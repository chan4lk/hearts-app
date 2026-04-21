import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from './prisma';
import { logger } from './logger';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

// Phase 1: Single tenant for BISTEC Global
// Phase 2: Derive from subdomain or SSO configuration
const DEFAULT_TENANT_ID = 'bistec-global';


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

// ── Short-lived cache for session DB lookups ──
// Prevents the session callback from hitting the DB on every getServerSession() call.
// A single page load with 5 parallel API requests previously made 5 identical SELECTs.
// With this cache (10s TTL), it makes 1 query and serves 4 from memory.
const SESSION_CACHE_TTL = 10_000; // 10 seconds
const sessionAuthCache = new Map<string, { data: { id: string; role: Role; isActive: boolean }; ts: number }>();

async function getCachedUserAuth(userId: string) {
  const cached = sessionAuthCache.get(userId);
  if (cached && Date.now() - cached.ts < SESSION_CACHE_TTL) {
    return cached.data;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true }
  });

  if (dbUser) {
    sessionAuthCache.set(userId, { data: dbUser, ts: Date.now() });
    // Prevent unbounded growth — evict old entries every 100 insertions
    if (sessionAuthCache.size > 100) {
      const now = Date.now();
      sessionAuthCache.forEach((entry, key) => {
        if (now - entry.ts > SESSION_CACHE_TTL) sessionAuthCache.delete(key);
      });
    }
  }

  return dbUser;
}

