# 홈페이지 구현 계획서 (/)

**페이지 경로**: `/`
**페이지 이름**: 홈페이지 (Landing Page)
**접근 권한**: Public (비인증 사용자 접근 가능)
**버전**: 1.0
**작성일**: 2025-11-02
**프로젝트**: University Dashboard - Vibe Dashboard 2

---

## 목차

1. [페이지 개요 및 목적](#1-페이지-개요-및-목적)
2. [UI 구성 요소](#2-ui-구성-요소)
3. [기능 요구사항](#3-기능-요구사항)
4. [사용할 공통 컴포넌트](#4-사용할-공통-컴포넌트)
5. [구현 상세](#5-구현-상세)
6. [라우팅 및 네비게이션](#6-라우팅-및-네비게이션)
7. [테스트 시나리오](#7-테스트-시나리오)
8. [체크리스트](#8-체크리스트)

---

## 1. 페이지 개요 및 목적

### 1.1 페이지 목적

홈페이지는 대학교 데이터 시각화 대시보드의 **진입점(Entry Point)**으로, 비인증 사용자에게 서비스를 소개하고 Google 로그인을 통해 인증된 사용자로 전환하는 역할을 합니다.

### 1.2 주요 목표

1. **서비스 소개**: 대시보드가 제공하는 가치와 주요 기능 안내
2. **인증 유도**: Google OAuth 로그인 버튼을 통한 사용자 인증
3. **상태별 UI 분기**:
   - 비로그인 상태: 로그인 버튼 표시
   - 로그인 상태: 대시보드 이동 버튼 및 로그아웃 버튼 표시

### 1.3 PRD 요구사항 매핑

| PRD 요구사항 | 구현 내용 |
|------------|---------|
| 홈페이지는 비인증 사용자 접근 가능 | Middleware에서 `/` 경로를 Public Route로 설정 |
| Google 로그인 버튼 제공 | Clerk `<SignInButton>` 컴포넌트 사용 |
| 사이트 소개 | 주요 기능 및 가치 제안 섹션 |
| 로그인 상태 확인 | `useCurrentUser` 훅으로 인증 상태 확인 |

### 1.4 Userflow 매핑

**참조 플로우**: Userflow 6.1 홈페이지 (/)

- **비로그인 상태**:
  - 사이트 소개 섹션 표시
  - 주요 기능 안내
  - "Google로 로그인" 버튼
- **로그인 상태**:
  - 사이트 소개 섹션 (동일)
  - "대시보드로 이동" 버튼

---

## 2. UI 구성 요소

### 2.1 페이지 레이아웃 구조

```
┌─────────────────────────────────────────────┐
│  Header (간소화)                             │
│  [Logo]                        [로그인 상태] │
├─────────────────────────────────────────────┤
│                                             │
│  Hero Section                               │
│  ┌───────────────────────────────────────┐  │
│  │  University Dashboard Logo            │  │
│  │                                       │  │
│  │  대학교 데이터 시각화 대시보드         │  │
│  │  실적, 논문, 예산을 한눈에             │  │
│  │                                       │  │
│  │  [비로그인] Google로 로그인            │  │
│  │  [로그인]   대시보드로 이동            │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Features Section                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 대시보드 │ │ 데이터  │ │ 분석    │       │
│  │ 조회    │ │ 업로드  │ │ 리포트  │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│  Footer                                    │
│  University Dashboard © 2025               │
└─────────────────────────────────────────────┘
```

### 2.2 컴포넌트 계층 구조

```typescript
// src/app/page.tsx (홈페이지)
<main>
  <HomeHeader />          // 간소화된 헤더 (로고 + 로그인 상태)
  <HeroSection />         // 주요 메시지 및 CTA
  <FeaturesSection />     // 주요 기능 소개 (3개 카드)
  <Footer />              // 하단 정보
</main>
```

### 2.3 비로그인 상태 UI

```
┌─────────────────────────────────────────────┐
│ [Logo] University Dashboard     [로그인]    │
├─────────────────────────────────────────────┤
│                                             │
│         대학교 데이터 시각화 대시보드         │
│         Ecount 데이터를 한눈에               │
│                                             │
│         [Google로 로그인]                    │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.4 로그인 상태 UI

```
┌─────────────────────────────────────────────┐
│ [Logo] University Dashboard  user@edu [▼]  │
├─────────────────────────────────────────────┤
│                                             │
│         대학교 데이터 시각화 대시보드         │
│         Ecount 데이터를 한눈에               │
│                                             │
│         [대시보드로 이동]                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 3. 기능 요구사항

### 3.1 핵심 기능

#### F-HOME-001: 인증 상태 확인

**설명**: 사용자의 현재 인증 상태를 확인하고 UI를 동적으로 변경

**입력**:
- 페이지 로드 시 자동 실행
- `useCurrentUser` 훅 호출

**처리**:
1. Supabase Auth 세션 확인
2. 세션이 있는 경우: 사용자 정보 로드 (email, name)
3. 세션이 없는 경우: 비로그인 상태로 처리

**출력**:
- `isAuthenticated`: boolean
- `user`: User 객체 또는 null
- `isLoading`: boolean

**사용 Hook**:
```typescript
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

const { user, isAuthenticated, isLoading } = useCurrentUser();
```

---

#### F-HOME-002: Google 로그인

**설명**: Google OAuth를 통한 사용자 인증 (Clerk 사용 예정, 현재는 Supabase Auth)

**입력**:
- "Google로 로그인" 버튼 클릭

**처리**:
1. 현재 코드베이스: Supabase Auth 사용
   ```typescript
   router.push('/login'); // /login 페이지로 이동
   ```
2. 향후 Clerk 통합 시:
   ```typescript
   <SignInButton mode="redirect" redirectUrl="/dashboard">
     <Button>Google로 로그인</Button>
   </SignInButton>
   ```

**출력**:
- 로그인 페이지로 리다이렉트
- 로그인 성공 시 `/dashboard`로 리다이렉트

**관련 유스케이스**: UC-001 (사용자 인증)

---

#### F-HOME-003: 대시보드 이동

**설명**: 로그인된 사용자가 메인 대시보드로 이동

**입력**:
- "대시보드로 이동" 버튼 클릭

**처리**:
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
```

**출력**:
- `/dashboard` 페이지로 네비게이션

---

#### F-HOME-004: 로그아웃

**설명**: 현재 세션 종료

**입력**:
- 헤더의 사용자 드롭다운에서 "로그아웃" 클릭

**처리**:
```typescript
const handleSignOut = async () => {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  await refresh(); // useCurrentUser의 refresh 함수
  router.replace('/');
};
```

**출력**:
- 세션 삭제
- 홈페이지로 리다이렉트
- "로그아웃되었습니다" 토스트 메시지 (선택 사항)

---

### 3.2 보조 기능

#### F-HOME-005: 주요 기능 소개

**설명**: 대시보드가 제공하는 주요 기능을 카드 형태로 표시

**카드 구성**:
1. **대시보드 조회**
   - 아이콘: `LayoutDashboard` (lucide-react)
   - 설명: "전체 대학 핵심 지표를 한눈에 파악"

2. **데이터 업로드** (관리자 전용)
   - 아이콘: `Upload`
   - 설명: "CSV 파일 업로드 및 DB 적재"

3. **분석 리포트**
   - 아이콘: `FileText`
   - 설명: "학과별 성과 분석 및 리포트 다운로드"

---

## 4. 사용할 공통 컴포넌트

### 4.1 Shadcn UI 컴포넌트

| 컴포넌트 | 용도 | 경로 |
|---------|------|------|
| `Button` | 로그인, 대시보드 이동 버튼 | `@/components/ui/button` |
| `Card` | 주요 기능 소개 카드 | `@/components/ui/card` |
| `DropdownMenu` | 사용자 프로필 드롭다운 | `@/components/ui/dropdown-menu` |

### 4.2 Lucide React 아이콘

```typescript
import {
  LayoutDashboard,
  Upload,
  FileText,
  LogOut,
  User,
} from 'lucide-react';
```

### 4.3 공통 훅 및 유틸리티

```typescript
// 인증 상태 확인
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

// Supabase 클라이언트
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

// Next.js 라우터
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 클래스 유틸리티
import { cn } from '@/lib/utils';
```

---

## 5. 구현 상세

### 5.1 파일 구조

```
src/
├── app/
│   └── page.tsx                  # 홈페이지 메인 컴포넌트 (수정)
│
└── components/
    └── home/                     # 홈페이지 전용 컴포넌트 (신규)
        ├── home-header.tsx       # 간소화된 헤더
        ├── hero-section.tsx      # 히어로 섹션
        ├── features-section.tsx  # 주요 기능 소개
        └── footer.tsx            # 하단 정보
```

### 5.2 컴포넌트 구현

#### 5.2.1 홈페이지 메인 (`src/app/page.tsx`)

**현재 코드 분석**:
- 기존 코드는 SuperNext 템플릿 소개 페이지로 구성됨
- `useCurrentUser` 훅으로 인증 상태 확인 중
- 로그인/로그아웃 기능 구현되어 있음

**수정 방향**:
- 기존 인증 로직 유지
- Hero Section, Features Section으로 UI 변경
- 대학교 대시보드에 맞게 콘텐츠 교체

```typescript
// src/app/page.tsx
'use client';

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { HomeHeader } from "@/components/home/home-header";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { Footer } from "@/components/home/footer";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <HomeHeader
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
        <HeroSection
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
        />

        <FeaturesSection />
      </div>

      <Footer />
    </main>
  );
}
```

---

#### 5.2.2 HomeHeader (`src/components/home/home-header.tsx`)

**목적**: 간소화된 헤더 (로고 + 로그인 상태)

```typescript
// src/components/home/home-header.tsx
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
};

export function HomeHeader({ user, isAuthenticated, isLoading }: HomeHeaderProps) {
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh(); // 페이지 새로고침으로 useCurrentUser 재실행
  }, [router]);

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
```

---

#### 5.2.3 HeroSection (`src/components/home/hero-section.tsx`)

**목적**: 주요 메시지 및 CTA (Call-to-Action)

```typescript
// src/components/home/hero-section.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type HeroSectionProps = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function HeroSection({ isAuthenticated, isLoading }: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold tracking-tight text-white md:text-6xl">
        대학교 데이터 시각화 대시보드
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-slate-300 md:text-xl">
        Ecount에서 추출한 데이터를 기반으로 실적, 논문 게재 수, 학생 수, 예산 등을
        직관적으로 파악하고 공유할 수 있는 맞춤형 그래프 및 차트를 제공합니다.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        {!isLoading && !isAuthenticated && (
          <Button asChild size="lg" className="px-8">
            <Link href="/login">Google로 로그인</Link>
          </Button>
        )}

        {!isLoading && isAuthenticated && (
          <Button asChild size="lg" className="px-8">
            <Link href="/dashboard">대시보드로 이동</Link>
          </Button>
        )}

        {isLoading && (
          <Button disabled size="lg" className="px-8">
            로딩 중...
          </Button>
        )}
      </div>
    </section>
  );
}
```

---

#### 5.2.4 FeaturesSection (`src/components/home/features-section.tsx`)

**목적**: 주요 기능 소개 (3개 카드)

```typescript
// src/components/home/features-section.tsx
'use client';

import { LayoutDashboard, Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: LayoutDashboard,
    title: '대시보드 조회',
    description: '전체 대학 핵심 지표를 한눈에 파악하고, 학과별 성과를 비교할 수 있습니다.',
  },
  {
    icon: Upload,
    title: '데이터 업로드',
    description: 'CSV 파일을 업로드하여 데이터베이스에 적재하고 검증할 수 있습니다. (관리자 전용)',
  },
  {
    icon: FileText,
    title: '분석 리포트',
    description: '학과별 KPI, 논문 게재 현황, 연구비 집행 등 다양한 분석 리포트를 제공합니다.',
  },
];

export function FeaturesSection() {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card key={feature.title} className="border-slate-700 bg-slate-900/60">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
                <Icon className="h-6 w-6 text-slate-200" />
              </div>
              <CardTitle className="text-slate-100">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
```

---

#### 5.2.5 Footer (`src/components/home/footer.tsx`)

**목적**: 하단 정보 표시

```typescript
// src/components/home/footer.tsx
'use client';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/80 py-8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-400">
        <p>University Dashboard © {currentYear}. All rights reserved.</p>
      </div>
    </footer>
  );
}
```

---

### 5.3 상태 관리

#### 5.3.1 인증 상태

**사용 Hook**: `useCurrentUser`

```typescript
// src/features/auth/hooks/useCurrentUser.ts (기존 코드 사용)
const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
```

**상태 흐름**:
1. 컴포넌트 마운트 시 자동 실행
2. Supabase Auth 세션 확인
3. 세션이 있으면 `user` 객체 반환, 없으면 `null`
4. `isAuthenticated` boolean 값 제공
5. 로그아웃 시 `refresh()` 호출하여 상태 업데이트

#### 5.3.2 로딩 상태

```typescript
{isLoading && <Spinner />}
{!isLoading && isAuthenticated && <AuthenticatedUI />}
{!isLoading && !isAuthenticated && <UnauthenticatedUI />}
```

---

### 5.4 API 연동

홈페이지는 **데이터 페칭이 없는 정적 페이지**입니다.

**필요한 API**:
- 없음 (인증 상태 확인은 `useCurrentUser` 훅이 자동 처리)

**향후 Clerk 통합 시**:
- Clerk SDK가 자동으로 세션 확인
- `useUser()` 훅 사용
- `<SignInButton>`, `<UserButton>` 컴포넌트 사용

---

## 6. 라우팅 및 네비게이션

### 6.1 페이지 경로

| 페이지 | 경로 | 인증 필요 | 설명 |
|--------|------|----------|------|
| 홈페이지 | `/` | 불필요 (Public) | 비인증/인증 모두 접근 가능 |
| 로그인 | `/login` | 불필요 | Supabase Auth 로그인 페이지 (기존 구현) |
| 회원가입 | `/signup` | 불필요 | Supabase Auth 회원가입 페이지 (기존 구현) |
| 메인 대시보드 | `/dashboard` | 필요 | 인증된 사용자만 접근 |

### 6.2 네비게이션 플로우

```
[홈페이지 /]
    ↓
