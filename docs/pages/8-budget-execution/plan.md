# 예산 집행 현황 페이지 구현 계획

**페이지 경로:** `/dashboard/budget/execution`
**페이지 이름:** 예산 집행 현황
**접근 권한:** Authenticated (인증된 모든 사용자)
**버전:** 1.0
**작성일:** 2025-11-02

---

## 목차

1. [개요](#1-개요)
2. [기능 요구사항](#2-기능-요구사항)
3. [데이터 모델](#3-데이터-모델)
4. [API 설계](#4-api-설계)
5. [컴포넌트 구조](#5-컴포넌트-구조)
6. [상태 관리](#6-상태-관리)
7. [구현 단계](#7-구현-단계)
8. [파일 구조](#8-파일-구조)
9. [테스트 계획](#9-테스트-계획)
10. [성능 최적화](#10-성능-최적화)

---

## 1. 개요

### 1.1 페이지 목적

연구과제별 예산 집행 내역을 추적하고 분석하여, 월별 추이, 집행항목별 비율, 학과별 비교, 집행률 등을 시각화함으로써 효율적인 예산 관리를 지원합니다.

### 1.2 주요 기능

1. **KPI 카드 섹션**
   - 총 집행금액 표시
   - 평균 집행률 (진행바)
   - 처리중 금액
   - 전월 대비 증감률

2. **차트 시각화**
   - 월별 집행금액 추이 (라인 차트)
   - 집행항목별 비율 (파이 차트)
   - 학과별 집행금액 비교 (막대 그래프)

3. **필터링 기능**
   - 집행 연도
   - 학과
   - 집행항목
   - 상태 (집행완료, 처리중)

4. **집행 내역 테이블**
   - 과제별 집행 내역
   - 정렬 및 검색 기능
   - CSV 다운로드

5. **예산 초과 경고**
   - 집행률 100% 초과 시 빨간색 경고
   - 집행률 95-100% 시 노란색 주의

### 1.3 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Shadcn UI, Tailwind CSS
- **Charts**: Recharts
- **Data Fetching**: React Query (TanStack Query)
- **State Management**: URL Query Parameters, React Query Cache
- **Backend**: Hono (API Routes)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk

---

## 2. 기능 요구사항

### 2.1 인증 및 권한

| 요구사항 | 설명 |
|---------|------|
| 인증 필수 | Clerk를 통한 Google 로그인 필수 |
| 접근 권한 | 모든 인증된 사용자 (viewer, administrator) |
| 세션 관리 | JWT 토큰 기반, 만료 시 재로그인 유도 |

### 2.2 데이터 조회

| 요구사항 | 설명 |
|---------|------|
| 초기 로딩 | 최근 1년 데이터 자동 조회 |
| 필터링 | 연도, 학과, 집행항목, 상태별 필터링 |
| 집계 | 월별, 항목별, 학과별 집계 |
| 페이지네이션 | 집행 내역 테이블 (50행/페이지) |

### 2.3 시각화

| 차트 유형 | 데이터 |
|----------|--------|
| 라인 차트 | 월별 집행금액 추이 (집행항목별 구분) |
| 파이 차트 | 집행항목별 비율 (인건비, 장비비, 재료비 등) |
| 막대 그래프 | 학과별 집행금액 (내림차순) |

### 2.4 비즈니스 로직

#### 집행률 계산

```typescript
집행률 = (집행완료 금액 / 총 연구비) × 100

// 색상 표시
- 집행률 >= 100%: 빨간색 (경고)
- 집행률 >= 95%: 노란색 (주의)
- 집행률 >= 90%: 녹색 (정상)
- 집행률 < 90%: 회색 (미달)
```

#### 예산 초과 경고

```typescript
if (집행금액 > 총 연구비) {
  // 빨간색 경고 아이콘 표시
  // 툴팁: "예산 초과: {초과금액}원"
}
```

#### 데이터 집계 기준

- **월별 집계**: `execution_date` 기준 (DATE_TRUNC('month'))
- **집행 완료 건만 집계**: `status = '집행완료'`
- **처리중 건 별도 표시**: `status = '처리중'`

---

## 3. 데이터 모델

### 3.1 데이터베이스 스키마

#### budget_executions 테이블

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

#### research_projects 테이블

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

### 3.2 TypeScript 타입 정의

```typescript
// src/features/budget/types.ts

export type BudgetExecution = {
  id: string;
  execution_id: string;
  project_id: string;
  execution_date: string; // ISO date string
  execution_item: string;
  execution_amount: number;
  status: '집행완료' | '처리중';
  notes: string | null;
  created_at: string;
};

export type ResearchProject = {
  id: string;
  project_number: string;
  project_name: string;
  principal_investigator: string;
  department_id: string;
  funding_agency: string;
  total_budget: number;
  created_at: string;
};

export type Department = {
  id: string;
  college_name: string;
  department_name: string;
  created_at: string;
};

// 집계 데이터 타입
export type BudgetKPI = {
  totalAmount: number;
  executionRate: number;
  processingAmount: number;
  monthlyChange: number; // 전월 대비 증감률
};

export type MonthlyTrend = {
  month: string; // YYYY-MM
  amount: number;
  items: Record<string, number>; // { "인건비": 300000000, ... }
};

export type ItemBreakdown = Record<string, {
  amount: number;
  percentage: number;
}>;

export type DepartmentBreakdown = {
  department: string;
  amount: number;
  executionRate: number;
};

export type BudgetWarning = {
  projectNumber: string;
  projectName: string;
  totalBudget: number;
  executedAmount: number;
  overageAmount: number;
  executionRate: number;
};

// API 응답 타입
export type BudgetExecutionResponse = {
  kpi: BudgetKPI;
  monthlyTrend: MonthlyTrend[];
  itemBreakdown: ItemBreakdown;
  departmentBreakdown: DepartmentBreakdown[];
  budgetWarnings: BudgetWarning[];
  executions: (BudgetExecution & {
    project: ResearchProject;
    department: Department;
  })[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
};

// 필터 타입
export type BudgetFilters = {
  year?: number;
  department?: string;
  executionItem?: string;
  status?: '집행완료' | '처리중' | 'all';
};
```

---

## 4. API 설계

### 4.1 API Routes

#### GET /api/budget/execution

**목적:** 예산 집행 현황 데이터 조회

**Request:**

```typescript
// Query Parameters
type BudgetExecutionQuery = {
  year?: string; // 2024
  department?: string; // 컴퓨터공학과
  executionItem?: string; // 인건비
  status?: string; // 집행완료 | 처리중 | all
  page?: string; // 1
  pageSize?: string; // 50
};
```

**Response:**

```typescript
// 200 OK
{
  "kpi": {
    "totalAmount": 8200000000,
    "executionRate": 68.5,
    "processingAmount": 3800000000,
    "monthlyChange": 5.2
  },
  "monthlyTrend": [
    {
      "month": "2024-01",
      "amount": 500000000,
      "items": {
        "인건비": 300000000,
        "장비비": 150000000,
        "재료비": 50000000
      }
    }
  ],
  "itemBreakdown": {
    "인건비": { "amount": 3700000000, "percentage": 45 },
    "장비비": { "amount": 2460000000, "percentage": 30 },
    "재료비": { "amount": 1230000000, "percentage": 15 },
    "기타": { "amount": 820000000, "percentage": 10 }
  },
  "departmentBreakdown": [
    {
      "department": "컴퓨터공학과",
      "amount": 1500000000,
      "executionRate": 75.0
    }
  ],
  "budgetWarnings": [
    {
      "projectNumber": "RD-2024-001",
      "projectName": "AI 연구과제",
      "totalBudget": 500000000,
      "executedAmount": 520000000,
      "overageAmount": 20000000,
      "executionRate": 104.0
    }
  ],
  "executions": [...],
  "pagination": {
    "total": 1234,
    "page": 1,
    "pageSize": 50
  }
}

// 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "세션이 만료되었습니다. 다시 로그인해주세요."
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "데이터를 불러오는 중 오류가 발생했습니다."
}
```

### 4.2 Hono Route 구현

**파일 위치:** `src/features/budget/backend/route.ts`

```typescript
// src/features/budget/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import type { BudgetExecutionResponse } from '../types';

const budgetQuerySchema = z.object({
  year: z.coerce.number().optional(),
  department: z.string().optional(),
  executionItem: z.string().optional(),
  status: z.enum(['집행완료', '처리중', 'all']).optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(50),
});

export function registerBudgetRoutes(app: Hono<AppEnv>) {
  const budget = new Hono<AppEnv>();

  budget.get('/execution', zValidator('query', budgetQuerySchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    try {
      // 1. KPI 계산
      const kpiData = await calculateKPI(supabase, filters);

      // 2. 월별 추이
      const monthlyTrend = await getMonthlyTrend(supabase, filters);

      // 3. 집행항목별 비율
      const itemBreakdown = await getItemBreakdown(supabase, filters);

      // 4. 학과별 집행금액
      const departmentBreakdown = await getDepartmentBreakdown(supabase, filters);

      // 5. 예산 초과 경고
      const budgetWarnings = await getBudgetWarnings(supabase, filters);

      // 6. 집행 내역 (페이지네이션)
      const { executions, total } = await getExecutions(supabase, filters);

      const response: BudgetExecutionResponse = {
        kpi: kpiData,
        monthlyTrend,
        itemBreakdown,
        departmentBreakdown,
        budgetWarnings,
        executions,
        pagination: {
          total,
          page: filters.page,
          pageSize: filters.pageSize,
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('Budget execution error:', error);
      return c.json(
        { error: 'Internal Server Error', message: '데이터를 불러오는 중 오류가 발생했습니다.' },
        500
      );
    }
  });

  app.route('/budget', budget);
}

// 헬퍼 함수들
async function calculateKPI(supabase: any, filters: any) {
  // KPI 계산 로직
  // ...
}

async function getMonthlyTrend(supabase: any, filters: any) {
  // 월별 추이 조회 로직
  // ...
}

async function getItemBreakdown(supabase: any, filters: any) {
  // 집행항목별 비율 계산 로직
  // ...
}

async function getDepartmentBreakdown(supabase: any, filters: any) {
  // 학과별 집행금액 조회 로직
  // ...
}

async function getBudgetWarnings(supabase: any, filters: any) {
  // 예산 초과 경고 조회 로직
  // ...
}

async function getExecutions(supabase: any, filters: any) {
  // 집행 내역 조회 로직 (페이지네이션)
  // ...
}
```

### 4.3 데이터베이스 쿼리

#### KPI 계산 쿼리

```sql
-- 총 집행금액 및 집행률
SELECT
  SUM(CASE WHEN be.status = '집행완료' THEN be.execution_amount ELSE 0 END) AS total_amount,
  SUM(CASE WHEN be.status = '처리중' THEN be.execution_amount ELSE 0 END) AS processing_amount,
  SUM(rp.total_budget) AS total_budget
FROM budget_executions be
JOIN research_projects rp ON rp.id = be.project_id
JOIN departments d ON d.id = rp.department_id
WHERE EXTRACT(YEAR FROM be.execution_date) = 2024;

-- 집행률 = (total_amount / total_budget) * 100
```

#### 월별 추이 쿼리

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', be.execution_date), 'YYYY-MM') AS month,
  be.execution_item,
  SUM(be.execution_amount) AS total_amount
FROM budget_executions be
JOIN research_projects rp ON rp.id = be.project_id
JOIN departments d ON d.id = rp.department_id
WHERE
  EXTRACT(YEAR FROM be.execution_date) = 2024
  AND be.status = '집행완료'
GROUP BY month, be.execution_item
ORDER BY month DESC;
```

#### 예산 초과 과제 조회

```sql
SELECT
  rp.project_number,
  rp.project_name,
  rp.total_budget,
  SUM(be.execution_amount) AS executed_amount,
  ROUND((SUM(be.execution_amount)::NUMERIC / rp.total_budget * 100), 2) AS execution_rate
FROM research_projects rp
LEFT JOIN budget_executions be ON be.project_id = rp.id
WHERE be.status = '집행완료'
GROUP BY rp.id, rp.project_number, rp.project_name, rp.total_budget
HAVING SUM(be.execution_amount) > rp.total_budget
ORDER BY execution_rate DESC;
```

---

## 5. 컴포넌트 구조

### 5.1 페이지 컴포넌트

**파일 위치:** `src/app/(protected)/dashboard/budget/execution/page.tsx`

```typescript
// src/app/(protected)/dashboard/budget/execution/page.tsx
'use client';

import { BudgetExecutionDashboard } from '@/features/budget/components/budget-execution-dashboard';

export default function BudgetExecutionPage() {
  return <BudgetExecutionDashboard />;
}
```

### 5.2 메인 대시보드 컴포넌트

**파일 위치:** `src/features/budget/components/budget-execution-dashboard.tsx`

```typescript
// src/features/budget/components/budget-execution-dashboard.tsx
'use client';

import { useState } from 'react';
import { useBudgetExecution } from '../hooks/useBudgetExecution';
import { BudgetFilters } from './budget-filters';
import { BudgetKPICards } from './budget-kpi-cards';
import { MonthlyTrendChart } from './monthly-trend-chart';
import { ItemBreakdownChart } from './item-breakdown-chart';
import { DepartmentBreakdownChart } from './department-breakdown-chart';
import { BudgetWarningsAlert } from './budget-warnings-alert';
import { ExecutionTable } from './execution-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function BudgetExecutionDashboard() {
  const [filters, setFilters] = useState<BudgetFilters>({
    year: new Date().getFullYear(),
    status: 'all',
  });

  const { data, isLoading, isError, error } = useBudgetExecution(filters);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">예산 집행 현황</h1>
        <p className="text-muted-foreground">
          연구과제별 예산 집행 내역을 추적하고 분석합니다
        </p>
      </div>

      {/* 필터 섹션 */}
      <BudgetFilters filters={filters} onFiltersChange={setFilters} />

      {/* KPI 카드 */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data ? (
        <>
          <BudgetKPICards kpi={data.kpi} />

          {/* 예산 초과 경고 */}
          {data.budgetWarnings.length > 0 && (
            <BudgetWarningsAlert warnings={data.budgetWarnings} />
          )}

          {/* 차트 그리드 */}
          <div className="grid gap-6 md:grid-cols-2">
            <MonthlyTrendChart data={data.monthlyTrend} />
            <ItemBreakdownChart data={data.itemBreakdown} />
          </div>

          <DepartmentBreakdownChart data={data.departmentBreakdown} />

          {/* 집행 내역 테이블 */}
          <ExecutionTable
            executions={data.executions}
            pagination={data.pagination}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        </>
      ) : null}
    </div>
  );
}
```

### 5.3 하위 컴포넌트 목록

#### 5.3.1 BudgetFilters

**파일:** `src/features/budget/components/budget-filters.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type BudgetFiltersProps = {
  filters: BudgetFilters;
  onFiltersChange: (filters: BudgetFilters) => void;
};

export function BudgetFilters({ filters, onFiltersChange }: BudgetFiltersProps) {
  // 연도 옵션, 학과 옵션, 집행항목 옵션 로드
  // 필터 변경 핸들러
  // 초기화 버튼
}
```

#### 5.3.2 BudgetKPICards

**파일:** `src/features/budget/components/budget-kpi-cards.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBudget, formatPercentage } from '@/lib/utils/number';
import { TrendingUp, TrendingDown } from 'lucide-react';

type BudgetKPICardsProps = {
  kpi: BudgetKPI;
};

export function BudgetKPICards({ kpi }: BudgetKPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">총 집행금액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBudget(kpi.totalAmount)}</div>
          <p className="text-xs text-muted-foreground">집행완료 건</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">평균 집행률</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(kpi.executionRate)}</div>
          {/* 진행바 */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">처리중 금액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBudget(kpi.processingAmount)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">전월 대비</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-2xl font-bold">
            {kpi.monthlyChange > 0 ? (
              <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="mr-2 h-4 w-4 text-red-600" />
            )}
            {formatPercentage(Math.abs(kpi.monthlyChange))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 5.3.3 MonthlyTrendChart

**파일:** `src/features/budget/components/monthly-trend-chart.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type MonthlyTrendChartProps = {
  data: MonthlyTrend[];
};

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  // Recharts 데이터 변환
  // 라인 차트 렌더링 (집행항목별 라인)
}
```

#### 5.3.4 ItemBreakdownChart

**파일:** `src/features/budget/components/item-breakdown-chart.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ItemBreakdownChartProps = {
  data: ItemBreakdown;
};

export function ItemBreakdownChart({ data }: ItemBreakdownChartProps) {
  // Recharts 데이터 변환
  // 파이 차트 렌더링
}
```

#### 5.3.5 DepartmentBreakdownChart

**파일:** `src/features/budget/components/department-breakdown-chart.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type DepartmentBreakdownChartProps = {
  data: DepartmentBreakdown[];
};

export function DepartmentBreakdownChart({ data }: DepartmentBreakdownChartProps) {
  // Recharts 데이터 변환
  // 막대 그래프 렌더링
}
```

#### 5.3.6 BudgetWarningsAlert

**파일:** `src/features/budget/components/budget-warnings-alert.tsx`

```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type BudgetWarningsAlertProps = {
  warnings: BudgetWarning[];
};

export function BudgetWarningsAlert({ warnings }: BudgetWarningsAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>예산 초과 경고</AlertTitle>
      <AlertDescription>
        {warnings.length}개 과제에서 예산 초과가 발생했습니다.
        {/* 경고 목록 표시 */}
      </AlertDescription>
    </Alert>
  );
}
```

#### 5.3.7 ExecutionTable

**파일:** `src/features/budget/components/execution-table.tsx`

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type ExecutionTableProps = {
  executions: any[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
  onPageChange: (page: number) => void;
};

export function ExecutionTable({ executions, pagination, onPageChange }: ExecutionTableProps) {
  // 테이블 렌더링
  // 페이지네이션 컨트롤
  // CSV 다운로드 버튼
}
```

---

## 6. 상태 관리

### 6.1 상태 관리 전략

이 페이지는 **URL Query Parameters**와 **React Query Cache**를 사용하여 상태를 관리합니다.

#### URL Query Parameters

- **목적**: 필터 상태를 URL에 저장하여 공유 가능하게 함
- **구현**: `useSearchParams`, `useRouter`

```typescript
// 예시: /dashboard/budget/execution?year=2024&department=컴퓨터공학과&status=집행완료
const searchParams = useSearchParams();
const router = useRouter();

// 필터 변경 시 URL 업데이트
const handleFilterChange = (newFilters: BudgetFilters) => {
  const params = new URLSearchParams();
  Object.entries(newFilters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  router.push(`?${params.toString()}`);
};
```

#### React Query Cache

- **목적**: API 응답 데이터 캐싱 및 자동 재요청
- **구현**: `useQuery`

```typescript
// src/features/budget/hooks/useBudgetExecution.ts
import { useQuery } from '@tanstack/react-query';

export function useBudgetExecution(filters: BudgetFilters) {
  return useQuery<BudgetExecutionResponse>({
    queryKey: ['budget-execution', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      const response = await fetch(`/api/budget/execution?${params}`);
      if (!response.ok) throw new Error('Failed to fetch budget execution data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
```

### 6.2 상태 흐름도

```
사용자 액션 (필터 변경)
    ↓
URL Query Parameters 업데이트
    ↓
React Query queryKey 변경
    ↓
자동 재fetch (캐시 확인)
    ↓
API 요청 (캐시 미스 시)
    ↓
데이터 캐싱
    ↓
컴포넌트 재렌더링
```

---

## 7. 구현 단계

### Phase 1: 기본 인프라 (1-2일)

#### Step 1.1: 타입 정의
- [ ] `src/features/budget/types.ts` 생성
- [ ] BudgetExecution, ResearchProject, Department 타입 정의
- [ ] BudgetKPI, MonthlyTrend, ItemBreakdown 등 집계 타입 정의
- [ ] API 응답 타입 정의

#### Step 1.2: API Routes
- [ ] `src/features/budget/backend/route.ts` 생성
- [ ] Hono 라우터 등록 (`registerBudgetRoutes`)
- [ ] Query 스키마 검증 (Zod)
- [ ] Supabase Service Client 통합

#### Step 1.3: Database Queries
- [ ] KPI 계산 쿼리 구현
- [ ] 월별 추이 쿼리 구현
- [ ] 집행항목별 비율 쿼리 구현
- [ ] 학과별 집행금액 쿼리 구현
- [ ] 예산 초과 경고 쿼리 구현
- [ ] 집행 내역 조회 (페이지네이션) 쿼리 구현

### Phase 2: Frontend 컴포넌트 (2-3일)

#### Step 2.1: React Query Hook
- [ ] `src/features/budget/hooks/useBudgetExecution.ts` 생성
- [ ] useQuery 설정 (queryKey, queryFn, staleTime)

#### Step 2.2: 페이지 컴포넌트
- [ ] `src/app/(protected)/dashboard/budget/execution/page.tsx` 생성
- [ ] 레이아웃 적용 (DashboardLayout)

#### Step 2.3: 메인 대시보드
- [ ] `src/features/budget/components/budget-execution-dashboard.tsx` 생성
- [ ] 필터 상태 관리
- [ ] 로딩/에러 상태 처리

#### Step 2.4: 필터 컴포넌트
- [ ] `BudgetFilters` 컴포넌트 구현
- [ ] 연도, 학과, 집행항목, 상태 선택 UI
- [ ] 필터 초기화 버튼

#### Step 2.5: KPI 카드
- [ ] `BudgetKPICards` 컴포넌트 구현
- [ ] 총 집행금액, 집행률, 처리중 금액, 전월 대비 증감률 표시

### Phase 3: 차트 시각화 (2-3일)

#### Step 3.1: 월별 추이 차트
- [ ] `MonthlyTrendChart` 컴포넌트 구현
- [ ] Recharts LineChart 통합
- [ ] 집행항목별 다중 라인
- [ ] 툴팁 및 범례

#### Step 3.2: 집행항목별 비율 차트
- [ ] `ItemBreakdownChart` 컴포넌트 구현
- [ ] Recharts PieChart 통합
- [ ] 퍼센트 및 금액 표시
- [ ] 클릭 이벤트 (필터 적용)

#### Step 3.3: 학과별 집행금액 차트
- [ ] `DepartmentBreakdownChart` 컴포넌트 구현
- [ ] Recharts BarChart 통합
- [ ] 내림차순 정렬
- [ ] 클릭 이벤트 (필터 적용)

### Phase 4: 테이블 및 경고 (1-2일)

#### Step 4.1: 예산 초과 경고
- [ ] `BudgetWarningsAlert` 컴포넌트 구현
- [ ] 경고 목록 표시
- [ ] 빨간색 하이라이트

#### Step 4.2: 집행 내역 테이블
- [ ] `ExecutionTable` 컴포넌트 구현
- [ ] 테이블 렌더링 (Shadcn Table)
- [ ] 페이지네이션 컨트롤
- [ ] 정렬 기능
- [ ] 검색 기능

#### Step 4.3: CSV 다운로드
- [ ] CSV 다운로드 기능 구현
- [ ] 현재 필터 조건 반영
- [ ] Blob 생성 및 다운로드

### Phase 5: 테스트 및 최적화 (1-2일)

#### Step 5.1: 단위 테스트
- [ ] API Route 테스트 (Hono)
- [ ] React Query Hook 테스트

#### Step 5.2: 통합 테스트
- [ ] 필터링 테스트
- [ ] 차트 상호작용 테스트
- [ ] CSV 다운로드 테스트

#### Step 5.3: 성능 최적화
- [ ] React Query 캐싱 확인
- [ ] 차트 렌더링 최적화 (메모이제이션)
- [ ] 디바운싱 적용 (필터 변경)

---

## 8. 파일 구조

```
/Users/leo/awesomedev/vmc1/vibe-dashboard-2/
├── docs/
│   └── pages/
│       └── 8-budget-execution/
│           ├── plan.md (본 문서)
│           └── state.md (추후 작성)
│
├── src/
│   ├── app/
│   │   └── (protected)/
│   │       └── dashboard/
│   │           └── budget/
│   │               └── execution/
│   │                   └── page.tsx
│   │
│   ├── features/
│   │   └── budget/
│   │       ├── backend/
│   │       │   └── route.ts (Hono Routes)
│   │       ├── components/
│   │       │   ├── budget-execution-dashboard.tsx
│   │       │   ├── budget-filters.tsx
│   │       │   ├── budget-kpi-cards.tsx
│   │       │   ├── monthly-trend-chart.tsx
│   │       │   ├── item-breakdown-chart.tsx
│   │       │   ├── department-breakdown-chart.tsx
│   │       │   ├── budget-warnings-alert.tsx
│   │       │   └── execution-table.tsx
│   │       ├── hooks/
│   │       │   └── useBudgetExecution.ts
│   │       └── types.ts
│   │
│   ├── lib/
│   │   └── utils/
│   │       └── number.ts (formatBudget, formatPercentage)
│   │
│   └── components/
│       └── ui/ (Shadcn UI)
│
└── supabase/
    └── migrations/ (DB 스키마)
```

---

## 9. 테스트 계획

### 9.1 단위 테스트

#### API Route 테스트

```typescript
// src/features/budget/backend/route.test.ts
describe('Budget API Routes', () => {
  it('GET /api/budget/execution - 기본 필터', async () => {
    const response = await app.request('/budget/execution');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('kpi');
    expect(data).toHaveProperty('monthlyTrend');
  });

  it('GET /api/budget/execution - 연도 필터', async () => {
    const response = await app.request('/budget/execution?year=2024');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.monthlyTrend.every((m: any) => m.month.startsWith('2024'))).toBe(true);
  });

  it('GET /api/budget/execution - 잘못된 파라미터', async () => {
    const response = await app.request('/budget/execution?year=abc');
    expect(response.status).toBe(400);
  });
});
```

#### React Query Hook 테스트

```typescript
// src/features/budget/hooks/useBudgetExecution.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBudgetExecution } from './useBudgetExecution';

describe('useBudgetExecution', () => {
  it('데이터 로딩 성공', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useBudgetExecution({ year: 2024 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveProperty('kpi');
  });
});
```

### 9.2 통합 테스트

#### E2E 테스트 (Playwright)

```typescript
// e2e/budget-execution.spec.ts
import { test, expect } from '@playwright/test';

test.describe('예산 집행 현황 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.click('button[type=submit]');
  });

  test('KPI 카드 표시', async ({ page }) => {
    await page.goto('/dashboard/budget/execution');
    await expect(page.locator('text=총 집행금액')).toBeVisible();
    await expect(page.locator('text=평균 집행률')).toBeVisible();
  });

  test('필터 적용', async ({ page }) => {
    await page.goto('/dashboard/budget/execution');
    await page.selectOption('[name=year]', '2023');
    await expect(page.url()).toContain('year=2023');
  });

  test('CSV 다운로드', async ({ page }) => {
    await page.goto('/dashboard/budget/execution');
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("CSV 다운로드")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/budget_execution_.*\.csv/);
  });
});
```

---

## 10. 성능 최적화

### 10.1 React Query 최적화

```typescript
// src/features/budget/hooks/useBudgetExecution.ts
export function useBudgetExecution(filters: BudgetFilters) {
  return useQuery<BudgetExecutionResponse>({
    queryKey: ['budget-execution', filters],
    queryFn: fetchBudgetExecution,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false, // 창 포커스 시 재요청 비활성화
    retry: 3, // 실패 시 3회 재시도
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });
}
```

### 10.2 차트 렌더링 최적화

```typescript
// src/features/budget/components/monthly-trend-chart.tsx
import { useMemo } from 'react';

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const chartData = useMemo(() => {
    // 차트 데이터 변환 (메모이제이션)
    return transformDataForChart(data);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        {/* ... */}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 10.3 필터 디바운싱

```typescript
// src/features/budget/components/budget-filters.tsx
import { useDebouncedCallback } from 'use-debounce';

export function BudgetFilters({ filters, onFiltersChange }: BudgetFiltersProps) {
  const debouncedFilterChange = useDebouncedCallback(
    (newFilters: BudgetFilters) => {
      onFiltersChange(newFilters);
    },
    300 // 300ms 디바운스
  );

  return (
    <div>
      <Select
        value={filters.department}
        onValueChange={(value) => debouncedFilterChange({ ...filters, department: value })}
      >
        {/* ... */}
      </Select>
    </div>
  );
}
```

### 10.4 데이터베이스 쿼리 최적화

- **인덱스 활용**: execution_date, project_id, status 컬럼 인덱스
- **JOIN 최적화**: 필요한 컬럼만 SELECT
- **집계 최적화**: GROUP BY에 인덱스 컬럼 사용

```sql
-- 인덱스 생성 (이미 database.md에 정의됨)
CREATE INDEX idx_budget_project_date ON budget_executions(project_id, execution_date DESC);
CREATE INDEX idx_budget_status ON budget_executions(status);
```

---

## 11. 예외 처리

### 11.1 에러 핸들링 전략

#### API 에러

```typescript
// src/features/budget/hooks/useBudgetExecution.ts
export function useBudgetExecution(filters: BudgetFilters) {
  return useQuery<BudgetExecutionResponse>({
    queryKey: ['budget-execution', filters],
    queryFn: async () => {
      const response = await fetch(`/api/budget/execution?${params}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
        }
        throw new Error('데이터를 불러오는 중 오류가 발생했습니다.');
      }

      return response.json();
    },
    onError: (error) => {
      console.error('Budget execution error:', error);
      // Sentry 에러 로깅
    },
  });
}
```

#### 컴포넌트 에러

```typescript
// src/features/budget/components/budget-execution-dashboard.tsx
import { ErrorBoundary } from '@/components/error/error-boundary';

export function BudgetExecutionDashboard() {
  return (
    <ErrorBoundary fallback={(error, reset) => (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error.message}</AlertDescription>
        <Button onClick={reset}>다시 시도</Button>
      </Alert>
    )}>
      {/* 대시보드 컨텐츠 */}
    </ErrorBoundary>
  );
}
```

### 11.2 빈 상태 처리

```typescript
// src/features/budget/components/budget-execution-dashboard.tsx
if (data && data.executions.length === 0) {
  return (
    <EmptyState
      title="집행 내역이 없습니다"
      description="선택한 조건에 해당하는 집행 내역이 없습니다. 필터를 초기화해주세요."
      action={{
        label: "필터 초기화",
        onClick: () => setFilters({ year: new Date().getFullYear(), status: 'all' }),
      }}
    />
  );
}
```

---

## 12. 접근성 (Accessibility)

### 12.1 키보드 네비게이션

- 모든 필터 컨트롤은 Tab 키로 접근 가능
- Enter/Space로 선택 가능
- Esc로 모달/드롭다운 닫기

### 12.2 스크린 리더

```typescript
<Card aria-label="총 집행금액 KPI 카드">
  <CardHeader>
    <CardTitle>총 집행금액</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold" aria-live="polite">
      {formatBudget(kpi.totalAmount)}
    </div>
  </CardContent>
</Card>
```

### 12.3 색상 대비

- WCAG 2.1 AA 준수 (4.5:1 명암비)
- 색상만으로 정보 전달 금지 (아이콘 병행)
- 예산 초과: 빨간색 + 경고 아이콘
- 정상 집행: 녹색 + 체크 아이콘

---

## 13. 마일스톤

| 마일스톤 | 예상 기간 | 주요 작업 | 완료 조건 |
|---------|----------|----------|----------|
| M1: 기본 인프라 | 1-2일 | 타입 정의, API Routes, DB 쿼리 | API 엔드포인트 정상 응답 |
| M2: Frontend 컴포넌트 | 2-3일 | 페이지 컴포넌트, 필터, KPI 카드 | 기본 UI 렌더링 |
| M3: 차트 시각화 | 2-3일 | 월별 추이, 항목별 비율, 학과별 비교 | 모든 차트 정상 표시 |
| M4: 테이블 및 경고 | 1-2일 | 집행 내역 테이블, 예산 초과 경고, CSV 다운로드 | 테이블 및 다운로드 기능 완료 |
| M5: 테스트 및 최적화 | 1-2일 | 단위/통합 테스트, 성능 최적화 | 모든 테스트 통과 |

**총 예상 기간: 7-12일**

---

## 14. 의존성

### 14.1 공통 모듈 의존성

이 페이지는 다음 공통 모듈에 의존합니다:

- **인증**: Clerk 통합 (Common Modules 문서 참조)
- **Layout**: DashboardLayout (Common Modules 문서 참조)
- **UI 컴포넌트**: Shadcn UI (Card, Table, Select 등)
- **Chart 컴포넌트**: Recharts 래퍼 (Common Modules 문서 참조)
- **유틸리티**: formatBudget, formatPercentage (Common Modules 문서 참조)

### 14.2 외부 라이브러리

```json
// package.json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "use-debounce": "^10.0.0"
  }
}
```

---

## 15. 향후 개선사항

### Phase 2 (추후)

1. **실시간 업데이트**
   - Supabase Realtime Subscriptions 통합
   - 집행 내역 실시간 반영

2. **고급 필터링**
   - 날짜 범위 선택 (DateRangePicker)
   - 다중 학과 선택
   - 집행금액 범위 필터

3. **리포트 생성**
   - PDF 리포트 다운로드
   - 이메일 전송 기능

4. **알림 기능**
   - 예산 초과 시 이메일 알림
   - 집행률 95% 도달 시 알림

5. **데이터 비교**
   - 연도별 비교 차트
   - 학과별 벤치마킹

---

## 16. 참고 자료

- **PRD v1.0**: Section 6.5 (예산 집행 현황)
- **Userflow v1.0**: Section 6.2 (예산 집행 현황 상세 플로우)
- **Database Design v2.0**: budget_executions, research_projects 테이블
- **Common Modules Plan**: 인증, 레이아웃, UI 컴포넌트
- **유스케이스 UC-005**: 예산 집행 현황 관리

---

**문서 작성자:** AI Assistant
**문서 버전:** 1.0
**작성일:** 2025-11-02
**최종 수정일:** 2025-11-02