// CSRF Protection: NextAuth.js includes built-in CSRF token validation for all
// sign-in/sign-out/callback requests. It generates a CSRF token stored in a cookie
// and verified on each POST request, so no additional CSRF middleware is needed.
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
          // Azure AD work/school accounts often don't populate `email`.
          // Fall back to `preferred_username` or `upn` (User Principal Name).
          const email =
            profile.email ||
            (profile as any).preferred_username ||
            (profile as any).upn ||
            null;

          logger.info('auth.azure.profile_processing', {
            hasEmail: !!profile.email,
            hasPreferredUsername: !!(profile as any).preferred_username,
            hasUpn: !!(profile as any).upn,
            resolvedEmail: email,
            hasName: !!profile.name,
            hasTokens: !!tokens,
          });

          // Validate required profile data
          if (!email) {
            throw new Error('No email / preferred_username / upn found in Azure AD profile');
          }

          // Normalize the profile so the rest of this callback uses `email`
          profile.email = email;

          if (!profile.name) {
            logger.warn('auth.azure.no_name', { email: profile.email });
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
            logger.info('auth.azure.existing_user_found', { userId: existingUser.id });
            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              role: existingUser.role
            };
          }
        } catch (error) {
          logger.error('auth.azure.callback_failed', {
            error: error instanceof Error ? error : new Error(String(error)),
          });
          throw error;
        }

        // For new users, always assign EMPLOYEE role
        // Admin will manually change roles in admin panel
        let role: Role = 'EMPLOYEE';

        // Normalize email for database
        const normalizedEmail = profile.email.toLowerCase().trim();

        logger.info('auth.azure.creating_user', { email: normalizedEmail, role });

        try {
          // Create new user with determined role
          // Normalize email to lowercase to prevent case sensitivity issues
          const user = await prisma.user.create({
            data: {
              tenantId: DEFAULT_TENANT_ID,
              email: profile.email.trim().toLowerCase(),
              name: profile.name || profile.email.split('@')[0],
              role: role,
            },
          });

          logger.info('auth.azure.user_created', { userId: user.id, role: user.role });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        } catch (dbError: any) {
          logger.error('auth.azure.user_create_failed', {
            error: dbError instanceof Error ? dbError : new Error(String(dbError)),
            errorCode: dbError?.code,
            userEmail: profile.email,
          });

          // Check if it's a unique constraint violation (P2002)
          if (dbError?.code === 'P2002') {
            logger.warn('auth.azure.unique_conflict', {
              userEmail: profile.email,
              hint: 'user may already exist with different casing',
            });
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
    // Email/password login is for LOCAL DEVELOPMENT ONLY.
    // In production, only Azure AD is allowed unless ALLOW_PASSWORD_LOGIN=true is
    // explicitly set in the environment (e.g., break-glass admin account).
    ...(process.env.NODE_ENV !== 'production' || process.env.ALLOW_PASSWORD_LOGIN === 'true'
      ? [
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

          const normalizedEmail = credentials.email.trim().toLowerCase();

          // NEW: Check if account is locked due to failed attempts
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: normalizedEmail,
                mode: 'insensitive',
              },
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              role: true,
              isActive: true,
              failedLoginAttempts: true,
              lastLoginAttempt: true,
            },
          });

          // NEW: Check if user exists and is active
          if (!user) {
            throw new Error('Invalid credentials');
          }

          if (!user.isActive) {
            throw new Error('User account is inactive');
          }

          // NEW: Implement login rate limiting (5 attempts = 15 minute lockout)
          if (user.failedLoginAttempts >= 5) {
            const timeSinceLastAttempt = user.lastLoginAttempt 
              ? Date.now() - user.lastLoginAttempt.getTime() 
              : 0;
            const lockoutDuration = 15 * 60 * 1000; // 15 minutes

            if (timeSinceLastAttempt < lockoutDuration) {
              const remainingTime = Math.ceil((lockoutDuration - timeSinceLastAttempt) / 1000);
              throw new Error(
                `Account locked due to too many failed login attempts. Try again in ${remainingTime} seconds.`
              );
            } else {
              // Lockout period expired, reset attempts
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: 0,
                  lastLoginAttempt: new Date(),
                },
              });
            }
          }

          if (!user.password) {
            throw new Error('Invalid credentials');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            // NEW: Increment failed attempts on wrong password
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: { increment: 1 },
                lastLoginAttempt: new Date(),
              },
            });
            throw new Error('Invalid credentials');
          }

          // NEW: Reset failed attempts on successful login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lastLoginAt: new Date(),
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          logger.error('auth.azure.callback_failed', {
            error: error instanceof Error ? error : new Error(String(error)),
          });
          throw error;
        }
      },
    }),
      ]
      : []),
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
            logger.warn('auth.signin.user_not_found_attempting_create', { email: user.email });

            try {
              // Always assign EMPLOYEE role for new users
              // Admin will manually change roles in admin panel
              const role: Role = 'EMPLOYEE';

              // Create the user with normalized email to prevent case sensitivity issues
              dbUser = await prisma.user.create({
                data: {
                  tenantId: DEFAULT_TENANT_ID,
                  email: user.email.trim().toLowerCase(),
                  name: user.name || user.email.split('@')[0],
                  role: role,
                },
              });

              logger.info('auth.signin.user_created', { email: user.email });
            } catch (createError) {
              logger.error('auth.signin.user_create_failed', {
                error: createError instanceof Error ? createError : new Error(String(createError)),
                email: user.email,
              });
              // Return false to show access denied error
              // This triggers NextAuth to redirect to /error?error=AccessDenied
              return false;
            }
          }

          // Update the user object with the latest data from the database
          user.id = dbUser.id;
          user.role = dbUser.role;
          user.email = dbUser.email; // Use the email from database (preserves original casing)

          logger.info('auth.signin.success', { provider: account?.provider, email: user.email });
        }
        return true;
      } catch (error) {
        logger.error('auth.signin.failed', {
          error: error instanceof Error ? error : new Error(String(error)),
          provider: account?.provider,
        });
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
            logger.error('auth.jwt.role_fetch_failed', {
              error: error instanceof Error ? error : new Error(String(error)),
              userId: token.id,
            });
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as User & { role?: Role };
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as Role;

        // Fetch role/isActive from DB with a short TTL cache (10s) to avoid
        // hitting the DB on every single API call. A page load with 5 parallel
        // API calls previously triggered 5 identical SELECT queries; now it's 1.
        try {
          const dbUser = await getCachedUserAuth(sessionUser.id);

          if (!dbUser) {
            // User was deleted or DB was reset — return session with token data
            // User will need to re-login to get a fresh session
            return session;
          }

          if (!dbUser.isActive) {
            logger.warn('auth.session.inactive_user_blocked', { email: sessionUser.email });
            throw new Error('User account is inactive');
          }

          sessionUser.id = dbUser.id;
          sessionUser.role = dbUser.role;
        } catch (error) {
          logger.error('auth.session.callback_failed', {
            error: error instanceof Error ? error : new Error(String(error)),
            userId: sessionUser.id,
          });
          throw error;
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
  // logger removed
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * Get JWT secret from environment - REQUIRED for security
 * Must be set in .env.local or production environment
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is not set. ' +
      'This is required for token verification. ' +
      'Please set JWT_SECRET in your .env.local file. ' +
      'Use a minimum of 32 characters for security.'
    );
  }
  
  if (secret.length < 16) {
    throw new Error(
      'FATAL: JWT_SECRET must be at least 16 characters long for security. ' +
      `Current length: ${secret.length} characters. ` +
      'Recommended: 32+ characters.'
    );
  }
  
  return secret;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = getJWTSecret();
    const decoded = verify(token, secret) as AuthUser;
    return decoded;
  } catch (error) {
    if (error instanceof Error && error.message.includes('FATAL')) {
      logger.error('auth.jwt.fatal_verify_failure', { error });
      throw error;
    }
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
