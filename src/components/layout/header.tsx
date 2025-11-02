'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useUserRole } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, isAuthenticated } = useCurrentUser();
  const { data: role } = useUserRole();
  const router = useRouter();

  const handleSignOut = async () => {
    // Supabase sign out
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">University Dashboard</span>
          </Link>
        </div>

        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {isAuthenticated && (
            <>
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
            </>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.email}</p>
                    {role && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {role === 'administrator' ? '관리자' : '일반 사용자'}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
