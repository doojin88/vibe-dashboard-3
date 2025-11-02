'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import type { UserRole } from '@/lib/auth/types';

export function useUserRole() {
  const { user, isAuthenticated } = useCurrentUser();

  return useQuery<UserRole | null>({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const response = await fetch('/api/auth/role');
      if (!response.ok) return 'viewer';

      const data = await response.json();
      return data.role;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
