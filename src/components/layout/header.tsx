'use client';

import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';

export function Header() {
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
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground/80"
          >
            대시보드
          </Link>
          {(role === 'administrator' || !role) && (
            <Link
              href="/data/upload"
              className="transition-colors hover:text-foreground/80"
            >
              데이터관리
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
