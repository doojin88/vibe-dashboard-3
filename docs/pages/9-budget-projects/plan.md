# 과제별 예산 상세 구현 계획
# /dashboard/budget/projects

**버전:** 1.0
**작성일:** 2025-11-02
**페이지 경로:** `/dashboard/budget/projects`
**페이지 이름:** 과제별 예산 상세
**접근 권한:** Authenticated (모든 인증 사용자)

---

## 목차

1. [페이지 개요](#1-페이지-개요)
2. [데이터 모델 및 API](#2-데이터-모델-및-api)
3. [UI/UX 설계](#3-uiux-설계)
4. [컴포넌트 구조](#4-컴포넌트-구조)
5. [상태 관리](#5-상태-관리)
6. [API 통신](#6-api-통신)
7. [구현 단계](#7-구현-단계)
8. [테스트 계획](#8-테스트-계획)
9. [성능 최적화](#9-성능-최적화)

---

## 1. 페이지 개요

### 1.1 목적

연구과제별 예산 집행 내역을 상세하게 조회하고 분석하는 페이지입니다. 관리자와 연구자가 각 과제의 예산 집행률, 집행 내역, 항목별 상세를 파악할 수 있습니다.

### 1.2 주요 기능

**필수 기능 (MVP):**
1. **과제 목록 조회**: 연구과제 목록을 테이블 형식으로 표시
2. **예산 집행률 시각화**: 과제별 예산 집행률을 진행바로 표시
3. **집행 내역 테이블**: 과제별 집행 내역을 상세 테이블로 표시
4. **필터링**: 연도, 학과, 지원기관, 연구책임자, 상태별 필터
5. **정렬**: 과제번호, 과제명, 총연구비, 집행금액, 집행률 등으로 정렬
6. **검색**: 과제명, 연구책임자 검색
7. **CSV 다운로드**: 필터링된 데이터 CSV 다운로드

**향후 확장 기능:**
- 과제별 예산 집행 추이 그래프 (타임라인)
- 집행항목별 비율 파이 차트
- 과제 상세 모달 (클릭 시 전체 정보 표시)

### 1.3 데이터 소스

**Primary Tables:**
- `research_projects`: 연구과제 기본 정보
- `budget_executions`: 예산 집행 내역

**Related Tables:**
- `departments`: 소속 학과 정보

**CSV 파일:**
- `research_project_data.csv`

### 1.4 사용자 시나리오

#### 시나리오 1: 관리자의 과제별 예산 현황 확인
1. 로그인 후 사이드바에서 "예산 관리 → 과제별 예산 상세" 클릭
2. 전체 연구과제 목록 및 집행률 확인
3. 특정 연도 필터 적용 (예: 2024년)
4. 집행률 낮은 과제 식별 (진행바 색상으로 구분)
5. 해당 과제 행 클릭하여 집행 내역 상세 확인
6. 집행 내역 CSV 다운로드하여 분석

#### 시나리오 2: 연구자의 본인 과제 예산 조회
1. 로그인 후 페이지 접근
2. 연구책임자 필터에 본인 이름 입력
3. 본인 과제의 예산 집행률 확인
4. 집행항목별 내역 확인
5. 처리중인 집행 건 확인

---

## 2. 데이터 모델 및 API

### 2.1 데이터베이스 스키마

#### research_projects (연구과제)

```typescript
type ResearchProject = {
  id: string; // UUID
  project_number: string; // 과제번호 (UNIQUE)
  project_name: string; // 과제명
  principal_investigator: string; // 연구책임자
  department_id: string; // 소속학과 FK
  funding_agency: string; // 지원기관
  total_budget: number; // 총연구비 (원)
  created_at: string; // 생성일
};
```

#### budget_executions (예산 집행)

```typescript
type BudgetExecution = {
  id: string; // UUID
  execution_id: string; // 집행ID (UNIQUE)
  project_id: string; // 연구과제 FK
  execution_date: string; // 집행일자 (Date)
  execution_item: string; // 집행항목 (인건비, 장비비 등)
  execution_amount: number; // 집행금액 (원)
  status: '집행완료' | '처리중'; // 상태
  notes?: string; // 비고
  created_at: string; // 생성일
};
```

### 2.2 API 엔드포인트

#### GET /api/budget/projects

**목적**: 연구과제 목록 및 집행 정보 조회

**Query Parameters:**
```typescript
type ProjectsQueryParams = {
  year?: number; // 집행 연도 필터 (execution_date 기준)
  department_id?: string; // 학과 필터
  funding_agency?: string; // 지원기관 필터
  principal_investigator?: string; // 연구책임자 검색
  status?: '집행완료' | '처리중'; // 집행 상태 필터
  search?: string; // 과제명 검색
  sort_by?: 'project_number' | 'total_budget' | 'executed_amount' | 'execution_rate';
  sort_order?: 'asc' | 'desc';
  page?: number; // 페이지 번호
  limit?: number; // 페이지당 항목 수
};
```

**Response:**
```typescript
type ProjectWithBudgetInfo = {
  id: string;
  project_number: string;
  project_name: string;
  principal_investigator: string;
  department: {
    id: string;
    college_name: string;
    department_name: string;
  };
  funding_agency: string;
  total_budget: number;
  executed_amount: number; // 총 집행금액 (집계)
  execution_rate: number; // 집행률 (%)
  execution_count: number; // 집행 건수
  status: '집행완료' | '처리중' | '미집행'; // 전체 상태
  created_at: string;
};

type ProjectsResponse = {
  projects: ProjectWithBudgetInfo[];
  total_count: number;
  page: number;
  limit: number;
};
```

#### GET /api/budget/projects/:projectId/executions

**목적**: 특정 과제의 집행 내역 상세 조회

**Query Parameters:**
```typescript
type ExecutionsQueryParams = {
  year?: number;
  status?: '집행완료' | '처리중';
  sort_by?: 'execution_date' | 'execution_amount';
  sort_order?: 'asc' | 'desc';
};
```

**Response:**
```typescript
type ExecutionDetail = {
  id: string;
  execution_id: string;
  execution_date: string;
  execution_item: string;
  execution_amount: number;
  status: '집행완료' | '처리중';
  notes?: string;
  created_at: string;
};

type ExecutionsResponse = {
  project: ResearchProject & {
    department: {
      college_name: string;
      department_name: string;
    };
  };
  executions: ExecutionDetail[];
  summary: {
    total_executed: number;
    by_item: {
      item: string;
      amount: number;
      count: number;
    }[];
    by_status: {
      status: string;
      count: number;
      amount: number;
    }[];
  };
};
```

#### GET /api/budget/projects/filters

**목적**: 필터 옵션 데이터 조회

**Response:**
```typescript
type FiltersResponse = {
  years: number[]; // 사용 가능한 연도 목록
  departments: {
    id: string;
    college_name: string;
    department_name: string;
  }[];
  funding_agencies: string[]; // 지원기관 목록
  principal_investigators: string[]; // 연구책임자 목록
};
```

### 2.3 데이터 집계 로직

#### 예산 집행률 계산

```sql
-- 과제별 집행 금액 집계
SELECT
  rp.id,
  rp.project_number,
  rp.project_name,
  rp.principal_investigator,
  rp.total_budget,
  COALESCE(SUM(be.execution_amount), 0) AS executed_amount,
  CASE
    WHEN rp.total_budget > 0 THEN
      ROUND(COALESCE(SUM(be.execution_amount), 0)::NUMERIC / rp.total_budget * 100, 2)
    ELSE 0
  END AS execution_rate,
  COUNT(be.id) AS execution_count
FROM research_projects rp
LEFT JOIN budget_executions be ON be.project_id = rp.id
GROUP BY rp.id
ORDER BY rp.created_at DESC;
```

#### 집행항목별 집계

```sql
-- 특정 과제의 집행항목별 금액
SELECT
  execution_item,
  COUNT(*) AS count,
  SUM(execution_amount) AS total_amount
FROM budget_executions
WHERE project_id = $1
GROUP BY execution_item
ORDER BY total_amount DESC;
```

---

## 3. UI/UX 설계

### 3.1 레이아웃 구조

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                  │
├─────────┬───────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                            │
│         │                                               │
│         │ ┌─────────────────────────────────────────┐  │
│         │ │ 페이지 제목: 과제별 예산 상세            │  │
│         │ └─────────────────────────────────────────┘  │
│         │                                               │
│         │ ┌─────────────────────────────────────────┐  │
│         │ │ 필터 패널                                │  │
│         │ │ - 연도, 학과, 지원기관, 상태 선택       │  │
│         │ │ - 검색 (과제명, 연구책임자)             │  │
│         │ └─────────────────────────────────────────┘  │
│         │                                               │
│         │ ┌─────────────────────────────────────────┐  │
│         │ │ KPI 카드 (3개)                           │  │
│         │ │ - 총 과제 수                             │  │
│         │ │ - 총 연구비                              │  │
│         │ │ - 평균 집행률                            │  │
│         │ └─────────────────────────────────────────┘  │
│         │                                               │
│         │ ┌─────────────────────────────────────────┐  │
│         │ │ 과제 목록 테이블                         │  │
│         │ │ - 과제번호, 과제명, 연구책임자          │  │
│         │ │ - 소속학과, 지원기관                    │  │
│         │ │ - 총연구비, 집행금액, 집행률            │  │
│         │ │ - 집행률 진행바 (색상 코딩)             │  │
│         │ │ - 페이지네이션                          │  │
│         │ └─────────────────────────────────────────┘  │
│         │                                               │
│         │ ┌─────────────────────────────────────────┐  │
│         │ │ 확장 행 (과제 클릭 시)                   │  │
│         │ │ - 집행 내역 상세 테이블                 │  │
│         │ │ - 집행항목별 요약                       │  │
│         │ └─────────────────────────────────────────┘  │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

### 3.2 주요 UI 컴포넌트

#### 3.2.1 필터 패널

**위치**: 페이지 상단
**컴포넌트**: `FilterPanel`

**필터 항목:**
- 연도 선택 (Dropdown, 다중 선택 가능)
- 학과 선택 (Dropdown with 단과대학 그룹핑)
- 지원기관 선택 (Dropdown)
- 연구책임자 검색 (Input with Autocomplete)
- 집행 상태 선택 (Radio: 전체/집행완료/처리중)
- 과제명 검색 (Input)
- 초기화 버튼

#### 3.2.2 KPI 카드

**위치**: 필터 패널 아래
**컴포넌트**: `KPICard` (3개)

**KPI 항목:**
1. **총 과제 수**: 필터된 전체 과제 수
2. **총 연구비**: 필터된 과제의 총 연구비 합계
3. **평균 집행률**: 필터된 과제의 평균 집행률 (%)

#### 3.2.3 과제 목록 테이블

**위치**: KPI 카드 아래
**컴포넌트**: `ProjectsTable`

**컬럼:**
| 컬럼 | 타입 | 정렬 | 설명 |
|------|------|------|------|
| 과제번호 | String | ✓ | 고유 과제번호 |
| 과제명 | String | ✓ | 연구과제명 (최대 50자 표시) |
| 연구책임자 | String | ✓ | PI 이름 |
| 소속학과 | String | - | 단과대학 / 학과명 |
| 지원기관 | String | ✓ | 연구비 지원기관 |
| 총연구비 | Number | ✓ | 억원 단위 표시 |
| 집행금액 | Number | ✓ | 총 집행금액 (억원) |
| 집행률 | Number | ✓ | % 표시 + 진행바 |
| 상태 | Badge | - | 집행완료/처리중/미집행 |

**인터랙션:**
- **행 클릭**: 집행 내역 상세 확장 (Expandable Row)
- **정렬**: 컬럼 헤더 클릭 (ASC/DESC 토글)
- **페이지네이션**: 50행/페이지 (변경 가능)

#### 3.2.4 집행률 진행바

**컴포넌트**: `ExecutionRateBar`

**색상 코딩:**
- 0-30%: Red (낮은 집행률)
- 31-70%: Yellow (보통 집행률)
- 71-100%: Green (높은 집행률)

**표시 형식:**
```
[████████░░] 75.3%
```

#### 3.2.5 집행 내역 상세 테이블 (확장 행)

**위치**: 과제 행 클릭 시 하단 확장
**컴포넌트**: `ExecutionDetailsTable`

**섹션 1: 과제 요약**
- 과제번호, 과제명
- 연구책임자, 소속학과
- 지원기관, 총연구비
- 총 집행금액, 집행률

**섹션 2: 집행항목별 요약**
- 집행항목별 금액 및 비율 (파이 차트)

**섹션 3: 집행 내역 테이블**
| 컬럼 | 타입 | 정렬 | 설명 |
|------|------|------|------|
| 집행ID | String | - | 고유 집행 ID |
| 집행일자 | Date | ✓ | YYYY-MM-DD |
| 집행항목 | String | - | 인건비, 장비비 등 |
| 집행금액 | Number | ✓ | 원 단위 표시 |
| 상태 | Badge | - | 집행완료/처리중 |
| 비고 | String | - | 메모 (있는 경우) |

**액션 버튼:**
- CSV 다운로드: 해당 과제의 집행 내역 CSV

### 3.3 Empty State

**조건**: 필터 결과 데이터 없음

**표시 내용:**
- 아이콘: FileQuestion
- 제목: "검색 결과가 없습니다"
- 설명: "필터 조건을 변경하거나 초기화해주세요."
- 액션: "필터 초기화" 버튼

### 3.4 로딩 상태

**테이블 로딩**: Skeleton Loader (5행 표시)
**KPI 로딩**: Skeleton Card (3개)

### 3.5 에러 상태

**API 오류 시**:
- 에러 알림 Toast
- 재시도 버튼

---

## 4. 컴포넌트 구조

### 4.1 컴포넌트 트리

```
BudgetProjectsPage
├── PageHeader
│   ├── Title: "과제별 예산 상세"
│   └── Description
├── FilterPanel
│   ├── YearFilter
│   ├── DepartmentFilter
│   ├── FundingAgencyFilter
│   ├── PISearchInput
│   ├── StatusRadioGroup
│   ├── ProjectSearchInput
│   └── ResetButton
├── KPISection
│   ├── KPICard (총 과제 수)
│   ├── KPICard (총 연구비)
│   └── KPICard (평균 집행률)
├── ProjectsTable
│   ├── TableHeader (with Sortable Columns)
│   ├── ProjectRow (Expandable)
│   │   ├── ProjectInfo
│   │   ├── ExecutionRateBar
│   │   └── ExecutionDetailsPanel (Expanded)
│   │       ├── ProjectSummary
│   │       ├── ItemPieChart
│   │       └── ExecutionDetailsTable
│   └── Pagination
└── ExportButton (CSV Download)
```

### 4.2 주요 컴포넌트 정의

#### BudgetProjectsPage

**파일 위치**: `src/app/dashboard/budget/projects/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FilterPanel } from './components/filter-panel';
import { KPISection } from './components/kpi-section';
import { ProjectsTable } from './components/projects-table';
import { useProjectsData } from './hooks/useProjectsData';
import type { ProjectFilters } from './types';

export default function BudgetProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });

  const { data, isLoading, error } = useProjectsData(filters, pagination);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">과제별 예산 상세</h1>
          <p className="text-muted-foreground">
            연구과제별 예산 집행 내역을 상세하게 확인하세요.
          </p>
        </div>

        <FilterPanel filters={filters} onFilterChange={setFilters} />

        <KPISection
          totalProjects={data?.total_count ?? 0}
          totalBudget={data?.total_budget ?? 0}
          avgExecutionRate={data?.avg_execution_rate ?? 0}
          isLoading={isLoading}
        />

        <ProjectsTable
          projects={data?.projects ?? []}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </div>
    </DashboardLayout>
  );
}
```

#### FilterPanel

**파일 위치**: `src/app/dashboard/budget/projects/components/filter-panel.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { ProjectFilters } from '../types';

type FilterPanelProps = {
  filters: ProjectFilters;
  onFilterChange: (filters: ProjectFilters) => void;
};

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const { data: filterOptions } = useQuery({
    queryKey: ['budget-projects-filters'],
    queryFn: async () => {
      const response = await fetch('/api/budget/projects/filters');
      return response.json();
    },
  });

  const handleReset = () => {
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>필터</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 연도 선택 */}
        <div className="space-y-2">
          <Label>연도</Label>
          <Select
            value={filters.year?.toString()}
            onValueChange={(value) =>
              onFilterChange({ ...filters, year: Number(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {filterOptions?.years.map((year: number) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 학과 선택 */}
        <div className="space-y-2">
          <Label>학과</Label>
          <Select
            value={filters.department_id}
            onValueChange={(value) =>
              onFilterChange({ ...filters, department_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {filterOptions?.departments.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.college_name} / {dept.department_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 지원기관 선택 */}
        <div className="space-y-2">
          <Label>지원기관</Label>
          <Select
            value={filters.funding_agency}
            onValueChange={(value) =>
              onFilterChange({ ...filters, funding_agency: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {filterOptions?.funding_agencies.map((agency: string) => (
                <SelectItem key={agency} value={agency}>
                  {agency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 과제명 검색 */}
        <div className="space-y-2">
          <Label>과제명 검색</Label>
          <Input
            placeholder="과제명 입력"
            value={filters.search ?? ''}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
          />
        </div>

        {/* 연구책임자 검색 */}
        <div className="space-y-2">
          <Label>연구책임자</Label>
          <Input
            placeholder="이름 입력"
            value={filters.principal_investigator ?? ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                principal_investigator: e.target.value,
              })
            }
          />
        </div>

        {/* 집행 상태 */}
        <div className="space-y-2">
          <Label>집행 상태</Label>
          <RadioGroup
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                status: value === 'all' ? undefined : (value as any),
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">전체</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="집행완료" id="completed" />
              <Label htmlFor="completed">집행완료</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="처리중" id="processing" />
              <Label htmlFor="processing">처리중</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 초기화 버튼 */}
        <div className="flex items-end">
          <Button variant="outline" onClick={handleReset} className="w-full">
            필터 초기화
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### ProjectsTable

**파일 위치**: `src/app/dashboard/budget/projects/components/projects-table.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { ExecutionRateBar } from './execution-rate-bar';
import { ExecutionDetailsPanel } from './execution-details-panel';
import { formatBudget } from '@/lib/utils/number';
import type { ProjectWithBudgetInfo } from '../types';

type ProjectsTableProps = {
  projects: ProjectWithBudgetInfo[];
  isLoading: boolean;
  pagination: { page: number; limit: number };
  onPaginationChange: (pagination: { page: number; limit: number }) => void;
};

export function ProjectsTable({
  projects,
  isLoading,
  pagination,
  onPaginationChange,
}: ProjectsTableProps) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null
  );

  const handleRowClick = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          과제 목록 (총 {projects.length}건)
        </h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          CSV 다운로드
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>과제번호</TableHead>
              <TableHead>과제명</TableHead>
              <TableHead>연구책임자</TableHead>
              <TableHead>소속학과</TableHead>
              <TableHead>지원기관</TableHead>
              <TableHead className="text-right">총연구비</TableHead>
              <TableHead className="text-right">집행금액</TableHead>
              <TableHead className="w-[200px]">집행률</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <>
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(project.id)}
                >
                  <TableCell>
                    {expandedProjectId === project.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {project.project_number}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {project.project_name}
                  </TableCell>
                  <TableCell>{project.principal_investigator}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.department.college_name} /{' '}
                    {project.department.department_name}
                  </TableCell>
                  <TableCell>{project.funding_agency}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatBudget(project.total_budget)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatBudget(project.executed_amount)}
                  </TableCell>
                  <TableCell>
                    <ExecutionRateBar rate={project.execution_rate} />
                  </TableCell>
                </TableRow>
                {expandedProjectId === project.id && (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <ExecutionDetailsPanel projectId={project.id} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() =>
            onPaginationChange({
              ...pagination,
              page: pagination.page - 1,
            })
          }
          disabled={pagination.page === 1}
        >
          이전
        </Button>
        <span className="mx-4 flex items-center">
          페이지 {pagination.page}
        </span>
        <Button
          variant="outline"
          onClick={() =>
            onPaginationChange({
              ...pagination,
              page: pagination.page + 1,
            })
          }
        >
          다음
        </Button>
      </div>
    </div>
  );
}
```

---

## 5. 상태 관리

### 5.1 로컬 상태 (useState)

**페이지 레벨:**
```typescript
// 필터 상태
const [filters, setFilters] = useState<ProjectFilters>({});

// 페이지네이션 상태
const [pagination, setPagination] = useState({ page: 1, limit: 50 });

// 확장된 행 ID
const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
```

### 5.2 서버 상태 (React Query)

**쿼리 키 구조:**
```typescript
// 과제 목록
['budget-projects', filters, pagination]

// 필터 옵션
['budget-projects-filters']

// 과제 상세 집행 내역
['budget-project-executions', projectId, executionFilters]
```

**캐싱 전략:**
- `staleTime`: 5분 (필터 변경 시 자동 재fetch)
- `cacheTime`: 10분
- `refetchOnWindowFocus`: false

### 5.3 URL 동기화 (Optional)

**URL 파라미터로 필터 저장 (공유 가능):**

```typescript
import { useRouter, useSearchParams } from 'next/navigation';

const router = useRouter();
const searchParams = useSearchParams();

// URL에서 필터 읽기
const filtersFromURL = {
  year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
  department_id: searchParams.get('dept') ?? undefined,
  // ...
};

// 필터 변경 시 URL 업데이트
const updateFilters = (newFilters: ProjectFilters) => {
  const params = new URLSearchParams();
  if (newFilters.year) params.set('year', newFilters.year.toString());
  if (newFilters.department_id) params.set('dept', newFilters.department_id);
  // ...

  router.push(`?${params.toString()}`);
  setFilters(newFilters);
};
```

---

## 6. API 통신

### 6.1 React Query Hooks

#### useProjectsData

**파일 위치**: `src/app/dashboard/budget/projects/hooks/useProjectsData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { ProjectFilters, ProjectsResponse } from '../types';

type Pagination = { page: number; limit: number };

export function useProjectsData(filters: ProjectFilters, pagination: Pagination) {
  return useQuery<ProjectsResponse>({
    queryKey: ['budget-projects', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams();

      // 필터 파라미터 추가
      if (filters.year) params.set('year', filters.year.toString());
      if (filters.department_id) params.set('department_id', filters.department_id);
      if (filters.funding_agency) params.set('funding_agency', filters.funding_agency);
      if (filters.principal_investigator)
        params.set('principal_investigator', filters.principal_investigator);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);

      // 페이지네이션
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const response = await fetch(`/api/budget/projects?${params}`);
      if (!response.ok) throw new Error('Failed to fetch projects');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

#### useExecutionDetails

**파일 위치**: `src/app/dashboard/budget/projects/hooks/useExecutionDetails.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { ExecutionsResponse } from '../types';

export function useExecutionDetails(projectId: string) {
  return useQuery<ExecutionsResponse>({
    queryKey: ['budget-project-executions', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/budget/projects/${projectId}/executions`);
      if (!response.ok) throw new Error('Failed to fetch execution details');

      return response.json();
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 6.2 API Route 구현 (Hono)

#### GET /api/budget/projects

**파일 위치**: `src/features/budget/backend/projects-route.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import type { AppEnv } from '@/backend/hono/context';

const projectsFilterSchema = z.object({
  year: z.coerce.number().optional(),
  department_id: z.string().optional(),
  funding_agency: z.string().optional(),
  principal_investigator: z.string().optional(),
  status: z.enum(['집행완료', '처리중']).optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['project_number', 'total_budget', 'executed_amount', 'execution_rate'])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export function registerBudgetProjectsRoutes(app: Hono<AppEnv>) {
  const budget = new Hono<AppEnv>();

  budget.get('/', zValidator('query', projectsFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 메인 쿼리: 연구과제 + 집행 집계
    let query = supabase
      .from('research_projects')
      .select(
        `
        id,
        project_number,
        project_name,
        principal_investigator,
        funding_agency,
        total_budget,
        created_at,
        departments (
          id,
          college_name,
          department_name
        )
      `
      )
      .order('created_at', { ascending: false });

    // 필터 적용
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    if (filters.funding_agency) {
      query = query.eq('funding_agency', filters.funding_agency);
    }

    if (filters.principal_investigator) {
      query = query.ilike('principal_investigator', `%${filters.principal_investigator}%`);
    }

    if (filters.search) {
      query = query.ilike('project_name', `%${filters.search}%`);
    }

    const { data: projects, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 각 과제별 집행 정보 집계
    const projectsWithExecution = await Promise.all(
      projects.map(async (project) => {
        let execQuery = supabase
          .from('budget_executions')
          .select('execution_amount, status')
          .eq('project_id', project.id);

        // 연도 필터 (집행일자 기준)
        if (filters.year) {
          execQuery = execQuery
            .gte('execution_date', `${filters.year}-01-01`)
            .lte('execution_date', `${filters.year}-12-31`);
        }

        // 상태 필터
        if (filters.status) {
          execQuery = execQuery.eq('status', filters.status);
        }

        const { data: executions } = await execQuery;

        const executed_amount = executions?.reduce(
          (sum, exec) => sum + exec.execution_amount,
          0
        ) ?? 0;

        const execution_rate = project.total_budget > 0
          ? (executed_amount / project.total_budget) * 100
          : 0;

        return {
          ...project,
          executed_amount,
          execution_rate: Math.round(execution_rate * 100) / 100,
          execution_count: executions?.length ?? 0,
        };
      })
    );

    // 정렬
    if (filters.sort_by) {
      projectsWithExecution.sort((a, b) => {
        const aValue = a[filters.sort_by as keyof typeof a] as number;
        const bValue = b[filters.sort_by as keyof typeof b] as number;

        return filters.sort_order === 'desc' ? bValue - aValue : aValue - bValue;
      });
    }

    // 페이지네이션
    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    const paginatedProjects = projectsWithExecution.slice(start, end);

    // 집계 통계
    const total_budget = projectsWithExecution.reduce(
      (sum, p) => sum + p.total_budget,
      0
    );
    const total_executed = projectsWithExecution.reduce(
      (sum, p) => sum + p.executed_amount,
      0
    );
    const avg_execution_rate = projectsWithExecution.length > 0
      ? projectsWithExecution.reduce((sum, p) => sum + p.execution_rate, 0) /
        projectsWithExecution.length
      : 0;

    return c.json({
      projects: paginatedProjects,
      total_count: projectsWithExecution.length,
      page: filters.page,
      limit: filters.limit,
      total_budget,
      total_executed,
      avg_execution_rate: Math.round(avg_execution_rate * 100) / 100,
    });
  });

  // 필터 옵션 조회
  budget.get('/filters', async (c) => {
    const supabase = getSupabaseServiceClient();

    // 연도 목록 (집행일자 기준)
    const { data: yearData } = await supabase
      .from('budget_executions')
      .select('execution_date')
      .order('execution_date', { ascending: false });

    const years = Array.from(
      new Set(
        yearData?.map((row) => new Date(row.execution_date).getFullYear()) ?? []
      )
    ).sort((a, b) => b - a);

    // 학과 목록
    const { data: departments } = await supabase
      .from('departments')
      .select('id, college_name, department_name')
      .order('college_name, department_name');

    // 지원기관 목록
    const { data: agencyData } = await supabase
      .from('research_projects')
      .select('funding_agency')
      .order('funding_agency');

    const funding_agencies = Array.from(
      new Set(agencyData?.map((row) => row.funding_agency) ?? [])
    ).sort();

    // 연구책임자 목록
    const { data: piData } = await supabase
      .from('research_projects')
      .select('principal_investigator')
      .order('principal_investigator');

    const principal_investigators = Array.from(
      new Set(piData?.map((row) => row.principal_investigator) ?? [])
    ).sort();

    return c.json({
      years,
      departments: departments ?? [],
      funding_agencies,
      principal_investigators,
    });
  });

  // 과제별 집행 내역 상세
  budget.get('/:projectId/executions', async (c) => {
    const projectId = c.req.param('projectId');
    const supabase = getSupabaseServiceClient();

    // 과제 정보
    const { data: project, error: projectError } = await supabase
      .from('research_projects')
      .select(
        `
        *,
        departments (
          college_name,
          department_name
        )
      `
      )
      .eq('id', projectId)
      .single();

    if (projectError) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // 집행 내역
    const { data: executions, error: execError } = await supabase
      .from('budget_executions')
      .select('*')
      .eq('project_id', projectId)
      .order('execution_date', { ascending: false });

    if (execError) {
      return c.json({ error: execError.message }, 500);
    }

    // 집행항목별 집계
    const byItem = executions.reduce((acc, exec) => {
      const existing = acc.find((item) => item.item === exec.execution_item);
      if (existing) {
        existing.amount += exec.execution_amount;
        existing.count += 1;
      } else {
        acc.push({
          item: exec.execution_item,
          amount: exec.execution_amount,
          count: 1,
        });
      }
      return acc;
    }, [] as { item: string; amount: number; count: number }[]);

    // 상태별 집계
    const byStatus = executions.reduce((acc, exec) => {
      const existing = acc.find((item) => item.status === exec.status);
      if (existing) {
        existing.amount += exec.execution_amount;
        existing.count += 1;
      } else {
        acc.push({
          status: exec.status,
          amount: exec.execution_amount,
          count: 1,
        });
      }
      return acc;
    }, [] as { status: string; amount: number; count: number }[]);

    const total_executed = executions.reduce(
      (sum, exec) => sum + exec.execution_amount,
      0
    );

    return c.json({
      project,
      executions,
      summary: {
        total_executed,
        by_item: byItem,
        by_status: byStatus,
      },
    });
  });

  app.route('/budget/projects', budget);
}
```

**Hono App 통합:**

```typescript
// src/backend/hono/app.ts
import { registerBudgetProjectsRoutes } from '@/features/budget/backend/projects-route';

export const createHonoApp = () => {
  // ... 기존 코드

  registerBudgetProjectsRoutes(app);

  // ...
};
```

---

## 7. 구현 단계

### Phase 1: 기본 구조 및 데이터 연동 (1주)

**목표**: 페이지 기본 구조 및 API 연동

**Tasks:**
1. ✅ 페이지 라우트 생성 (`/dashboard/budget/projects/page.tsx`)
2. ✅ 타입 정의 (`types.ts`)
3. ✅ API Route 구현 (Hono)
   - GET `/api/budget/projects`
   - GET `/api/budget/projects/filters`
4. ✅ React Query Hooks 구현
   - `useProjectsData`
   - `useFilterOptions`
5. ✅ 기본 레이아웃 및 페이지 구조

### Phase 2: 필터 및 KPI (3일)

**목표**: 필터 패널 및 KPI 카드 구현

**Tasks:**
1. ✅ FilterPanel 컴포넌트
   - 연도, 학과, 지원기관, 상태 필터
   - 검색 입력
   - 초기화 버튼
2. ✅ KPISection 컴포넌트
   - KPICard 재사용
   - 집계 데이터 표시

### Phase 3: 과제 목록 테이블 (1주)

**목표**: 메인 테이블 및 확장 행 구현

**Tasks:**
1. ✅ ProjectsTable 컴포넌트
   - 테이블 구조 및 컬럼 정의
   - 정렬 기능
   - 페이지네이션
2. ✅ ExecutionRateBar 컴포넌트
   - 진행바 및 색상 코딩
3. ✅ 확장 행 (Expandable Row)
   - 클릭 시 펼침/접힘

### Phase 4: 집행 내역 상세 (1주)

**목표**: 확장 행 내 상세 정보 구현

**Tasks:**
1. ✅ API Route 구현
   - GET `/api/budget/projects/:projectId/executions`
2. ✅ ExecutionDetailsPanel 컴포넌트
   - 과제 요약 섹션
   - 집행항목별 파이 차트
   - 집행 내역 상세 테이블
3. ✅ useExecutionDetails Hook

### Phase 5: 데이터 내보내기 및 최적화 (3일)

**목표**: CSV 다운로드 및 성능 최적화

**Tasks:**
1. ✅ CSV 다운로드 기능
   - 전체 과제 목록 CSV
   - 특정 과제 집행 내역 CSV
2. ✅ 성능 최적화
   - React Query 캐싱 튜닝
   - 테이블 가상화 (필요 시)
   - 로딩 스켈레톤 개선
3. ✅ 에러 핸들링
   - 에러 바운더리
   - 재시도 로직

### Phase 6: 테스트 및 버그 수정 (3일)

**목표**: 통합 테스트 및 버그 수정

**Tasks:**
1. ✅ 기능 테스트
   - 필터 조합 테스트
   - 정렬 테스트
   - 페이지네이션 테스트
2. ✅ UI/UX 개선
   - 반응형 디자인 확인
   - 접근성 개선
3. ✅ 버그 수정 및 코드 리뷰

---

## 8. 테스트 계획

### 8.1 단위 테스트

**유틸리티 함수:**
- `formatBudget()`: 숫자 포맷팅 정확성
- `calculateExecutionRate()`: 집행률 계산 로직

### 8.2 통합 테스트

**API Routes:**
- GET `/api/budget/projects`: 필터 조합별 응답 검증
- GET `/api/budget/projects/:projectId/executions`: 집행 내역 집계 검증

**React Query Hooks:**
- `useProjectsData`: 캐싱 및 재fetch 동작 확인
- `useExecutionDetails`: 데이터 로딩 상태 확인

### 8.3 E2E 테스트 (선택 사항)

**시나리오:**
1. 페이지 접근 및 초기 데이터 로딩
2. 필터 적용 및 결과 업데이트
3. 과제 행 클릭하여 상세 정보 확장
4. CSV 다운로드 실행

---

## 9. 성능 최적화

### 9.1 데이터베이스 쿼리 최적화

**인덱스 활용:**
```sql
-- research_projects
CREATE INDEX idx_project_dept ON research_projects(department_id);
CREATE INDEX idx_project_pi ON research_projects(principal_investigator);
CREATE INDEX idx_project_agency ON research_projects(funding_agency);

-- budget_executions
CREATE INDEX idx_budget_project_date ON budget_executions(project_id, execution_date DESC);
CREATE INDEX idx_budget_date ON budget_executions(execution_date DESC);
CREATE INDEX idx_budget_status ON budget_executions(status);
```

**집계 쿼리 최적화:**
- 과제별 집행 금액 집계는 별도 쿼리로 병렬 처리
- Materialized View 고려 (추후)

### 9.2 프론트엔드 최적화

**React Query 캐싱:**
```typescript
{
  staleTime: 5 * 60 * 1000, // 5분
  cacheTime: 10 * 60 * 1000, // 10분
  refetchOnWindowFocus: false,
}
```

**테이블 가상화 (필요 시):**
- `@tanstack/react-virtual` 사용
- 100개 이상 행에서 적용

**메모이제이션:**
```typescript
const sortedProjects = useMemo(() => {
  // 정렬 로직
}, [projects, sortConfig]);
```

### 9.3 번들 크기 최적화

**코드 스플리팅:**
```typescript
const ExecutionDetailsPanel = dynamic(
  () => import('./execution-details-panel'),
  { loading: () => <Skeleton /> }
);
```

---

## 10. 주의사항 및 제약사항

### 10.1 데이터 정합성

- 집행금액 > 총연구비 경고 표시 (빨간색)
- 미래 집행일자 경고
- 집행 내역 없는 과제 표시 (회색)

### 10.2 성능 고려사항

- 과제 수가 1,000개 이상일 경우 페이지네이션 필수
- 집행 내역 조회는 Lazy Loading (확장 시에만 요청)

### 10.3 보안

- API Route는 Clerk 인증 확인 후 Supabase Service Role Key 사용
- 민감 정보 노출 없음 (비고 필드만 선택적 표시)

### 10.4 확장성

- 과제 상태 추가 시 타입 확장 가능
- 집행항목 코드화 고려 (향후)

---

## 11. 참고 자료

**관련 문서:**
- `/docs/prd.md`: 전체 PRD
- `/docs/userflow.md`: 사용자 플로우
- `/docs/database.md`: 데이터베이스 스키마
- `/docs/common-modules.md`: 공통 모듈

**관련 페이지:**
- `/dashboard/budget/execution`: 예산 집행 현황 (관련 페이지)
- `/dashboard/research/projects`: 연구과제 관리 (관련 페이지)

**기술 스택:**
- Next.js 15 App Router
- React Query (TanStack Query)
- Hono (Backend API)
- Supabase (PostgreSQL)
- Shadcn UI

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design 문서를 기반으로 작성되었습니다.
코드 충돌을 방지하기 위해 공통 모듈(`common-modules.md`)에 정의된 컴포넌트와 유틸리티를 재사용하며,
DRY 원칙을 엄격히 준수합니다.
