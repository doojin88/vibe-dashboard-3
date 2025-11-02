/**
 * Environment Variables Validation and Access
 *
 * This module provides type-safe access to environment variables
 * and validates that all required variables are present.
 */

// Client-side environment variables (accessible in browser)
export const clientEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760', 10),
  // Clerk (optional)
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  clerkSignInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  clerkSignUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  clerkAfterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  clerkAfterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
} as const

// Server-side only environment variables (NOT accessible in browser)
export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Clerk (optional)
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
} as const

/**
 * Validate that all required environment variables are present
 * Call this in middleware or API routes to ensure proper configuration
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required client variables
  if (!clientEnv.supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  if (!clientEnv.supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }

  // Required server variables (only check on server-side)
  if (typeof window === 'undefined') {
    if (!serverEnv.supabaseServiceRoleKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is not set')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get environment name for display
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  return (serverEnv.nodeEnv as any) || 'development'
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

/**
 * Format file size from bytes to human-readable format
 */
export function formatMaxFileSize(): string {
  const bytes = clientEnv.maxFileSize
  const mb = bytes / (1024 * 1024)
  return `${mb}MB`
}

// Validate environment variables on module load (development only)
if (isDevelopment() && typeof window === 'undefined') {
  const validation = validateEnv()
  if (!validation.valid) {
    console.error('❌ Environment validation failed:')
    validation.errors.forEach((error) => console.error(`  - ${error}`))
    console.error('\nPlease check your .env.local file.')
    console.error('See docs/setup/environment-variables.md for setup instructions.\n')
  } else {
    console.log('✅ Environment variables validated successfully')
  }
}
