import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import type { Role, User as PrismaUser } from '.prisma/client';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { User } from 'next-auth';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
          response_type: "code",
          prompt: "select_account"
        }
      },
      profile: async (profile: any) => {
        console.log('[Azure AD] Profile received:', JSON.stringify(profile, null, 2));
        
        try {
          // Get email from profile with proper type handling for Prisma
          let email: string | undefined;
          
          if (profile.email !== null && profile.email !== undefined) {
            email = String(profile.email);
          } else if (profile.preferred_username !== null && profile.preferred_username !== undefined) {
            email = String(profile.preferred_username);
          }
          
          if (!email) {
            console.error('[Azure AD] No email or preferred_username found in profile');
            throw new Error('No email or preferred_username found in Azure AD profile');
          }
          
          console.log(`[Azure AD] Processing user with email: ${email}`);
          
          // Always fetch or create the user in the database
          const user = await prisma.user.upsert({
            where: { email },
            update: { 
              name: profile.name,
              lastLoginAt: new Date()
            },
            create: {
              email,
              name: profile.name,
              password: 'azure-ad-auth', // Placeholder for Azure AD users
              role: 'EMPLOYEE' as Role, // Default role for new users
              isActive: true,
              lastLoginAt: new Date()
            },
          });

          console.log(`[Azure AD] User processed successfully with role: ${user.role}`);
          
          return user as User;
        } catch (error) {
          console.error('[Azure AD] Error in profile callback:', error);
          throw error;
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return user as User;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log(`[signIn] Callback triggered for provider: ${account?.provider}`);
      
      try {
        // Always fetch the latest user data from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email || '' },
        });
        
        if (!dbUser) {
          console.error('[signIn] User not found in database');
          return false;
        }
        
        // Update the user object with the latest data from the database
        user.id = dbUser.id;
        user.role = dbUser.role;
        user.activeRole = dbUser.role; // Initialize activeRole with base role
        
        console.log(`[signIn] User logged in successfully with role: ${user.role}`);
        return true;
      } catch (error) {
        console.error('[signIn] Error processing sign in:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      console.log(`[jwt] JWT callback triggered for user: ${user?.email}`);
      
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.activeRole = user.role as Role; // Initialize activeRole with base role
        
        // Store the initial role in session storage
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeRole', user.role as string);
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log(`[session] Session callback triggered for token: ${token?.id}`);
      
      if (session.user) {
        // Ensure the session user has the correct type
        const sessionUser = session.user;
        
        // Update session with token data
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as Role;
        sessionUser.activeRole = token.role as Role; // Initialize with base role
        
        // Log the session details for debugging
        console.log(`[session] User session created with role: ${sessionUser.role}`);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/register',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.callback-url' 
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Host-next-auth.csrf-token' 
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  logger: {
    error(code, ...message) {
      console.error(`[NextAuth Error] ${code}:`, ...message);
    },
    warn(code, ...message) {
      console.warn(`[NextAuth Warn] ${code}:`, ...message);
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[NextAuth Debug] ${code}:`, ...message);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 