# 메인 대시보드 구현 계획
# Main Dashboard Implementation Plan

**페이지 경로**: `/dashboard`
**페이지명**: 메인 대시보드
**접근 권한**: Authenticated (로그인 필요)
**작성일**: 2025-11-02
**버전**: 1.0

---

## 목차

1. [페이지 개요 및 목적](#1-페이지-개요-및-목적)
2. [UI 구성 요소](#2-ui-구성-요소)
3. [기능 요구사항](#3-기능-요구사항)
4. [데이터 구조 및 API](#4-데이터-구조-및-api)
5. [사용할 공통 컴포넌트](#5-사용할-공통-컴포넌트)
6. [데이터 Fetching 전략](#6-데이터-fetching-전략)
7. [구현 상세](#7-구현-상세)
8. [성능 최적화](#8-성능-최적화)
9. [에러 핸들링](#9-에러-핸들링)
10. [테스트 시나리오](#10-테스트-시나리오)

---

## 1. 페이지 개요 및 목적

### 1.1 페이지 목적

**주요 목적**: 전체 대학의 핵심 지표를 한눈에 파악

메인 대시보드는 사용자가 로그인 후 처음 보게 되는 화면으로, 대학 전체의 핵심 성과 지표(KPI)와 주요 트렌드를 한눈에 파악할 수 있도록 설계됩니다.

### 1.2 타겟 사용자

- **대학 경영진**: 전체 대학의 핵심 지표 파악 및 전략적 의사결정
- **학과장/단과대학장**: 소속 조직의 위치와 전체 성과 비교
- **일반 사용자**: 대학 전체 성과 개요 파악

### 1.3 페이지 플로우

```
[Google 로그인] (Clerk)
    ↓
[Clerk 인증 성공]
    ↓
[/dashboard 리다이렉트]
    ↓
[메인 대시보드 로드]
    ├── KPI 데이터 fetch (React Query)
    ├── 트렌드 데이터 fetch
    └── 단과대학 비교 데이터 fetch
    ↓
[차트 및 KPI 카드 렌더링]
    ↓
[사용자 상호작용]
    ├── 차트 호버/클릭
    ├── 세부 페이지 이동
    └── 데이터 다운로드
```

---

## 2. UI 구성 요소

### 2.1 레이아웃 구조

```
┌──────────────────────────────────────────────────┐
│ Header (공통)                                    │
│ [Logo] [대시보드] [데이터관리]      [Avatar ▼]  │
├─────────┬────────────────────────────────────────┤
│         │                                        │
│ Sidebar │  메인 대시보드 컨텐츠                  │
│ (공통)  │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ KPI 카드 섹션 (4개)            │   │
│         │  │ [취업률][논문수][연구비][학생]  │   │
│         │  └────────────────────────────────┘   │
│         │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ 연도별 트렌드                   │   │
│         │  │ - 취업률 추이 (라인 차트)       │   │
│         │  │ - 기술이전 수입 (막대 그래프)   │   │
│         │  │ - 논문 게재 수 (라인 차트)      │   │
│         │  └────────────────────────────────┘   │
│         │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ 단과대학별 성과 비교             │   │
│         │  │ - 취업률 비교 (막대 그래프)     │   │
│         │  │ - 연구비 분포 (파이 차트)       │   │
│         │  └────────────────────────────────┘   │
│         │                                        │
└─────────┴────────────────────────────────────────┘
```

### 2.2 섹션별 상세 구성

#### 2.2.1 KPI 카드 섹션 (상단)

**레이아웃**: 4개의 카드를 가로로 배치 (그리드 레이아웃)

**카드 구성**:
1. **평균 취업률**
   - 아이콘: GraduationCap (lucide-react)
   - 메인 값: `73.5%` (대형 폰트)
   - 서브텍스트: `전년 대비 +2.3%` (트렌드 표시)
   - 트렌드 화살표: 상승/하락 아이콘

2. **총 논문 게재 수**
   - 아이콘: FileText
   - 메인 값: `1,234편`
   - 서브텍스트: `SCIE 678편, KCI 556편`

3. **총 연구비**
   - 아이콘: Wallet
   - 메인 값: `120억원`
   - 서브텍스트: `전년 대비 +15억원`

4. **재학생 수**
   - 아이콘: Users
   - 메인 값: `8,456명`
   - 서브텍스트: `학사 6,234 / 석사 1,567 / 박사 655`

**스타일링**:
- 카드 높이: 고정 (약 150px)
- 반응형: 모바일에서는 2x2 그리드로 변경
- 카드 배경: 카드 컴포넌트 기본 스타일 (Shadcn UI)
- 호버 효과: subtle shadow 증가

#### 2.2.2 연도별 트렌드 (중앙)

**레이아웃**: 3개의 차트를 가로 또는 세로로 배치

**차트 구성**:

1. **취업률 추이** (라인 차트)
   - X축: 연도 (최근 3년: 2021, 2022, 2023)
   - Y축: 취업률 (%)
   - 데이터 포인트: 각 연도별 전체 평균 취업률
   - 색상: 파란색 라인 (#3b82f6)
   - 툴팁: 연도, 취업률, 전년 대비 증감

2. **기술이전 수입 추이** (막대 그래프)
   - X축: 연도 (최근 3년)
   - Y축: 수입액 (억원)
   - 막대 색상: 그라디언트 (연도별 구분)
   - 툴팁: 연도, 수입액

3. **논문 게재 수 추이** (라인 차트)
   - X축: 연도 (최근 3년)
   - Y축: 논문 수 (편)
   - 다중 라인:
     - SCIE (파란색)
     - KCI (초록색)
     - 전체 (회색, 점선)
   - 범례 표시

**스타일링**:
- 차트 높이: 300px
- 차트 래퍼: Card 컴포넌트
- 다운로드 버튼: 각 차트 우측 상단

#### 2.2.3 단과대학별 성과 비교 (하단)

**레이아웃**: 2개의 차트를 가로로 배치 (그리드 레이아웃)

**차트 구성**:

1. **단과대학별 취업률 비교** (막대 그래프)
   - X축: 단과대학명
   - Y축: 평균 취업률 (%)
   - 막대 색상:
     - 목표 달성 (≥ 75%): 초록색
     - 보통 (65-75%): 노란색
     - 개선 필요 (< 65%): 빨간색
   - 정렬: 취업률 내림차순
   - 툴팁: 단과대학명, 취업률, 소속 학과 수

2. **단과대학별 연구비 분포** (파이 차트)
   - 각 조각: 단과대학
   - 값: 총 연구비 (억원)
   - 라벨: 단과대학명 + 비율 (%)
   - 색상: 자동 할당 (Recharts 기본)
   - 툴팁: 단과대학명, 연구비, 비율

**스타일링**:
- 차트 높이: 400px
- 차트 래퍼: Card 컴포넌트

---

## 3. 기능 요구사항

### 3.1 필수 기능 (MVP)

#### FR-MAIN-001: KPI 카드 표시
- **설명**: 4개의 핵심 지표를 카드 형태로 표시
- **입력**: 없음 (자동 로드)
- **처리**:
  1. 최신 평가연도 데이터 조회
  2. 전체 데이터에서 집계 계산
  3. 전년 대비 증감 계산
- **출력**:
  - 평균 취업률
  - 총 논문 수 (SCIE/KCI 구분)
  - 총 연구비
  - 총 재학생 수
  - 각각의 전년 대비 증감

#### FR-MAIN-002: 연도별 트렌드 차트
- **설명**: 최근 3년간의 주요 지표 트렌드 표시
- **입력**: 없음 (최근 3년 자동 선택)
- **처리**:
  1. 최근 3년 데이터 조회
  2. 연도별 평균/합계 계산
  3. 차트 데이터 변환
- **출력**:
  - 취업률 추이 라인 차트
  - 기술이전 수입 막대 그래프
  - 논문 게재 수 라인 차트 (SCIE/KCI 구분)

#### FR-MAIN-003: 단과대학별 성과 비교
- **설명**: 단과대학별 취업률 및 연구비 비교
- **입력**: 없음 (최신 연도 자동 선택)
- **처리**:
  1. 최신 평가연도 데이터 조회
  2. 단과대학별 집계
  3. 정렬 (취업률 내림차순)
- **출력**:
  - 단과대학별 평균 취업률 막대 그래프
  - 단과대학별 연구비 분포 파이 차트

#### FR-MAIN-004: 데이터 새로고침
- **설명**: 사용자가 수동으로 데이터 새로고침 가능
- **입력**: 새로고침 버튼 클릭
- **처리**: React Query 캐시 무효화 및 재fetch
- **출력**: 최신 데이터로 업데이트된 대시보드

#### FR-MAIN-005: 차트 다운로드
- **설명**: 차트를 이미지로 다운로드
- **입력**: 차트별 다운로드 버튼 클릭
- **처리**: 차트를 PNG 이미지로 변환
- **출력**: {차트명}_{날짜}.png 파일 다운로드

### 3.2 추가 기능 (Phase 2)

- 연도 범위 선택 필터
- 단과대학 필터 (특정 단과대학만 보기)
- KPI 목표 대비 달성률 표시
- PDF 리포트 생성

---

## 4. 데이터 구조 및 API

### 4.1 데이터 소스

**데이터베이스 테이블**:
1. `kpi_metrics`: 학과별 KPI 데이터
2. `publications`: 논문 게재 데이터
3. `research_projects`: 연구과제 데이터
4. `students`: 학생 정보
5. `departments`: 단과대학 및 학과 정보

### 4.2 API 엔드포인트

#### 4.2.1 메인 대시보드 집계 데이터

**엔드포인트**: `GET /api/dashboard/overview`

**쿼리 파라미터**:
- `year` (optional): 평가연도 (기본값: 최신 연도)

**응답 구조**:
```typescript
{
  currentYear: 2023,
  kpis: {
    employmentRate: {
      value: 73.5,
      previousYear: 71.2,
      change: 2.3,
      trend: "up"
    },
    publicationCount: {
      value: 1234,
      scie: 678,
      kci: 556,
      previousYear: 1150,
      change: 84
    },
    researchBudget: {
      value: 12000000000, // 120억 (원 단위)
      previousYear: 10500000000,
      change: 1500000000
    },
    studentCount: {
      value: 8456,
      undergraduate: 6234,
      master: 1567,
      doctorate: 655
    }
  }
}
```

#### 4.2.2 연도별 트렌드 데이터

**엔드포인트**: `GET /api/dashboard/trends`

**쿼리 파라미터**:
- `years` (optional): 조회할 연도 수 (기본값: 3)

**응답 구조**:
```typescript
{
  years: [2021, 2022, 2023],
  employmentRate: [
    { year: 2021, value: 69.8 },
    { year: 2022, value: 71.2 },
    { year: 2023, value: 73.5 }
  ],
  techTransferIncome: [
    { year: 2021, value: 3500000000 },
    { year: 2022, value: 4200000000 },
    { year: 2023, value: 5100000000 }
  ],
  publications: [
    { year: 2021, total: 1050, scie: 580, kci: 470 },
    { year: 2022, total: 1150, scie: 620, kci: 530 },
    { year: 2023, total: 1234, scie: 678, kci: 556 }
  ]
}
```

#### 4.2.3 단과대학별 성과 데이터

**엔드포인트**: `GET /api/dashboard/colleges`

**쿼리 파라미터**:
- `year` (optional): 평가연도 (기본값: 최신 연도)

**응답 구조**:
```typescript
{
  year: 2023,
  colleges: [
    {
      name: "공과대학",
      employmentRate: 78.5,
      departmentCount: 12,
      researchBudget: 5500000000,
      budgetShare: 45.8
    },
    {
      name: "경영대학",
      employmentRate: 75.2,
      departmentCount: 5,
      researchBudget: 2800000000,
      budgetShare: 23.3
    },
    // ... 기타 단과대학
  ]
}
```

### 4.3 데이터베이스 쿼리 예시

#### KPI 집계 쿼리
```sql
-- 평균 취업률
SELECT
  AVG(employment_rate) AS avg_employment_rate,
  evaluation_year
FROM kpi_metrics
WHERE evaluation_year IN (2022, 2023)
GROUP BY evaluation_year
ORDER BY evaluation_year DESC;

-- 총 논문 수
SELECT
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE journal_grade = 'SCIE') AS scie_count,
  COUNT(*) FILTER (WHERE journal_grade = 'KCI') AS kci_count,
  EXTRACT(YEAR FROM publication_date) AS year
FROM publications
WHERE EXTRACT(YEAR FROM publication_date) IN (2022, 2023)
GROUP BY year
ORDER BY year DESC;

-- 총 연구비
SELECT
  SUM(total_budget) AS total_budget,
  EXTRACT(YEAR FROM created_at) AS year
FROM research_projects
WHERE EXTRACT(YEAR FROM created_at) IN (2022, 2023)
GROUP BY year
ORDER BY year DESC;

-- 재학생 수
SELECT
  COUNT(*) AS total_students,
  COUNT(*) FILTER (WHERE program_type = '학사') AS undergraduate,
  COUNT(*) FILTER (WHERE program_type = '석사') AS master,
  COUNT(*) FILTER (WHERE program_type = '박사') AS doctorate
FROM students
WHERE enrollment_status = '재학';
```

#### 단과대학별 집계 쿼리
```sql
SELECT
  d.college_name,
  AVG(k.employment_rate) AS avg_employment_rate,
  COUNT(DISTINCT d.id) AS department_count,
  COALESCE(SUM(rp.total_budget), 0) AS total_research_budget
FROM departments d
LEFT JOIN kpi_metrics k ON k.department_id = d.id AND k.evaluation_year = 2023
LEFT JOIN research_projects rp ON rp.department_id = d.id
GROUP BY d.college_name
ORDER BY avg_employment_rate DESC;
```

---

## 5. 사용할 공통 컴포넌트

### 5.1 레이아웃 컴포넌트 (공통 모듈)

#### `DashboardLayout`
- **경로**: `src/components/layout/dashboard-layout.tsx`
- **사용**: 페이지 전체 래퍼
- **props**:
  - `children`: React.ReactNode

```tsx
<DashboardLayout>
  {/* 메인 대시보드 컨텐츠 */}
</DashboardLayout>
```

### 5.2 UI 컴포넌트 (공통 모듈)

#### `KPICard`
- **경로**: `src/components/dashboard/kpi-card.tsx`
- **사용**: KPI 카드 섹션
- **props**:
  - `title`: string
  - `value`: string | number
  - `icon`: LucideIcon
  - `description?`: string
  - `trend?`: { value: number, isPositive: boolean }

```tsx
<KPICard
  title="평균 취업률"
  value="73.5%"
  icon={GraduationCap}
  description="전체 학과 평균"
  trend={{ value: 2.3, isPositive: true }}
/>
```

#### `ChartWrapper`
- **경로**: `src/components/charts/chart-wrapper.tsx`
- **사용**: 차트 래퍼
- **props**:
  - `title`: string
  - `description?`: string
  - `children`: React.ReactNode
  - `isLoading?`: boolean
  - `onDownload?`: () => void

```tsx
<ChartWrapper
  title="취업률 추이"
  description="최근 3년"
  onDownload={handleDownload}
>
  <LineChart data={trendData} />
</ChartWrapper>
```

#### `BarChart`, `LineChart`, `PieChart`
- **경로**: `src/components/charts/`
- **사용**: 각 차트 섹션
- **공통 props**:
  - `data`: Record<string, unknown>[]
  - `dataKey`: string
  - `xAxisKey`: string (BarChart, LineChart)
  - 기타 차트별 props

```tsx
<BarChart
  data={collegeData}
  dataKey="employmentRate"
  xAxisKey="name"
  color="#10b981"
/>
```

#### `EmptyState`
- **경로**: `src/components/dashboard/empty-state.tsx`
- **사용**: 데이터 없을 때
- **props**:
  - `title`: string
  - `description?`: string
  - `action?`: { label: string, onClick: () => void }

```tsx
<EmptyState
  title="데이터가 없습니다"
  description="업로드된 데이터가 없습니다."
  action={{
    label: "데이터 업로드",
    onClick: () => router.push("/data/upload")
  }}
/>
```

### 5.3 Shadcn UI 컴포넌트

- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`
- `Skeleton` (로딩 상태)

---

## 6. 데이터 Fetching 전략

### 6.1 React Query 사용

#### 쿼리 키 구조
```typescript
["dashboard", "overview", { year: 2023 }]
["dashboard", "trends", { years: 3 }]
["dashboard", "colleges", { year: 2023 }]
```

#### 캐싱 설정
```typescript
{
  staleTime: 5 * 60 * 1000, // 5분
  cacheTime: 10 * 60 * 1000, // 10분
  refetchOnWindowFocus: false,
  refetchOnMount: true
}
```

### 6.2 Custom Hooks

#### `useDashboardOverview`
```typescript
// src/hooks/api/useDashboardOverview.ts
import { useQuery } from '@tanstack/react-query';

type DashboardOverview = {
  currentYear: number;
  kpis: {
    employmentRate: KPIMetric;
    publicationCount: KPIMetric;
    researchBudget: KPIMetric;
    studentCount: KPIMetric;
  };
};

type KPIMetric = {
  value: number;
  previousYear?: number;
  change?: number;
  trend?: "up" | "down" | "stable";
  // 추가 필드...
};

export function useDashboardOverview(year?: number) {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard", "overview", { year }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set("year", String(year));

      const response = await fetch(`/api/dashboard/overview?${params}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard overview");

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

#### `useDashboardTrends`
```typescript
// src/hooks/api/useDashboardTrends.ts
export function useDashboardTrends(years: number = 3) {
  return useQuery({
    queryKey: ["dashboard", "trends", { years }],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/trends?years=${years}`);
      if (!response.ok) throw new Error("Failed to fetch trends");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

#### `useDashboardColleges`
```typescript
// src/hooks/api/useDashboardColleges.ts
export function useDashboardColleges(year?: number) {
  return useQuery({
    queryKey: ["dashboard", "colleges", { year }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set("year", String(year));

      const response = await fetch(`/api/dashboard/colleges?${params}`);
      if (!response.ok) throw new Error("Failed to fetch colleges data");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### 6.3 병렬 데이터 로딩

```typescript
// 페이지 컴포넌트에서
const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
const { data: trends, isLoading: trendsLoading } = useDashboardTrends();
const { data: colleges, isLoading: collegesLoading } = useDashboardColleges();

const isLoading = overviewLoading || trendsLoading || collegesLoading;
```

---

## 7. 구현 상세

### 7.1 페이지 컴포넌트 구조

**파일 경로**: `src/app/dashboard/page.tsx`

```typescript
// src/app/dashboard/page.tsx
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KPISummary } from "./_components/kpi-summary";
import { TrendsSection } from "./_components/trends-section";
import { CollegesSection } from "./_components/colleges-section";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardOverview, useDashboardTrends, useDashboardColleges } from "@/hooks/api";

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: trends, isLoading: trendsLoading } = useDashboardTrends();
  const { data: colleges, isLoading: collegesLoading } = useDashboardColleges();

  const isLoading = overviewLoading || trendsLoading || collegesLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">메인 대시보드</h1>
          <p className="text-muted-foreground">전체 대학 핵심 지표 한눈에 파악</p>
        </div>

        {/* KPI 카드 섹션 */}
        {overviewLoading ? (
          <KPISummarySkeleton />
        ) : overview ? (
          <KPISummary data={overview.kpis} />
        ) : (
          <EmptyState title="KPI 데이터를 불러올 수 없습니다" />
        )}

        {/* 연도별 트렌드 */}
        {trendsLoading ? (
          <TrendsSectionSkeleton />
        ) : trends ? (
          <TrendsSection data={trends} />
        ) : (
          <EmptyState title="트렌드 데이터를 불러올 수 없습니다" />
        )}

        {/* 단과대학별 성과 */}
        {collegesLoading ? (
          <CollegesSectionSkeleton />
        ) : colleges ? (
          <CollegesSection data={colleges} />
        ) : (
          <EmptyState title="단과대학 데이터를 불러올 수 없습니다" />
        )}
      </div>
    </DashboardLayout>
  );
}
```

### 7.2 섹션 컴포넌트

#### 7.2.1 KPI Summary

**파일 경로**: `src/app/dashboard/_components/kpi-summary.tsx`

```typescript
// src/app/dashboard/_components/kpi-summary.tsx
import { KPICard } from "@/components/dashboard/kpi-card";
import { GraduationCap, FileText, Wallet, Users } from "lucide-react";
import { formatPercentage, formatNumber, formatBudget } from "@/lib/utils/number";

type KPISummaryProps = {
  data: {
    employmentRate: KPIMetric;
    publicationCount: KPIMetric;
    researchBudget: KPIMetric;
    studentCount: KPIMetric;
  };
};

export function KPISummary({ data }: KPISummaryProps) {
  const { employmentRate, publicationCount, researchBudget, studentCount } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="평균 취업률"
        value={formatPercentage(employmentRate.value)}
        icon={GraduationCap}
        description="전체 학과 평균"
        trend={
          employmentRate.change
            ? {
                value: employmentRate.change,
                isPositive: employmentRate.change > 0,
              }
            : undefined
        }
      />

      <KPICard
        title="총 논문 게재 수"
        value={`${formatNumber(publicationCount.value)}편`}
        icon={FileText}
        description={`SCIE ${publicationCount.scie}편, KCI ${publicationCount.kci}편`}
      />

      <KPICard
        title="총 연구비"
        value={formatBudget(researchBudget.value)}
        icon={Wallet}
        description="전체 연구과제 합계"
        trend={
          researchBudget.change
            ? {
                value: Math.abs(researchBudget.change / 100000000), // 억 단위
                isPositive: researchBudget.change > 0,
              }
            : undefined
        }
      />

      <KPICard
        title="재학생 수"
        value={`${formatNumber(studentCount.value)}명`}
        icon={Users}
        description={`학사 ${formatNumber(studentCount.undergraduate)} / 석사 ${formatNumber(studentCount.master)} / 박사 ${formatNumber(studentCount.doctorate)}`}
      />
    </div>
  );
}

export function KPISummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

#### 7.2.2 Trends Section

**파일 경로**: `src/app/dashboard/_components/trends-section.tsx`

```typescript
// src/app/dashboard/_components/trends-section.tsx
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";

type TrendsSectionProps = {
  data: {
    years: number[];
    employmentRate: { year: number; value: number }[];
    techTransferIncome: { year: number; value: number }[];
    publications: { year: number; total: number; scie: number; kci: number }[];
  };
};

export function TrendsSection({ data }: TrendsSectionProps) {
  // 데이터 변환
  const employmentRateData = data.employmentRate.map(item => ({
    year: String(item.year),
    value: item.value,
  }));

  const incomeData = data.techTransferIncome.map(item => ({
    year: String(item.year),
    value: item.value / 100000000, // 억 단위 변환
  }));

  const publicationsData = data.publications.map(item => ({
    year: String(item.year),
    SCIE: item.scie,
    KCI: item.kci,
    전체: item.total,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">연도별 트렌드</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartWrapper
          title="취업률 추이"
          description="최근 3년"
          onDownload={() => handleDownloadChart("employment-rate")}
        >
          <LineChart
            data={employmentRateData}
            dataKey="value"
            xAxisKey="year"
            yAxisLabel="취업률 (%)"
            color="#3b82f6"
          />
        </ChartWrapper>

        <ChartWrapper
          title="기술이전 수입"
          description="최근 3년"
          onDownload={() => handleDownloadChart("tech-transfer")}
        >
          <BarChart
            data={incomeData}
            dataKey="value"
            xAxisKey="year"
            yAxisLabel="수입액 (억원)"
            color="#10b981"
          />
        </ChartWrapper>

        <ChartWrapper
          title="논문 게재 수"
          description="최근 3년 (SCIE/KCI)"
          onDownload={() => handleDownloadChart("publications")}
        >
          <LineChart
            data={publicationsData}
            dataKeys={["SCIE", "KCI"]}
            xAxisKey="year"
            yAxisLabel="논문 수 (편)"
            colors={["#3b82f6", "#10b981"]}
          />
        </ChartWrapper>
      </div>
    </div>
  );
}
```

#### 7.2.3 Colleges Section

**파일 경로**: `src/app/dashboard/_components/colleges-section.tsx`

```typescript
// src/app/dashboard/_components/colleges-section.tsx
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";

type CollegesSectionProps = {
  data: {
    year: number;
    colleges: Array<{
      name: string;
      employmentRate: number;
      departmentCount: number;
      researchBudget: number;
      budgetShare: number;
    }>;
  };
};

export function CollegesSection({ data }: CollegesSectionProps) {
  // 취업률 막대 그래프 데이터
  const employmentData = data.colleges.map(college => ({
    name: college.name,
    취업률: college.employmentRate,
  }));

  // 연구비 파이 차트 데이터
  const budgetData = data.colleges.map(college => ({
    name: college.name,
    value: college.researchBudget / 100000000, // 억 단위
    percentage: college.budgetShare,
  }));

  // 취업률 기준 색상
  const getBarColor = (value: number) => {
    if (value >= 75) return "#10b981"; // 초록색
    if (value >= 65) return "#f59e0b"; // 노란색
    return "#ef4444"; // 빨간색
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">단과대학별 성과 비교</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartWrapper
          title="단과대학별 평균 취업률"
          description={`${data.year}년 기준`}
          onDownload={() => handleDownloadChart("college-employment")}
        >
          <BarChart
            data={employmentData}
            dataKey="취업률"
            xAxisKey="name"
            yAxisLabel="취업률 (%)"
            colorFunction={getBarColor}
          />
        </ChartWrapper>

        <ChartWrapper
          title="단과대학별 연구비 분포"
          description={`${data.year}년 기준`}
          onDownload={() => handleDownloadChart("college-budget")}
        >
          <PieChart
            data={budgetData}
            dataKey="value"
            nameKey="name"
            showPercentage
          />
        </ChartWrapper>
      </div>
    </div>
  );
}
```

### 7.3 API Routes (Hono)

#### 7.3.1 Dashboard Overview API

**파일 경로**: `src/features/dashboard/backend/route.ts`

```typescript
// src/features/dashboard/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const querySchema = z.object({
  year: z.coerce.number().optional(),
});

export function registerDashboardRoutes(app: Hono<AppEnv>) {
  const dashboard = new Hono<AppEnv>();

  // GET /api/dashboard/overview
  dashboard.get('/overview', zValidator('query', querySchema), async (c) => {
    const { year } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 최신 연도 조회 (year가 없을 경우)
    let currentYear = year;
    if (!currentYear) {
      const { data: latestYear } = await supabase
        .from('kpi_metrics')
        .select('evaluation_year')
        .order('evaluation_year', { ascending: false })
        .limit(1)
        .single();

      currentYear = latestYear?.evaluation_year || new Date().getFullYear();
    }

    const previousYear = currentYear - 1;

    // 평균 취업률
    const { data: employmentData } = await supabase
      .from('kpi_metrics')
      .select('employment_rate, evaluation_year')
      .in('evaluation_year', [currentYear, previousYear]);

    const currentEmploymentRate = employmentData
      ?.filter(d => d.evaluation_year === currentYear)
      .reduce((sum, d) => sum + (d.employment_rate || 0), 0) /
      (employmentData?.filter(d => d.evaluation_year === currentYear).length || 1);

    const prevEmploymentRate = employmentData
      ?.filter(d => d.evaluation_year === previousYear)
      .reduce((sum, d) => sum + (d.employment_rate || 0), 0) /
      (employmentData?.filter(d => d.evaluation_year === previousYear).length || 1);

    // 총 논문 수
    const { data: publicationsData } = await supabase
      .from('publications')
      .select('journal_grade')
      .gte('publication_date', `${currentYear}-01-01`)
      .lt('publication_date', `${currentYear + 1}-01-01`);

    const totalPublications = publicationsData?.length || 0;
    const scieCount = publicationsData?.filter(p => p.journal_grade === 'SCIE').length || 0;
    const kciCount = publicationsData?.filter(p => p.journal_grade === 'KCI').length || 0;

    // 총 연구비
    const { data: budgetData } = await supabase
      .from('research_projects')
      .select('total_budget, created_at');

    const currentBudget = budgetData
      ?.filter(d => new Date(d.created_at).getFullYear() === currentYear)
      .reduce((sum, d) => sum + d.total_budget, 0) || 0;

    const prevBudget = budgetData
      ?.filter(d => new Date(d.created_at).getFullYear() === previousYear)
      .reduce((sum, d) => sum + d.total_budget, 0) || 0;

    // 재학생 수
    const { data: studentsData } = await supabase
      .from('students')
      .select('program_type')
      .eq('enrollment_status', '재학');

    const totalStudents = studentsData?.length || 0;
    const undergraduate = studentsData?.filter(s => s.program_type === '학사').length || 0;
    const master = studentsData?.filter(s => s.program_type === '석사').length || 0;
    const doctorate = studentsData?.filter(s => s.program_type === '박사').length || 0;

    return c.json({
      currentYear,
      kpis: {
        employmentRate: {
          value: currentEmploymentRate,
          previousYear: prevEmploymentRate,
          change: currentEmploymentRate - prevEmploymentRate,
          trend: currentEmploymentRate > prevEmploymentRate ? 'up' : 'down',
        },
        publicationCount: {
          value: totalPublications,
          scie: scieCount,
          kci: kciCount,
        },
        researchBudget: {
          value: currentBudget,
          previousYear: prevBudget,
          change: currentBudget - prevBudget,
        },
        studentCount: {
          value: totalStudents,
          undergraduate,
          master,
          doctorate,
        },
      },
    });
  });

  // GET /api/dashboard/trends
  dashboard.get('/trends', zValidator('query', z.object({
    years: z.coerce.number().default(3),
  })), async (c) => {
    const { years } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 최신 연도 조회
    const { data: latestYear } = await supabase
      .from('kpi_metrics')
      .select('evaluation_year')
      .order('evaluation_year', { ascending: false })
      .limit(1)
      .single();

    const currentYear = latestYear?.evaluation_year || new Date().getFullYear();
    const yearRange = Array.from({ length: years }, (_, i) => currentYear - i).reverse();

    // 연도별 취업률
    const { data: kpiData } = await supabase
      .from('kpi_metrics')
      .select('employment_rate, evaluation_year, tech_transfer_income')
      .in('evaluation_year', yearRange);

    const employmentRate = yearRange.map(year => ({
      year,
      value: kpiData
        ?.filter(d => d.evaluation_year === year)
        .reduce((sum, d) => sum + (d.employment_rate || 0), 0) /
        (kpiData?.filter(d => d.evaluation_year === year).length || 1),
    }));

    const techTransferIncome = yearRange.map(year => ({
      year,
      value: kpiData
        ?.filter(d => d.evaluation_year === year)
        .reduce((sum, d) => sum + (d.tech_transfer_income || 0), 0),
    }));

    // 연도별 논문 수
    const { data: pubData } = await supabase
      .from('publications')
      .select('publication_date, journal_grade');

    const publications = yearRange.map(year => {
      const yearPubs = pubData?.filter(p =>
        new Date(p.publication_date).getFullYear() === year
      ) || [];

      return {
        year,
        total: yearPubs.length,
        scie: yearPubs.filter(p => p.journal_grade === 'SCIE').length,
        kci: yearPubs.filter(p => p.journal_grade === 'KCI').length,
      };
    });

    return c.json({
      years: yearRange,
      employmentRate,
      techTransferIncome,
      publications,
    });
  });

  // GET /api/dashboard/colleges
  dashboard.get('/colleges', zValidator('query', querySchema), async (c) => {
    const { year } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 최신 연도 조회
    let currentYear = year;
    if (!currentYear) {
      const { data: latestYear } = await supabase
        .from('kpi_metrics')
        .select('evaluation_year')
        .order('evaluation_year', { ascending: false })
        .limit(1)
        .single();

      currentYear = latestYear?.evaluation_year || new Date().getFullYear();
    }

    // 단과대학별 집계
    const { data: collegeData } = await supabase
      .rpc('get_college_performance', { target_year: currentYear });

    // RPC가 없다면 직접 쿼리
    // (실제로는 Supabase에서 RPC 함수 생성 필요)

    return c.json({
      year: currentYear,
      colleges: collegeData || [],
    });
  });

  app.route('/dashboard', dashboard);
}
```

**Supabase RPC 함수 생성** (선택 사항):

```sql
-- Supabase에서 실행
CREATE OR REPLACE FUNCTION get_college_performance(target_year INTEGER)
RETURNS TABLE (
  name TEXT,
  employment_rate NUMERIC,
  department_count BIGINT,
  research_budget BIGINT,
  budget_share NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.college_name AS name,
    AVG(k.employment_rate) AS employment_rate,
    COUNT(DISTINCT d.id) AS department_count,
    COALESCE(SUM(rp.total_budget), 0) AS research_budget,
    ROUND(
      COALESCE(SUM(rp.total_budget), 0)::NUMERIC /
      NULLIF((SELECT SUM(total_budget) FROM research_projects), 0) * 100,
      2
    ) AS budget_share
  FROM departments d
  LEFT JOIN kpi_metrics k ON k.department_id = d.id AND k.evaluation_year = target_year
  LEFT JOIN research_projects rp ON rp.department_id = d.id
  GROUP BY d.college_name
  ORDER BY employment_rate DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. 성능 최적화

### 8.1 데이터 캐싱

- **React Query 캐싱**: 5분 staleTime, 10분 cacheTime
- **Supabase Connection Pooling**: 기본 제공
- **API Route 레벨 캐싱**: Next.js 15 캐싱 활용

### 8.2 쿼리 최적화

- **집계 쿼리 DB 레벨**: 애플리케이션이 아닌 DB에서 집계
- **인덱스 활용**: evaluation_year, publication_date 인덱스
- **JOIN 최소화**: 필요한 데이터만 조회

### 8.3 렌더링 최적화

- **Skeleton 로딩**: 데이터 로드 전 레이아웃 표시
- **메모이제이션**: 차트 컴포넌트 React.memo 적용
- **코드 스플리팅**: 차트 라이브러리 동적 import

```typescript
// 차트 컴포넌트 동적 import
const LineChart = dynamic(() => import('@/components/charts/line-chart'), {
  loading: () => <Skeleton className="h-[300px]" />,
});
```

---

## 9. 에러 핸들링

### 9.1 API 에러 처리

```typescript
// React Query 에러 핸들링
const { data, error, isError } = useDashboardOverview();

if (isError) {
  return (
    <ErrorState
      title="데이터를 불러올 수 없습니다"
      message={error.message}
      action={{
        label: "다시 시도",
        onClick: () => queryClient.invalidateQueries(["dashboard", "overview"]),
      }}
    />
  );
}
```

### 9.2 빈 데이터 처리

```typescript
// 데이터가 없을 때
if (!data || data.kpis.length === 0) {
  return (
    <EmptyState
      title="데이터가 없습니다"
      description="업로드된 데이터가 없습니다."
      action={{
        label: "데이터 업로드",
        onClick: () => router.push("/data/upload"),
      }}
    />
  );
}
```

### 9.3 차트 렌더링 에러

```typescript
// ChartWrapper 내부에서 ErrorBoundary 사용
<ErrorBoundary
  fallback={(error, reset) => (
    <div className="flex flex-col items-center justify-center h-[300px]">
      <p className="text-sm text-muted-foreground">차트를 표시할 수 없습니다</p>
      <Button variant="outline" size="sm" onClick={reset}>
        다시 시도
      </Button>
    </div>
  )}
>
  <LineChart data={data} />
</ErrorBoundary>
```

---

## 10. 테스트 시나리오

### 10.1 기능 테스트

#### TC-001: 페이지 로드 및 KPI 표시
- **전제 조건**: 사용자 로그인 완료, 데이터 업로드 완료
- **테스트 단계**:
  1. /dashboard 접근
  2. KPI 카드 4개 렌더링 확인
  3. 각 KPI 값 표시 확인
  4. 트렌드 화살표 표시 확인 (전년 대비 증감)
- **예상 결과**:
  - 4개 KPI 카드 정상 표시
  - 올바른 값 및 트렌드 표시

#### TC-002: 연도별 트렌드 차트
- **전제 조건**: 최근 3년 데이터 존재
- **테스트 단계**:
  1. 트렌드 섹션 스크롤
  2. 3개 차트 렌더링 확인
  3. 각 차트에 3개 연도 데이터 포인트 확인
  4. 차트 호버 시 툴팁 표시 확인
- **예상 결과**:
  - 3개 차트 정상 렌더링
  - 툴팁 정보 정확 표시

#### TC-003: 단과대학별 성과 비교
- **전제 조건**: 여러 단과대학 데이터 존재
- **테스트 단계**:
  1. 단과대학 섹션 스크롤
  2. 막대 그래프 렌더링 확인
  3. 파이 차트 렌더링 확인
  4. 막대 색상이 취업률 기준 분류 확인 (초록/노랑/빨강)
- **예상 결과**:
  - 두 차트 정상 렌더링
  - 색상 분류 정확

#### TC-004: 차트 다운로드
- **전제 조건**: 차트 렌더링 완료
- **테스트 단계**:
  1. 차트 우측 상단 다운로드 버튼 클릭
  2. PNG 파일 다운로드 확인
  3. 파일명 형식 확인 (예: employment-rate_20251102.png)
- **예상 결과**:
  - PNG 파일 다운로드 성공
  - 파일 내용 차트 이미지

#### TC-005: 데이터 새로고침
- **전제 조건**: 대시보드 로드 완료
- **테스트 단계**:
  1. 새로고침 버튼 클릭
  2. 로딩 인디케이터 표시 확인
  3. 데이터 재로드 확인
- **예상 결과**:
  - 데이터 성공적으로 재로드

### 10.2 에러 시나리오 테스트

#### TC-006: API 오류 처리
- **전제 조건**: 네트워크 오류 시뮬레이션
- **테스트 단계**:
  1. API 요청 실패 시뮬레이션
  2. 에러 메시지 표시 확인
  3. "다시 시도" 버튼 표시 확인
  4. 다시 시도 버튼 클릭 시 재요청 확인
- **예상 결과**:
  - 적절한 에러 메시지 표시
  - 재시도 기능 동작

#### TC-007: 빈 데이터 처리
- **전제 조건**: 데이터베이스에 데이터 없음
- **테스트 단계**:
  1. /dashboard 접근
  2. 빈 상태 UI 표시 확인
  3. "데이터 업로드" 버튼 표시 확인
  4. 버튼 클릭 시 /data/upload 이동 확인
- **예상 결과**:
  - 빈 상태 UI 정상 표시
  - 업로드 페이지 이동 성공

#### TC-008: 차트 렌더링 실패
- **전제 조건**: 잘못된 데이터 형식
- **테스트 단계**:
  1. 차트 렌더링 실패 시뮬레이션
  2. Fallback UI 표시 확인
  3. 에러 메시지 확인
- **예상 결과**:
  - Fallback UI 표시
  - 적절한 에러 메시지

### 10.3 성능 테스트

#### TC-009: 페이지 로드 시간
- **측정 지표**: Lighthouse Performance Score
- **목표**: > 90
- **테스트 단계**:
  1. Lighthouse 실행
  2. Performance Score 확인
  3. FCP, LCP 측정
- **예상 결과**:
  - Performance Score > 90
  - FCP < 1.5s
  - LCP < 2.5s

#### TC-010: API 응답 시간
- **측정 지표**: API 응답 시간
- **목표**: < 500ms (단순 조회), < 2s (복잡한 집계)
- **테스트 단계**:
  1. Network 탭에서 API 요청 확인
  2. 응답 시간 측정
- **예상 결과**:
  - /api/dashboard/overview < 500ms
  - /api/dashboard/trends < 1s
  - /api/dashboard/colleges < 1s

### 10.4 접근성 테스트

#### TC-011: 키보드 네비게이션
- **전제 조건**: 키보드만 사용
- **테스트 단계**:
  1. Tab 키로 포커스 이동
  2. Enter 키로 버튼 클릭
  3. 모든 인터랙티브 요소 접근 가능 확인
- **예상 결과**:
  - 키보드만으로 모든 기능 사용 가능

#### TC-012: 스크린 리더 호환성
- **전제 조건**: 스크린 리더 활성화
- **테스트 단계**:
  1. 스크린 리더로 페이지 탐색
  2. ARIA 레이블 읽기 확인
  3. 차트 대체 텍스트 확인
- **예상 결과**:
  - 모든 컨텐츠 스크린 리더로 접근 가능

### 10.5 반응형 테스트

#### TC-013: 모바일 레이아웃
- **전제 조건**: 모바일 뷰포트 (375x667)
- **테스트 단계**:
  1. 모바일 뷰포트로 변경
  2. KPI 카드 2x2 그리드 확인
  3. 차트 세로 배치 확인
  4. 터치 제스처 동작 확인
- **예상 결과**:
  - 모바일 레이아웃 정상 표시
  - 터치 인터랙션 정상 동작

#### TC-014: 태블릿 레이아웃
- **전제 조건**: 태블릿 뷰포트 (768x1024)
- **테스트 단계**:
  1. 태블릿 뷰포트로 변경
  2. 레이아웃 확인
  3. 차트 크기 확인
- **예상 결과**:
  - 태블릿 레이아웃 정상 표시

---

## 부록

### A. 파일 구조

```
src/
├── app/
│   └── dashboard/
│       ├── page.tsx (메인 페이지)
│       └── _components/
│           ├── kpi-summary.tsx
│           ├── trends-section.tsx
│           └── colleges-section.tsx
├── components/
│   ├── layout/
│   │   ├── dashboard-layout.tsx (공통)
│   │   ├── header.tsx (공통)
│   │   └── sidebar.tsx (공통)
│   ├── dashboard/
│   │   ├── kpi-card.tsx (공통)
│   │   ├── empty-state.tsx (공통)
│   │   └── error-state.tsx
│   └── charts/
│       ├── chart-wrapper.tsx (공통)
│       ├── line-chart.tsx (공통)
│       ├── bar-chart.tsx (공통)
│       └── pie-chart.tsx (공통)
├── hooks/
│   └── api/
│       ├── useDashboardOverview.ts
│       ├── useDashboardTrends.ts
│       └── useDashboardColleges.ts
├── features/
│   └── dashboard/
│       └── backend/
│           └── route.ts (Hono API)
└── lib/
    └── utils/
        ├── number.ts (공통)
        ├── date.ts (공통)
        └── download.ts (공통)
```

### B. 환경 변수

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### C. 참고 문서

- [PRD v1.0](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/prd.md)
- [Userflow v1.0](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/userflow.md)
- [Database Design v2.0](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/database.md)
- [Common Modules v1.0](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/common-modules.md)

---

**문서 종료**

이 메인 대시보드 구현 계획은 PRD, Userflow, Database, Common Modules 문서를 기반으로 작성되었습니다. 모든 구현은 기존 코드베이스 구조를 준수하며, DRY 원칙을 철저히 따릅니다.
