import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { Role, User } from '@prisma/client';

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
      profile: async (profile, tokens) => {
        console.log('Azure AD profile:', JSON.stringify(profile, null, 2));
        console.log('Azure AD tokens:', JSON.stringify(tokens, null, 2));
        
        // Check if user exists first
        let existingUser = await prisma.user.findUnique({
          where: { email: profile.email }
        });

        // If user exists, update their role if they're from bistecglobal.com
        if (existingUser) {
          if (profile.email.endsWith('@bistecglobal.com') && existingUser.role !== 'ADMIN') {
            console.log(`[Azure AD] Updating existing user ${existingUser.email} to ADMIN role`);
            existingUser = await prisma.user.update({
              where: { email: profile.email },
              data: { role: 'ADMIN' }
            });
          }
          console.log(`[Azure AD] Existing user found with role: ${existingUser.role}`);
          return {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role
          };
        }

        // For new users, determine role based on Azure AD groups/roles
        let role: Role = 'EMPLOYEE';
        
        // Check Azure AD groups if available
        const groups = profile.groups || [];
        const roles = profile.roles || [];
        
        // You can configure these group/role names in your Azure AD
        const adminGroups = ['Admins', 'Administrators', 'AspireHub Admins'];
        const managerGroups = ['Managers', 'Team Leads', 'AspireHub Managers'];
        
        // Check if user is admin based on email domain or other criteria
        if (profile.email.endsWith('@bistecglobal.com')) {
          role = 'ADMIN';
          console.log(`[Azure AD] Assigning ADMIN role to bistecglobal.com email: ${profile.email}`);
        } else if (
          groups.some((group: string) => adminGroups.includes(group)) ||
          roles.includes('Admin') ||
          profile.email.toLowerCase().includes('admin') ||
          profile.email.toLowerCase().includes('administrator')
        ) {
          role = 'ADMIN';
          console.log(`[Azure AD] Assigning ADMIN role based on groups/roles: ${profile.email}`);
        } else if (
          groups.some((group: string) => managerGroups.includes(group)) ||
          roles.includes('Manager')
        ) {
          role = 'MANAGER';
          console.log(`[Azure AD] Assigning MANAGER role based on groups/roles: ${profile.email}`);
        }
        
        console.log(`[Azure AD] Final role assignment for ${profile.email}: ${role}`);
        
        // Create new user with determined role
        const user = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            password: 'azure-ad-auth', // Placeholder for Azure AD users
            role: role,
          },
        });

        console.log(`New user created with role: ${user.role}`);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Invalid credentials');
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.password) {
            throw new Error('Invalid credentials');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'azure-ad') {
        // For Azure AD, we've already handled user creation in the profile callback
        // Just fetch the latest user data to ensure we have the correct role
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        
        if (!dbUser) {
          console.error('User not found in database after Azure AD login');
          return false;
        }
        
        // Update the user object with the latest data from the database
        user.id = dbUser.id;
        user.role = dbUser.role;
        
        console.log(`[signIn] User logged in with role: ${user.role}`);
      }
      return true;
    },
    async jwt({ token, user }) {
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
      if (session.user) {
        // Ensure the session user has the correct type
        const sessionUser = session.user as User & { role?: Role };
        
        // Update session with token data
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as Role;
        
        // Always fetch the latest role from the database
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: sessionUser.email },
            select: { role: true, id: true }
          });
          
          if (dbUser) {
            sessionUser.id = dbUser.id;
            sessionUser.role = dbUser.role;
            console.log(`[session] Updated session with database values:`, {
              id: dbUser.id,
              role: dbUser.role
            });
          } else {
            console.error(`[session] User not found in database: ${sessionUser.email}`);
          }
        } catch (error) {
          console.error('[session] Error fetching user data from database:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
    newUser: '/register',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
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
      console.error(code, message);
    },
    warn(code, ...message) {
      console.warn(code, message);
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(code, message);
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
