'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import type { UserRole } from '@/lib/auth/types';
import { clientEnv } from '@/lib/env';

export function useUserRole() {
  const hasClerk = !!clientEnv.clerkPublishableKey;
  let user = null;
  let isSignedIn = false;

  // Hook 규칙 준수: 항상 호출하되, 에러 발생 시 무시
  try {
    if (hasClerk) {
      const clerkUser = useUser();
      user = clerkUser.user;
      isSignedIn = clerkUser.isSignedIn;
    }
  } catch {
    // ClerkProvider가 없으면 무시
  }

  return useQuery<UserRole | null>({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const response = await fetch('/api/auth/role');
      if (!response.ok) return 'viewer';

      const data = await response.json();
      return data.role;
    },
    enabled: isSignedIn && !!user,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
