'use client';

import Link from 'next/link';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { clientEnv } from '@/lib/env';

function ClerkAuthButtons() {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return <span className="text-sm text-slate-400">로딩 중...</span>;
  }

  return (
    <>
      <SignedIn>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">대시보드</Link>
        </Button>
        <UserButton />
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">
            로그인
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">
            회원가입
          </Button>
        </SignUpButton>
      </SignedOut>
    </>
  );
}

export function HomeHeader() {
  const hasClerk = !!clientEnv.clerkPublishableKey;

  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-xl font-bold text-white">
            University Dashboard
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {hasClerk ? (
            <ClerkAuthButtons />
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">대시보드</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
