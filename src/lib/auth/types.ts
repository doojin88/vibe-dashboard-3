export type UserRole = 'viewer' | 'administrator';

export type RBACPermission =
  | 'dashboard:view'
  | 'data:upload'
  | 'data:validate'
  | 'data:delete';

export const ROLE_PERMISSIONS: Record<UserRole, RBACPermission[]> = {
  viewer: ['dashboard:view'],
  administrator: ['dashboard:view', 'data:upload', 'data:validate', 'data:delete'],
};
