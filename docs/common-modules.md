# Common Modules Implementation Plan
# 대학교 데이터 시각화 대시보드

**버전:** 1.0
**작성일:** 2025-11-02
**프로젝트명:** University Dashboard - Vibe Dashboard 2
**기반 문서:** PRD v1.0, Userflow v1.0, Database Design v2.0

---

## 목차

1. [개요](#1-개요)
2. [인증 및 권한 관리](#2-인증-및-권한-관리)
3. [데이터베이스 클라이언트 및 타입](#3-데이터베이스-클라이언트-및-타입)
4. [공통 레이아웃 컴포넌트](#4-공통-레이아웃-컴포넌트)
5. [공통 UI 컴포넌트](#5-공통-ui-컴포넌트)
6. [데이터 Fetching 유틸리티](#6-데이터-fetching-유틸리티)
7. [차트 공통 컴포넌트](#7-차트-공통-컴포넌트)
8. [에러 핸들링](#8-에러-핸들링)
9. [유틸리티 함수](#9-유틸리티-함수)
10. [구현 우선순위](#10-구현-우선순위)

---

## 1. 개요

### 1.1 목적

페이지 단위 개발을 병렬로 진행하기 위해, 모든 페이지에서 공통적으로 사용될 모듈과 로직을 사전에 정의하고 구현합니다. 이를 통해 코드 충돌을 방지하고 일관성 있는 개발을 보장합니다.

### 1.2 설계 원칙

1. **최소 복잡성**: MVP에 필요한 기능만 구현
2. **재사용성**: 모든 페이지에서 동일하게 사용 가능한 인터페이스
3. **타입 안정성**: TypeScript strict mode 활용
4. **성능**: React Query 캐싱, 메모이제이션 적극 활용
5. **확장성**: 단순하지만 확장 가능한 구조

### 1.3 기술 스택 확인

**현재 프로젝트 상태:**
- Next.js 15.1.0 (App Router)
- React 19
- TypeScript 5
- Supabase SSR (@supabase/ssr, @supabase/supabase-js)
- React Query (@tanstack/react-query)
- Hono (Backend API)
- Shadcn UI (Radix UI 기반)
- Tailwind CSS 4
- Zustand (상태 관리)
- Zod (스키마 검증)

**주의사항:**
- Clerk는 설치되지 않음 → Supabase Auth 사용 중
- 현재 Supabase Auth 기반 인증 시스템 구현되어 있음

---

## 2. 인증 및 권한 관리

### 2.1 현재 상태 분석

**기존 코드:**
- `/middleware.ts`: Supabase Auth 기반 인증 확인
- `/src/features/auth/`: 인증 관련 기능 구현됨
- `/src/features/auth/context/current-user-context.tsx`: 사용자 컨텍스트
- `/src/features/auth/server/load-current-user.ts`: 서버 사이드 사용자 로드

**PRD 요구사항:**
- Clerk Google OAuth 인증
- RBAC (Role-Based Access Control)
- 관리자/일반사용자 구분

### 2.2 구현 계획

#### 2.2.1 Clerk 통합 (필수 작업)

**파일 위치:**
- `middleware.ts` (기존 수정)
- `src/app/layout.tsx` (기존 수정)
- `src/lib/clerk/client.ts` (신규)
- `src/lib/clerk/server.ts` (신규)

**1단계: Clerk 설치**

```bash
npm install @clerk/nextjs@latest
```

**2단계: middleware.ts 교체**

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/']);
const isAuthRoute = createRouteMatcher(['/login', '/signup']);

export default clerkMiddleware(async (auth, req) => {
  // 공개 경로는 인증 불필요
  if (isPublicRoute(req)) {
    return;
  }

  // 인증 경로는 로그인 시 대시보드로 리다이렉트
  if (isAuthRoute(req)) {
    const { userId } = await auth();
    if (userId) {
      return Response.redirect(new URL('/dashboard', req.url));
    }
    return;
  }

  // 나머지 모든 경로는 인증 필수
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**3단계: app/layout.tsx 수정**

```typescript
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "University Dashboard",
  description: "대학교 데이터 시각화 대시보드",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ko" suppressHydrationWarning>
        <body className="antialiased font-sans">
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

**4단계: 환경 변수 설정**

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### 2.2.2 RBAC 구현

**파일 위치:**
- `src/lib/auth/rbac.ts` (신규)
- `src/lib/auth/types.ts` (신규)
- `src/hooks/useUserRole.ts` (신규)

**타입 정의:**

```typescript
// src/lib/auth/types.ts
export type UserRole = 'viewer' | 'administrator';

export type RBACPermission =
  | 'dashboard:view'
  | 'data:upload'
  | 'data:validate'
  | 'data:delete';

export const ROLE_PERMISSIONS: Record<UserRole, RBACPermission[]> = {
  viewer: ['dashboard:view'],
  administrator: ['dashboard:view', 'data:upload', 'data:validate', 'data:delete'],
};
```

**RBAC 유틸리티:**

```typescript
// src/lib/auth/rbac.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { UserRole, RBACPermission } from './types';
import { ROLE_PERMISSIONS } from './types';

export async function getUserRole(): Promise<UserRole | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_user_id', userId)
    .single();

  return user?.role as UserRole ?? 'viewer';
}

export async function hasPermission(permission: RBACPermission): Promise<boolean> {
  const role = await getUserRole();

  if (!role) {
    return false;
  }

  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function requirePermission(permission: RBACPermission): Promise<void> {
  const allowed = await hasPermission(permission);

  if (!allowed) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

export async function requireRole(role: UserRole): Promise<void> {
  const userRole = await getUserRole();

  if (userRole !== role) {
    throw new Error(`Forbidden: Requires ${role} role`);
  }
}
```

**클라이언트 훅:**

```typescript
// src/hooks/useUserRole.ts
'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import type { UserRole } from '@/lib/auth/types';

export function useUserRole() {
  const { user, isLoaded } = useUser();

  return useQuery<UserRole | null>({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const response = await fetch('/api/auth/role');
      if (!response.ok) return 'viewer';

      const data = await response.json();
      return data.role;
    },
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
```

**API Route:**

```typescript
// src/app/api/auth/role/route.ts
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/lib/auth/rbac';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole();

    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

#### 2.2.3 Clerk Webhook (사용자 동기화)

**파일 위치:**
- `src/app/api/webhooks/clerk/route.ts` (신규)

```typescript
// src/app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification error', { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ');

    await supabase.from('users').upsert({
      clerk_user_id: id,
      email,
      name,
      role: 'viewer', // 기본값
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'clerk_user_id',
    });
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data;

    await supabase
      .from('users')
      .delete()
      .eq('clerk_user_id', id);
  }

  return new Response('', { status: 200 });
}
```

---

## 3. 데이터베이스 클라이언트 및 타입

### 3.1 현재 상태 분석

**기존 코드:**
- `/src/lib/supabase/server-client.ts`: 서버 클라이언트 구현됨
- `/src/lib/supabase/browser-client.ts`: 브라우저 클라이언트 구현됨
- `/src/lib/supabase/types.ts`: 빈 타입 정의

### 3.2 구현 계획

#### 3.2.1 타입 생성

**Supabase CLI로 타입 자동 생성:**

```bash
# Supabase 프로젝트 연결
npx supabase login
npx supabase link --project-ref <project-ref>

# 타입 생성
npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
```

**수동 타입 정의 (백업):**

```typescript
// src/lib/supabase/types.ts
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          name: string | null;
          role: 'viewer' | 'administrator';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      departments: {
        Row: {
          id: string;
          college_name: string;
          department_name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      kpi_metrics: {
        Row: {
          id: string;
          department_id: string;
          evaluation_year: number;
          employment_rate: number | null;
          full_time_faculty: number | null;
          visiting_faculty: number | null;
          tech_transfer_income: number | null;
          intl_conference_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kpi_metrics']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['kpi_metrics']['Insert']>;
      };
      publications: {
        Row: {
          id: string;
          publication_id: string;
          department_id: string;
          title: string;
          main_author: string;
          co_authors: string | null;
          journal_name: string;
          journal_grade: 'SCIE' | 'SSCI' | 'A&HCI' | 'SCOPUS' | 'KCI' | 'Other' | null;
          impact_factor: number | null;
          publication_date: string;
          project_linked: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['publications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
          project_linked?: boolean;
        };
        Update: Partial<Database['public']['Tables']['publications']['Insert']>;
      };
      research_projects: {
        Row: {
          id: string;
          project_number: string;
          project_name: string;
          principal_investigator: string;
          department_id: string;
          funding_agency: string;
          total_budget: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['research_projects']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['research_projects']['Insert']>;
      };
      budget_executions: {
        Row: {
          id: string;
          execution_id: string;
          project_id: string;
          execution_date: string;
          execution_item: string;
          execution_amount: number;
          status: '집행완료' | '처리중';
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budget_executions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['budget_executions']['Insert']>;
      };
      students: {
        Row: {
          id: string;
          student_number: string;
          name: string;
          department_id: string;
          grade: number | null;
          program_type: '학사' | '석사' | '박사' | '석박통합' | null;
          enrollment_status: '재학' | '휴학' | '졸업' | '자퇴' | '제적' | null;
          gender: '남' | '여' | '기타' | null;
          admission_year: number | null;
          advisor: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
      };
      upload_logs: {
        Row: {
          id: string;
          user_id: string | null;
          file_name: string;
          file_type: string;
          file_size: number | null;
          data_type: 'department_kpi' | 'publication_list' | 'research_project_data' | 'student_roster';
          status: 'uploaded' | 'validated' | 'completed' | 'failed';
          rows_processed: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['upload_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['upload_logs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
```

#### 3.2.2 Service Role Key 클라이언트

**파일 위치:**
- `src/lib/supabase/service-client.ts` (신규)

```typescript
// src/lib/supabase/service-client.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/constants/env';
import type { Database } from './types';

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseServiceClient() {
  if (serviceClient) {
    return serviceClient;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  serviceClient = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return serviceClient;
}
```

---

## 4. 공통 레이아웃 컴포넌트

### 4.1 레이아웃 구조

```
┌─────────────────────────────────────────────────┐
│ Header                                          │
│ [Logo] [대시보드] [데이터관리]     [Avatar ▼]  │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│ Sidebar   │  Main Content Area                 │
│           │                                     │
│ - 메인    │                                     │
│ - 학과    │                                     │
│ - 연구    │                                     │
│ - 예산    │                                     │
│ - 학생    │                                     │
│ [관리자]  │                                     │
│ - 업로드  │                                     │
│ - 검증    │                                     │
│ - 조회    │                                     │
│           │                                     │
└───────────┴─────────────────────────────────────┘
```

### 4.2 구현 계획

#### 4.2.1 Dashboard Layout

**파일 위치:**
- `src/components/layout/dashboard-layout.tsx` (신규)

```typescript
// src/components/layout/dashboard-layout.tsx
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
```

#### 4.2.2 Header

**파일 위치:**
- `src/components/layout/header.tsx` (신규)

```typescript
// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';

export function Header() {
  const { isSignedIn } = useUser();
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
          {isSignedIn && (
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
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
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
```

#### 4.2.3 Sidebar

**파일 위치:**
- `src/components/layout/sidebar.tsx` (신규)
- `src/lib/navigation/menu-config.ts` (신규)

**메뉴 설정:**

```typescript
// src/lib/navigation/menu-config.ts
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Wallet,
  Users,
  Upload,
  CheckSquare,
  Database,
} from 'lucide-react';

export type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  role?: 'administrator' | 'viewer';
  children?: MenuItem[];
};

export const MENU_ITEMS: MenuItem[] = [
  {
    title: '메인 대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '학과 성과 관리',
    href: '/dashboard/department',
    icon: Building2,
    children: [
      {
        title: '학과별 KPI',
        href: '/dashboard/department/kpi',
        icon: LayoutDashboard,
      },
      {
        title: '취업률 분석',
        href: '/dashboard/department/employment',
        icon: GraduationCap,
      },
      {
        title: '교원 현황',
        href: '/dashboard/department/faculty',
        icon: Users,
      },
    ],
  },
  {
    title: '연구 성과 분석',
    href: '/dashboard/research',
    icon: GraduationCap,
    children: [
      {
        title: '논문 게재 현황',
        href: '/dashboard/research/publications',
        icon: LayoutDashboard,
      },
      {
        title: '연구과제 관리',
        href: '/dashboard/research/projects',
        icon: Database,
      },
      {
        title: '연구자 성과',
        href: '/dashboard/research/researchers',
        icon: Users,
      },
    ],
  },
  {
    title: '예산 관리',
    href: '/dashboard/budget',
    icon: Wallet,
    children: [
      {
        title: '예산 집행 현황',
        href: '/dashboard/budget/execution',
        icon: LayoutDashboard,
      },
      {
        title: '과제별 예산 상세',
        href: '/dashboard/budget/projects',
        icon: Database,
      },
    ],
  },
  {
    title: '학생 현황',
    href: '/dashboard/students',
    icon: Users,
    children: [
      {
        title: '재학생 현황',
        href: '/dashboard/students/enrollment',
        icon: LayoutDashboard,
      },
      {
        title: '지도교수별 현황',
        href: '/dashboard/students/advisors',
        icon: Users,
      },
    ],
  },
  {
    title: '파일 업로드',
    href: '/data/upload',
    icon: Upload,
    role: 'administrator',
  },
  {
    title: '데이터 검증',
    href: '/data/validation',
    icon: CheckSquare,
    role: 'administrator',
  },
  {
    title: '데이터 조회',
    href: '/data/browse',
    icon: Database,
    role: 'administrator',
  },
];
```

**Sidebar 컴포넌트:**

```typescript
// src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { MENU_ITEMS, type MenuItem } from '@/lib/navigation/menu-config';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function Sidebar() {
  const pathname = usePathname();
  const { data: role } = useUserRole();

  const visibleItems = MENU_ITEMS.filter(
    (item) => !item.role || item.role === role
  );

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r bg-background">
      <nav className="flex flex-col gap-2 p-4">
        {visibleItems.map((item) => (
          <MenuItem key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}

function MenuItem({ item, pathname }: { item: MenuItem; pathname: string }) {
  const [isOpen, setIsOpen] = useState(pathname.startsWith(item.href));

  if (item.children) {
    return (
      <Accordion type="single" collapsible value={isOpen ? item.href : ''}>
        <AccordionItem value={item.href} className="border-none">
          <AccordionTrigger
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:no-underline',
              pathname.startsWith(item.href) && 'bg-accent'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
          </AccordionTrigger>
          <AccordionContent className="pl-6 pt-1">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent',
                  pathname === child.href && 'bg-accent font-medium'
                )}
              >
                <child.icon className="h-4 w-4" />
                <span>{child.title}</span>
              </Link>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent',
        pathname === item.href && 'bg-accent'
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.title}</span>
    </Link>
  );
}
```

---

## 5. 공통 UI 컴포넌트

### 5.1 KPI Card

**파일 위치:**
- `src/components/dashboard/kpi-card.tsx` (신규)

```typescript
// src/components/dashboard/kpi-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type KPICardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: KPICardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5.2 Filter Panel

**파일 위치:**
- `src/components/dashboard/filter-panel.tsx` (신규)

```typescript
// src/components/dashboard/filter-panel.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type FilterValue = string | number | null;

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterConfig = {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
};

type FilterPanelProps = {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, FilterValue>) => void;
  onReset?: () => void;
};

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
}: FilterPanelProps) {
  const [values, setValues] = useState<Record<string, FilterValue>>(() => {
    return filters.reduce((acc, filter) => {
      acc[filter.key] = filter.defaultValue ?? null;
      return acc;
    }, {} as Record<string, FilterValue>);
  });

  const handleChange = (key: string, value: string) => {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);
    onFilterChange(nextValues);
  };

  const handleReset = () => {
    const resetValues = filters.reduce((acc, filter) => {
      acc[filter.key] = filter.defaultValue ?? null;
      return acc;
    }, {} as Record<string, FilterValue>);

    setValues(resetValues);
    onFilterChange(resetValues);
    onReset?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <Select
              value={values[filter.key] as string}
              onValueChange={(value) => handleChange(filter.key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`${filter.label} 선택`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button variant="outline" onClick={handleReset} className="w-full">
          초기화
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 5.3 Data Table

**파일 위치:**
- `src/components/dashboard/data-table.tsx` (신규)

```typescript
// src/components/dashboard/data-table.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

export type ColumnDef<TData> = {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  cell?: (row: TData) => React.ReactNode;
  sortable?: boolean;
};

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
};

export function DataTable<TData>({
  columns,
  data,
  onSort,
}: DataTableProps<TData>) {
  const handleSort = (columnId: string) => {
    if (onSort) {
      // 간단한 구현: 항상 토글
      onSort(columnId, 'asc');
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id}>
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.id)}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {column.cell
                      ? column.cell(row)
                      : column.accessorKey
                      ? String(row[column.accessorKey])
                      : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 5.4 Empty State

**파일 위치:**
- `src/components/dashboard/empty-state.tsx` (신규)

```typescript
// src/components/dashboard/empty-state.tsx
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

---

## 6. 데이터 Fetching 유틸리티

### 6.1 React Query Hooks

**파일 위치:**
- `src/hooks/api/useKPIMetrics.ts` (신규)
- `src/hooks/api/usePublications.ts` (신규)
- `src/hooks/api/useResearchProjects.ts` (신규)
- `src/hooks/api/useStudents.ts` (신규)

**예시: KPI Metrics Hook**

```typescript
// src/hooks/api/useKPIMetrics.ts
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/lib/supabase/types';

type KPIMetric = Database['public']['Tables']['kpi_metrics']['Row'] & {
  department: {
    college_name: string;
    department_name: string;
  };
};

type KPIFilters = {
  evaluation_year?: number;
  college_name?: string;
  department_name?: string;
};

export function useKPIMetrics(filters: KPIFilters = {}) {
  return useQuery<KPIMetric[]>({
    queryKey: ['kpi-metrics', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      const response = await fetch(`/api/kpi-metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch KPI metrics');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useKPIMetricsAggregate(filters: KPIFilters = {}) {
  return useQuery({
    queryKey: ['kpi-metrics-aggregate', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      const response = await fetch(`/api/kpi-metrics/aggregate?${params}`);
      if (!response.ok) throw new Error('Failed to fetch aggregate data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### 6.2 API Routes (Hono)

**파일 위치:**
- `src/features/kpi/backend/route.ts` (신규)

```typescript
// src/features/kpi/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const kpiFilterSchema = z.object({
  evaluation_year: z.coerce.number().optional(),
  college_name: z.string().optional(),
  department_name: z.string().optional(),
});

export function registerKPIRoutes(app: Hono<AppEnv>) {
  const kpi = new Hono<AppEnv>();

  kpi.get('/', zValidator('query', kpiFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('kpi_metrics')
      .select('*, departments(college_name, department_name)');

    if (filters.evaluation_year) {
      query = query.eq('evaluation_year', filters.evaluation_year);
    }

    if (filters.college_name) {
      query = query.eq('departments.college_name', filters.college_name);
    }

    if (filters.department_name) {
      query = query.eq('departments.department_name', filters.department_name);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  });

  kpi.get('/aggregate', zValidator('query', kpiFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 집계 쿼리 구현
    // ...

    return c.json({
      avg_employment_rate: 0,
      total_departments: 0,
      // ...
    });
  });

  app.route('/kpi-metrics', kpi);
}
```

**Hono App 통합:**

```typescript
// src/backend/hono/app.ts 수정
import { registerKPIRoutes } from '@/features/kpi/backend/route';
// ... 기타 imports

export const createHonoApp = () => {
  // ... 기존 코드

  registerExampleRoutes(app);
  registerKPIRoutes(app); // 추가

  // ...
};
```

---

## 7. 차트 공통 컴포넌트

### 7.1 Recharts 설치

```bash
npm install recharts
```

### 7.2 차트 래퍼 컴포넌트

**파일 위치:**
- `src/components/charts/chart-wrapper.tsx` (신규)
- `src/components/charts/bar-chart.tsx` (신규)
- `src/components/charts/line-chart.tsx` (신규)
- `src/components/charts/pie-chart.tsx` (신규)

**Chart Wrapper:**

```typescript
// src/components/charts/chart-wrapper.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ChartWrapperProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  onDownload?: () => void;
};

export function ChartWrapper({
  title,
  description,
  children,
  isLoading,
  onDownload,
}: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
```

**Bar Chart:**

```typescript
// src/components/charts/bar-chart.tsx
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type BarChartProps = {
  data: Record<string, unknown>[];
  dataKey: string;
  xAxisKey: string;
  yAxisLabel?: string;
  color?: string;
};

export function BarChart({
  data,
  dataKey,
  xAxisKey,
  yAxisLabel,
  color = '#8884d8',
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey} fill={color} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
```

---

## 8. 에러 핸들링

### 8.1 Error Boundary

**파일 위치:**
- `src/components/error/error-boundary.tsx` (신규)

```typescript
// src/components/error/error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              오류가 발생했습니다
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {this.state.error.message}
            </p>
            <Button onClick={this.reset}>다시 시도</Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

### 8.2 Error Toast

**파일 위치:**
- `src/lib/errors/toast.ts` (신규)

```typescript
// src/lib/errors/toast.ts
import { toast } from '@/hooks/use-toast';

export function showErrorToast(error: unknown, fallbackMessage?: string) {
  const message =
    error instanceof Error ? error.message : fallbackMessage ?? '오류가 발생했습니다';

  toast({
    variant: 'destructive',
    title: '오류',
    description: message,
  });
}

export function showSuccessToast(message: string) {
  toast({
    title: '성공',
    description: message,
  });
}
```

---

## 9. 유틸리티 함수

### 9.1 날짜 포맷팅

**파일 위치:**
- `src/lib/utils/date.ts` (신규)

```typescript
// src/lib/utils/date.ts
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(
  date: string | Date,
  formatStr: string = 'yyyy-MM-dd'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ko });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function getYearOptions(startYear: number = 2020): { label: string; value: string }[] {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let year = currentYear; year >= startYear; year--) {
    years.push({
      label: `${year}년`,
      value: String(year),
    });
  }

  return years;
}
```

### 9.2 숫자 포맷팅

**파일 위치:**
- `src/lib/utils/number.ts` (신규)

```typescript
// src/lib/utils/number.ts
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatBudget(value: number): string {
  if (value >= 100000000) {
    // 억 단위
    return `${formatNumber(value / 100000000, 1)}억원`;
  } else if (value >= 10000) {
    // 만 단위
    return `${formatNumber(value / 10000, 1)}만원`;
  }
  return `${formatNumber(value)}원`;
}
```

### 9.3 CSV 다운로드

**파일 위치:**
- `src/lib/utils/download.ts` (신규)

```typescript
// src/lib/utils/download.ts
export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

## 10. 구현 우선순위

### Phase 1: 핵심 인프라 (1-2주)

**우선순위 1 (즉시 시작 필요):**
1. ✅ Clerk 설치 및 통합
2. ✅ middleware.ts 교체
3. ✅ app/layout.tsx 수정
4. ✅ RBAC 구현 (getUserRole, hasPermission)
5. ✅ Supabase 타입 생성 (Database 타입)
6. ✅ Service Role Client 구현

**우선순위 2 (병렬 진행 가능):**
7. ✅ Clerk Webhook 구현 (사용자 동기화)
8. ✅ Header 컴포넌트
9. ✅ Sidebar 컴포넌트
10. ✅ DashboardLayout 컴포넌트

### Phase 2: 공통 UI (2-3주)

**우선순위 3:**
11. ✅ KPI Card
12. ✅ Filter Panel
13. ✅ Data Table
14. ✅ Empty State
15. ✅ Chart Wrapper
16. ✅ Bar Chart, Line Chart, Pie Chart

**우선순위 4:**
17. ✅ Error Boundary
18. ✅ Error Toast
19. ✅ 유틸리티 함수 (date, number, download)

### Phase 3: 데이터 Fetching (병렬 진행)

**우선순위 5 (각 팀별 담당):**
20. ✅ KPI Metrics API + Hook
21. ✅ Publications API + Hook
22. ✅ Research Projects API + Hook
23. ✅ Students API + Hook
24. ✅ Budget Executions API + Hook

---

## 11. 검증 체크리스트

### 11.1 인증 검증

- [ ] Clerk 설치 완료 (`@clerk/nextjs@latest`)
- [ ] middleware.ts가 `clerkMiddleware()` 사용
- [ ] ClerkProvider가 app/layout.tsx에 적용
- [ ] Google OAuth 로그인 성공
- [ ] 사용자 role이 Supabase users 테이블에 동기화
- [ ] 관리자 권한으로 /data/upload 접근 가능
- [ ] 일반 사용자로 /data/upload 접근 시 403

### 11.2 레이아웃 검증

- [ ] Header가 모든 페이지에 표시
- [ ] Sidebar 메뉴가 role에 따라 필터링
- [ ] 현재 경로가 Sidebar에서 하이라이트
- [ ] 모바일에서 반응형 동작

### 11.3 데이터 검증

- [ ] Supabase 타입이 자동 생성되었거나 수동 정의됨
- [ ] Service Role Key가 환경 변수에 설정
- [ ] API Route에서 Supabase 쿼리 성공
- [ ] React Query 캐싱 동작 확인

### 11.4 UI 컴포넌트 검증

- [ ] KPI Card가 올바르게 렌더링
- [ ] Filter Panel에서 필터 변경 시 콜백 호출
- [ ] Data Table에서 정렬 가능
- [ ] Empty State가 데이터 없을 때 표시
- [ ] Chart가 Recharts로 렌더링

---

## 12. 주의사항 및 제약사항

### 12.1 Clerk 통합 주의사항

**중요:**
- 현재 코드베이스는 Supabase Auth를 사용 중
- Clerk로 마이그레이션 시 기존 인증 코드 모두 교체 필요
- `/src/features/auth/` 디렉토리 전체 재작성 또는 삭제

**마이그레이션 순서:**
1. Clerk 설치
2. middleware.ts 교체
3. app/layout.tsx 수정
4. 기존 auth 관련 코드 제거
5. 새로운 RBAC 구현

### 12.2 타입 안정성

- Database 타입이 정의되기 전까지 타입 에러 발생 가능
- Supabase CLI로 타입 자동 생성 권장
- 수동 타입 정의 시 스키마와 일치 필수

### 12.3 환경 변수

**필수 환경 변수:**
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 12.4 코드 충돌 방지

**절대 수정하지 말아야 할 공통 파일:**
- `middleware.ts`
- `src/app/layout.tsx`
- `src/lib/auth/*`
- `src/lib/supabase/*`
- `src/components/layout/*`
- `src/lib/navigation/menu-config.ts`

**페이지별 독립 작업:**
- `/src/app/dashboard/**` - 각 페이지 독립적으로 개발
- `/src/features/**` - 기능별 모듈화
- API Routes는 Hono 라우터로 등록하여 충돌 방지

---

## 13. 다음 단계

### 13.1 즉시 시작 가능한 작업

1. **Clerk 설치 및 인증 통합** (최우선)
2. **Supabase 타입 생성** (병렬)
3. **공통 레이아웃 구현** (병렬)

### 13.2 페이지별 개발 준비

공통 모듈 구현 완료 후:
- 각 페이지 팀은 독립적으로 개발 시작 가능
- API Routes는 Hono 라우터로 등록
- React Query Hooks로 데이터 페칭

---

**문서 종료**

이 공통 모듈 계획서는 PRD, Userflow, Database Design 문서를 기반으로 작성되었으며, 현재 프로젝트 상태를 반영하여 Clerk 통합 방안을 포함합니다. 모든 페이지 개발이 병렬로 진행될 수 있도록 코드 충돌 가능성을 최소화했습니다.
