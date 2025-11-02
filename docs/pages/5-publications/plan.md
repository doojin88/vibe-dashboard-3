# 구현 계획: 논문 게재 현황 페이지
# /dashboard/research/publications

**버전:** 1.0
**작성일:** 2025-11-02
**페이지 경로:** `/dashboard/research/publications`
**접근 권한:** Authenticated (모든 로그인 사용자)
**기반 문서:** PRD v1.0, Userflow v1.0, Database Design v2.0, Common Modules v1.0

---

## 목차

1. [페이지 개요](#1-페이지-개요)
2. [기능 요구사항](#2-기능-요구사항)
3. [데이터 모델](#3-데이터-모델)
4. [상태 관리 설계](#4-상태-관리-설계)
5. [컴포넌트 구조](#5-컴포넌트-구조)
6. [API 설계](#6-api-설계)
7. [UI/UX 설계](#7-uiux-설계)
8. [구현 단계](#8-구현-단계)
9. [테스트 계획](#9-테스트-계획)
10. [성능 최적화](#10-성능-최적화)

---

## 1. 페이지 개요

### 1.1 목적

논문 게재 데이터를 시각화하여 다음을 지원합니다:
- 연도별 논문 게재 추이 파악
- SCIE/KCI 등급별 분포 분석
- 학과별 논문 성과 비교
- Impact Factor 추이 분석
- 주저자별 논문 수 랭킹

### 1.2 사용자 시나리오

#### 시나리오 1: 경영진의 연구 성과 파악
```
1. 사이드바에서 "연구 성과 분석 → 논문 게재 현황" 클릭
2. 전체 논문 게재 수 및 SCIE/KCI 분포 확인
3. 연도별 추이 차트로 증감 파악
4. 학과별 비교 차트로 성과 저조 학과 식별
5. 필터로 특정 연도/학과 상세 분석
```

#### 시나리오 2: 교수진의 개인 성과 조회
```
1. 논문 게재 현황 페이지 접근
2. 주저자 필터에 본인 이름 입력
3. 본인 논문 목록 테이블에서 확인
4. 특정 논문 클릭하여 상세 정보 모달 오픈
5. 학술지명, Impact Factor 확인
```

#### 시나리오 3: 학과장의 학과 성과 분석
```
1. 단과대학/학과 필터로 소속 학과 선택
2. 학과별 논문 게재 수 차트에서 위치 확인
3. 저널 등급별 분포로 SCIE 비율 파악
4. Impact Factor 평균 확인
5. CSV 다운로드하여 보고서 작성
```

### 1.3 주요 기능

**필터링**
- 게재 연도 (다중 선택)
- 단과대학 (다중 선택)
- 학과 (다중 선택)
- 저널 등급 (SCIE, KCI 등)
- 주저자 검색

**시각화**
- KPI 카드: 총 논문 수, SCIE 수, KCI 수, 평균 Impact Factor
- 연도별 논문 게재 수 (라인 차트) - SCIE/KCI 구분
- 학술지 등급별 분포 (파이 차트)
- 학과별 논문 게재 수 (막대 그래프)
- Impact Factor 평균 추이 (라인 차트)
- 주저자별 논문 수 랭킹 (테이블, Top 20)

**상세 정보**
- 논문 목록 테이블 (페이지네이션)
- 논문 상세 모달 (제목, 저자, 학술지, IF, 게재일)

**데이터 내보내기**
- CSV 다운로드
- 차트 이미지 다운로드

---

## 2. 기능 요구사항

### 2.1 필수 기능 (MVP)

#### FR-PUB-001: 논문 데이터 조회
- **설명**: publications 테이블에서 논문 데이터를 조회하고 필터링
- **우선순위**: High
- **상세**:
  - 기본 정렬: publication_date DESC
  - JOIN departments (단과대학, 학과 정보)
  - 필터: 연도, 단과대학, 학과, 저널 등급, 주저자
  - 페이지네이션: 50건/페이지

#### FR-PUB-002: KPI 카드 표시
- **설명**: 상단 KPI 카드에 집계 데이터 표시
- **우선순위**: High
- **상세**:
  - 총 논문 수
  - SCIE 논문 수
  - KCI 논문 수
  - 평균 Impact Factor (null 제외)

#### FR-PUB-003: 연도별 추이 차트
- **설명**: 연도별 논문 게재 수를 라인 차트로 표시
- **우선순위**: High
- **상세**:
  - X축: 연도
  - Y축: 논문 수
  - 다중 라인: SCIE (파란색), KCI (초록색)
  - 필터 적용 시 실시간 업데이트

#### FR-PUB-004: 저널 등급별 분포 차트
- **설명**: 저널 등급별 비율을 파이 차트로 표시
- **우선순위**: High
- **상세**:
  - SCIE, SSCI, A&HCI, SCOPUS, KCI, Other
  - 비율 및 절대 수 표시

#### FR-PUB-005: 학과별 논문 수 차트
- **설명**: 학과별 논문 게재 수를 막대 그래프로 표시
- **우선순위**: High
- **상세**:
  - X축: 학과명
  - Y축: 논문 수
  - 내림차순 정렬
  - Top 20 학과만 표시

#### FR-PUB-006: Impact Factor 추이 차트
- **설명**: 연도별 평균 Impact Factor 추이를 라인 차트로 표시
- **우선순위**: Medium
- **상세**:
  - X축: 연도
  - Y축: 평균 Impact Factor
  - null 값 제외

#### FR-PUB-007: 주저자 랭킹 테이블
- **설명**: 주저자별 논문 수를 테이블로 표시
- **우선순위**: Medium
- **상세**:
  - 컬럼: 순위, 이름, 소속 학과, 논문 수, 평균 IF
  - 내림차순 정렬 (논문 수 기준)
  - Top 20만 표시

#### FR-PUB-008: 논문 목록 테이블
- **설명**: 논문 상세 목록을 페이지네이션 테이블로 표시
- **우선순위**: High
- **상세**:
  - 컬럼: 게재일, 제목, 주저자, 학술지명, 저널등급, Impact Factor
  - 페이지네이션: 50건/페이지
  - 정렬: 컬럼 클릭으로 정렬 가능
  - 행 클릭 시 상세 모달 오픈

#### FR-PUB-009: 논문 상세 모달
- **설명**: 논문 클릭 시 상세 정보 모달 표시
- **우선순위**: Medium
- **상세**:
  - 논문 제목
  - 주저자 및 참여저자
  - 학술지명 및 저널등급 (badge)
  - Impact Factor
  - 게재일
  - 과제연계 여부 (badge)
  - 닫기 버튼

#### FR-PUB-010: 필터 패널
- **설명**: 좌측 필터 패널에서 필터 조건 설정
- **우선순위**: High
- **상세**:
  - 게재 연도 (다중 선택)
  - 단과대학 (다중 선택)
  - 학과 (다중 선택, 단과대학 선택 시 필터링)
  - 저널 등급 (다중 선택)
  - 주저자 검색 (텍스트 입력)
  - 초기화 버튼

#### FR-PUB-011: CSV 다운로드
- **설명**: 현재 필터 조건으로 데이터를 CSV로 다운로드
- **우선순위**: Medium
- **상세**:
  - 파일명: `publications_{YYYYMMDD}.csv`
  - UTF-8 BOM 포함
  - 전체 데이터 (페이지네이션 무시)

### 2.2 선택 기능 (Phase 2)

- 차트 이미지 다운로드 (PNG, SVG)
- 논문 상세 정보 공유 (URL)
- 즐겨찾기 필터 저장
- 알림 설정 (신규 논문 등록 시)

---

## 3. 데이터 모델

### 3.1 데이터베이스 스키마

#### publications 테이블

```sql
CREATE TABLE publications (
  id UUID PRIMARY KEY,
  publication_id VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  title TEXT NOT NULL,
  main_author VARCHAR(100) NOT NULL,
  co_authors TEXT,
  journal_name VARCHAR(200) NOT NULL,
  journal_grade VARCHAR(20), -- SCIE, SSCI, A&HCI, SCOPUS, KCI, Other
  impact_factor DECIMAL(6,3),
  publication_date DATE NOT NULL,
  project_linked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### departments 테이블

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  college_name VARCHAR(100) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_name, department_name)
);
```

### 3.2 TypeScript 타입

#### Database Types

```typescript
// src/lib/supabase/types.ts (일부)
export type Publication = Database['public']['Tables']['publications']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
```

#### Domain Types

```typescript
// src/features/publications/types.ts

export type PublicationWithDepartment = Publication & {
  department: Pick<Department, 'college_name' | 'department_name'>;
};

export type PublicationFilters = {
  year?: number[];
  college_name?: string[];
  department_name?: string[];
  journal_grade?: string[];
  main_author?: string;
};

export type PublicationKPI = {
  total_count: number;
  scie_count: number;
  kci_count: number;
  avg_impact_factor: number | null;
};

export type PublicationTrend = {
  year: number;
  total_count: number;
  scie_count: number;
  kci_count: number;
};

export type JournalGradeDistribution = {
  journal_grade: string;
  count: number;
  percentage: number;
};

export type DepartmentPublicationCount = {
  department_id: string;
  college_name: string;
  department_name: string;
  count: number;
};

export type ImpactFactorTrend = {
  year: number;
  avg_impact_factor: number;
};

export type AuthorRanking = {
  main_author: string;
  department_name: string;
  publication_count: number;
  avg_impact_factor: number | null;
};
```

### 3.3 데이터 집계 쿼리

#### KPI 집계

```sql
-- KPI 카드 데이터
SELECT
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE journal_grade = 'SCIE') AS scie_count,
  COUNT(*) FILTER (WHERE journal_grade = 'KCI') AS kci_count,
  AVG(impact_factor) FILTER (WHERE impact_factor IS NOT NULL) AS avg_impact_factor
FROM publications
WHERE [filters]
```

#### 연도별 추이

```sql
-- 연도별 논문 게재 수
SELECT
  EXTRACT(YEAR FROM publication_date) AS year,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE journal_grade = 'SCIE') AS scie_count,
  COUNT(*) FILTER (WHERE journal_grade = 'KCI') AS kci_count
FROM publications
WHERE [filters]
GROUP BY year
ORDER BY year DESC
```

#### 저널 등급별 분포

```sql
-- 저널 등급별 분포
SELECT
  journal_grade,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM publications
WHERE [filters]
GROUP BY journal_grade
ORDER BY count DESC
```

#### 학과별 논문 수

```sql
-- 학과별 논문 수 (Top 20)
SELECT
  d.id AS department_id,
  d.college_name,
  d.department_name,
  COUNT(p.id) AS count
FROM publications p
JOIN departments d ON d.id = p.department_id
WHERE [filters]
GROUP BY d.id, d.college_name, d.department_name
ORDER BY count DESC
LIMIT 20
```

#### Impact Factor 추이

```sql
-- 연도별 평균 Impact Factor
SELECT
  EXTRACT(YEAR FROM publication_date) AS year,
  AVG(impact_factor) AS avg_impact_factor
FROM publications
WHERE impact_factor IS NOT NULL
  AND [filters]
GROUP BY year
ORDER BY year DESC
```

#### 주저자 랭킹

```sql
-- 주저자별 논문 수 (Top 20)
SELECT
  p.main_author,
  d.department_name,
  COUNT(p.id) AS publication_count,
  AVG(p.impact_factor) AS avg_impact_factor
FROM publications p
JOIN departments d ON d.id = p.department_id
WHERE [filters]
GROUP BY p.main_author, d.department_name
ORDER BY publication_count DESC
LIMIT 20
```

---

## 4. 상태 관리 설계

### 4.1 URL 상태 (Query Parameters)

**위치:** URL Query String

**관리:** `useSearchParams` (Next.js)

**상태:**
```typescript
{
  year?: string[];           // ['2023', '2024']
  college?: string[];        // ['공과대학']
  department?: string[];     // ['컴퓨터공학과']
  grade?: string[];          // ['SCIE', 'KCI']
  author?: string;           // '홍길동'
  page?: number;             // 1
  sort?: string;             // 'publication_date'
  order?: 'asc' | 'desc';    // 'desc'
}
```

**이유:**
- 필터 상태를 URL로 공유 가능
- 브라우저 뒤로가기 지원
- 북마크 가능

### 4.2 서버 상태 (React Query)

**위치:** React Query Cache

**관리:** `@tanstack/react-query`

**쿼리 키 구조:**
```typescript
['publications', filters]                    // 논문 목록
['publications', 'kpi', filters]             // KPI 집계
['publications', 'trend', filters]           // 연도별 추이
['publications', 'grade-distribution', filters] // 저널 등급별 분포
['publications', 'department-count', filters]   // 학과별 논문 수
['publications', 'impact-trend', filters]       // Impact Factor 추이
['publications', 'author-ranking', filters]     // 주저자 랭킹
['publications', 'detail', publicationId]       // 논문 상세
```

**캐싱 전략:**
```typescript
{
  staleTime: 5 * 60 * 1000,   // 5분
  cacheTime: 10 * 60 * 1000,  // 10분
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
}
```

### 4.3 로컬 상태 (useState)

**위치:** 컴포넌트 내부

**관리:** `useState`, `useReducer`

**상태:**
```typescript
{
  selectedPublication: PublicationWithDepartment | null; // 상세 모달
  isModalOpen: boolean;                                  // 모달 오픈 여부
}
```

### 4.4 전역 상태 (Zustand)

**위치:** `src/features/publications/store/publicationStore.ts`

**관리:** Zustand

**상태:**
```typescript
interface PublicationStore {
  filters: PublicationFilters;
  setFilters: (filters: Partial<PublicationFilters>) => void;
  resetFilters: () => void;
}
```

**이유:**
- 필터 상태를 여러 컴포넌트에서 공유
- URL 동기화

**구현:**
```typescript
// src/features/publications/store/publicationStore.ts
import { create } from 'zustand';
import type { PublicationFilters } from '../types';

interface PublicationStore {
  filters: PublicationFilters;
  setFilters: (filters: Partial<PublicationFilters>) => void;
  resetFilters: () => void;
}

export const usePublicationStore = create<PublicationStore>((set) => ({
  filters: {},
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () => set({ filters: {} }),
}));
```

---

## 5. 컴포넌트 구조

### 5.1 페이지 컴포넌트 계층

```
/dashboard/research/publications/page.tsx (Server Component)
│
├─ PublicationsContent (Client Component)
│  ├─ PublicationsFilterPanel (Client Component)
│  │  ├─ YearFilter
│  │  ├─ CollegeFilter
│  │  ├─ DepartmentFilter
│  │  ├─ GradeFilter
│  │  ├─ AuthorSearchInput
│  │  └─ FilterResetButton
│  │
│  ├─ PublicationsKPISection (Client Component)
│  │  ├─ KPICard (총 논문 수)
│  │  ├─ KPICard (SCIE 수)
│  │  ├─ KPICard (KCI 수)
│  │  └─ KPICard (평균 IF)
│  │
│  ├─ PublicationsChartsSection (Client Component)
│  │  ├─ PublicationTrendChart (라인 차트)
│  │  ├─ JournalGradeDistributionChart (파이 차트)
│  │  ├─ DepartmentPublicationChart (막대 그래프)
│  │  └─ ImpactFactorTrendChart (라인 차트)
│  │
│  ├─ AuthorRankingTable (Client Component)
│  │  └─ DataTable
│  │
│  ├─ PublicationsListTable (Client Component)
│  │  ├─ DataTable
│  │  └─ Pagination
│  │
│  └─ PublicationDetailModal (Client Component)
│     ├─ Dialog
│     └─ PublicationDetailContent
```

### 5.2 파일 구조

```
/src
├─ app
│  └─ dashboard
│     └─ research
│        └─ publications
│           ├─ page.tsx                    # Server Component (페이지 엔트리)
│           └─ layout.tsx                  # (선택) 레이아웃
│
├─ features
│  └─ publications
│     ├─ api
│     │  ├─ usePublications.ts             # React Query Hook (목록)
│     │  ├─ usePublicationKPI.ts           # React Query Hook (KPI)
│     │  ├─ usePublicationTrend.ts         # React Query Hook (추이)
│     │  ├─ useJournalGradeDistribution.ts # React Query Hook (분포)
│     │  ├─ useDepartmentPublicationCount.ts # React Query Hook (학과별)
│     │  ├─ useImpactFactorTrend.ts        # React Query Hook (IF 추이)
│     │  └─ useAuthorRanking.ts            # React Query Hook (랭킹)
│     │
│     ├─ backend
│     │  └─ route.ts                       # Hono API Route
│     │
│     ├─ components
│     │  ├─ PublicationsContent.tsx        # 메인 컨테이너
│     │  ├─ PublicationsFilterPanel.tsx   # 필터 패널
│     │  ├─ PublicationsKPISection.tsx     # KPI 카드 섹션
│     │  ├─ PublicationsChartsSection.tsx  # 차트 섹션
│     │  ├─ PublicationTrendChart.tsx      # 추이 차트
│     │  ├─ JournalGradeDistributionChart.tsx # 분포 차트
│     │  ├─ DepartmentPublicationChart.tsx # 학과별 차트
│     │  ├─ ImpactFactorTrendChart.tsx     # IF 차트
│     │  ├─ AuthorRankingTable.tsx         # 랭킹 테이블
│     │  ├─ PublicationsListTable.tsx      # 논문 목록 테이블
│     │  └─ PublicationDetailModal.tsx     # 상세 모달
│     │
│     ├─ store
│     │  └─ publicationStore.ts            # Zustand Store
│     │
│     ├─ types.ts                          # TypeScript 타입
│     └─ utils.ts                          # 유틸리티 함수
│
└─ components
   ├─ dashboard
   │  ├─ kpi-card.tsx                      # (공통 모듈)
   │  ├─ filter-panel.tsx                  # (공통 모듈)
   │  ├─ data-table.tsx                    # (공통 모듈)
   │  └─ empty-state.tsx                   # (공통 모듈)
   │
   └─ charts
      ├─ chart-wrapper.tsx                 # (공통 모듈)
      ├─ line-chart.tsx                    # (공통 모듈)
      ├─ bar-chart.tsx                     # (공통 모듈)
      └─ pie-chart.tsx                     # (공통 모듈)
```

### 5.3 주요 컴포넌트 상세

#### 5.3.1 PublicationsContent

**책임:**
- 전체 페이지 레이아웃
- 필터 상태 관리
- URL 동기화

**Props:**
```typescript
type PublicationsContentProps = {
  initialFilters?: PublicationFilters;
};
```

**구현:**
```typescript
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePublicationStore } from '../store/publicationStore';
import { PublicationsFilterPanel } from './PublicationsFilterPanel';
import { PublicationsKPISection } from './PublicationsKPISection';
import { PublicationsChartsSection } from './PublicationsChartsSection';
import { AuthorRankingTable } from './AuthorRankingTable';
import { PublicationsListTable } from './PublicationsListTable';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export function PublicationsContent({ initialFilters }: PublicationsContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { filters, setFilters } = usePublicationStore();

  // URL → Store 동기화 (초기 로드)
  useEffect(() => {
    const urlFilters: PublicationFilters = {
      year: searchParams.getAll('year').map(Number),
      college_name: searchParams.getAll('college'),
      department_name: searchParams.getAll('department'),
      journal_grade: searchParams.getAll('grade'),
      main_author: searchParams.get('author') || undefined,
    };
    setFilters(urlFilters);
  }, [searchParams, setFilters]);

  // Store → URL 동기화 (필터 변경 시)
  const syncURL = () => {
    const params = new URLSearchParams();
    if (filters.year) filters.year.forEach((y) => params.append('year', String(y)));
    if (filters.college_name) filters.college_name.forEach((c) => params.append('college', c));
    // ... (나머지 필터)

    router.push(`/dashboard/research/publications?${params.toString()}`);
  };

  useEffect(() => {
    syncURL();
  }, [filters]);

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        {/* 좌측 필터 */}
        <aside className="w-64 flex-shrink-0">
          <PublicationsFilterPanel />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 space-y-6">
          <h1 className="text-3xl font-bold">논문 게재 현황</h1>

          <PublicationsKPISection />
          <PublicationsChartsSection />
          <AuthorRankingTable />
          <PublicationsListTable />
        </main>
      </div>
    </DashboardLayout>
  );
}
```

#### 5.3.2 PublicationsFilterPanel

**책임:**
- 필터 UI 렌더링
- 필터 값 변경 처리
- 초기화 기능

**구현:**
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePublicationStore } from '../store/publicationStore';
import { useFilterOptions } from '../api/useFilterOptions';
import { MultiSelect } from '@/components/ui/multi-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PublicationsFilterPanel() {
  const { filters, setFilters, resetFilters } = usePublicationStore();
  const { data: options, isLoading } = useFilterOptions();

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 게재 연도 */}
        <div className="space-y-2">
          <Label>게재 연도</Label>
          <MultiSelect
            options={options?.years || []}
            value={filters.year || []}
            onChange={(year) => setFilters({ year })}
            placeholder="연도 선택"
          />
        </div>

        {/* 단과대학 */}
        <div className="space-y-2">
          <Label>단과대학</Label>
          <MultiSelect
            options={options?.colleges || []}
            value={filters.college_name || []}
            onChange={(college_name) => setFilters({ college_name, department_name: [] })}
            placeholder="단과대학 선택"
          />
        </div>

        {/* 학과 (단과대학 선택 시 필터링) */}
        <div className="space-y-2">
          <Label>학과</Label>
          <MultiSelect
            options={
              filters.college_name
                ? options?.departments.filter((d) =>
                    filters.college_name?.includes(d.college_name)
                  ) || []
                : options?.departments || []
            }
            value={filters.department_name || []}
            onChange={(department_name) => setFilters({ department_name })}
            placeholder="학과 선택"
            disabled={!filters.college_name?.length}
          />
        </div>

        {/* 저널 등급 */}
        <div className="space-y-2">
          <Label>저널 등급</Label>
          <MultiSelect
            options={options?.grades || []}
            value={filters.journal_grade || []}
            onChange={(journal_grade) => setFilters({ journal_grade })}
            placeholder="등급 선택"
          />
        </div>

        {/* 주저자 검색 */}
        <div className="space-y-2">
          <Label>주저자</Label>
          <Input
            type="text"
            placeholder="저자 이름 검색"
            value={filters.main_author || ''}
            onChange={(e) => setFilters({ main_author: e.target.value })}
          />
        </div>

        {/* 초기화 버튼 */}
        <Button variant="outline" onClick={resetFilters} className="w-full">
          초기화
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 5.3.3 PublicationsKPISection

**책임:**
- KPI 카드 렌더링
- 집계 데이터 조회

**구현:**
```typescript
'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import { usePublicationKPI } from '../api/usePublicationKPI';
import { usePublicationStore } from '../store/publicationStore';
import { FileText, Award, BookOpen, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PublicationsKPISection() {
  const { filters } = usePublicationStore();
  const { data: kpi, isLoading } = usePublicationKPI(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <KPICard
        title="총 논문 수"
        value={kpi?.total_count || 0}
        icon={FileText}
        description="전체 논문 게재 수"
      />
      <KPICard
        title="SCIE 논문"
        value={kpi?.scie_count || 0}
        icon={Award}
        description="SCIE 등급 논문"
      />
      <KPICard
        title="KCI 논문"
        value={kpi?.kci_count || 0}
        icon={BookOpen}
        description="KCI 등급 논문"
      />
      <KPICard
        title="평균 Impact Factor"
        value={kpi?.avg_impact_factor?.toFixed(2) || 'N/A'}
        icon={TrendingUp}
        description="평균 IF"
      />
    </div>
  );
}
```

#### 5.3.4 PublicationTrendChart

**책임:**
- 연도별 추이 차트 렌더링
- SCIE/KCI 다중 라인 표시

**구현:**
```typescript
'use client';

import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { usePublicationTrend } from '../api/usePublicationTrend';
import { usePublicationStore } from '../store/publicationStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function PublicationTrendChart() {
  const { filters } = usePublicationStore();
  const { data: trend, isLoading } = usePublicationTrend(filters);

  return (
    <ChartWrapper
      title="연도별 논문 게재 추이"
      description="SCIE/KCI 구분"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trend || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="scie_count" stroke="#3b82f6" name="SCIE" />
          <Line type="monotone" dataKey="kci_count" stroke="#10b981" name="KCI" />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
```

#### 5.3.5 PublicationsListTable

**책임:**
- 논문 목록 테이블 렌더링
- 페이지네이션
- 정렬
- 상세 모달 오픈

**구현:**
```typescript
'use client';

import { useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import { usePublications } from '../api/usePublications';
import { usePublicationStore } from '../store/publicationStore';
import { PublicationDetailModal } from './PublicationDetailModal';
import type { PublicationWithDepartment } from '../types';
import { formatDate } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';

export function PublicationsListTable() {
  const { filters } = usePublicationStore();
  const [page, setPage] = useState(1);
  const [selectedPub, setSelectedPub] = useState<PublicationWithDepartment | null>(null);

  const { data, isLoading } = usePublications({ ...filters, page, limit: 50 });

  const columns: ColumnDef<PublicationWithDepartment>[] = [
    {
      id: 'publication_date',
      header: '게재일',
      accessorKey: 'publication_date',
      cell: (row) => formatDate(row.publication_date, 'yyyy-MM-dd'),
      sortable: true,
    },
    {
      id: 'title',
      header: '논문 제목',
      accessorKey: 'title',
      sortable: false,
    },
    {
      id: 'main_author',
      header: '주저자',
      accessorKey: 'main_author',
      sortable: true,
    },
    {
      id: 'journal_name',
      header: '학술지명',
      accessorKey: 'journal_name',
      sortable: false,
    },
    {
      id: 'journal_grade',
      header: '저널등급',
      cell: (row) => (
        <Badge variant={row.journal_grade === 'SCIE' ? 'default' : 'secondary'}>
          {row.journal_grade}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: 'impact_factor',
      header: 'Impact Factor',
      cell: (row) => row.impact_factor?.toFixed(2) || 'N/A',
      sortable: true,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.items || []}
        onSort={(columnId, direction) => {
          // 정렬 로직
        }}
        onRowClick={(row) => setSelectedPub(row)}
      />

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-4">
        {/* Pagination 컴포넌트 */}
      </div>

      {/* 상세 모달 */}
      <PublicationDetailModal
        publication={selectedPub}
        isOpen={!!selectedPub}
        onClose={() => setSelectedPub(null)}
      />
    </>
  );
}
```

---

## 6. API 설계

### 6.1 Hono API Routes

**파일 위치:** `src/features/publications/backend/route.ts`

#### 6.1.1 논문 목록 조회

**Endpoint:** `GET /api/publications`

**Query Parameters:**
```typescript
{
  year?: string[];           // ['2023', '2024']
  college_name?: string[];
  department_name?: string[];
  journal_grade?: string[];
  main_author?: string;
  page?: number;             // 기본: 1
  limit?: number;            // 기본: 50
  sort?: string;             // 기본: 'publication_date'
  order?: 'asc' | 'desc';    // 기본: 'desc'
}
```

**Response:**
```typescript
{
  items: PublicationWithDepartment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**구현:**
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const publicationFilterSchema = z.object({
  year: z.array(z.coerce.number()).optional(),
  college_name: z.array(z.string()).optional(),
  department_name: z.array(z.string()).optional(),
  journal_grade: z.array(z.string()).optional(),
  main_author: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
  sort: z.string().default('publication_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export function registerPublicationRoutes(app: Hono<AppEnv>) {
  const pub = new Hono<AppEnv>();

  // GET /api/publications
  pub.get('/', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select('*, department:departments(college_name, department_name)', {
        count: 'exact',
      });

    // 필터 적용
    if (filters.year && filters.year.length > 0) {
      query = query.in(
        'publication_date',
        filters.year.map((y) => `${y}-01-01`).map((y) => `${y}-12-31`)
      );
      // 또는: EXTRACT(YEAR FROM publication_date)를 사용하는 RPC 호출
    }

    if (filters.college_name && filters.college_name.length > 0) {
      query = query.in('department.college_name', filters.college_name);
    }

    if (filters.department_name && filters.department_name.length > 0) {
      query = query.in('department.department_name', filters.department_name);
    }

    if (filters.journal_grade && filters.journal_grade.length > 0) {
      query = query.in('journal_grade', filters.journal_grade);
    }

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    // 정렬
    query = query.order(filters.sort, { ascending: filters.order === 'asc' });

    // 페이지네이션
    const offset = (filters.page - 1) * filters.limit;
    query = query.range(offset, offset + filters.limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      items: data || [],
      total: count || 0,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil((count || 0) / filters.limit),
    });
  });

  // GET /api/publications/kpi
  pub.get('/kpi', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // RPC 함수 호출 또는 집계 쿼리
    // ...

    return c.json({
      total_count: 1234,
      scie_count: 678,
      kci_count: 556,
      avg_impact_factor: 2.45,
    });
  });

  // GET /api/publications/trend
  pub.get('/trend', zValidator('query', publicationFilterSchema), async (c) => {
    // 연도별 추이 집계
    // ...
    return c.json([
      { year: 2023, total_count: 500, scie_count: 300, kci_count: 200 },
      // ...
    ]);
  });

  // ... (나머지 엔드포인트)

  app.route('/publications', pub);
}
```

#### 6.1.2 KPI 집계

**Endpoint:** `GET /api/publications/kpi`

**Response:**
```typescript
{
  total_count: number;
  scie_count: number;
  kci_count: number;
  avg_impact_factor: number | null;
}
```

#### 6.1.3 연도별 추이

**Endpoint:** `GET /api/publications/trend`

**Response:**
```typescript
{
  year: number;
  total_count: number;
  scie_count: number;
  kci_count: number;
}[]
```

#### 6.1.4 저널 등급별 분포

**Endpoint:** `GET /api/publications/grade-distribution`

**Response:**
```typescript
{
  journal_grade: string;
  count: number;
  percentage: number;
}[]
```

#### 6.1.5 학과별 논문 수

**Endpoint:** `GET /api/publications/department-count`

**Response:**
```typescript
{
  department_id: string;
  college_name: string;
  department_name: string;
  count: number;
}[]
```

#### 6.1.6 Impact Factor 추이

**Endpoint:** `GET /api/publications/impact-trend`

**Response:**
```typescript
{
  year: number;
  avg_impact_factor: number;
}[]
```

#### 6.1.7 주저자 랭킹

**Endpoint:** `GET /api/publications/author-ranking`

**Response:**
```typescript
{
  main_author: string;
  department_name: string;
  publication_count: number;
  avg_impact_factor: number | null;
}[]
```

#### 6.1.8 논문 상세

**Endpoint:** `GET /api/publications/:id`

**Response:**
```typescript
PublicationWithDepartment
```

### 6.2 React Query Hooks

#### 6.2.1 usePublications

**파일 위치:** `src/features/publications/api/usePublications.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { PublicationFilters, PublicationWithDepartment } from '../types';

type UsePublicationsParams = PublicationFilters & {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
};

type PublicationsResponse = {
  items: PublicationWithDepartment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function usePublications(params: UsePublicationsParams = {}) {
  return useQuery<PublicationsResponse>({
    queryKey: ['publications', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.year) params.year.forEach((y) => searchParams.append('year', String(y)));
      if (params.college_name)
        params.college_name.forEach((c) => searchParams.append('college_name', c));
      if (params.department_name)
        params.department_name.forEach((d) => searchParams.append('department_name', d));
      if (params.journal_grade)
        params.journal_grade.forEach((g) => searchParams.append('journal_grade', g));
      if (params.main_author) searchParams.set('main_author', params.main_author);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.order) searchParams.set('order', params.order);

      const response = await fetch(`/api/publications?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch publications');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
```

#### 6.2.2 usePublicationKPI

**파일 위치:** `src/features/publications/api/usePublicationKPI.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { PublicationFilters, PublicationKPI } from '../types';

export function usePublicationKPI(filters: PublicationFilters = {}) {
  return useQuery<PublicationKPI>({
    queryKey: ['publications', 'kpi', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      // ... (필터 적용)

      const response = await fetch(`/api/publications/kpi?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch KPI');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## 7. UI/UX 설계

### 7.1 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ Header: University Dashboard                    [Avatar ▼] │
├───────────┬─────────────────────────────────────────────────┤
│ Sidebar   │ 논문 게재 현황                                   │
│           ├─────────────────────────────────────────────────┤
│ - 메인    │ [총 논문 수] [SCIE 수] [KCI 수] [평균 IF]      │
│ - 학과    ├─────────────────────────────────────────────────┤
│ ▼ 연구    │ [연도별 추이 차트]    [저널 등급별 분포 차트]   │
│   - 논문  │ [학과별 논문 수]      [IF 추이 차트]           │
│   - 과제  ├─────────────────────────────────────────────────┤
│   - 연구자│ [주저자 랭킹 테이블 Top 20]                    │
│ - 예산    ├─────────────────────────────────────────────────┤
│ - 학생    │ [논문 목록 테이블] (페이지네이션)              │
│           │                                                 │
│ [필터]    │                                                 │
│ 연도      │                                                 │
│ 단과대학  │                                                 │
│ 학과      │                                                 │
│ 저널등급  │                                                 │
│ 주저자    │                                                 │
│ [초기화]  │                                                 │
└───────────┴─────────────────────────────────────────────────┘
```

### 7.2 색상 및 테마

**KPI 카드:**
- 총 논문 수: 파란색 (#3b82f6)
- SCIE 수: 보라색 (#8b5cf6)
- KCI 수: 초록색 (#10b981)
- 평균 IF: 주황색 (#f59e0b)

**차트:**
- SCIE: 파란색 (#3b82f6)
- KCI: 초록색 (#10b981)
- Other: 회색 (#6b7280)

**저널 등급 Badge:**
- SCIE: blue
- KCI: green
- Other: gray

### 7.3 반응형 디자인

**Desktop (≥1280px):**
- 필터 패널: 고정 너비 (256px)
- 메인 콘텐츠: flex-1
- 차트: 2열 그리드
- KPI 카드: 4열 그리드

**Tablet (768px - 1279px):**
- 필터 패널: 접을 수 있는 드로어
- 차트: 1열 그리드
- KPI 카드: 2열 그리드

**Mobile (<768px):**
- 필터 패널: 하단 시트
- 차트: 1열 그리드
- KPI 카드: 1열 그리드

### 7.4 로딩 상태

**스켈레톤 로더:**
- KPI 카드: 4개 스켈레톤
- 차트: 차트 영역 스켈레톤
- 테이블: 행 스켈레톤

**프로그레스:**
- 데이터 로딩 시: 상단 프로그레스 바

### 7.5 빈 상태

**데이터 없음:**
```
[아이콘]
데이터가 없습니다
필터 조건을 변경하거나 데이터를 업로드해주세요.
[필터 초기화] [데이터 업로드]
```

### 7.6 에러 상태

**API 오류:**
```
[경고 아이콘]
데이터를 불러오는 중 오류가 발생했습니다.
[다시 시도]
```

---

## 8. 구현 단계

### Phase 1: 기본 인프라 (1-2일)

**Task 1.1: 타입 정의**
- [x] `src/features/publications/types.ts` 작성
- [x] Database 타입 확인
- [x] Domain 타입 정의

**Task 1.2: Zustand Store 구현**
- [x] `src/features/publications/store/publicationStore.ts` 작성
- [x] 필터 상태 관리
- [x] URL 동기화 로직

**Task 1.3: Hono API Routes 구현**
- [ ] `src/features/publications/backend/route.ts` 작성
- [ ] GET /api/publications
- [ ] GET /api/publications/kpi
- [ ] GET /api/publications/trend
- [ ] GET /api/publications/grade-distribution
- [ ] GET /api/publications/department-count
- [ ] GET /api/publications/impact-trend
- [ ] GET /api/publications/author-ranking
- [ ] Hono App 통합

**Task 1.4: React Query Hooks 구현**
- [ ] `usePublications.ts`
- [ ] `usePublicationKPI.ts`
- [ ] `usePublicationTrend.ts`
- [ ] `useJournalGradeDistribution.ts`
- [ ] `useDepartmentPublicationCount.ts`
- [ ] `useImpactFactorTrend.ts`
- [ ] `useAuthorRanking.ts`

### Phase 2: UI 컴포넌트 (2-3일)

**Task 2.1: 필터 패널**
- [ ] `PublicationsFilterPanel.tsx`
- [ ] YearFilter (MultiSelect)
- [ ] CollegeFilter (MultiSelect)
- [ ] DepartmentFilter (MultiSelect, 조건부 활성화)
- [ ] GradeFilter (MultiSelect)
- [ ] AuthorSearchInput (Input)
- [ ] FilterResetButton

**Task 2.2: KPI 카드**
- [ ] `PublicationsKPISection.tsx`
- [ ] 총 논문 수 카드
- [ ] SCIE 수 카드
- [ ] KCI 수 카드
- [ ] 평균 IF 카드

**Task 2.3: 차트 컴포넌트**
- [ ] `PublicationTrendChart.tsx` (라인 차트)
- [ ] `JournalGradeDistributionChart.tsx` (파이 차트)
- [ ] `DepartmentPublicationChart.tsx` (막대 그래프)
- [ ] `ImpactFactorTrendChart.tsx` (라인 차트)

**Task 2.4: 테이블 컴포넌트**
- [ ] `AuthorRankingTable.tsx` (DataTable 재사용)
- [ ] `PublicationsListTable.tsx` (DataTable 재사용)
- [ ] Pagination 컴포넌트
- [ ] 정렬 로직

**Task 2.5: 상세 모달**
- [ ] `PublicationDetailModal.tsx`
- [ ] Dialog 래핑
- [ ] 상세 정보 표시

### Phase 3: 페이지 통합 (1일)

**Task 3.1: 메인 페이지 컴포넌트**
- [ ] `src/app/dashboard/research/publications/page.tsx`
- [ ] `PublicationsContent.tsx`
- [ ] 레이아웃 조립
- [ ] URL 동기화 로직

**Task 3.2: 스타일링 및 반응형**
- [ ] 레이아웃 스타일링
- [ ] 반응형 대응 (Desktop, Tablet, Mobile)
- [ ] 다크 모드 지원

### Phase 4: 기능 완성 (1-2일)

**Task 4.1: CSV 다운로드**
- [ ] 다운로드 버튼 추가
- [ ] CSV 생성 로직 (`downloadCSV` 유틸 활용)
- [ ] 파일명 생성 (`publications_{YYYYMMDD}.csv`)

**Task 4.2: 에러 핸들링**
- [ ] API 오류 처리 (Error Boundary)
- [ ] 빈 상태 UI
- [ ] 로딩 상태 (스켈레톤)

**Task 4.3: 성능 최적화**
- [ ] React Query 캐싱 검증
- [ ] 차트 메모이제이션
- [ ] 불필요한 리렌더링 방지

### Phase 5: 테스트 및 배포 (1일)

**Task 5.1: 단위 테스트**
- [ ] API Hooks 테스트
- [ ] Store 테스트
- [ ] 컴포넌트 렌더링 테스트

**Task 5.2: 통합 테스트**
- [ ] 필터 동작 테스트
- [ ] 페이지네이션 테스트
- [ ] 모달 오픈/닫기 테스트

**Task 5.3: E2E 테스트**
- [ ] 사용자 시나리오 테스트
- [ ] 필터 → 차트 업데이트 플로우
- [ ] 데이터 다운로드 플로우

---

## 9. 테스트 계획

### 9.1 단위 테스트

#### Store 테스트

**파일:** `src/features/publications/store/publicationStore.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePublicationStore } from './publicationStore';

describe('publicationStore', () => {
  it('should set filters', () => {
    const { result } = renderHook(() => usePublicationStore());

    act(() => {
      result.current.setFilters({ year: [2023] });
    });

    expect(result.current.filters.year).toEqual([2023]);
  });

  it('should reset filters', () => {
    const { result } = renderHook(() => usePublicationStore());

    act(() => {
      result.current.setFilters({ year: [2023], college_name: ['공과대학'] });
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual({});
  });
});
```

#### API Hooks 테스트

**파일:** `src/features/publications/api/usePublications.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePublications } from './usePublications';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePublications', () => {
  it('should fetch publications', async () => {
    const { result } = renderHook(() => usePublications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toBeDefined();
  });
});
```

### 9.2 통합 테스트

#### 필터 동작 테스트

**파일:** `src/features/publications/components/PublicationsContent.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicationsContent } from './PublicationsContent';

describe('PublicationsContent', () => {
  it('should update charts when filter changes', async () => {
    render(<PublicationsContent />);

    const yearFilter = screen.getByLabelText('게재 연도');
    await userEvent.click(yearFilter);
    await userEvent.click(screen.getByText('2023'));

    await waitFor(() => {
      expect(screen.getByText('총 논문 수')).toBeInTheDocument();
    });
  });
});
```

### 9.3 E2E 테스트

#### Playwright 시나리오

**파일:** `e2e/publications.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Publications Page', () => {
  test('should filter and display publications', async ({ page }) => {
    await page.goto('/dashboard/research/publications');

    // 필터 선택
    await page.click('text=게재 연도');
    await page.click('text=2023');

    // 차트 업데이트 확인
    await expect(page.locator('text=총 논문 수')).toBeVisible();

    // 테이블 확인
    await expect(page.locator('table')).toBeVisible();
  });

  test('should open publication detail modal', async ({ page }) => {
    await page.goto('/dashboard/research/publications');

    // 테이블 행 클릭
    await page.click('table tbody tr:first-child');

    // 모달 오픈 확인
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('text=논문 제목')).toBeVisible();
  });
});
```

---

## 10. 성능 최적화

### 10.1 React Query 캐싱

**전략:**
```typescript
{
  staleTime: 5 * 60 * 1000,   // 5분간 fresh 상태 유지
  cacheTime: 10 * 60 * 1000,  // 10분간 캐시 보관
  refetchOnWindowFocus: false, // 포커스 시 재조회 안 함
}
```

**이유:**
- 논문 데이터는 자주 변경되지 않음
- 불필요한 API 호출 방지
- 사용자 경험 개선 (즉시 표시)

### 10.2 차트 메모이제이션

**구현:**
```typescript
import { memo } from 'react';

export const PublicationTrendChart = memo(function PublicationTrendChart() {
  // ...
});
```

**이유:**
- 차트 렌더링 비용이 높음
- props가 변경되지 않으면 재렌더링 방지

### 10.3 페이지네이션

**전략:**
- 50건/페이지
- Offset 페이지네이션 (단순)
- Keyset 페이지네이션 (성능 향상 시)

**이유:**
- 대량 데이터 렌더링 방지
- 스크롤 성능 개선

### 10.4 인덱스 활용

**데이터베이스 인덱스:**
```sql
CREATE INDEX idx_pub_dept_date ON publications(department_id, publication_date DESC);
CREATE INDEX idx_pub_date ON publications(publication_date DESC);
CREATE INDEX idx_pub_main_author ON publications(main_author);
CREATE INDEX idx_pub_journal_grade ON publications(journal_grade);
```

**이유:**
- 필터링 쿼리 성능 향상
- 정렬 성능 향상

### 10.5 번들 최적화

**Dynamic Import:**
```typescript
import dynamic from 'next/dynamic';

const PublicationDetailModal = dynamic(() =>
  import('./PublicationDetailModal').then((mod) => mod.PublicationDetailModal)
);
```

**이유:**
- 모달 코드는 클릭 시에만 로드
- 초기 번들 크기 감소

---

## 부록

### A. 데이터 샘플

```typescript
// publications 샘플 데이터
const samplePublications: PublicationWithDepartment[] = [
  {
    id: 'uuid-1',
    publication_id: 'PUB-2023-001',
    department_id: 'dept-uuid-1',
    title: 'Deep Learning for Medical Image Analysis',
    main_author: '홍길동',
    co_authors: '김철수, 이영희',
    journal_name: 'IEEE Transactions on Medical Imaging',
    journal_grade: 'SCIE',
    impact_factor: 10.048,
    publication_date: '2023-03-15',
    project_linked: true,
    created_at: '2023-03-20T00:00:00Z',
    department: {
      college_name: '공과대학',
      department_name: '컴퓨터공학과',
    },
  },
  // ...
];
```

### B. 유용한 SQL 쿼리

#### 전체 평균 Impact Factor
```sql
SELECT AVG(impact_factor) AS avg_impact_factor
FROM publications
WHERE impact_factor IS NOT NULL;
```

#### 학과별 SCIE 비율
```sql
SELECT
  d.department_name,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE p.journal_grade = 'SCIE') AS scie_count,
  ROUND(
    COUNT(*) FILTER (WHERE p.journal_grade = 'SCIE') * 100.0 / COUNT(*),
    2
  ) AS scie_percentage
FROM publications p
JOIN departments d ON d.id = p.department_id
GROUP BY d.department_name
ORDER BY scie_percentage DESC;
```

### C. 참고 자료

- [Recharts Documentation](https://recharts.org/)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
- [Supabase PostgREST Filtering](https://postgrest.org/en/stable/api.html#horizontal-filtering-rows)

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design, Common Modules 문서를 기반으로 작성되었으며, 논문 게재 현황 페이지의 엄밀한 구현을 위한 모든 세부사항을 포함합니다.
