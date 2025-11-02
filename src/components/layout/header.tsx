'use client';

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { clientEnv } from '@/lib/env';

function HeaderContent() {
  const { data: role } = useUserRole();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">University Dashboard</span>
          </Link>
        </div>

        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <SignedIn>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80"
            >
              대시보드
            </Link>
            {role === 'administrator' && (
              <Link
                href="/data/upload"
                className="transition-colors hover:text-foreground/80"
              >
                데이터관리
              </Link>
            )}
          </SignedIn>
        </nav>

        <div className="flex items-center space-x-2">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost">로그인</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

export function Header() {
  const hasClerk = !!clientEnv.clerkPublishableKey;
  
  if (!hasClerk) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">University Dashboard</span>
            </Link>
          </div>
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80"
            >
              대시보드
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return <HeaderContent />;
}
