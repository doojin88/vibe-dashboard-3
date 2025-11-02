'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

type DashboardLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn('flex-1 p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
