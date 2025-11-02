import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/lib/auth/rbac';
import { clientEnv } from '@/lib/env';

export async function GET() {
  try {
    // Clerk가 설정되지 않은 경우 기본 role 반환
    if (!clientEnv.clerkPublishableKey) {
      return NextResponse.json({ role: 'viewer' });
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole(userId);

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    // Clerk가 설정되지 않은 경우 에러를 무시하고 기본 role 반환
    if (!clientEnv.clerkPublishableKey) {
      return NextResponse.json({ role: 'viewer' });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