비로그인 상태
    ↓
[로그인 버튼 클릭]
    ↓
[/login 페이지]
    ↓
Google OAuth 인증
    ↓
로그인 성공
    ↓
[/dashboard로 리다이렉트]
```

```
[홈페이지 /]
    ↓
로그인 상태
    ↓
[대시보드 이동 버튼 클릭]
    ↓
[/dashboard로 네비게이션]
```

### 6.3 Middleware 설정 확인

**현재 코드 (`middleware.ts`)**:
- Supabase Auth 기반 인증 확인
- 보호된 경로 설정

**필요한 설정**:
- `/` 경로는 Public Route로 유지 (인증 불필요)
- `/dashboard/*` 경로는 인증 필요

**향후 Clerk 통합 시**:
```typescript
// middleware.ts (수정 예정)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/']);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return; // 인증 불필요
  }

  await auth.protect(); // 나머지 경로는 인증 필요
});
```

---

## 7. 테스트 시나리오

### 7.1 성공 케이스

| TC ID | 시나리오 | 입력 | 기대 결과 |
|-------|---------|------|----------|
| TC-HOME-01 | 비로그인 상태에서 홈페이지 접근 | URL 직접 입력: `/` | Hero Section 표시, "Google로 로그인" 버튼 표시 |
| TC-HOME-02 | 로그인 버튼 클릭 | "Google로 로그인" 버튼 클릭 | `/login` 페이지로 이동 |
| TC-HOME-03 | 로그인 후 홈페이지 접근 | 로그인 완료 후 `/` 접근 | "대시보드로 이동" 버튼 표시, 사용자 이메일 표시 |
| TC-HOME-04 | 대시보드 이동 버튼 클릭 | "대시보드로 이동" 버튼 클릭 | `/dashboard` 페이지로 네비게이션 |
| TC-HOME-05 | 로그아웃 클릭 | 헤더 드롭다운에서 "로그아웃" 클릭 | 세션 종료, 홈페이지 새로고침, 비로그인 상태 UI 표시 |
| TC-HOME-06 | Features Section 표시 | 페이지 스크롤 | 3개 카드 정상 렌더링 (대시보드 조회, 데이터 업로드, 분석 리포트) |

### 7.2 로딩 상태 테스트

| TC ID | 시나리오 | 입력 | 기대 결과 |
|-------|---------|------|----------|
| TC-HOME-07 | 초기 로딩 상태 | 페이지 마운트 직후 | "로딩 중..." 메시지 표시 |
| TC-HOME-08 | 로딩 완료 후 UI 전환 | 세션 확인 완료 | 로그인/비로그인 상태에 맞는 UI 표시 |

### 7.3 에러 케이스

| TC ID | 시나리오 | 입력 | 기대 결과 |
|-------|---------|------|----------|
| TC-HOME-09 | Supabase 연결 오류 | 네트워크 단절 상태 | 에러 메시지 표시 (선택 사항), 기본 UI 표시 |
| TC-HOME-10 | 로그아웃 실패 | Supabase 오류 발생 | 에러 토스트 메시지, 재시도 안내 |

### 7.4 반응형 테스트

| TC ID | 시나리오 | 기대 결과 |
|-------|---------|----------|
| TC-HOME-11 | 모바일 뷰 (375px) | 버튼 세로 배치, 카드 1열 표시 |
| TC-HOME-12 | 태블릿 뷰 (768px) | 카드 2열 표시 |
| TC-HOME-13 | 데스크톱 뷰 (1920px) | 카드 3열 표시 |

---

## 8. 체크리스트

### 8.1 구현 전 확인사항

- [ ] `useCurrentUser` 훅이 `/src/features/auth/hooks/useCurrentUser.ts`에 존재하는지 확인
- [ ] Supabase Auth 로그인 페이지(`/login`, `/signup`)가 구현되어 있는지 확인
- [ ] Shadcn UI 컴포넌트 (`Button`, `Card`, `DropdownMenu`) 설치 확인
- [ ] Lucide React 아이콘 패키지 설치 확인 (`lucide-react`)

### 8.2 구현 단계

**Phase 1: 기본 구조 (1일)**
- [ ] `src/components/home/` 디렉토리 생성
- [ ] `HomeHeader` 컴포넌트 구현
- [ ] `HeroSection` 컴포넌트 구현
- [ ] `FeaturesSection` 컴포넌트 구현
- [ ] `Footer` 컴포넌트 구현

**Phase 2: 메인 페이지 통합 (0.5일)**
- [ ] `src/app/page.tsx` 수정
- [ ] 기존 인증 로직 유지하면서 새 UI 적용
- [ ] 로컬 개발 서버에서 동작 확인

**Phase 3: 스타일링 및 반응형 (0.5일)**
- [ ] Tailwind CSS 클래스 적용
- [ ] 반응형 디자인 검증 (모바일, 태블릿, 데스크톱)
- [ ] 다크 모드 지원 (배경색, 텍스트 색상)

**Phase 4: 테스트 (0.5일)**
- [ ] 비로그인 상태 UI 테스트
- [ ] 로그인 상태 UI 테스트
- [ ] 로그아웃 기능 테스트
- [ ] 네비게이션 링크 동작 확인
- [ ] 로딩 상태 UI 확인

### 8.3 Clerk 통합 준비 (향후)

- [ ] Clerk 설치 및 환경 변수 설정
- [ ] `middleware.ts` Clerk 버전으로 교체
- [ ] `useCurrentUser` 대신 Clerk `useUser()` 훅 사용
- [ ] `<SignInButton>`, `<UserButton>` 컴포넌트로 교체

### 8.4 품질 확인

- [ ] TypeScript 타입 에러 없음
- [ ] ESLint 경고 없음
- [ ] Lighthouse Performance Score > 90
- [ ] 모든 링크 정상 동작
- [ ] 로그인/로그아웃 플로우 검증

---

## 부록

### A. 참고 문서

- [PRD: 3.1.1 공용 페이지 - 홈페이지](/docs/prd.md)
- [Userflow: 6.1 홈페이지 (/)](/docs/userflow.md)
- [Use Case: UC-001 사용자 인증](/docs/usecases/1-authentication/spec.md)
- [Common Modules: 2. 인증 및 권한 관리](/docs/common-modules.md)

### B. 관련 파일

**기존 파일** (수정):
- `/src/app/page.tsx` - 홈페이지 메인

**신규 파일** (생성):
- `/src/components/home/home-header.tsx`
- `/src/components/home/hero-section.tsx`
- `/src/components/home/features-section.tsx`
- `/src/components/home/footer.tsx`

**의존 파일** (기존 사용):
- `/src/features/auth/hooks/useCurrentUser.ts`
- `/src/lib/supabase/browser-client.ts`
- `/src/components/ui/button.tsx`
- `/src/components/ui/card.tsx`
- `/src/components/ui/dropdown-menu.tsx`

### C. 향후 개선 사항

1. **Clerk 통합** (우선순위: High)
   - PRD 요구사항에 맞춰 Clerk 인증으로 전환
   - Google OAuth 원클릭 로그인 구현

2. **애니메이션 추가** (우선순위: Low)
   - Hero Section fade-in 효과
   - Features 카드 호버 효과

3. **다국어 지원** (우선순위: Future)
   - i18n 라이브러리 통합
   - 한국어/영어 전환

4. **접근성 개선** (우선순위: Medium)
   - ARIA 레이블 추가
   - 키보드 네비게이션 지원
   - 색상 대비 검증 (WCAG 2.1 AA)

---

**문서 종료**

이 구현 계획서는 PRD, Userflow, Use Case, Common Modules 문서를 기반으로 작성되었으며, 현재 코드베이스의 Supabase Auth 구조를 유지하면서 향후 Clerk 통합을 고려한 설계입니다.
