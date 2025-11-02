# 교원 현황 페이지 구현 계획
# /dashboard/department/faculty

**버전:** 1.0
**작성일:** 2025-11-02
**페이지 경로:** `/dashboard/department/faculty`
**페이지 이름:** 교원 현황
**접근 권한:** Authenticated (모든 인증된 사용자)
**우선순위:** High

---

## 목차

1. [페이지 개요](#1-페이지-개요)
2. [데이터 요구사항](#2-데이터-요구사항)
3. [UI 컴포넌트 설계](#3-ui-컴포넌트-설계)
4. [API 설계](#4-api-설계)
5. [상태 관리](#5-상태-관리)
6. [구현 단계](#6-구현-단계)
7. [파일 구조](#7-파일-구조)
8. [의존성 및 재사용 모듈](#8-의존성-및-재사용-모듈)

---

## 1. 페이지 개요

### 1.1 목적

학과별 전임교원 및 초빙교원 현황을 시각화하여 교원 인력 구성을 분석하고, 학과별/단과대학별 교원 현황 추이를 파악할 수 있도록 합니다.

### 1.2 주요 기능

1. **교원 현황 KPI 카드**
   - 전체 전임교원 수
   - 전체 초빙교원 수
   - 평균 전임/초빙 비율
   - 총 교원 수

2. **학과별 교원 현황 (스택 바 차트)**
   - X축: 학과명
   - Y축: 교원 수
   - 스택: 전임교원 (파란색), 초빙교원 (주황색)

3. **단과대학별 교원 분포 (도넛 차트)**
   - 단과대학별 총 교원 수 (전임 + 초빙)
   - 백분율 표시

4. **연도별 교원 증감 추이 (라인 차트)**
   - X축: 평가년도
   - Y축: 교원 수
   - 두 개의 라인: 전임교원, 초빙교원

5. **교원 현황 상세 테이블**
   - 단과대학, 학과, 평가년도, 전임교원 수, 초빙교원 수, 총 교원 수, 전임/초빙 비율
   - 정렬 및 페이지네이션

6. **필터 기능**
   - 평가년도 (다중 선택)
   - 단과대학 (다중 선택)
   - 학과 (다중 선택)
   - 필터 초기화

### 1.3 비즈니스 규칙

- 전임교원과 초빙교원은 음수가 될 수 없음 (데이터베이스 제약)
- 전임/초빙 비율 = 전임교원 수 / (전임교원 수 + 초빙교원 수) × 100
- 필터 상태는 URL 파라미터로 저장 (공유 가능)
- 기본값: 최신 평가년도 데이터 표시

---

## 2. 데이터 요구사항

### 2.1 데이터 소스

**테이블**: `kpi_metrics`, `departments`

**필요 필드**:
- `kpi_metrics.evaluation_year`: 평가년도
- `kpi_metrics.full_time_faculty`: 전임교원 수
- `kpi_metrics.visiting_faculty`: 초빙교원 수
- `departments.college_name`: 단과대학명
- `departments.department_name`: 학과명

### 2.2 데이터 조회 쿼리

#### 기본 조회
```sql
SELECT
  k.id,
  k.evaluation_year,
  k.full_time_faculty,
  k.visiting_faculty,
  d.college_name,
  d.department_name,
  (k.full_time_faculty + k.visiting_faculty) AS total_faculty
FROM kpi_metrics k
JOIN departments d ON d.id = k.department_id
WHERE k.full_time_faculty IS NOT NULL
  AND k.visiting_faculty IS NOT NULL
ORDER BY k.evaluation_year DESC, d.college_name, d.department_name;
```

#### 필터 적용
```sql
-- 평가년도 필터
WHERE k.evaluation_year IN (2021, 2022, 2023)

-- 단과대학 필터
AND d.college_name IN ('공과대학', '경영대학')

-- 학과 필터
AND d.department_name IN ('컴퓨터공학과', '기계공학과')
```

#### 집계 쿼리 (KPI 카드용)
```sql
-- 전체 집계
SELECT
  SUM(k.full_time_faculty) AS total_full_time,
  SUM(k.visiting_faculty) AS total_visiting,
  COUNT(DISTINCT d.id) AS total_departments,
  AVG(k.full_time_faculty::float / NULLIF(k.full_time_faculty + k.visiting_faculty, 0) * 100) AS avg_ratio
FROM kpi_metrics k
JOIN departments d ON d.id = k.department_id
WHERE k.evaluation_year = 2023;
```

#### 단과대학별 집계
```sql
SELECT
  d.college_name,
  SUM(k.full_time_faculty + k.visiting_faculty) AS total_faculty
FROM kpi_metrics k
JOIN departments d ON d.id = k.department_id
WHERE k.evaluation_year = 2023
GROUP BY d.college_name
ORDER BY total_faculty DESC;
```

#### 연도별 추이
```sql
SELECT
  k.evaluation_year,
  SUM(k.full_time_faculty) AS total_full_time,
  SUM(k.visiting_faculty) AS total_visiting
FROM kpi_metrics k
GROUP BY k.evaluation_year
ORDER BY k.evaluation_year ASC;
```

### 2.3 데이터 타입 정의

```typescript
// API 응답 타입
type FacultyData = {
  id: string;
  evaluation_year: number;
  full_time_faculty: number;
  visiting_faculty: number;
  total_faculty: number;
  department: {
    college_name: string;
    department_name: string;
  };
};

type FacultyAggregate = {
  total_full_time: number;
  total_visiting: number;
  total_departments: number;
  avg_full_time_ratio: number;
};

type CollegeFacultyDistribution = {
  college_name: string;
  total_faculty: number;
  percentage: number;
};

type YearlyTrend = {
  evaluation_year: number;
  total_full_time: number;
  total_visiting: number;
};

// 필터 타입
type FacultyFilters = {
  evaluation_years?: number[];
  college_names?: string[];
  department_names?: string[];
};
```

---

## 3. UI 컴포넌트 설계

### 3.1 페이지 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                  │
├───────────┬─────────────────────────────────────────────┤
│           │ 교원 현황                                   │
│ Sidebar   ├─────────────────────────────────────────────┤
│           │ [필터 패널]                                 │
│           │ 평가년도: [2023 ▼] [2022 ▼]                │
│           │ 단과대학: [공과대학 ▼]                      │
│           │ 학과: [전체 ▼]                              │
│           │ [필터 초기화]                               │
│           ├─────────────────────────────────────────────┤
│           │ [KPI 카드 섹션]                             │
│           │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│           │ │전임  │ │초빙  │ │평균  │ │총    │       │
│           │ │교원  │ │교원  │ │비율  │ │교원  │       │
│           │ └──────┘ └──────┘ └──────┘ └──────┘       │
│           ├─────────────────────────────────────────────┤
│           │ [차트 섹션]                                 │
│           │ ┌───────────────────┬────────────────────┐ │
│           │ │ 학과별 교원 현황  │ 단과대학별 분포    │ │
│           │ │ (스택 바 차트)    │ (도넛 차트)        │ │
│           │ │                   │                    │ │
│           │ └───────────────────┴────────────────────┘ │
│           │ ┌──────────────────────────────────────┐   │
│           │ │ 연도별 교원 증감 추이 (라인 차트)    │   │
│           │ │                                      │   │
│           │ └──────────────────────────────────────┘   │
│           ├─────────────────────────────────────────────┤
│           │ [데이터 테이블]                             │
│           │ 단과대학 | 학과 | 년도 | 전임 | 초빙 | 총 │
│           │ [페이지네이션]                              │
│           │ [CSV 다운로드]                              │
└───────────┴─────────────────────────────────────────────┘
```

### 3.2 컴포넌트 구조

```
FacultyStatusPage (Client Component)
├── DashboardLayout (재사용)
│   ├── Header (재사용)
│   └── Sidebar (재사용)
├── PageHeader
│   ├── Title: "교원 현황"
│   └── Breadcrumb: "대시보드 > 학과 성과 관리 > 교원 현황"
├── FilterPanel (재사용)
│   ├── YearFilter (다중 선택)
│   ├── CollegeFilter (다중 선택)
│   ├── DepartmentFilter (다중 선택)
│   └── ResetButton
├── KPICardSection
│   ├── KPICard: 전임교원 수 (재사용)
│   ├── KPICard: 초빙교원 수 (재사용)
│   ├── KPICard: 평균 전임비율 (재사용)
│   └── KPICard: 총 교원 수 (재사용)
├── ChartSection
│   ├── StackedBarChart: 학과별 교원 현황
│   ├── DonutChart: 단과대학별 분포
│   └── LineChart: 연도별 추이
└── DataTableSection
    ├── FacultyTable
    ├── Pagination (재사용)
    └── DownloadButton (CSV)
```

### 3.3 새로 작성할 컴포넌트

#### 3.3.1 FacultyStatusPage
**파일**: `src/app/(protected)/dashboard/department/faculty/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FilterPanel, type FilterValue } from '@/components/dashboard/filter-panel';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { StackedBarChart } from '@/components/charts/stacked-bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { LineChart } from '@/components/charts/line-chart';
import { DataTable } from '@/components/dashboard/data-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useFacultyData } from '@/hooks/api/useFacultyData';
import { Users, UserCheck, UserPlus, UsersRound } from 'lucide-react';

export default function FacultyStatusPage() {
  const [filters, setFilters] = useState<Record<string, FilterValue>>({
    evaluation_year: null,
    college_name: null,
    department_name: null,
  });

  const { data, isLoading, error } = useFacultyData(filters);

  // 데이터 처리 로직
  const kpiData = data?.aggregate;
  const chartData = data?.chart;
  const tableData = data?.table;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">교원 현황</h1>
          <p className="text-muted-foreground">
            학과별 전임/초빙 교원 현황 분석
          </p>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="전임교원"
            value={kpiData?.total_full_time || 0}
            icon={UserCheck}
            description="전임교원 수"
          />
          <KPICard
            title="초빙교원"
            value={kpiData?.total_visiting || 0}
            icon={UserPlus}
            description="초빙교원 수"
          />
          <KPICard
            title="평균 전임비율"
            value={`${(kpiData?.avg_full_time_ratio || 0).toFixed(1)}%`}
            icon={Users}
            description="전임교원 비율"
          />
          <KPICard
            title="총 교원"
            value={(kpiData?.total_full_time || 0) + (kpiData?.total_visiting || 0)}
            icon={UsersRound}
            description="전체 교원 수"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper
            title="학과별 교원 현황"
            description="전임교원 vs 초빙교원"
            isLoading={isLoading}
          >
            <StackedBarChart
              data={chartData?.byDepartment || []}
              xAxisKey="department_name"
              dataKeys={['full_time_faculty', 'visiting_faculty']}
              colors={['#3b82f6', '#f97316']}
              labels={['전임교원', '초빙교원']}
            />
          </ChartWrapper>

          <ChartWrapper
            title="단과대학별 교원 분포"
            description="단과대학별 총 교원 수"
            isLoading={isLoading}
          >
            <DonutChart
              data={chartData?.byCollege || []}
              nameKey="college_name"
              valueKey="total_faculty"
            />
          </ChartWrapper>
        </div>

        <ChartWrapper
          title="연도별 교원 증감 추이"
          description="전임/초빙 교원 수 변화"
          isLoading={isLoading}
        >
          <LineChart
            data={chartData?.trend || []}
            xAxisKey="evaluation_year"
            dataKeys={['total_full_time', 'total_visiting']}
            colors={['#3b82f6', '#f97316']}
            labels={['전임교원', '초빙교원']}
          />
        </ChartWrapper>

        {/* Data Table */}
        <ChartWrapper title="교원 현황 상세" isLoading={isLoading}>
          <DataTable
            columns={tableColumns}
            data={tableData || []}
            onSort={(columnId, direction) => {
              // 정렬 로직
            }}
          />
        </ChartWrapper>
      </div>
    </DashboardLayout>
  );
}
```

#### 3.3.2 StackedBarChart 컴포넌트
**파일**: `src/components/charts/stacked-bar-chart.tsx`

```typescript
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type StackedBarChartProps = {
  data: Record<string, unknown>[];
  xAxisKey: string;
  dataKeys: string[];
  colors?: string[];
  labels?: string[];
};

export function StackedBarChart({
  data,
  xAxisKey,
  dataKeys,
  colors = ['#3b82f6', '#f97316'],
  labels,
}: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xAxisKey}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={colors[index % colors.length]}
            name={labels?.[index] || key}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

#### 3.3.3 DonutChart 컴포넌트
**파일**: `src/components/charts/donut-chart.tsx`

```typescript
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type DonutChartProps = {
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey: string;
};

export function DonutChart({ data, nameKey, valueKey }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          label={(entry) => `${entry[nameKey]}: ${entry[valueKey]}`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

---

## 4. API 설계

### 4.1 API 엔드포인트

**Base URL**: `/api/faculty`

#### 4.1.1 GET /api/faculty
전체 교원 현황 데이터 조회 (필터링 지원)

**Query Parameters**:
```typescript
{
  evaluation_year?: number[];      // 평가년도 (다중)
  college_name?: string[];         // 단과대학명 (다중)
  department_name?: string[];      // 학과명 (다중)
}
```

**Response**:
```typescript
{
  aggregate: {
    total_full_time: number;
    total_visiting: number;
    total_departments: number;
    avg_full_time_ratio: number;
  };
  chart: {
    byDepartment: Array<{
      department_name: string;
      college_name: string;
      full_time_faculty: number;
      visiting_faculty: number;
    }>;
    byCollege: Array<{
      college_name: string;
      total_faculty: number;
      percentage: number;
    }>;
    trend: Array<{
      evaluation_year: number;
      total_full_time: number;
      total_visiting: number;
    }>;
  };
  table: Array<{
    id: string;
    evaluation_year: number;
    college_name: string;
    department_name: string;
    full_time_faculty: number;
    visiting_faculty: number;
    total_faculty: number;
    full_time_ratio: number;
  }>;
}
```

#### 4.1.2 GET /api/faculty/filters
필터 옵션 데이터 조회

**Response**:
```typescript
{
  years: number[];
  colleges: string[];
  departments: Array<{
    college_name: string;
    department_name: string;
  }>;
}
```

### 4.2 Backend 구현

**파일**: `src/features/faculty/backend/route.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const facultyFilterSchema = z.object({
  evaluation_year: z.coerce.number().array().optional(),
  college_name: z.string().array().optional(),
  department_name: z.string().array().optional(),
});

export function registerFacultyRoutes(app: Hono<AppEnv>) {
  const faculty = new Hono<AppEnv>();

  faculty.get('/', zValidator('query', facultyFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 기본 쿼리
    let query = supabase
      .from('kpi_metrics')
      .select(`
        id,
        evaluation_year,
        full_time_faculty,
        visiting_faculty,
        department:departments(college_name, department_name)
      `)
      .not('full_time_faculty', 'is', null)
      .not('visiting_faculty', 'is', null);

    // 필터 적용
    if (filters.evaluation_year && filters.evaluation_year.length > 0) {
      query = query.in('evaluation_year', filters.evaluation_year);
    }

    const { data: rawData, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 데이터 변환 및 집계
    const data = rawData.map((item: any) => ({
      ...item,
      total_faculty: item.full_time_faculty + item.visiting_faculty,
      full_time_ratio: (item.full_time_faculty / (item.full_time_faculty + item.visiting_faculty)) * 100,
      college_name: item.department.college_name,
      department_name: item.department.department_name,
    }));

    // 필터 추가 (college, department)
    let filteredData = data;
    if (filters.college_name && filters.college_name.length > 0) {
      filteredData = filteredData.filter((item) =>
        filters.college_name!.includes(item.college_name)
      );
    }
    if (filters.department_name && filters.department_name.length > 0) {
      filteredData = filteredData.filter((item) =>
        filters.department_name!.includes(item.department_name)
      );
    }

    // KPI 집계
    const aggregate = {
      total_full_time: filteredData.reduce((sum, item) => sum + item.full_time_faculty, 0),
      total_visiting: filteredData.reduce((sum, item) => sum + item.visiting_faculty, 0),
      total_departments: new Set(filteredData.map((item) => item.department_name)).size,
      avg_full_time_ratio:
        filteredData.length > 0
          ? filteredData.reduce((sum, item) => sum + item.full_time_ratio, 0) / filteredData.length
          : 0,
    };

    // 학과별 차트 데이터
    const byDepartment = filteredData.map((item) => ({
      department_name: item.department_name,
      college_name: item.college_name,
      full_time_faculty: item.full_time_faculty,
      visiting_faculty: item.visiting_faculty,
    }));

    // 단과대학별 집계
    const collegeMap = new Map<string, number>();
    filteredData.forEach((item) => {
      const current = collegeMap.get(item.college_name) || 0;
      collegeMap.set(item.college_name, current + item.total_faculty);
    });

    const totalFaculty = Array.from(collegeMap.values()).reduce((sum, val) => sum + val, 0);
    const byCollege = Array.from(collegeMap.entries()).map(([college_name, total]) => ({
      college_name,
      total_faculty: total,
      percentage: (total / totalFaculty) * 100,
    }));

    // 연도별 추이
    const yearMap = new Map<number, { full_time: number; visiting: number }>();
    filteredData.forEach((item) => {
      const current = yearMap.get(item.evaluation_year) || { full_time: 0, visiting: 0 };
      yearMap.set(item.evaluation_year, {
        full_time: current.full_time + item.full_time_faculty,
        visiting: current.visiting + item.visiting_faculty,
      });
    });

    const trend = Array.from(yearMap.entries())
      .map(([year, counts]) => ({
        evaluation_year: year,
        total_full_time: counts.full_time,
        total_visiting: counts.visiting,
      }))
      .sort((a, b) => a.evaluation_year - b.evaluation_year);

    return c.json({
      aggregate,
      chart: {
        byDepartment,
        byCollege,
        trend,
      },
      table: filteredData,
    });
  });

  faculty.get('/filters', async (c) => {
    const supabase = getSupabaseServiceClient();

    // 평가년도 목록
    const { data: yearsData } = await supabase
      .from('kpi_metrics')
      .select('evaluation_year')
      .not('full_time_faculty', 'is', null)
      .order('evaluation_year', { ascending: false });

    const years = Array.from(new Set(yearsData?.map((item) => item.evaluation_year) || []));

    // 단과대학 및 학과 목록
    const { data: deptsData } = await supabase
      .from('departments')
      .select('college_name, department_name')
      .order('college_name, department_name');

    const colleges = Array.from(new Set(deptsData?.map((item) => item.college_name) || []));

    return c.json({
      years,
      colleges,
      departments: deptsData || [],
    });
  });

  app.route('/faculty', faculty);
}
```

**등록**: `src/backend/hono/app.ts`에 추가

```typescript
import { registerFacultyRoutes } from '@/features/faculty/backend/route';

export const createHonoApp = () => {
  // ... 기존 코드

  registerExampleRoutes(app);
  registerKPIRoutes(app);
  registerFacultyRoutes(app); // 추가

  // ...
};
```

---

## 5. 상태 관리

### 5.1 React Query Hook

**파일**: `src/hooks/api/useFacultyData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { FilterValue } from '@/components/dashboard/filter-panel';

type FacultyFilters = Record<string, FilterValue>;

export function useFacultyData(filters: FacultyFilters = {}) {
  return useQuery({
    queryKey: ['faculty', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/faculty?${params}`);
      if (!response.ok) throw new Error('Failed to fetch faculty data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useFacultyFilters() {
  return useQuery({
    queryKey: ['faculty', 'filters'],
    queryFn: async () => {
      const response = await fetch('/api/faculty/filters');
      if (!response.ok) throw new Error('Failed to fetch filters');

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10분
  });
}
```

### 5.2 URL 파라미터 동기화

**파일**: `src/app/(protected)/dashboard/department/faculty/page.tsx`

```typescript
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FacultyStatusPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Record<string, FilterValue>>(() => {
    // URL 파라미터에서 초기값 복원
    return {
      evaluation_year: searchParams.get('year')?.split(',').map(Number) || null,
      college_name: searchParams.get('college')?.split(',') || null,
      department_name: searchParams.get('dept')?.split(',') || null,
    };
  });

  // 필터 변경 시 URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.evaluation_year) {
      params.set('year', filters.evaluation_year.toString());
    }
    if (filters.college_name) {
      params.set('college', filters.college_name.toString());
    }
    if (filters.department_name) {
      params.set('dept', filters.department_name.toString());
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  // ...
}
```

---

## 6. 구현 단계

### Phase 1: 기본 구조 (1일)

1. **디렉토리 생성**
   ```bash
   mkdir -p src/app/(protected)/dashboard/department/faculty
   mkdir -p src/features/faculty/backend
   mkdir -p src/components/charts
   ```

2. **페이지 파일 생성**
   - `src/app/(protected)/dashboard/department/faculty/page.tsx`

3. **레이아웃 확인**
   - DashboardLayout 재사용 확인
   - Sidebar 메뉴 항목 추가 확인

### Phase 2: API 구현 (1-2일)

1. **Backend Route 작성**
   - `src/features/faculty/backend/route.ts`
   - Hono 라우터 등록

2. **React Query Hook 작성**
   - `src/hooks/api/useFacultyData.ts`

3. **API 테스트**
   - Postman 또는 curl로 엔드포인트 테스트
   - 필터링 로직 검증

### Phase 3: UI 컴포넌트 (2-3일)

1. **차트 컴포넌트 작성**
   - `src/components/charts/stacked-bar-chart.tsx`
   - `src/components/charts/donut-chart.tsx`
   - `src/components/charts/line-chart.tsx` (이미 있으면 재사용)

2. **페이지 컴포넌트 조립**
   - KPI 카드 섹션
   - 차트 섹션
   - 테이블 섹션

3. **필터 패널 연동**
   - FilterPanel 재사용
   - URL 파라미터 동기화

### Phase 4: 스타일링 및 최적화 (1일)

1. **반응형 디자인**
   - 모바일, 태블릿, 데스크톱 대응

2. **로딩 상태 및 에러 처리**
   - 스켈레톤 로더
   - 빈 상태 UI
   - 에러 메시지

3. **성능 최적화**
   - React Query 캐싱 확인
   - 차트 렌더링 최적화

### Phase 5: 테스트 및 배포 (1일)

1. **기능 테스트**
   - 필터링 동작 확인
   - 차트 렌더링 확인
   - 데이터 정확성 검증

2. **접근성 테스트**
   - 키보드 네비게이션
   - 스크린 리더 호환성

3. **문서 작성**
   - 주석 추가
   - README 업데이트 (필요시)

**예상 소요 시간**: 6-8일

---

## 7. 파일 구조

```
/Users/leo/awesomedev/vmc1/vibe-dashboard-2/
├── src/
│   ├── app/
│   │   └── (protected)/
│   │       └── dashboard/
│   │           └── department/
│   │               └── faculty/
│   │                   └── page.tsx (신규)
│   ├── features/
│   │   └── faculty/ (신규)
│   │       └── backend/
│   │           └── route.ts (신규)
│   ├── hooks/
│   │   └── api/
│   │       └── useFacultyData.ts (신규)
│   └── components/
│       └── charts/
│           ├── stacked-bar-chart.tsx (신규)
│           ├── donut-chart.tsx (신규)
│           └── line-chart.tsx (재사용 또는 신규)
└── docs/
    └── pages/
        └── 4-faculty-status/
            └── plan.md (이 문서)
```

---

## 8. 의존성 및 재사용 모듈

### 8.1 기존 공통 모듈 재사용

**레이아웃**:
- `src/components/layout/dashboard-layout.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/sidebar.tsx`

**UI 컴포넌트**:
- `src/components/dashboard/kpi-card.tsx`
- `src/components/dashboard/filter-panel.tsx`
- `src/components/dashboard/data-table.tsx`
- `src/components/dashboard/empty-state.tsx`
- `src/components/charts/chart-wrapper.tsx`

**Backend**:
- `src/lib/supabase/service-client.ts`
- `src/lib/supabase/types.ts`
- `src/backend/hono/app.ts`

**Hooks**:
- `src/hooks/useUserRole.ts`
- React Query 설정 (`src/app/providers.tsx`)

### 8.2 새로 작성할 모듈

**페이지**:
- `src/app/(protected)/dashboard/department/faculty/page.tsx`

**Backend**:
- `src/features/faculty/backend/route.ts`

**Hooks**:
- `src/hooks/api/useFacultyData.ts`

**차트 컴포넌트**:
- `src/components/charts/stacked-bar-chart.tsx`
- `src/components/charts/donut-chart.tsx`

### 8.3 외부 라이브러리

**이미 설치됨**:
- `recharts` (차트 라이브러리)
- `@tanstack/react-query` (데이터 fetching)
- `zod` (스키마 검증)
- `hono` (API 프레임워크)

**추가 설치 불필요**: 모든 필요한 라이브러리가 이미 설치되어 있음

---

## 9. 주의사항

### 9.1 데이터 무결성

- `full_time_faculty` 및 `visiting_faculty`가 NULL인 레코드 제외
- 음수 값 체크 (데이터베이스 제약으로 방지됨)
- 0으로 나누기 방지 (전임비율 계산 시)

### 9.2 성능 고려사항

- 대량 데이터 시 페이지네이션 필수
- React Query 캐싱 활용 (5분 staleTime)
- 차트 렌더링 시 메모이제이션 고려

### 9.3 접근성

- 차트에 대체 텍스트 제공 (aria-label)
- 키보드 네비게이션 지원
- 색상만으로 정보 전달 금지 (레이블 병행)

### 9.4 에러 처리

- API 에러 시 사용자 친화적인 메시지
- 재시도 버튼 제공
- 에러 로깅 (Sentry 연동)

---

## 10. 테스트 체크리스트

### 10.1 기능 테스트

- [ ] 페이지가 정상적으로 로드됨
- [ ] 필터 적용 시 데이터가 올바르게 필터링됨
- [ ] 필터 초기화 버튼이 작동함
- [ ] URL 파라미터가 필터 상태와 동기화됨
- [ ] KPI 카드가 정확한 값을 표시함
- [ ] 스택 바 차트가 올바르게 렌더링됨
- [ ] 도넛 차트가 올바르게 렌더링됨
- [ ] 라인 차트가 올바르게 렌더링됨
- [ ] 데이터 테이블이 정확한 데이터를 표시함
- [ ] 정렬 기능이 작동함
- [ ] CSV 다운로드가 작동함

### 10.2 성능 테스트

- [ ] 페이지 로딩 시간 < 2초
- [ ] API 응답 시간 < 1초
- [ ] 차트 렌더링 시간 < 1초
- [ ] 필터 변경 시 즉시 반응함

### 10.3 접근성 테스트

- [ ] 키보드만으로 모든 기능 사용 가능
- [ ] 스크린 리더로 콘텐츠 읽을 수 있음
- [ ] 색상 대비 충분함 (WCAG AA)
- [ ] 포커스 표시가 명확함

### 10.4 반응형 테스트

- [ ] 데스크톱 (1920x1080) 정상 표시
- [ ] 태블릿 (768x1024) 정상 표시
- [ ] 모바일 (375x667) 정상 표시
- [ ] 차트가 반응형으로 크기 조정됨

---

## 11. 참고 문서

- **PRD**: `/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/prd.md`
- **Userflow**: `/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/userflow.md`
- **Database**: `/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/database.md`
- **Common Modules**: `/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/common-modules.md`
- **UC-002 대시보드 조회**: `/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/usecases/2-dashboard-view/spec.md`

---

**문서 종료**

이 구현 계획은 교원 현황 페이지의 상세한 개발 가이드를 제공합니다.
기존 공통 모듈을 최대한 재사용하며, DRY 원칙을 준수하고, 엄밀한 오류 없는 구현을 목표로 합니다.
