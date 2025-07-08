import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import type { Role, User } from '.prisma/client';
import { PrismaAdapter } from "@next-auth/prisma-adapter";

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
  }
  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}

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
      profile: async (profile) => {
        console.log('[Azure AD] Profile received:', JSON.stringify(profile, null, 2));
        
        try {
          // Use preferred_username as email if email is not available
          const email = profile.email || profile.preferred_username;
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
              role: 'EMPLOYEE', // Default role for new users
              isActive: true,
              lastLoginAt: new Date()
            },
          });

          console.log(`[Azure AD] User processed successfully with role: ${user.role}`);
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log(`[signIn] Callback triggered for provider: ${account?.provider}`);
      
      if (account?.provider === 'azure-ad') {
        try {
          // For Azure AD, we've already handled user creation in the profile callback
          // Just fetch the latest user data to ensure we have the correct role
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          
          if (!dbUser) {
            console.error('[signIn] User not found in database after Azure AD login');
            return false;
          }
          
          // Update the user object with the latest data from the database
          user.id = dbUser.id;
          user.role = dbUser.role;
          
          console.log(`[signIn] User logged in successfully with role: ${user.role}`);
        } catch (error) {
          console.error('[signIn] Error processing Azure AD sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      console.log(`[jwt] JWT callback triggered for user: ${user?.email}`);
      
      if (user) {
        token.id = user.id;
        token.role = user.role;
        
        // Always fetch the latest role from the database
        if (user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: { role: true }
            });
            
            if (dbUser) {
              token.role = dbUser.role;
              console.log(`[jwt] Updated token role from database: ${dbUser.role}`);
            }
          } catch (error) {
            console.error('[jwt] Error fetching user role from database:', error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log(`[session] Session callback triggered for token: ${token?.id}`);
      
      if (session.user) {
        // Ensure the session user has the correct type
        const sessionUser = session.user as User & { role?: Role };
        
        // Update session with token data
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as Role;
        
        // Log the session details for debugging
        console.log(`[session] User session created with role: ${sessionUser.role}`);
        
        // Fallback to fetch role from the database if missing
        if (!sessionUser.role && sessionUser.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: sessionUser.email },
              select: { role: true }
            });
            
            if (dbUser) {
              sessionUser.role = dbUser.role;
              console.log(`[session] Updated session role from database: ${dbUser.role}`);
            }
          } catch (error) {
            console.error('[session] Error fetching user role from database:', error);
          }
        }
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

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return !!user;
}

export async function hasRole(role: string): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === role;
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete('token');
} 
