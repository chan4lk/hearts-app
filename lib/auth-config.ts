import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from './prisma';
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
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log(`[signIn] Callback triggered for provider: ${account?.provider}`);
      console.log('[signIn] Account details:', JSON.stringify(account, null, 2));
      console.log('[signIn] Profile details:', JSON.stringify(profile, null, 2));
      
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
      console.log('[jwt] Token details:', JSON.stringify(token, null, 2));
      console.log('[jwt] Account details:', JSON.stringify(account, null, 2));
      
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.activeRole = user.role as Role; // Initialize activeRole with base role
      }
      return token;
    },
    async session({ session, token }) {
      console.log(`[session] Session callback triggered for token: ${token?.id}`);
      console.log('[session] Token details:', JSON.stringify(token, null, 2));
      
      if (session.user) {
        // Ensure the session user has the correct type
        const sessionUser = session.user;
        
        // Update session with token data
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as Role;
        sessionUser.activeRole = token.role as Role; // Initialize with base role
        
        // Log the session details for debugging
        console.log(`[session] User session created with role: ${sessionUser.role}`);
        console.log('[session] Session details:', JSON.stringify(session, null, 2));
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
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  useSecureCookies: false, // Set to false for development
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for development
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for development
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for development
      }
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for development
        maxAge: 900, // 15 minutes
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
}; 