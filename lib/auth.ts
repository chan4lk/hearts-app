import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { logger } from './logger';

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

export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
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
        try {
          // Only log in development - never log sensitive profile data in production
          if (process.env.NODE_ENV === 'development') {
            logger.log('Azure AD processing profile', 'Information', {
              hasEmail: !!profile.email,
              hasName: !!profile.name,
              hasTokens: !!tokens
            });
          }

          // Validate required profile data
          if (!profile.email) {
            throw new Error('No email found in Azure AD profile');
          }

          if (!profile.name && process.env.NODE_ENV === 'development') {
            logger.log('Azure AD: No name found, using email as fallback', 'Warning');
          }

          // Normalize email to lowercase for case-insensitive lookup
          // Check if user exists first (case-insensitive lookup)
          let existingUser = await prisma.user.findFirst({
            where: {
              email: {
                equals: profile.email.trim(),
                mode: 'insensitive',
              },
            },
          });

          // If user exists, don't automatically update their role
          if (existingUser) {
            if (process.env.NODE_ENV === 'development') {
              logger.log('Azure AD: Existing user found', 'Information');
            }
            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              role: existingUser.role
            };
          }
        } catch (error) {
          logger.error(error instanceof Error ? error : new Error(String(error)));
          throw error;
        }

        // For new users, always assign EMPLOYEE role
        // Admin will manually change roles in admin panel
        let role: Role = 'EMPLOYEE';

        // Normalize email for database
        const normalizedEmail = profile.email.toLowerCase().trim();

        if (process.env.NODE_ENV === 'development') {
          logger.log('Azure AD: Creating new user with EMPLOYEE role', 'Information');
        }

        try {
          // Create new user with determined role
          // Normalize email to lowercase to prevent case sensitivity issues
          const user = await prisma.user.create({
            data: {
              email: profile.email.trim().toLowerCase(), // Normalize to lowercase
              name: profile.name || profile.email.split('@')[0], // Fallback to email prefix if no name
              password: 'azure-ad-auth', // Placeholder for Azure AD users
              role: role,
            },
          });

          if (process.env.NODE_ENV === 'development') {
            logger.log('Azure AD: New user created', 'Information');
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        } catch (dbError: any) {
          console.error('[Azure AD] Database error creating user:', {
            error: dbError,
            errorCode: dbError?.code,
            errorMessage: dbError?.message,
            userEmail: profile.email,
            normalizedEmail: profile.email.trim().toLowerCase(),
            timestamp: new Date().toISOString()
          });

          // Check if it's a unique constraint violation (P2002)
          if (dbError?.code === 'P2002') {
            console.error('[Azure AD] Unique constraint violation - user may already exist with different casing');
            // Try to find the existing user again with more detailed logging
            const existingUserRetry = await prisma.user.findFirst({
              where: {
                email: {
                  equals: profile.email.trim(),
                  mode: 'insensitive',
                },
              },
            });

            if (existingUserRetry) {
              return {
                id: existingUserRetry.id,
                name: existingUserRetry.name,
                email: existingUserRetry.email,
                role: existingUserRetry.role
              };
            }
          }

          throw new Error(`Failed to create user in database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
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
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Invalid credentials');
          }

          // Use case-insensitive email lookup
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: credentials.email.trim(),
                mode: 'insensitive',
              },
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
          logger.error(error instanceof Error ? error : new Error(String(error)));
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'azure-ad') {
          // Use case-insensitive email lookup to find existing user
          let dbUser = await prisma.user.findFirst({
            where: {
              email: {
                equals: user.email.trim(),
                mode: 'insensitive',
              },
            },
          });

          // If user doesn't exist, try to create them (fallback in case profile callback failed)
          if (!dbUser) {
            if (process.env.NODE_ENV === 'development') {
              logger.log('SignIn: User not found, attempting to create', 'Warning');
            }

            try {
              // Always assign EMPLOYEE role for new users
              // Admin will manually change roles in admin panel
              const role: Role = 'EMPLOYEE';

              // Create the user with normalized email to prevent case sensitivity issues
              dbUser = await prisma.user.create({
                data: {
                  email: user.email.trim().toLowerCase(), // Normalize to lowercase
                  name: user.name || user.email.split('@')[0],
                  password: 'azure-ad-auth',
                  role: role,
                },
              });

              if (process.env.NODE_ENV === 'development') {
                logger.log('SignIn: User created successfully', 'Information');
              }
            } catch (createError) {
              logger.error(
                createError instanceof Error ? createError : new Error(String(createError))
              );
              // Return false to show access denied error
              // This triggers NextAuth to redirect to /error?error=AccessDenied
              return false;
            }
          }

          // Update the user object with the latest data from the database
          user.id = dbUser.id;
          user.role = dbUser.role;
          user.email = dbUser.email; // Use the email from database (preserves original casing)

          if (process.env.NODE_ENV === 'development') {
            logger.log('SignIn: User logged in successfully', 'Information');
          }
        }
        return true;
      } catch (error) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          { provider: account?.provider }
        );
        // Return false to show access denied error
        // This triggers NextAuth to redirect to /error?error=AccessDenied
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;

        // Always fetch the latest role from the database
        if (user.email) {
          try {
            // Use case-insensitive email lookup
            const dbUser = await prisma.user.findFirst({
              where: {
                email: {
                  equals: user.email.trim(),
                  mode: 'insensitive',
                },
              },
              select: { role: true }
            });

            if (dbUser) {
              token.role = dbUser.role;
              // Don't log role updates - security risk
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
        // Don't log session data - security risk

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
          } else {
            logger.error(new Error('Session: User not found in database'));
          }
        } catch (error) {
          logger.error(error instanceof Error ? error : new Error(String(error)));
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
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
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
      const details = message.map(m => typeof m === 'object' ? JSON.stringify(m, null, 2) : String(m)).join(' ');
      logger.error(new Error(`NextAuth: ${code} - ${details}`));
    },
    warn(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        const details = message.map(m => typeof m === 'object' ? JSON.stringify(m) : String(m)).join(' ');
        logger.log(`NextAuth Warning: ${code}`, 'Warning', { message: details });
      }
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        const details = message.map(m => typeof m === 'object' ? JSON.stringify(m) : String(m)).join(' ');
        logger.log(`NextAuth Debug: ${code}`, 'Verbose', { message: details });
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
