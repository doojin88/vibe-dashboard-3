import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { UserRole, RBACPermission } from './types';
import { ROLE_PERMISSIONS } from './types';
import type { Database } from '@/lib/supabase/types';

export async function getUserRole(userId: string): Promise<UserRole | null> {
  if (!userId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return 'viewer';
  }

  return (user as Database['public']['Tables']['users']['Row']).role;
}

export async function hasPermission(userId: string, permission: RBACPermission): Promise<boolean> {
  const role = await getUserRole(userId);

  if (!role) {
    return false;
  }

  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function requirePermission(userId: string, permission: RBACPermission): Promise<void> {
  const allowed = await hasPermission(userId, permission);

  if (!allowed) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

export async function requireRole(userId: string, requiredRole: UserRole): Promise<void> {
  const userRole = await getUserRole(userId);

  if (userRole !== requiredRole) {
    throw new Error(`Forbidden: Requires ${requiredRole} role`);
  }
}
