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
    queryKey: ['userRole', hasClerk ? user?.id : 'no-auth'],
    queryFn: async () => {
      // Clerk가 없으면 항상 'viewer' 반환 (로그인 없이 사용)
      if (!hasClerk) {
        return 'viewer';
      }

      // Clerk가 있지만 사용자가 없으면 null
      if (!user) {
        return null;
      }

      const response = await fetch('/api/auth/role');
      if (!response.ok) {
        // 에러 발생 시 기본값 반환
        return 'viewer';
      }

      const data = await response.json();
      return data.role || 'viewer';
    },
    // Clerk가 없으면 항상 활성화 (항상 'viewer' 반환)
    // Clerk가 있으면 사용자가 로그인했을 때만 활성화
    enabled: !hasClerk || (isSignedIn && !!user),
    staleTime: 5 * 60 * 1000, // 5분
    // Clerk가 없을 때는 초기 데이터를 'viewer'로 설정
    initialData: !hasClerk ? 'viewer' : undefined,
  });
}
