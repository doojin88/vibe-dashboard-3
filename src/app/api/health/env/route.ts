/**
 * Environment Health Check Endpoint
 *
 * GET /api/health/env
 *
 * Returns the status of environment variables configuration.
 * Useful for debugging and verifying setup.
 */

import { NextResponse } from 'next/server'
import { validateEnv, getEnvironment, formatMaxFileSize } from '@/lib/env'

export async function GET() {
  const validation = validateEnv()

  // Check individual variables
  const checks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    maxFileSize: !!process.env.NEXT_PUBLIC_MAX_FILE_SIZE,
    clerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: !!process.env.CLERK_SECRET_KEY,
  }

  // Calculate status
  const requiredChecks = [
    checks.supabaseUrl,
    checks.supabaseAnonKey,
    checks.supabaseServiceRoleKey,
  ]
  const allRequiredPresent = requiredChecks.every((check) => check)

  const response = {
    status: allRequiredPresent ? 'healthy' : 'unhealthy',
    environment: getEnvironment(),
    timestamp: new Date().toISOString(),
    checks: {
      required: {
        supabaseUrl: checks.supabaseUrl ? '✓' : '✗ Missing',
        supabaseAnonKey: checks.supabaseAnonKey ? '✓' : '✗ Missing',
        supabaseServiceRoleKey: checks.supabaseServiceRoleKey ? '✓' : '✗ Missing',
      },
      optional: {
        appUrl: checks.appUrl ? '✓' : '✗ Using default',
        maxFileSize: checks.maxFileSize
          ? `✓ ${formatMaxFileSize()}`
          : '✗ Using default (10MB)',
        clerk: checks.clerkPublishableKey && checks.clerkSecretKey ? '✓' : '✗ Not configured',
      },
    },
    validation: {
      valid: validation.valid,
      errors: validation.errors,
    },
  }

  return NextResponse.json(response, {
    status: allRequiredPresent ? 200 : 500,
  })
}
