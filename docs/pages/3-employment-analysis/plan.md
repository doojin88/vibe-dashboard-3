# Implementation Plan: 취업률 분석 (Employment Analysis)

**페이지 경로**: `/dashboard/department/employment`
**페이지 ID**: 3-employment-analysis
**버전**: 1.0
**작성일**: 2025-11-02
**우선순위**: High
**담당**: TBD

---

## 목차

1. [페이지 개요](#1-페이지-개요)
2. [요구사항 분석](#2-요구사항-분석)
3. [데이터 구조](#3-데이터-구조)
4. [컴포넌트 설계](#4-컴포넌트-설계)
5. [API 설계](#5-api-설계)
6. [상태 관리](#6-상태-관리)
7. [구현 단계](#7-구현-단계)
8. [테스트 계획](#8-테스트-계획)
9. [예외 처리](#9-예외-처리)
10. [성능 최적화](#10-성능-최적화)

---

## 1. 페이지 개요

### 1.1 목적

학과별, 연도별 취업률 데이터를 상세하게 분석하고 시각화하여, 대학 경영진과 학과장이 취업률 추이를 파악하고 개선 방향을 수립할 수 있도록 지원합니다.

### 1.2 주요 기능

1. **학과별 취업률 트렌드 분석** (3개년 비교)
2. **단과대학별 평균 취업률** (파이 차트)
3. **목표 대비 달성률** (게이지 차트)
4. **연도별/학과별 필터링**
5. **취업률 상세 데이터 테이블**
6. **CSV 다운로드**

### 1.3 타겟 사용자

- **주요**: 대학 경영진, 학과장, 단과대학장
- **부**: 교수진, 연구지원 담당자

---

## 2. 요구사항 분석

### 2.1 PRD 요구사항

**출처**: `/docs/prd.md` - 3.1.2 학과 성과 관리

> **2-2. 취업률 분석**
> - 학과별 취업률 트렌드 (3개년 비교)
> - 단과대학별 평균 취업률 (파이 차트)
> - 목표 대비 달성률 (게이지 차트)

### 2.2 Userflow 요구사항

**출처**: `/docs/userflow.md` - 6.3 논문 게재 현황 조회

- 사용자가 사이드바에서 "학과 성과 관리" → "취업률 분석" 메뉴 클릭
- 필터 옵션 로드 (평가년도, 단과대학, 학과)
- 필터 적용 시 URL 파라미터 업데이트
- 차트 및 테이블 렌더링
- 데이터 다운로드 기능

### 2.3 기능 요구사항

#### FR-001: 페이지 접근 및 인증
- **설명**: 인증된 사용자만 페이지 접근 가능
- **우선순위**: High
- **검증**:
  - Clerk 인증 확인
  - Supabase RLS 적용
  - 권한 없는 사용자는 403 에러

#### FR-002: 필터링
- **설명**: 평가년도, 단과대학, 학과별 필터링
- **우선순위**: High
- **세부 기능**:
  - 평가년도 다중 선택 (기본값: 최근 3년)
  - 단과대학 다중 선택
  - 학과 다중 선택 (단과대학 선택 시 필터링)
  - 필터 초기화 버튼
  - URL 파라미터로 필터 상태 저장 (공유 가능)

#### FR-003: 학과별 취업률 트렌드
- **설명**: 선택된 학과의 3개년 취업률 추이 라인 차트
- **우선순위**: High
- **세부 기능**:
  - X축: 평가년도
  - Y축: 취업률 (%)
  - 다중 라인: 각 학과별 색상 구분
  - 툴팁: 연도, 학과명, 취업률 표시

#### FR-004: 단과대학별 평균 취업률
- **설명**: 단과대학별 평균 취업률 파이 차트
- **우선순위**: Medium
- **세부 기능**:
  - 각 단과대학의 평균 취업률 계산 (가중 평균)
  - 색상 구분
  - 클릭 시 해당 단과대학 필터 적용

#### FR-005: 목표 대비 달성률
- **설명**: 학과별 목표 취업률 대비 달성률 게이지 차트
- **우선순위**: Medium
- **세부 기능**:
  - 목표 취업률: 70% (상수)
  - 달성률 = (실제 취업률 / 목표 취업률) × 100
  - 색상 기준:
    - 녹색: ≥ 100% (목표 달성)
    - 노란색: 70-99% (경고)
    - 빨간색: < 70% (미달)

#### FR-006: 데이터 테이블
- **설명**: 취업률 상세 데이터 테이블
- **우선순위**: High
- **세부 기능**:
  - 컬럼: 평가년도, 단과대학, 학과, 취업률, 달성률, 전년 대비 증감
  - 정렬 기능 (각 컬럼 클릭)
  - 페이지네이션 (50행/페이지)
  - CSV 다운로드

### 2.4 비기능 요구사항

#### NFR-001: 성능
- 페이지 초기 로딩 시간: < 2초
- 필터 변경 시 응답 시간: < 500ms
- 차트 렌더링 시간: < 1초

#### NFR-002: 접근성
- WCAG 2.1 Level AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환성

#### NFR-003: 반응형
- 데스크톱 (1920x1080 이상)
- 태블릿 (768x1024)
- 모바일 (375x667 이상)

---

## 3. 데이터 구조

### 3.1 데이터 소스

**Supabase 테이블**:
- `kpi_metrics`: 학과별 연도별 KPI 메트릭
- `departments`: 단과대학 및 학과 정보

### 3.2 데이터 모델

#### 3.2.1 KPI Metrics (kpi_metrics 테이블)

```typescript
type KPIMetric = {
  id: string;
  department_id: string;
  evaluation_year: number;
  employment_rate: number | null; // 취업률 (%)
  full_time_faculty: number | null;
  visiting_faculty: number | null;
  tech_transfer_income: number | null;
  intl_conference_count: number | null;
  created_at: string;
  updated_at: string;
};
```

#### 3.2.2 Department (departments 테이블)

```typescript
type Department = {
  id: string;
  college_name: string; // 단과대학명
  department_name: string; // 학과명
  created_at: string;
};
```

#### 3.2.3 Employment Data (API 응답)

```typescript
type EmploymentData = {
  id: string;
  evaluation_year: number;
  college_name: string;
  department_name: string;
  employment_rate: number;
  achievement_rate: number; // 목표 대비 달성률
  year_over_year_change: number | null; // 전년 대비 증감
};

type EmploymentTrend = {
  department_name: string;
  data: {
    year: number;
    employment_rate: number;
  }[];
};

type CollegeAverage = {
  college_name: string;
  avg_employment_rate: number;
  department_count: number;
};
```

### 3.3 API 엔드포인트

#### GET /api/employment/list

**Query Parameters**:
```typescript
type EmploymentQueryParams = {
  evaluation_year?: number[]; // 다중 선택 가능
  college_name?: string[]; // 다중 선택 가능
  department_name?: string[]; // 다중 선택 가능
};
```

**Response**:
```typescript
type EmploymentListResponse = {
  data: EmploymentData[];
  total: number;
};
```

#### GET /api/employment/trends

**Query Parameters**:
```typescript
type TrendQueryParams = {
  department_name: string[]; // 비교할 학과 목록
  start_year: number;
  end_year: number;
};
```

**Response**:
```typescript
type TrendsResponse = {
  trends: EmploymentTrend[];
};
```

#### GET /api/employment/college-average

**Query Parameters**:
```typescript
type CollegeAverageParams = {
  evaluation_year: number;
};
```

**Response**:
```typescript
type CollegeAverageResponse = {
  data: CollegeAverage[];
};
```

---

## 4. 컴포넌트 설계

### 4.1 페이지 구조

```
/dashboard/department/employment
├── page.tsx (메인 페이지)
└── components/
    ├── EmploymentFilterPanel.tsx
    ├── EmploymentTrendChart.tsx
    ├── CollegeAveragePieChart.tsx
    ├── AchievementGaugeChart.tsx
    └── EmploymentDataTable.tsx
```

### 4.2 컴포넌트 상세

#### 4.2.1 page.tsx (메인 페이지)

**파일 경로**: `src/app/(protected)/dashboard/department/employment/page.tsx`

**책임**:
- 레이아웃 구성
- 필터 상태 관리 (URL 파라미터 동기화)
- API 데이터 페칭 (React Query)
- 자식 컴포넌트 조합

**Props**: 없음 (Server Component → Client Component)

**State**:
```typescript
type FilterState = {
  evaluation_years: number[];
  college_names: string[];
  department_names: string[];
};
```

**구현**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmploymentFilterPanel } from './components/EmploymentFilterPanel';
import { EmploymentTrendChart } from './components/EmploymentTrendChart';
import { CollegeAveragePieChart } from './components/CollegeAveragePieChart';
import { AchievementGaugeChart } from './components/AchievementGaugeChart';
import { EmploymentDataTable } from './components/EmploymentDataTable';
import { useEmploymentData } from '@/hooks/api/useEmploymentData';

export default function EmploymentAnalysisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터에서 필터 상태 초기화
  const [filters, setFilters] = useState<FilterState>({
    evaluation_years: searchParams.getAll('year').map(Number),
    college_names: searchParams.getAll('college'),
    department_names: searchParams.getAll('dept'),
  });

  // API 데이터 페칭
  const { data: employmentData, isLoading, error } = useEmploymentData(filters);

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);

    // URL 파라미터 업데이트
    const params = new URLSearchParams();
    newFilters.evaluation_years.forEach(y => params.append('year', String(y)));
    newFilters.college_names.forEach(c => params.append('college', c));
    newFilters.department_names.forEach(d => params.append('dept', d));

    router.push(`?${params.toString()}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">취업률 분석</h1>

        {/* 필터 패널 */}
        <EmploymentFilterPanel
          filters={filters}
          onChange={handleFilterChange}
        />

        {/* KPI 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="평균 취업률"
            value={`${employmentData?.avgRate ?? 0}%`}
            icon={TrendingUp}
          />
          <KPICard
            title="목표 달성 학과"
            value={`${employmentData?.achievedCount ?? 0}개`}
            icon={CheckCircle}
          />
          <KPICard
            title="분석 대상"
            value={`${employmentData?.total ?? 0}개 학과`}
            icon={Building2}
          />
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmploymentTrendChart
            data={employmentData?.trends ?? []}
            isLoading={isLoading}
          />
          <CollegeAveragePieChart
            data={employmentData?.collegeAvg ?? []}
            isLoading={isLoading}
          />
        </div>

        <AchievementGaugeChart
          data={employmentData?.achievements ?? []}
          isLoading={isLoading}
        />

        {/* 데이터 테이블 */}
        <EmploymentDataTable
          data={employmentData?.list ?? []}
          isLoading={isLoading}
          onDownloadCSV={() => {/* 다운로드 로직 */}}
        />
      </div>
    </DashboardLayout>
  );
}
```

#### 4.2.2 EmploymentFilterPanel.tsx

**파일 경로**: `src/app/(protected)/dashboard/department/employment/components/EmploymentFilterPanel.tsx`

**책임**:
- 필터 옵션 렌더링
- 필터 변경 이벤트 처리
- 필터 초기화

**Props**:
```typescript
type EmploymentFilterPanelProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};
```

**구현**:
```typescript
'use client';

import { FilterPanel, type FilterConfig } from '@/components/dashboard/filter-panel';
import { useFilterOptions } from '@/hooks/api/useFilterOptions';

export function EmploymentFilterPanel({
  filters,
  onChange,
}: EmploymentFilterPanelProps) {
  // 필터 옵션 데이터 조회
  const { data: options } = useFilterOptions();

  const filterConfigs: FilterConfig[] = [
    {
      key: 'evaluation_year',
      label: '평가년도',
      options: options?.years ?? [],
      defaultValue: String(new Date().getFullYear() - 1),
    },
    {
      key: 'college_name',
      label: '단과대학',
      options: options?.colleges ?? [],
    },
    {
      key: 'department_name',
      label: '학과',
      options: options?.departments ?? [],
    },
  ];

  return (
    <FilterPanel
      filters={filterConfigs}
      onFilterChange={(values) => {
        onChange({
          evaluation_years: [Number(values.evaluation_year)],
          college_names: values.college_name ? [values.college_name as string] : [],
          department_names: values.department_name ? [values.department_name as string] : [],
        });
      }}
      onReset={() => {
        onChange({
          evaluation_years: [new Date().getFullYear() - 1],
          college_names: [],
          department_names: [],
        });
      }}
    />
  );
}
```

#### 4.2.3 EmploymentTrendChart.tsx

**파일 경로**: `src/app/(protected)/dashboard/department/employment/components/EmploymentTrendChart.tsx`

**책임**:
- 학과별 취업률 트렌드 라인 차트 렌더링
- 차트 상호작용 (툴팁, 줌)

**Props**:
```typescript
type EmploymentTrendChartProps = {
  data: EmploymentTrend[];
  isLoading?: boolean;
};
```

**구현**:
```typescript
'use client';

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
import { ChartWrapper } from '@/components/charts/chart-wrapper';

export function EmploymentTrendChart({
  data,
  isLoading,
}: EmploymentTrendChartProps) {
  // 데이터 변환: 학과별 → 연도별
  const chartData = transformToYearlyData(data);

  return (
    <ChartWrapper
      title="학과별 취업률 트렌드 (3개년)"
      description="선택된 학과의 연도별 취업률 추이"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis
            label={{ value: '취업률 (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip />
          <Legend />
          {data.map((trend, index) => (
            <Line
              key={trend.department_name}
              type="monotone"
              dataKey={trend.department_name}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// 데이터 변환 함수
function transformToYearlyData(trends: EmploymentTrend[]) {
  // 모든 연도 추출
  const years = Array.from(
    new Set(trends.flatMap(t => t.data.map(d => d.year)))
  ).sort();

  // 연도별로 데이터 재구성
  return years.map(year => {
    const entry: Record<string, number | string> = { year };
    trends.forEach(trend => {
      const dataPoint = trend.data.find(d => d.year === year);
      entry[trend.department_name] = dataPoint?.employment_rate ?? 0;
    });
    return entry;
  });
}

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
  '#d084d0', '#ffb347', '#a3e4d7', '#f7b7a3', '#aab7b8'
];
```

#### 4.2.4 CollegeAveragePieChart.tsx

**파일 경로**: `src/app/(protected)/dashboard/department/employment/components/CollegeAveragePieChart.tsx`

**책임**:
- 단과대학별 평균 취업률 파이 차트 렌더링

**Props**:
```typescript
type CollegeAveragePieChartProps = {
  data: CollegeAverage[];
  isLoading?: boolean;
};
```

**구현**:
```typescript
'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartWrapper } from '@/components/charts/chart-wrapper';

export function CollegeAveragePieChart({
  data,
  isLoading,
}: CollegeAveragePieChartProps) {
  const chartData = data.map(item => ({
    name: item.college_name,
    value: item.avg_employment_rate,
  }));

  return (
    <ChartWrapper
      title="단과대학별 평균 취업률"
      description="가중 평균 기준"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
```

#### 4.2.5 AchievementGaugeChart.tsx

**파일 경로**: `src/app/(protected)/dashboard/department/employment/components/AchievementGaugeChart.tsx`

**책임**:
- 학과별 목표 대비 달성률 게이지 차트 렌더링

**Props**:
```typescript
type AchievementGaugeChartProps = {
  data: EmploymentData[];
  isLoading?: boolean;
};
```

**구현**:
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChartWrapper } from '@/components/charts/chart-wrapper';

const TARGET_RATE = 70; // 목표 취업률 70%

export function AchievementGaugeChart({
  data,
  isLoading,
}: AchievementGaugeChartProps) {
  // 달성률 계산
  const achievements = data.map(item => ({
    department_name: item.department_name,
    employment_rate: item.employment_rate,
    achievement_rate: (item.employment_rate / TARGET_RATE) * 100,
    status: getAchievementStatus(item.employment_rate),
  }));

  return (
    <ChartWrapper
      title="목표 대비 달성률 (목표: 70%)"
      description="학과별 취업률 목표 달성 현황"
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.slice(0, 9).map((item) => (
          <Card key={item.department_name}>
            <CardHeader>
              <CardTitle className="text-base">{item.department_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>취업률</span>
                  <span className="font-semibold">{item.employment_rate.toFixed(1)}%</span>
                </div>
                <Progress
                  value={item.achievement_rate}
                  className={getProgressColor(item.status)}
                />
                <p className="text-xs text-muted-foreground">
                  달성률: {item.achievement_rate.toFixed(0)}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChartWrapper>
  );
}

function getAchievementStatus(rate: number): 'success' | 'warning' | 'danger' {
  if (rate >= TARGET_RATE) return 'success';
  if (rate >= TARGET_RATE * 0.7) return 'warning';
  return 'danger';
}

function getProgressColor(status: 'success' | 'warning' | 'danger'): string {
  switch (status) {
    case 'success': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'danger': return 'bg-red-500';
  }
}
```

#### 4.2.6 EmploymentDataTable.tsx

**파일 경로**: `src/app/(protected)/dashboard/department/employment/components/EmploymentDataTable.tsx`

**책임**:
- 취업률 상세 데이터 테이블 렌더링
- 정렬, 페이지네이션
- CSV 다운로드

**Props**:
```typescript
type EmploymentDataTableProps = {
  data: EmploymentData[];
  isLoading?: boolean;
  onDownloadCSV: () => void;
};
```

**구현**:
```typescript
'use client';

import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { formatPercentage } from '@/lib/utils/number';

export function EmploymentDataTable({
  data,
  isLoading,
  onDownloadCSV,
}: EmploymentDataTableProps) {
  const columns: ColumnDef<EmploymentData>[] = [
    {
      id: 'evaluation_year',
      header: '평가년도',
      accessorKey: 'evaluation_year',
      sortable: true,
    },
    {
      id: 'college_name',
      header: '단과대학',
      accessorKey: 'college_name',
      sortable: true,
    },
    {
      id: 'department_name',
      header: '학과',
      accessorKey: 'department_name',
      sortable: true,
    },
    {
      id: 'employment_rate',
      header: '취업률',
      sortable: true,
      cell: (row) => formatPercentage(row.employment_rate),
    },
    {
      id: 'achievement_rate',
      header: '목표 달성률',
      sortable: true,
      cell: (row) => (
        <span className={getAchievementColor(row.achievement_rate)}>
          {formatPercentage(row.achievement_rate)}
        </span>
      ),
    },
    {
      id: 'year_over_year_change',
      header: '전년 대비',
      sortable: true,
      cell: (row) => (
        <span className={row.year_over_year_change >= 0 ? 'text-green-600' : 'text-red-600'}>
          {row.year_over_year_change > 0 ? '+' : ''}
          {formatPercentage(row.year_over_year_change ?? 0)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">취업률 상세 데이터</h3>
        <Button onClick={onDownloadCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          CSV 다운로드
        </Button>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

function getAchievementColor(rate: number): string {
  if (rate >= 100) return 'text-green-600 font-semibold';
  if (rate >= 70) return 'text-yellow-600';
  return 'text-red-600';
}
```

---

## 5. API 설계

### 5.1 API Routes 구조

**파일 경로**: `src/features/employment/backend/route.ts`

```typescript
// src/features/employment/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const employmentFilterSchema = z.object({
  evaluation_year: z.coerce.number().array().optional(),
  college_name: z.string().array().optional(),
  department_name: z.string().array().optional(),
});

export function registerEmploymentRoutes(app: Hono<AppEnv>) {
  const employment = new Hono<AppEnv>();

  // GET /employment/list - 취업률 목록 조회
  employment.get('/list', zValidator('query', employmentFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('kpi_metrics')
      .select(`
        id,
        evaluation_year,
        employment_rate,
        departments (
          college_name,
          department_name
        )
      `);

    // 필터 적용
    if (filters.evaluation_year && filters.evaluation_year.length > 0) {
      query = query.in('evaluation_year', filters.evaluation_year);
    }

    if (filters.college_name && filters.college_name.length > 0) {
      query = query.in('departments.college_name', filters.college_name);
    }

    if (filters.department_name && filters.department_name.length > 0) {
      query = query.in('departments.department_name', filters.department_name);
    }

    const { data, error } = await query.order('evaluation_year', { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 달성률 및 전년 대비 증감 계산
    const enrichedData = calculateAchievementAndChange(data);

    return c.json({
      data: enrichedData,
      total: enrichedData.length,
    });
  });

  // GET /employment/trends - 트렌드 데이터
  employment.get('/trends', async (c) => {
    const department_names = c.req.queries('department_name') || [];
    const start_year = Number(c.req.query('start_year')) || new Date().getFullYear() - 3;
    const end_year = Number(c.req.query('end_year')) || new Date().getFullYear();

    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('kpi_metrics')
      .select(`
        evaluation_year,
        employment_rate,
        departments (
          department_name
        )
      `)
      .in('departments.department_name', department_names)
      .gte('evaluation_year', start_year)
      .lte('evaluation_year', end_year)
      .order('evaluation_year', { ascending: true });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 학과별로 그룹화
    const trends = groupByDepartment(data);

    return c.json({ trends });
  });

  // GET /employment/college-average - 단과대학별 평균
  employment.get('/college-average', async (c) => {
    const evaluation_year = Number(c.req.query('evaluation_year')) || new Date().getFullYear() - 1;

    const supabase = getSupabaseServiceClient();

    // 가중 평균 계산을 위한 집계 쿼리
    const { data, error } = await supabase.rpc('get_college_employment_average', {
      p_year: evaluation_year,
    });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ data });
  });

  app.route('/employment', employment);
}

// 달성률 및 전년 대비 증감 계산
function calculateAchievementAndChange(data: any[]) {
  const TARGET_RATE = 70;

  return data.map((item, index) => {
    const achievement_rate = (item.employment_rate / TARGET_RATE) * 100;

    // 전년 대비 증감 계산
    const prevYearData = data.find(
      d =>
        d.departments.department_name === item.departments.department_name &&
        d.evaluation_year === item.evaluation_year - 1
    );

    const year_over_year_change = prevYearData
      ? item.employment_rate - prevYearData.employment_rate
      : null;

    return {
      id: item.id,
      evaluation_year: item.evaluation_year,
      college_name: item.departments.college_name,
      department_name: item.departments.department_name,
      employment_rate: item.employment_rate,
      achievement_rate,
      year_over_year_change,
    };
  });
}

// 학과별로 그룹화
function groupByDepartment(data: any[]) {
  const grouped = new Map<string, any[]>();

  data.forEach(item => {
    const deptName = item.departments.department_name;
    if (!grouped.has(deptName)) {
      grouped.set(deptName, []);
    }
    grouped.get(deptName)!.push({
      year: item.evaluation_year,
      employment_rate: item.employment_rate,
    });
  });

  return Array.from(grouped.entries()).map(([department_name, yearlyData]) => ({
    department_name,
    data: yearlyData,
  }));
}
```

### 5.2 Supabase RPC (가중 평균 계산)

**파일**: Supabase SQL Functions

```sql
-- 단과대학별 가중 평균 취업률 계산
CREATE OR REPLACE FUNCTION get_college_employment_average(p_year INTEGER)
RETURNS TABLE (
  college_name VARCHAR,
  avg_employment_rate DECIMAL,
  department_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.college_name,
    AVG(k.employment_rate)::DECIMAL AS avg_employment_rate,
    COUNT(DISTINCT d.id)::INTEGER AS department_count
  FROM kpi_metrics k
  JOIN departments d ON d.id = k.department_id
  WHERE k.evaluation_year = p_year
    AND k.employment_rate IS NOT NULL
  GROUP BY d.college_name
  ORDER BY avg_employment_rate DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. 상태 관리

### 6.1 React Query Hooks

**파일 경로**: `src/hooks/api/useEmploymentData.ts`

```typescript
// src/hooks/api/useEmploymentData.ts
import { useQuery } from '@tanstack/react-query';

type FilterState = {
  evaluation_years: number[];
  college_names: string[];
  department_names: string[];
};

export function useEmploymentData(filters: FilterState) {
  return useQuery({
    queryKey: ['employment', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      filters.evaluation_years.forEach(y => params.append('evaluation_year', String(y)));
      filters.college_names.forEach(c => params.append('college_name', c));
      filters.department_names.forEach(d => params.append('department_name', d));

      const response = await fetch(`/api/employment/list?${params}`);
      if (!response.ok) throw new Error('Failed to fetch employment data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useEmploymentTrends(departmentNames: string[]) {
  return useQuery({
    queryKey: ['employment', 'trends', departmentNames],
    queryFn: async () => {
      const params = new URLSearchParams();
      departmentNames.forEach(d => params.append('department_name', d));

      const response = await fetch(`/api/employment/trends?${params}`);
      if (!response.ok) throw new Error('Failed to fetch trends');

      return response.json();
    },
    enabled: departmentNames.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCollegeAverage(evaluationYear: number) {
  return useQuery({
    queryKey: ['employment', 'college-average', evaluationYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/employment/college-average?evaluation_year=${evaluationYear}`
      );
      if (!response.ok) throw new Error('Failed to fetch college average');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### 6.2 URL 파라미터 동기화

**전략**:
- `useSearchParams`로 URL 파라미터 읽기
- `useRouter`로 URL 업데이트
- 필터 변경 시 `router.push()` 호출
- 브라우저 뒤로가기/앞으로가기 지원

---

## 7. 구현 단계

### 7.1 Phase 1: 기본 구조 (1주)

**Task 1.1: 페이지 및 라우트 생성**
- [ ] `src/app/(protected)/dashboard/department/employment/page.tsx` 생성
- [ ] 기본 레이아웃 구성
- [ ] Sidebar 메뉴 항목 추가 (`src/lib/navigation/menu-config.ts`)

**Task 1.2: API Routes 구현**
- [ ] `src/features/employment/backend/route.ts` 생성
- [ ] `/employment/list` 엔드포인트 구현
- [ ] Supabase 쿼리 작성 및 테스트
- [ ] Hono 앱에 라우터 등록

**Task 1.3: React Query Hooks**
- [ ] `src/hooks/api/useEmploymentData.ts` 생성
- [ ] `useEmploymentData` 훅 구현
- [ ] 캐싱 설정 (staleTime: 5분)

### 7.2 Phase 2: 필터 및 KPI 카드 (3일)

**Task 2.1: 필터 패널**
- [ ] `EmploymentFilterPanel.tsx` 구현
- [ ] 필터 옵션 API 통합
- [ ] URL 파라미터 동기화

**Task 2.2: KPI 카드**
- [ ] 평균 취업률 카드
- [ ] 목표 달성 학과 수 카드
- [ ] 분석 대상 학과 수 카드

### 7.3 Phase 3: 차트 구현 (1주)

**Task 3.1: 트렌드 차트**
- [ ] `EmploymentTrendChart.tsx` 구현
- [ ] Recharts 라인 차트 설정
- [ ] 데이터 변환 로직
- [ ] 툴팁 및 범례 설정

**Task 3.2: 파이 차트**
- [ ] `CollegeAveragePieChart.tsx` 구현
- [ ] 가중 평균 계산 API 연동
- [ ] 클릭 시 필터 적용

**Task 3.3: 게이지 차트**
- [ ] `AchievementGaugeChart.tsx` 구현
- [ ] Progress 바 컴포넌트 활용
- [ ] 색상 기준 적용 (녹색/노란색/빨간색)

### 7.4 Phase 4: 데이터 테이블 및 다운로드 (3일)

**Task 4.1: 데이터 테이블**
- [ ] `EmploymentDataTable.tsx` 구현
- [ ] 정렬 기능
- [ ] 페이지네이션

**Task 4.2: CSV 다운로드**
- [ ] `downloadCSV` 유틸리티 함수 활용
- [ ] UTF-8 BOM 추가 (한글 지원)

### 7.5 Phase 5: 테스트 및 최적화 (3일)

**Task 5.1: 단위 테스트**
- [ ] API 엔드포인트 테스트
- [ ] 데이터 변환 함수 테스트

**Task 5.2: 통합 테스트**
- [ ] 필터 적용 플로우 테스트
- [ ] 차트 렌더링 테스트
- [ ] CSV 다운로드 테스트

**Task 5.3: 성능 최적화**
- [ ] React Query 캐싱 확인
- [ ] 차트 메모이제이션
- [ ] 불필요한 재렌더링 제거

---

## 8. 테스트 계획

### 8.1 단위 테스트

#### 8.1.1 데이터 변환 함수

```typescript
// src/app/(protected)/dashboard/department/employment/components/__tests__/transformData.test.ts
import { transformToYearlyData } from '../EmploymentTrendChart';

describe('transformToYearlyData', () => {
  it('should transform department trends to yearly data', () => {
    const input = [
      {
        department_name: '컴퓨터공학과',
        data: [
          { year: 2021, employment_rate: 70 },
          { year: 2022, employment_rate: 75 },
        ],
      },
      {
        department_name: '기계공학과',
        data: [
          { year: 2021, employment_rate: 65 },
          { year: 2022, employment_rate: 68 },
        ],
      },
    ];

    const expected = [
      { year: 2021, '컴퓨터공학과': 70, '기계공학과': 65 },
      { year: 2022, '컴퓨터공학과': 75, '기계공학과': 68 },
    ];

    expect(transformToYearlyData(input)).toEqual(expected);
  });
});
```

#### 8.1.2 달성률 계산

```typescript
// src/features/employment/backend/__tests__/calculations.test.ts
import { calculateAchievementRate } from '../route';

describe('calculateAchievementRate', () => {
  it('should calculate achievement rate correctly', () => {
    expect(calculateAchievementRate(70, 70)).toBe(100);
    expect(calculateAchievementRate(35, 70)).toBe(50);
    expect(calculateAchievementRate(84, 70)).toBe(120);
  });
});
```

### 8.2 통합 테스트

#### 8.2.1 API 엔드포인트

```typescript
// src/features/employment/backend/__tests__/route.test.ts
import { testClient } from 'hono/testing';
import { createHonoApp } from '@/backend/hono/app';

describe('Employment API', () => {
  const app = createHonoApp();
  const client = testClient(app);

  it('GET /employment/list should return filtered data', async () => {
    const res = await client.employment.list.$get({
      query: {
        evaluation_year: ['2023'],
        college_name: ['공과대학'],
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toBeInstanceOf(Array);
    expect(data.total).toBeGreaterThan(0);
  });
});
```

### 8.3 E2E 테스트 (선택 사항)

```typescript
// e2e/employment-analysis.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Employment Analysis Page', () => {
  test('should display employment data and charts', async ({ page }) => {
    await page.goto('/dashboard/department/employment');

    // 제목 확인
    await expect(page.locator('h1')).toContainText('취업률 분석');

    // KPI 카드 확인
    await expect(page.locator('.kpi-card')).toHaveCount(3);

    // 차트 확인
    await expect(page.locator('.recharts-wrapper')).toBeVisible();

    // 필터 적용
    await page.selectOption('select[name="evaluation_year"]', '2023');
    await page.waitForResponse('/api/employment/list*');

    // 테이블 확인
    await expect(page.locator('table')).toBeVisible();
  });
});
```

---

## 9. 예외 처리

### 9.1 데이터 없음

**시나리오**: 필터 조건에 맞는 데이터가 없음

**처리**:
```typescript
if (employmentData?.list.length === 0) {
  return (
    <EmptyState
      title="데이터가 없습니다"
      description="선택한 조건에 맞는 취업률 데이터가 없습니다. 필터를 변경해보세요."
      action={{
        label: "필터 초기화",
        onClick: handleResetFilters,
      }}
    />
  );
}
```

### 9.2 API 오류

**시나리오**: Supabase 쿼리 실패, 네트워크 오류

**처리**:
```typescript
if (error) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-red-600">
            데이터 로딩 실패
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message}
          </p>
          <Button onClick={reset} className="mt-4">
            다시 시도
          </Button>
        </Card>
      )}
    />
  );
}
```

### 9.3 차트 렌더링 실패

**시나리오**: Recharts 에러, 데이터 형식 불일치

**처리**:
```typescript
try {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        {/* ... */}
      </LineChart>
    </ResponsiveContainer>
  );
} catch (error) {
  console.error('Chart rendering error:', error);
  return (
    <div className="flex flex-col items-center justify-center h-[300px]">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">
        차트를 표시할 수 없습니다
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        새로고침
      </Button>
    </div>
  );
}
```

### 9.4 세션 만료

**시나리오**: JWT 토큰 유효기간 초과

**처리**:
```typescript
// API 요청 시 Axios Interceptor에서 자동 처리
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 현재 페이지 URL 저장
      sessionStorage.setItem('redirect_url', window.location.pathname);
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 10. 성능 최적화

### 10.1 React Query 캐싱

**전략**:
- staleTime: 5분 (데이터 신선도)
- cacheTime: 10분 (캐시 보관)
- refetchOnWindowFocus: false (불필요한 재fetch 방지)

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});
```

### 10.2 차트 메모이제이션

**최적화**:
```typescript
import { useMemo } from 'react';

export function EmploymentTrendChart({ data, isLoading }: Props) {
  const chartData = useMemo(() => transformToYearlyData(data), [data]);

  return (
    <ChartWrapper isLoading={isLoading}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          {/* ... */}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
```

### 10.3 데이터 페이지네이션

**전략**:
- 테이블은 50행/페이지
- 서버 사이드 페이지네이션 (대용량 데이터)

```typescript
const { data, isLoading } = useEmploymentData({
  ...filters,
  page: currentPage,
  limit: 50,
});
```

### 10.4 Lazy Loading

**차트 컴포넌트 지연 로딩**:
```typescript
import dynamic from 'next/dynamic';

const EmploymentTrendChart = dynamic(
  () => import('./components/EmploymentTrendChart'),
  { ssr: false, loading: () => <Skeleton className="h-[300px]" /> }
);
```

---

## 11. 체크리스트

### 11.1 개발 완료 체크리스트

- [ ] 페이지 파일 생성 (`page.tsx`)
- [ ] API Routes 구현 및 테스트
- [ ] React Query Hooks 구현
- [ ] 필터 패널 구현
- [ ] KPI 카드 3개 구현
- [ ] 트렌드 차트 구현 (라인 차트)
- [ ] 파이 차트 구현 (단과대학별 평균)
- [ ] 게이지 차트 구현 (달성률)
- [ ] 데이터 테이블 구현
- [ ] CSV 다운로드 기능
- [ ] 에러 핸들링 구현
- [ ] 로딩 상태 UI 구현
- [ ] 빈 상태 UI 구현

### 11.2 테스트 체크리스트

- [ ] API 엔드포인트 단위 테스트
- [ ] 데이터 변환 함수 테스트
- [ ] 컴포넌트 렌더링 테스트
- [ ] 필터 적용 통합 테스트
- [ ] CSV 다운로드 테스트
- [ ] 에러 처리 테스트

### 11.3 성능 체크리스트

- [ ] React Query 캐싱 설정
- [ ] 차트 메모이제이션
- [ ] 불필요한 재렌더링 제거
- [ ] Lighthouse Performance Score > 90

### 11.4 접근성 체크리스트

- [ ] 키보드 네비게이션 지원
- [ ] ARIA 레이블 적용
- [ ] 색상 대비 4.5:1 이상
- [ ] 스크린 리더 테스트

---

## 12. 참고 문서

- **PRD**: `/docs/prd.md`
- **Userflow**: `/docs/userflow.md`
- **Database**: `/docs/database.md`
- **Common Modules**: `/docs/common-modules.md`
- **Usecase - Dashboard View**: `/docs/usecases/2-dashboard-view/spec.md`

---

## 13. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-02 | AI Assistant | 초기 작성 |

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design, Common Modules 문서를 기반으로 작성되었으며,
기존 코드베이스 구조 (`features`, `backend/hono`, `hooks/api`)를 엄격히 준수합니다.
DRY 원칙에 따라 공통 컴포넌트를 최대한 재사용하고, 중복 코드를 최소화했습니다.
