import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/constants/env';
import type { Database } from './types';

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseServiceClient() {
  if (serviceClient) {
    return serviceClient;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  serviceClient = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return serviceClient;
}
