# Environment Variables Setup Guide

## Overview

This document provides a comprehensive guide for setting up environment variables for the University Dashboard project.

## File Structure

```
.env.local          # Local development (DO NOT commit)
.env.example        # Template for team members (commit to git)
.env.production     # Production variables (DO NOT commit)
```

---

## Required Environment Variables

### 1. Supabase Configuration

#### NEXT_PUBLIC_SUPABASE_URL
- **Type**: Public
- **Description**: Your Supabase project URL
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Example**: `https://kynebdxupxyclpfdxhfz.supabase.co`

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type**: Public
- **Description**: Supabase anonymous/public API key (safe for client-side use)
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### SUPABASE_SERVICE_ROLE_KEY
- **Type**: Secret (Server-side only)
- **Description**: Supabase service role key with admin privileges
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `service_role`
- **Security**: ⚠️ **NEVER expose this key to the client side!** Only use in API routes and server components.
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### 2. Application Configuration

#### NODE_ENV
- **Type**: System
- **Description**: Application environment
- **Values**: `development`, `production`, `test`
- **Default**: `development`

#### NEXT_PUBLIC_APP_URL
- **Type**: Public
- **Description**: Base URL of the application
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

---

### 3. File Upload Configuration

#### NEXT_PUBLIC_MAX_FILE_SIZE
- **Type**: Public
- **Description**: Maximum file upload size in bytes
- **Default**: `10485760` (10MB)
- **Formula**: `MB * 1024 * 1024`
- **Examples**:
  - 5MB: `5242880`
  - 10MB: `10485760`
  - 20MB: `20971520`

---

### 4. Clerk Authentication (Optional - Future Migration)

These variables are for migrating from Supabase Auth to Clerk in the future.

#### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- **Type**: Public
- **Description**: Clerk publishable key
- **Where to find**: Clerk Dashboard → API Keys → Publishable key
- **Example**: `pk_test_...` or `pk_live_...`

#### CLERK_SECRET_KEY
- **Type**: Secret
- **Description**: Clerk secret key
- **Where to find**: Clerk Dashboard → API Keys → Secret key
- **Security**: ⚠️ **Server-side only!**
- **Example**: `sk_test_...` or `sk_live_...`

#### Clerk URL Configuration
```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## Setup Instructions

### For New Team Members

1. **Copy the example file**
   ```bash
   cp .env.example .env.local
   ```

2. **Get Supabase credentials**
   - Ask the project admin for the Supabase project URL and keys
   - Or create your own Supabase project:
     1. Go to https://supabase.com
     2. Create a new project
     3. Run the database migration (see [database.md](../database.md))
     4. Copy the URL and keys from Settings → API

3. **Fill in the values**
   - Open `.env.local`
   - Replace all placeholder values with actual credentials
   - Save the file

4. **Verify the setup**
   ```bash
   npm run dev
   ```
   - Check console for any missing environment variable warnings
   - Try logging in to verify Supabase connection

---

## Environment-Specific Configuration

### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://dashboard.university.edu
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_MAX_FILE_SIZE=10485760

# Production-only (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## Verifying Environment Variables

### 1. Check if variables are loaded
Create a test API route:

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  })
}
```

Then visit: `http://localhost:3000/api/test-env`

### 2. Check client-side variables
Open browser console:

```javascript
console.log({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
})
```

---

## Security Best Practices

### ✅ DO
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Keep `.env.local` in `.gitignore`
- Commit `.env.example` with placeholder values
- Rotate keys regularly in production
- Use different Supabase projects for dev/staging/prod
- Store production secrets in Vercel/hosting platform

### ❌ DON'T
- Commit `.env.local` or `.env.production`
- Expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Share credentials in Slack/Email (use secure channels)
- Hardcode credentials in source code
- Use production credentials in development

---

## Troubleshooting

### Issue: "Supabase client not initialized"
**Solution**: Check if `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

### Issue: "401 Unauthorized" errors
**Solution**:
1. Check if Supabase keys are correct
2. Verify RLS policies are configured
3. Check if user is authenticated

### Issue: Environment variables not updating
**Solution**:
1. Restart the dev server (`npm run dev`)
2. Clear Next.js cache: `rm -rf .next`
3. Check for typos in variable names

### Issue: "Service role key required" error
**Solution**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` (without `NEXT_PUBLIC_` prefix).

---

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase API Settings](https://supabase.com/docs/guides/api)
- [Clerk Environment Variables](https://clerk.com/docs/deployments/clerk-environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Contact

For credentials or access issues, contact:
- **Project Admin**: [Admin Name]
- **DevOps Team**: [Team Contact]
- **Supabase Project Owner**: [Owner Name]
