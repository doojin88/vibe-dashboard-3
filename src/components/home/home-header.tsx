'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

type User = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type HomeHeaderProps = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
};

export function HomeHeader({ user, isAuthenticated, isLoading, onRefresh }: HomeHeaderProps) {
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await onRefresh();
    router.replace('/');
  }, [onRefresh, router]);

  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-xl font-bold text-white">
            University Dashboard
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="text-sm text-slate-400">로딩 중...</span>
          )}

          {!isLoading && isAuthenticated && user && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">대시보드</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {user.email ?? '사용자'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!isLoading && !isAuthenticated && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
