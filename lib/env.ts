/**
 * Environment variable validation
 * Validates all required environment variables on application startup
 */

interface EnvConfig {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  AZURE_AD_CLIENT_ID: string;
  AZURE_AD_CLIENT_SECRET: string;
  AZURE_AD_TENANT_ID: string;
  OPENAI_API_KEY?: string; // Optional - only needed for AI features
  APPLICATIONINSIGHTS_CONNECTION_STRING?: string; // Optional - only needed for logging
  JWT_SECRET?: string; // Optional - only needed if using JWT auth
}

/**
 * Validate required environment variables
 * Throws error if any required variables are missing
 */
export function validateEnv(): void {
  const required: (keyof EnvConfig)[] = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'AZURE_AD_CLIENT_ID',
    'AZURE_AD_CLIENT_SECRET',
    'AZURE_AD_TENANT_ID',
  ];

  const missing: string[] = [];
  const invalid: string[] = [];

  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  // Validate format of specific variables
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
    invalid.push('NEXTAUTH_URL must be a valid URL (http:// or https://)');
  }

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    invalid.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  if (invalid.length > 0) {
    throw new Error(`Invalid environment variables:\n${invalid.join('\n')}`);
  }
}

/**
 * Get environment variable with validation
 */
export function getEnv(key: keyof EnvConfig, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value || defaultValue!;
}

/**
 * Check if optional environment variable is set
 */
export function hasEnv(key: keyof EnvConfig): boolean {
  return !!process.env[key];
}
