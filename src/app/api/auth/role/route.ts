import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/lib/auth/rbac';
import { clientEnv } from '@/lib/env';

export async function GET() {
  // Clerk가 설정되지 않은 경우 항상 기본 role 반환 (로그인 없이 사용)
  if (!clientEnv.clerkPublishableKey) {
    return NextResponse.json({ role: 'viewer' });
  }

  try {
    const { userId } = await auth();

    // Clerk가 설정되어 있지만 사용자가 로그인하지 않은 경우
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole(userId);

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    // 에러 발생 시에도 Clerk가 없으면 viewer 반환 (안전한 fallback)
    if (!clientEnv.clerkPublishableKey) {
      return NextResponse.json({ role: 'viewer' });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
