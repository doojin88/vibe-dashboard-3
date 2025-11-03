import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Clerk 키가 설정되어 있는지 확인
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// Clerk가 없을 때는 빈 미들웨어 (모든 요청 통과)
const noAuthMiddleware = async (req: NextRequest) => {
  return NextResponse.next()
}

// Clerk가 있을 때만 인증 미들웨어 적용
export default hasClerk ? clerkMiddleware() : noAuthMiddleware

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

