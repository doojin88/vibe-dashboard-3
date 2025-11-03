import { NextResponse } from 'next/server';

// 비로그인 상태로 항상 'viewer' 역할 반환
export async function GET() {
  return NextResponse.json({ role: 'viewer' });
}
