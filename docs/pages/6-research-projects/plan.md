# Implementation Plan: Research Projects Management
# 연구과제 관리 페이지 구현 계획

**페이지 경로**: `/dashboard/research/projects`
**페이지 번호**: 6
**페이지 이름**: 연구과제 관리
**작성일**: 2025-11-02
**버전**: 1.0

---

## 목차

1. [개요](#1-개요)
2. [요구사항 분석](#2-요구사항-분석)
3. [데이터 모델 및 API 설계](#3-데이터-모델-및-api-설계)
4. [컴포넌트 구조](#4-컴포넌트-구조)
5. [상태 관리 설계](#5-상태-관리-설계)
6. [구현 단계](#6-구현-단계)
7. [테스트 계획](#7-테스트-계획)
8. [예외 처리 및 에러 핸들링](#8-예외-처리-및-에러-핸들링)
9. [성능 최적화](#9-성능-최적화)
10. [체크리스트](#10-체크리스트)

---

## 1. 개요

### 1.1 페이지 목적

연구과제 및 연구비 관리 페이지로, 다음 기능을 제공합니다:
- 지원기관별 연구비 수주 현황 시각화
- 학과별 총 연구비 비교
- 과제별 진행 상태 모니터링 (집행완료/처리중)
- 예산 집행 추이 타임라인

### 1.2 기술 스택

**프론트엔드**:
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn UI
- Recharts (차트)
- React Query (데이터 페칭)
- Zod (스키마 검증)

**백엔드**:
- Hono (API Routes)
- Supabase (PostgreSQL)
- Service Role Key (서버 사이드)

**인증**:
- Clerk (Google OAuth)

### 1.3 관련 문서

- PRD v1.0: 섹션 6.2 (FR-DASH-004: 연구과제 관리)
- Userflow v1.0: 섹션 3.4 (연구과제 관리 플로우)
- Database Design v2.0: 섹션 3.2.5, 3.2.6 (research_projects, budget_executions)
- Common Modules: 섹션 4, 5, 7 (레이아웃, UI 컴포넌트, 차트)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항 (PRD 기반)

#### FR-DASH-004: 연구과제 관리
**우선순위**: Medium

**상세 요구사항**:
1. **지원기관별 연구비 수주 현황** (파이 차트)
   - 각 지원기관의 총 연구비 비율 표시
   - 클릭 시 해당 지원기관 과제 목록 필터링

2. **학과별 총 연구비** (막대 그래프)
   - 내림차순 정렬 (상위 10개 학과)
   - 학과별 과제 수 및 총 연구비 표시

3. **과제별 진행 상태** (도넛 차트)
   - 집행완료 vs 처리중 비율
   - 각 상태별 과제 수 표시

4. **연구비 집행 추이** (타임라인/라인 차트)
   - 월별 집행금액 추이
   - 집행항목별 색상 구분

### 2.2 사용자 플로우 (Userflow 기반)

**입력**:
- 사이드바 메뉴 클릭: 연구 성과 분석 → 연구과제 관리
- 필터 선택:
  - 연구 연도 (다중 선택)
  - 지원기관 (다중 선택)
  - 학과 (다중 선택)
  - 진행 상태 (집행완료, 처리중)

**처리**:
1. research_projects 테이블 조회
2. JOIN budget_executions (예산 집행 내역)
3. JOIN departments (학과 정보)
4. 필터 조건 적용
5. 집계 계산:
   - 지원기관별 총 연구비
   - 학과별 총 연구비
   - 진행 상태별 과제 수
   - 예산 집행 추이 (월별)

**출력**:
- 연구과제 관리 화면
- 필터 섹션
- KPI 요약
  - 총 과제 수: 234건
  - 총 연구비: 120억원
  - 집행률: 68.5%
- 차트 섹션
  - 지원기관별 분포 (파이 차트)
  - 학과별 연구비 (막대 그래프)
  - 진행 상태 (도넛 차트)
  - 집행 추이 (라인 차트)
- 과제 상세 테이블
- CSV/Excel 다운로드 버튼

### 2.3 데이터 소스

#### CSV 매핑
- `research_project_data.csv` → `research_projects`, `budget_executions`

#### 데이터베이스 스키마

**research_projects**:
```sql
CREATE TABLE research_projects (
  id UUID PRIMARY KEY,
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(300) NOT NULL,
  principal_investigator VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id),
  funding_agency VARCHAR(200) NOT NULL,
  total_budget BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**budget_executions**:
```sql
CREATE TABLE budget_executions (
  id UUID PRIMARY KEY,
  execution_id VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID REFERENCES research_projects(id),
  execution_date DATE NOT NULL,
  execution_item VARCHAR(100) NOT NULL,
  execution_amount BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL, -- '집행완료', '처리중'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. 데이터 모델 및 API 설계

### 3.1 타입 정의

**파일 위치**: `src/features/research-projects/types.ts`

```typescript
import type { Database } from '@/lib/supabase/types';

// 데이터베이스 타입
export type ResearchProject = Database['public']['Tables']['research_projects']['Row'];
export type BudgetExecution = Database['public']['Tables']['budget_executions']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];

// 조인된 프로젝트 데이터
export type ProjectWithDetails = ResearchProject & {
  department: Pick<Department, 'college_name' | 'department_name'>;
  executions: BudgetExecution[];
  total_executed: number;
  execution_rate: number;
};

// 필터 타입
export type ProjectFilters = {
  year?: number;
  funding_agency?: string;
  department_id?: string;
  status?: '집행완료' | '처리중';
};

// 집계 데이터 타입
export type ProjectAggregate = {
  total_projects: number;
  total_budget: number;
  total_executed: number;
  execution_rate: number;
  by_funding_agency: AgencyData[];
  by_department: DepartmentData[];
  by_status: StatusData[];
  execution_timeline: TimelineData[];
};

export type AgencyData = {
  funding_agency: string;
  total_budget: number;
  project_count: number;
  percentage: number;
};

export type DepartmentData = {
  department_name: string;
  college_name: string;
  total_budget: number;
  project_count: number;
};

export type StatusData = {
  status: '집행완료' | '처리중';
  count: number;
  percentage: number;
};

export type TimelineData = {
  month: string;
  total_amount: number;
  by_item: {
    [key: string]: number;
  };
};
```

### 3.2 API 설계

**파일 위치**: `src/features/research-projects/backend/route.ts`

#### 3.2.1 GET /api/research-projects

**목적**: 연구과제 목록 조회 (필터링 지원)

**Query Parameters**:
```typescript
{
  year?: number;
  funding_agency?: string;
  department_id?: string;
  status?: '집행완료' | '처리중';
  limit?: number;
  offset?: number;
}
```

**Response**:
```typescript
{
  data: ProjectWithDetails[];
  total: number;
}
```

**쿼리 예시**:
```typescript
const { data, error } = await supabase
  .from('research_projects')
  .select(`
    *,
    department:departments(college_name, department_name),
    executions:budget_executions(*)
  `)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
```

#### 3.2.2 GET /api/research-projects/aggregate

**목적**: 연구과제 집계 데이터 조회

**Query Parameters**:
```typescript
{
  year?: number;
  funding_agency?: string;
  department_id?: string;
}
```

**Response**:
```typescript
ProjectAggregate
```

**집계 로직**:
1. 지원기관별 집계:
```sql
SELECT
  funding_agency,
  COUNT(*) AS project_count,
  SUM(total_budget) AS total_budget
FROM research_projects
GROUP BY funding_agency
ORDER BY total_budget DESC;
```

2. 학과별 집계:
```sql
SELECT
  d.college_name,
  d.department_name,
  COUNT(rp.id) AS project_count,
  SUM(rp.total_budget) AS total_budget
FROM research_projects rp
JOIN departments d ON d.id = rp.department_id
GROUP BY d.college_name, d.department_name
ORDER BY total_budget DESC
LIMIT 10;
```

3. 상태별 집계:
```sql
SELECT
  status,
  COUNT(*) AS count
FROM budget_executions
GROUP BY status;
```

4. 월별 집행 추이:
```sql
SELECT
  TO_CHAR(execution_date, 'YYYY-MM') AS month,
  execution_item,
  SUM(execution_amount) AS total_amount
FROM budget_executions
WHERE execution_date >= NOW() - INTERVAL '12 months'
GROUP BY month, execution_item
ORDER BY month;
```

### 3.3 Hono 라우트 구현

**파일 위치**: `src/features/research-projects/backend/route.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const projectFilterSchema = z.object({
  year: z.coerce.number().optional(),
  funding_agency: z.string().optional(),
  department_id: z.string().uuid().optional(),
  status: z.enum(['집행완료', '처리중']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const aggregateFilterSchema = z.object({
  year: z.coerce.number().optional(),
  funding_agency: z.string().optional(),
  department_id: z.string().uuid().optional(),
});

export function registerResearchProjectRoutes(app: Hono<AppEnv>) {
  const projects = new Hono<AppEnv>();

  // GET /api/research-projects
  projects.get('/', zValidator('query', projectFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('research_projects')
      .select(`
        *,
        department:departments(college_name, department_name),
        executions:budget_executions(*)
      `, { count: 'exact' });

    // 필터 적용
    if (filters.funding_agency) {
      query = query.eq('funding_agency', filters.funding_agency);
    }

    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    // 페이지네이션
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 집행률 계산
    const projectsWithRate = data?.map((project) => {
      const totalExecuted = project.executions?.reduce(
        (sum, exec) => sum + (exec.execution_amount || 0),
        0
      ) || 0;

      return {
        ...project,
        total_executed: totalExecuted,
        execution_rate: project.total_budget > 0
          ? (totalExecuted / project.total_budget) * 100
          : 0,
      };
    }) || [];

    return c.json({
      data: projectsWithRate,
      total: count || 0,
    });
  });

  // GET /api/research-projects/aggregate
  projects.get('/aggregate', zValidator('query', aggregateFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 1. 전체 프로젝트 조회
    let projectQuery = supabase
      .from('research_projects')
      .select(`
        *,
        department:departments(college_name, department_name),
        executions:budget_executions(*)
      `);

    if (filters.funding_agency) {
      projectQuery = projectQuery.eq('funding_agency', filters.funding_agency);
    }

    if (filters.department_id) {
      projectQuery = projectQuery.eq('department_id', filters.department_id);
    }

    const { data: projects, error: projectError } = await projectQuery;

    if (projectError) {
      return c.json({ error: projectError.message }, 500);
    }

    // 2. 집계 계산
    const totalProjects = projects?.length || 0;
    const totalBudget = projects?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0;
    const totalExecuted = projects?.reduce((sum, p) => {
      return sum + (p.executions?.reduce((eSum, e) => eSum + (e.execution_amount || 0), 0) || 0);
    }, 0) || 0;
    const executionRate = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

    // 3. 지원기관별 집계
    const byAgency = new Map<string, { budget: number; count: number }>();
    projects?.forEach((project) => {
      const agency = project.funding_agency;
      const current = byAgency.get(agency) || { budget: 0, count: 0 };
      byAgency.set(agency, {
        budget: current.budget + (project.total_budget || 0),
        count: current.count + 1,
      });
    });

    const byFundingAgency = Array.from(byAgency.entries())
      .map(([agency, data]) => ({
        funding_agency: agency,
        total_budget: data.budget,
        project_count: data.count,
        percentage: totalBudget > 0 ? (data.budget / totalBudget) * 100 : 0,
      }))
      .sort((a, b) => b.total_budget - a.total_budget);

    // 4. 학과별 집계 (상위 10개)
    const byDept = new Map<string, {
      college: string;
      dept: string;
      budget: number;
      count: number;
    }>();

    projects?.forEach((project) => {
      const key = project.department_id;
      const current = byDept.get(key) || {
        college: project.department?.college_name || '',
        dept: project.department?.department_name || '',
        budget: 0,
        count: 0,
      };
      byDept.set(key, {
        ...current,
        budget: current.budget + (project.total_budget || 0),
        count: current.count + 1,
      });
    });

    const byDepartment = Array.from(byDept.values())
      .map((data) => ({
        college_name: data.college,
        department_name: data.dept,
        total_budget: data.budget,
        project_count: data.count,
      }))
      .sort((a, b) => b.total_budget - a.total_budget)
      .slice(0, 10);

    // 5. 상태별 집계
    const allExecutions = projects?.flatMap((p) => p.executions || []) || [];
    const byStatus = new Map<string, number>();

    allExecutions.forEach((exec) => {
      const status = exec.status;
      byStatus.set(status, (byStatus.get(status) || 0) + 1);
    });

    const statusData = Array.from(byStatus.entries()).map(([status, count]) => ({
      status: status as '집행완료' | '처리중',
      count,
      percentage: allExecutions.length > 0 ? (count / allExecutions.length) * 100 : 0,
    }));

    // 6. 월별 집행 추이 (최근 12개월)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const timelineMap = new Map<string, { total: number; byItem: Map<string, number> }>();

    allExecutions
      .filter((exec) => new Date(exec.execution_date) >= twelveMonthsAgo)
      .forEach((exec) => {
        const month = exec.execution_date.substring(0, 7); // YYYY-MM
        const current = timelineMap.get(month) || { total: 0, byItem: new Map() };

        current.total += exec.execution_amount || 0;
        current.byItem.set(
          exec.execution_item,
          (current.byItem.get(exec.execution_item) || 0) + (exec.execution_amount || 0)
        );

        timelineMap.set(month, current);
      });

    const executionTimeline = Array.from(timelineMap.entries())
      .map(([month, data]) => ({
        month,
        total_amount: data.total,
        by_item: Object.fromEntries(data.byItem),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return c.json({
      total_projects: totalProjects,
      total_budget: totalBudget,
      total_executed: totalExecuted,
      execution_rate: executionRate,
      by_funding_agency: byFundingAgency,
      by_department: byDepartment,
      by_status: statusData,
      execution_timeline: executionTimeline,
    });
  });

  app.route('/research-projects', projects);
}
```

### 3.4 React Query Hooks

**파일 위치**: `src/features/research-projects/hooks/useResearchProjects.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { ProjectWithDetails, ProjectFilters, ProjectAggregate } from '../types';

export function useResearchProjects(filters: ProjectFilters = {}) {
  return useQuery<{ data: ProjectWithDetails[]; total: number }>({
    queryKey: ['research-projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value));
      });

      const response = await fetch(`/api/research-projects?${params}`);
      if (!response.ok) throw new Error('Failed to fetch research projects');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useResearchProjectsAggregate(filters: Omit<ProjectFilters, 'status'> = {}) {
  return useQuery<ProjectAggregate>({
    queryKey: ['research-projects-aggregate', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value));
      });

      const response = await fetch(`/api/research-projects/aggregate?${params}`);
      if (!response.ok) throw new Error('Failed to fetch aggregate data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### 3.5 Hono App 통합

**파일 위치**: `src/backend/hono/app.ts` (수정)

```typescript
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerKPIRoutes } from '@/features/kpi/backend/route';
import { registerResearchProjectRoutes } from '@/features/research-projects/backend/route';

export const createHonoApp = () => {
  // ... 기존 코드

  registerExampleRoutes(app);
  registerKPIRoutes(app);
  registerResearchProjectRoutes(app); // 추가

  // ...
};
```

---

## 4. 컴포넌트 구조

### 4.1 페이지 컴포넌트 계층

```
src/app/dashboard/research/projects/
├── page.tsx                          # 메인 페이지
└── components/
    ├── research-projects-header.tsx  # 페이지 헤더
    ├── kpi-summary-cards.tsx         # KPI 요약 카드
    ├── filter-panel.tsx              # 필터 패널
    ├── funding-agency-chart.tsx      # 지원기관별 파이 차트
    ├── department-budget-chart.tsx   # 학과별 막대 그래프
    ├── status-chart.tsx              # 진행 상태 도넛 차트
    ├── execution-timeline-chart.tsx  # 집행 추이 라인 차트
    └── project-details-table.tsx     # 과제 상세 테이블
```

### 4.2 page.tsx (메인 페이지)

**파일 위치**: `src/app/dashboard/research/projects/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ResearchProjectsHeader } from './components/research-projects-header';
import { KPISummaryCards } from './components/kpi-summary-cards';
import { FilterPanel } from './components/filter-panel';
import { FundingAgencyChart } from './components/funding-agency-chart';
import { DepartmentBudgetChart } from './components/department-budget-chart';
import { StatusChart } from './components/status-chart';
import { ExecutionTimelineChart } from './components/execution-timeline-chart';
import { ProjectDetailsTable } from './components/project-details-table';
import { useResearchProjectsAggregate } from '@/features/research-projects/hooks/useResearchProjects';
import type { ProjectFilters } from '@/features/research-projects/types';

export default function ResearchProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({});

  const { data: aggregate, isLoading, error } = useResearchProjectsAggregate(filters);

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-destructive">데이터를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <ResearchProjectsHeader />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <KPISummaryCards aggregate={aggregate} isLoading={isLoading} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FundingAgencyChart
                data={aggregate?.by_funding_agency}
                isLoading={isLoading}
              />
              <StatusChart data={aggregate?.by_status} isLoading={isLoading} />
            </div>

            <DepartmentBudgetChart
              data={aggregate?.by_department}
              isLoading={isLoading}
            />

            <ExecutionTimelineChart
              data={aggregate?.execution_timeline}
              isLoading={isLoading}
            />

            <ProjectDetailsTable filters={filters} />
          </div>

          <div className="lg:col-span-1">
            <FilterPanel filters={filters} onFilterChange={setFilters} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 4.3 주요 컴포넌트 구현

#### 4.3.1 KPISummaryCards

**파일 위치**: `src/app/dashboard/research/projects/components/kpi-summary-cards.tsx`

```typescript
import { KPICard } from '@/components/dashboard/kpi-card';
import { FolderKanban, DollarSign, TrendingUp } from 'lucide-react';
import { formatNumber, formatBudget, formatPercentage } from '@/lib/utils/number';
import type { ProjectAggregate } from '@/features/research-projects/types';

type KPISummaryCardsProps = {
  aggregate?: ProjectAggregate;
  isLoading: boolean;
};

export function KPISummaryCards({ aggregate, isLoading }: KPISummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KPICard
        title="총 과제 수"
        value={formatNumber(aggregate?.total_projects || 0)}
        icon={FolderKanban}
        description="전체 연구과제 수"
      />
      <KPICard
        title="총 연구비"
        value={formatBudget(aggregate?.total_budget || 0)}
        icon={DollarSign}
        description="총 연구비 수주액"
      />
      <KPICard
        title="집행률"
        value={formatPercentage(aggregate?.execution_rate || 0)}
        icon={TrendingUp}
        description="예산 대비 집행 비율"
      />
    </div>
  );
}
```

#### 4.3.2 FundingAgencyChart

**파일 위치**: `src/app/dashboard/research/projects/components/funding-agency-chart.tsx`

```typescript
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatBudget } from '@/lib/utils/number';
import type { AgencyData } from '@/features/research-projects/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

type FundingAgencyChartProps = {
  data?: AgencyData[];
  isLoading: boolean;
};

export function FundingAgencyChart({ data, isLoading }: FundingAgencyChartProps) {
  const chartData = data?.map((item) => ({
    name: item.funding_agency,
    value: item.total_budget,
    count: item.project_count,
  })) || [];

  return (
    <ChartWrapper title="지원기관별 연구비 분포" isLoading={isLoading}>
      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          데이터가 없습니다
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatBudget(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
```

#### 4.3.3 DepartmentBudgetChart

**파일 위치**: `src/app/dashboard/research/projects/components/department-budget-chart.tsx`

```typescript
import { ChartWrapper } from '@/components/charts/chart-wrapper';
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
import { formatBudget } from '@/lib/utils/number';
import type { DepartmentData } from '@/features/research-projects/types';

type DepartmentBudgetChartProps = {
  data?: DepartmentData[];
  isLoading: boolean;
};

export function DepartmentBudgetChart({ data, isLoading }: DepartmentBudgetChartProps) {
  const chartData = data?.map((item) => ({
    name: item.department_name,
    budget: item.total_budget,
    count: item.project_count,
  })) || [];

  return (
    <ChartWrapper
      title="학과별 총 연구비"
      description="상위 10개 학과"
      isLoading={isLoading}
    >
      {chartData.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          데이터가 없습니다
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => formatBudget(value)} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip
              formatter={(value: number) => formatBudget(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend />
            <Bar dataKey="budget" fill="#8884d8" name="총 연구비" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
```

#### 4.3.4 ExecutionTimelineChart

**파일 위치**: `src/app/dashboard/research/projects/components/execution-timeline-chart.tsx`

```typescript
import { ChartWrapper } from '@/components/charts/chart-wrapper';
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
import { formatBudget } from '@/lib/utils/number';
import type { TimelineData } from '@/features/research-projects/types';

type ExecutionTimelineChartProps = {
  data?: TimelineData[];
  isLoading: boolean;
};

export function ExecutionTimelineChart({ data, isLoading }: ExecutionTimelineChartProps) {
  const chartData = data?.map((item) => ({
    month: item.month,
    total: item.total_amount,
    ...item.by_item,
  })) || [];

  // 집행항목 추출 (색상 매핑용)
  const items = Array.from(
    new Set(data?.flatMap((d) => Object.keys(d.by_item)) || [])
  );

  const ITEM_COLORS: Record<string, string> = {
    인건비: '#8884d8',
    장비비: '#82ca9d',
    재료비: '#ffc658',
    기타: '#ff8042',
  };

  return (
    <ChartWrapper
      title="연구비 집행 추이"
      description="최근 12개월"
      isLoading={isLoading}
    >
      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          데이터가 없습니다
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatBudget(value)} />
            <Tooltip
              formatter={(value: number) => formatBudget(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#000"
              strokeWidth={2}
              name="총 집행액"
            />
            {items.map((item) => (
              <Line
                key={item}
                type="monotone"
                dataKey={item}
                stroke={ITEM_COLORS[item] || '#999'}
                name={item}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
```

#### 4.3.5 ProjectDetailsTable

**파일 위치**: `src/app/dashboard/research/projects/components/project-details-table.tsx`

```typescript
'use client';

import { useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useResearchProjects } from '@/features/research-projects/hooks/useResearchProjects';
import { formatBudget, formatPercentage } from '@/lib/utils/number';
import { downloadCSV } from '@/lib/utils/download';
import type { ProjectWithDetails, ProjectFilters } from '@/features/research-projects/types';

type ProjectDetailsTableProps = {
  filters: ProjectFilters;
};

export function ProjectDetailsTable({ filters }: ProjectDetailsTableProps) {
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading } = useResearchProjects({
    ...filters,
    limit: pageSize,
    offset: page * pageSize,
  });

  const columns: ColumnDef<ProjectWithDetails>[] = [
    {
      id: 'project_number',
      header: '과제번호',
      accessorKey: 'project_number',
      sortable: true,
    },
    {
      id: 'project_name',
      header: '과제명',
      accessorKey: 'project_name',
      sortable: false,
    },
    {
      id: 'principal_investigator',
      header: '연구책임자',
      accessorKey: 'principal_investigator',
      sortable: true,
    },
    {
      id: 'department',
      header: '소속학과',
      cell: (row) => row.department?.department_name || '-',
      sortable: false,
    },
    {
      id: 'funding_agency',
      header: '지원기관',
      accessorKey: 'funding_agency',
      sortable: true,
    },
    {
      id: 'total_budget',
      header: '총연구비',
      cell: (row) => formatBudget(row.total_budget),
      sortable: true,
    },
    {
      id: 'total_executed',
      header: '집행금액',
      cell: (row) => formatBudget(row.total_executed),
      sortable: true,
    },
    {
      id: 'execution_rate',
      header: '집행률',
      cell: (row) => formatPercentage(row.execution_rate),
      sortable: true,
    },
  ];

  const handleDownload = () => {
    if (!data?.data) return;

    const csvData = data.data.map((project) => ({
      과제번호: project.project_number,
      과제명: project.project_name,
      연구책임자: project.principal_investigator,
      소속학과: project.department?.department_name || '',
      지원기관: project.funding_agency,
      총연구비: project.total_budget,
      집행금액: project.total_executed,
      집행률: project.execution_rate.toFixed(1),
    }));

    downloadCSV(csvData, `research_projects_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>과제 상세 내역</CardTitle>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={!data?.data}>
          <Download className="mr-2 h-4 w-4" />
          CSV 다운로드
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        ) : (
          <DataTable columns={columns} data={data?.data || []} />
        )}

        {data && data.total > pageSize && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 {data.total}건 중 {page * pageSize + 1}-
              {Math.min((page + 1) * pageSize, data.total)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * pageSize >= data.total}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 4.3.6 FilterPanel

**파일 위치**: `src/app/dashboard/research/projects/components/filter-panel.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getYearOptions } from '@/lib/utils/date';
import type { ProjectFilters } from '@/features/research-projects/types';

type FilterPanelProps = {
  filters: ProjectFilters;
  onFilterChange: (filters: ProjectFilters) => void;
};

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<ProjectFilters>(filters);

  const yearOptions = getYearOptions(2020);

  const statusOptions = [
    { label: '전체', value: '' },
    { label: '집행완료', value: '집행완료' },
    { label: '처리중', value: '처리중' },
  ];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">연도</label>
          <Select
            value={localFilters.year?.toString()}
            onValueChange={(value) =>
              setLocalFilters({ ...localFilters, year: value ? Number(value) : undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {yearOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">진행 상태</label>
          <Select
            value={localFilters.status || ''}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                status: value ? (value as '집행완료' | '처리중') : undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApply} className="flex-1">
            적용
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex-1">
            초기화
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 5. 상태 관리 설계

### 5.1 URL 상태 동기화

필터 상태를 URL 파라미터로 관리하여 공유 가능한 링크 제공:

```typescript
// useSearchParams를 사용한 URL 동기화 (선택 사항)
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export function useProjectFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters: ProjectFilters = {
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    funding_agency: searchParams.get('agency') || undefined,
    status: searchParams.get('status') as '집행완료' | '처리중' | undefined,
  };

  const setFilters = (newFilters: ProjectFilters) => {
    const params = new URLSearchParams();

    if (newFilters.year) params.set('year', String(newFilters.year));
    if (newFilters.funding_agency) params.set('agency', newFilters.funding_agency);
    if (newFilters.status) params.set('status', newFilters.status);

    router.push(`?${params.toString()}`);
  };

  return { filters, setFilters };
}
```

### 5.2 React Query 캐싱

```typescript
// queryClient 설정 (app/providers.tsx)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 6. 구현 단계

### Phase 1: 백엔드 API 구현 (1주)

**작업 항목**:
1. ✅ 타입 정의 (`types.ts`)
2. ✅ Hono 라우트 구현 (`route.ts`)
   - GET /api/research-projects
   - GET /api/research-projects/aggregate
3. ✅ React Query Hooks (`useResearchProjects.ts`)
4. ✅ Hono App 통합

**검증**:
- Postman/Thunder Client로 API 테스트
- 필터링 동작 확인
- 집계 계산 정확성 검증

### Phase 2: UI 컴포넌트 구현 (1주)

**작업 항목**:
1. ✅ page.tsx (메인 페이지)
2. ✅ KPISummaryCards
3. ✅ FilterPanel
4. ✅ 차트 컴포넌트
   - FundingAgencyChart
   - DepartmentBudgetChart
   - StatusChart
   - ExecutionTimelineChart
5. ✅ ProjectDetailsTable

**검증**:
- 각 컴포넌트 독립 테스트
- 로딩 상태 확인
- 빈 데이터 상태 확인

### Phase 3: 통합 및 테스트 (3일)

**작업 항목**:
1. ✅ 필터 기능 통합
2. ✅ 차트 상호작용 구현
3. ✅ CSV 다운로드 기능
4. ✅ 에러 핸들링
5. ✅ 성능 최적화

**검증**:
- 전체 사용자 플로우 테스트
- 엣지 케이스 테스트
- 성능 프로파일링

---

## 7. 테스트 계획

### 7.1 단위 테스트

```typescript
// __tests__/features/research-projects/aggregate.test.ts
describe('Research Projects Aggregate', () => {
  it('should calculate total budget correctly', () => {
    // ...
  });

  it('should group by funding agency', () => {
    // ...
  });

  it('should calculate execution rate', () => {
    // ...
  });
});
```

### 7.2 통합 테스트

```typescript
// __tests__/api/research-projects.test.ts
describe('GET /api/research-projects', () => {
  it('should return filtered projects', async () => {
    // ...
  });

  it('should handle pagination', async () => {
    // ...
  });
});
```

### 7.3 E2E 테스트 (선택 사항)

```typescript
// e2e/research-projects.spec.ts
test('should display research projects dashboard', async ({ page }) => {
  await page.goto('/dashboard/research/projects');

  await expect(page.getByText('총 과제 수')).toBeVisible();
  await expect(page.getByText('지원기관별 연구비 분포')).toBeVisible();
});
```

---

## 8. 예외 처리 및 에러 핸들링

### 8.1 API 에러 처리

```typescript
// route.ts
try {
  const { data, error } = await supabase.from('research_projects').select('*');

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
} catch (err) {
  return c.json({ error: 'Internal Server Error' }, 500);
}
```

### 8.2 클라이언트 에러 처리

```typescript
// page.tsx
if (error) {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">오류 발생</CardTitle>
          </CardHeader>
          <CardContent>
            <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
            <Button onClick={() => refetch()} className="mt-4">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

### 8.3 엣지 케이스

1. **데이터 없음**:
   - 빈 상태 UI 표시
   - 안내 메시지 제공

2. **집행 데이터 없는 과제**:
   - 집행률 0% 표시
   - 테이블에 "-" 표시

3. **집행금액 > 총연구비**:
   - 빨간색 경고 표시
   - 집행률 100% 이상 표시

4. **네트워크 오류**:
   - React Query 자동 재시도 (3회)
   - 에러 토스트 표시

---

## 9. 성능 최적화

### 9.1 데이터베이스 최적화

**인덱스 확인**:
```sql
-- database.md 참조
CREATE INDEX idx_project_dept ON research_projects(department_id);
CREATE INDEX idx_project_pi ON research_projects(principal_investigator);
CREATE INDEX idx_project_agency ON research_projects(funding_agency);
CREATE INDEX idx_budget_project_date ON budget_executions(project_id, execution_date DESC);
```

### 9.2 쿼리 최적화

1. **JOIN 최소화**: 필요한 필드만 SELECT
2. **집계는 DB에서**: 애플리케이션 집계 금지
3. **페이지네이션**: 대용량 데이터 처리

### 9.3 프론트엔드 최적화

1. **React Query 캐싱**: 5분 staleTime
2. **메모이제이션**: useMemo, React.memo 활용
3. **코드 스플리팅**: 차트 라이브러리 lazy load

```typescript
import dynamic from 'next/dynamic';

const FundingAgencyChart = dynamic(
  () => import('./components/funding-agency-chart').then((mod) => mod.FundingAgencyChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

---

## 10. 체크리스트

### 10.1 백엔드

- [ ] `src/features/research-projects/types.ts` 작성
- [ ] `src/features/research-projects/backend/route.ts` 구현
- [ ] `src/features/research-projects/hooks/useResearchProjects.ts` 작성
- [ ] `src/backend/hono/app.ts`에 라우트 등록
- [ ] API 엔드포인트 테스트 (Postman)
- [ ] 집계 로직 검증

### 10.2 프론트엔드

- [ ] `src/app/dashboard/research/projects/page.tsx` 작성
- [ ] `components/research-projects-header.tsx` 구현
- [ ] `components/kpi-summary-cards.tsx` 구현
- [ ] `components/filter-panel.tsx` 구현
- [ ] `components/funding-agency-chart.tsx` 구현
- [ ] `components/department-budget-chart.tsx` 구현
- [ ] `components/status-chart.tsx` 구현
- [ ] `components/execution-timeline-chart.tsx` 구현
- [ ] `components/project-details-table.tsx` 구현

### 10.3 통합 및 테스트

- [ ] 필터 기능 동작 확인
- [ ] 차트 렌더링 확인
- [ ] CSV 다운로드 테스트
- [ ] 로딩 상태 확인
- [ ] 에러 핸들링 확인
- [ ] 빈 데이터 상태 확인
- [ ] 반응형 디자인 확인 (모바일/태블릿)

### 10.4 성능 및 접근성

- [ ] Lighthouse 성능 점수 > 90
- [ ] React Query 캐싱 동작 확인
- [ ] 키보드 네비게이션 테스트
- [ ] 스크린 리더 테스트 (선택)
- [ ] 색상 대비 확인 (WCAG AA)

### 10.5 문서화

- [ ] 컴포넌트 JSDoc 주석 추가
- [ ] API 엔드포인트 문서화
- [ ] README 업데이트 (필요시)

---

## 부록

### A. 샘플 데이터

```typescript
// 개발용 샘플 데이터
export const SAMPLE_PROJECTS: ProjectWithDetails[] = [
  {
    id: '1',
    project_number: 'NRF-2023-001',
    project_name: 'AI 기반 자율주행 시스템 개발',
    principal_investigator: '김철수',
    department_id: 'dept-1',
    department: {
      college_name: '공과대학',
      department_name: '컴퓨터공학과',
    },
    funding_agency: '한국연구재단',
    total_budget: 500000000,
    created_at: '2023-01-01',
    executions: [
      {
        id: 'exec-1',
        execution_id: 'EXEC-001',
        project_id: '1',
        execution_date: '2023-06-15',
        execution_item: '인건비',
        execution_amount: 150000000,
        status: '집행완료',
        notes: null,
        created_at: '2023-06-15',
      },
    ],
    total_executed: 150000000,
    execution_rate: 30,
  },
  // ...
];
```

### B. 참고 링크

- [Recharts Documentation](https://recharts.org/)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [Hono Documentation](https://hono.dev/)

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design, Common Modules 문서를 기반으로 작성되었으며, 기존 코드베이스 구조 (`src/features/kpi`)를 참고하여 일관성 있는 개발이 가능하도록 설계되었습니다.
