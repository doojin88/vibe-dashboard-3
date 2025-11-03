'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HomeHeader() {
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-xl font-bold text-white">
            University Dashboard
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">대시보드</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
