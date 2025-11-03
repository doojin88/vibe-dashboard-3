'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserRole } from '@/lib/auth/types';

// 비로그인 상태로 항상 'viewer' 역할 반환
export function useUserRole() {
  return useQuery<UserRole>({
    queryKey: ['userRole', 'no-auth'],
    queryFn: async (): Promise<UserRole> => {
      // 비로그인 상태이므로 항상 'viewer' 반환
      return 'viewer';
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5분
    initialData: 'viewer' as UserRole,
  });
}
