# Implementation Plan: 데이터 조회 페이지 (/data/browse)

**버전**: 1.0
**작성일**: 2025-11-02
**페이지 번호**: 14
**페이지 경로**: `/data/browse`
**접근 권한**: Administrator Only
**관련 문서**:
- PRD v1.0 (Section 6.3)
- Userflow v1.0 (Section 4.4)
- Database v2.0
- UC-004: 데이터 DB 적재 및 관리

---

## 1. 페이지 개요

### 1.1 목적

관리자가 데이터베이스에 적재된 모든 데이터를 조회, 검색, 필터링, 정렬하고 CSV/Excel로 다운로드할 수 있는 관리 페이지입니다.

### 1.2 핵심 기능

- **테이블 선택**: 5개 주요 테이블 중 선택하여 데이터 조회
- **페이지네이션**: 50행 단위로 데이터 표시
- **정렬**: 컬럼 클릭으로 오름차순/내림차순 정렬
- **검색**: 텍스트 검색 (디바운스 적용)
- **필터링**: 날짜 범위, 숫자 범위, 카테고리 필터
- **다운로드**: CSV/Excel 형식으로 전체 데이터 다운로드
- **상세 조회**: 행 클릭 시 상세 정보 모달 표시 (선택 사항)

### 1.3 사용자 시나리오

**시나리오 1: 최근 업로드된 논문 데이터 확인**
1. 관리자가 `/data/browse` 접근
2. 테이블 선택: "논문 게재"
3. 최신 순으로 정렬된 논문 목록 확인
4. 검색: "인공지능" 키워드로 논문 필터링
5. CSV 다운로드하여 오프라인 검토

**시나리오 2: 특정 학과의 KPI 데이터 분석**
1. 테이블 선택: "KPI 메트릭"
2. 필터: 평가년도 = 2023, 단과대학 = "공과대학"
3. 취업률 컬럼으로 내림차순 정렬
4. 상위 학과들의 데이터 확인
5. 필터링된 데이터를 Excel로 다운로드

---

## 2. 페이지 구조

### 2.1 URL 설계

**기본 URL**: `/data/browse`

**쿼리 파라미터**:
```
/data/browse?table=publications&page=2&search=AI&sort=publication_date&order=desc
```

| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| table | string | N | 조회할 테이블 (kpi_metrics, publications, research_projects, budget_executions, students) | publications |
| page | number | N | 페이지 번호 (1부터 시작) | 1 |
| limit | number | N | 페이지당 행 수 | 50 |
| search | string | N | 검색어 | - |
| sort | string | N | 정렬 컬럼 | created_at |
| order | 'asc' \| 'desc' | N | 정렬 방향 | desc |
| filters | JSON | N | 추가 필터 조건 | {} |

### 2.2 레이아웃 구조

```
┌─────────────────────────────────────────────────┐
│ DashboardLayout                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ PageHeader                                  │ │
│ │ - 제목: "데이터 조회"                       │ │
│ │ - 설명: "데이터베이스에 적재된 데이터 관리" │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ TableSelector (드롭다운)                    │ │
│ │ [논문 게재 ▼]                               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ FilterBar                                   │ │
│ │ [검색 입력] [날짜 범위] [필터] [CSV 다운로드]│ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ DataTable (Shadcn Table)                    │ │
│ │ - 50행/페이지                               │ │
│ │ - 정렬 가능한 컬럼 헤더                     │ │
│ │ - 행 클릭 → 상세 모달                       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Pagination                                  │ │
│ │ [◀ 이전] [1] [2] [3] ... [10] [다음 ▶]     │ │
│ │ 표시: 1-50 / 총 1,234건                     │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 3. 데이터 모델

### 3.1 테이블 설정

```typescript
// src/lib/data-browse/table-config.ts

export type TableName =
  | 'kpi_metrics'
  | 'publications'
  | 'research_projects'
  | 'budget_executions'
  | 'students';

export type TableConfig = {
  key: TableName;
  label: string;
  icon: LucideIcon;
  columns: ColumnConfig[];
  defaultSort: string;
  searchableColumns: string[];
  filterConfig?: FilterConfig[];
};

export type ColumnConfig = {
  key: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'badge' | 'link';
  sortable: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
};

export const TABLE_CONFIGS: Record<TableName, TableConfig> = {
  kpi_metrics: {
    key: 'kpi_metrics',
    label: 'KPI 메트릭',
    icon: BarChart3,
    defaultSort: 'evaluation_year',
    searchableColumns: ['departments.department_name', 'departments.college_name'],
    columns: [
      { key: 'evaluation_year', header: '평가년도', type: 'number', sortable: true },
      { key: 'departments.college_name', header: '단과대학', type: 'text', sortable: true },
      { key: 'departments.department_name', header: '학과', type: 'text', sortable: true },
      { key: 'employment_rate', header: '취업률 (%)', type: 'number', sortable: true },
      { key: 'full_time_faculty', header: '전임교원', type: 'number', sortable: true },
      { key: 'visiting_faculty', header: '초빙교원', type: 'number', sortable: true },
      { key: 'tech_transfer_income', header: '기술이전 수입 (억원)', type: 'number', sortable: true },
      { key: 'intl_conference_count', header: '국제학술대회', type: 'number', sortable: true },
      { key: 'updated_at', header: '업데이트', type: 'date', sortable: true },
    ],
    filterConfig: [
      { key: 'evaluation_year', label: '평가년도', type: 'number-range' },
      { key: 'college_name', label: '단과대학', type: 'select' },
    ],
  },
  publications: {
    key: 'publications',
    label: '논문 게재',
    icon: BookOpen,
    defaultSort: 'publication_date',
    searchableColumns: ['title', 'main_author', 'journal_name'],
    columns: [
      { key: 'publication_id', header: '논문ID', type: 'text', sortable: false },
      { key: 'title', header: '논문 제목', type: 'link', sortable: true, width: '300px' },
      { key: 'main_author', header: '주저자', type: 'text', sortable: true },
      { key: 'journal_name', header: '학술지명', type: 'text', sortable: true },
      { key: 'journal_grade', header: '저널등급', type: 'badge', sortable: true },
      { key: 'impact_factor', header: 'IF', type: 'number', sortable: true },
      { key: 'publication_date', header: '게재일', type: 'date', sortable: true },
      { key: 'project_linked', header: '과제연계', type: 'badge', sortable: false },
    ],
    filterConfig: [
      { key: 'publication_date', label: '게재일', type: 'date-range' },
      { key: 'journal_grade', label: '저널등급', type: 'select', options: ['SCIE', 'SSCI', 'A&HCI', 'SCOPUS', 'KCI', 'Other'] },
      { key: 'project_linked', label: '과제연계', type: 'boolean' },
    ],
  },
  research_projects: {
    key: 'research_projects',
    label: '연구과제',
    icon: Flask,
    defaultSort: 'created_at',
    searchableColumns: ['project_name', 'principal_investigator', 'funding_agency'],
    columns: [
      { key: 'project_number', header: '과제번호', type: 'text', sortable: false },
      { key: 'project_name', header: '과제명', type: 'text', sortable: true, width: '300px' },
      { key: 'principal_investigator', header: '연구책임자', type: 'text', sortable: true },
      { key: 'departments.department_name', header: '소속학과', type: 'text', sortable: true },
      { key: 'funding_agency', header: '지원기관', type: 'text', sortable: true },
      { key: 'total_budget', header: '총연구비 (원)', type: 'number', sortable: true },
      { key: 'created_at', header: '등록일', type: 'date', sortable: true },
    ],
    filterConfig: [
      { key: 'funding_agency', label: '지원기관', type: 'select' },
      { key: 'total_budget', label: '총연구비', type: 'number-range' },
    ],
  },
  budget_executions: {
    key: 'budget_executions',
    label: '예산 집행',
    icon: Wallet,
    defaultSort: 'execution_date',
    searchableColumns: ['execution_id', 'execution_item', 'research_projects.project_name'],
    columns: [
      { key: 'execution_id', header: '집행ID', type: 'text', sortable: false },
      { key: 'research_projects.project_name', header: '과제명', type: 'text', sortable: false, width: '250px' },
      { key: 'execution_date', header: '집행일자', type: 'date', sortable: true },
      { key: 'execution_item', header: '집행항목', type: 'text', sortable: true },
      { key: 'execution_amount', header: '집행금액 (원)', type: 'number', sortable: true },
      { key: 'status', header: '상태', type: 'badge', sortable: true },
    ],
    filterConfig: [
      { key: 'execution_date', label: '집행일자', type: 'date-range' },
      { key: 'status', label: '상태', type: 'select', options: ['집행완료', '처리중'] },
      { key: 'execution_amount', label: '집행금액', type: 'number-range' },
    ],
  },
  students: {
    key: 'students',
    label: '학생 정보',
    icon: Users,
    defaultSort: 'created_at',
    searchableColumns: ['student_number', 'name', 'email', 'advisor'],
    columns: [
      { key: 'student_number', header: '학번', type: 'text', sortable: true },
      { key: 'name', header: '이름', type: 'text', sortable: true },
      { key: 'departments.college_name', header: '단과대학', type: 'text', sortable: true },
      { key: 'departments.department_name', header: '학과', type: 'text', sortable: true },
      { key: 'grade', header: '학년', type: 'number', sortable: true },
      { key: 'program_type', header: '과정구분', type: 'badge', sortable: true },
      { key: 'enrollment_status', header: '학적상태', type: 'badge', sortable: true },
      { key: 'advisor', header: '지도교수', type: 'text', sortable: true },
    ],
    filterConfig: [
      { key: 'program_type', label: '과정구분', type: 'select', options: ['학사', '석사', '박사', '석박통합'] },
      { key: 'enrollment_status', label: '학적상태', type: 'select', options: ['재학', '휴학', '졸업', '자퇴', '제적'] },
      { key: 'admission_year', label: '입학년도', type: 'number-range' },
    ],
  },
};
```

### 3.2 API 응답 타입

```typescript
// src/lib/data-browse/types.ts

export type DataBrowseResponse<T = any> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type DataBrowseFilters = {
  search?: string;
  dateRange?: { start: string; end: string; field: string };
  numberRange?: { min: number; max: number; field: string };
  select?: Record<string, string>;
  boolean?: Record<string, boolean>;
};

export type DataBrowseParams = {
  table: TableName;
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: DataBrowseFilters;
};
```

---

## 4. 컴포넌트 설계

### 4.1 페이지 컴포넌트

**파일 위치**: `src/app/(protected)/data/browse/page.tsx`

```typescript
// src/app/(protected)/data/browse/page.tsx
import { Suspense } from 'react';
import { DataBrowserShell } from '@/components/data-browse/data-browser-shell';
import { DataBrowserSkeleton } from '@/components/data-browse/data-browser-skeleton';

export const metadata = {
  title: '데이터 조회 | University Dashboard',
  description: '데이터베이스에 적재된 데이터 조회 및 관리',
};

type SearchParams = {
  table?: string;
  page?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: string;
};

type DataBrowsePageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DataBrowsePage({ searchParams }: DataBrowsePageProps) {
  const params = await searchParams;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="데이터 조회"
          description="데이터베이스에 적재된 데이터를 조회하고 관리합니다"
        />

        <Suspense fallback={<DataBrowserSkeleton />}>
          <DataBrowserShell initialParams={params} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
```

### 4.2 DataBrowserShell (클라이언트 컴포넌트)

**파일 위치**: `src/components/data-browse/data-browser-shell.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TableSelector } from './table-selector';
import { FilterBar } from './filter-bar';
import { DataTable } from './data-table';
import { DataTablePagination } from './data-table-pagination';
import { useDataBrowse } from '@/hooks/api/useDataBrowse';
import { TABLE_CONFIGS, type TableName } from '@/lib/data-browse/table-config';

type DataBrowserShellProps = {
  initialParams: any;
};

export function DataBrowserShell({ initialParams }: DataBrowserShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [selectedTable, setSelectedTable] = useState<TableName>(
    (initialParams.table as TableName) || 'publications'
  );
  const [page, setPage] = useState(Number(initialParams.page) || 1);
  const [search, setSearch] = useState(initialParams.search || '');
  const [sort, setSort] = useState(initialParams.sort || TABLE_CONFIGS[selectedTable].defaultSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialParams.order || 'desc');
  const [filters, setFilters] = useState(
    initialParams.filters ? JSON.parse(initialParams.filters) : {}
  );

  // Data fetching
  const { data, isLoading, error } = useDataBrowse({
    table: selectedTable,
    page,
    limit: 50,
    sort,
    order,
    filters: { search, ...filters },
  });

  // URL 동기화
  const updateURL = () => {
    const params = new URLSearchParams();
    params.set('table', selectedTable);
    params.set('page', String(page));
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    if (Object.keys(filters).length > 0) {
      params.set('filters', JSON.stringify(filters));
    }
    router.push(`/data/browse?${params.toString()}`, { scroll: false });
  };

  // Handlers
  const handleTableChange = (table: TableName) => {
    setSelectedTable(table);
    setPage(1);
    setSearch('');
    setFilters({});
    setSort(TABLE_CONFIGS[table].defaultSort);
    // URL은 useEffect에서 업데이트
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (column: string) => {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(column);
      setOrder('desc');
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // URL 업데이트 (디바운스 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedTable, page, search, sort, order, filters]);

  const tableConfig = TABLE_CONFIGS[selectedTable];

  return (
    <div className="space-y-4">
      {/* 테이블 선택 */}
      <TableSelector
        selected={selectedTable}
        onChange={handleTableChange}
        tables={Object.values(TABLE_CONFIGS)}
      />

      {/* 필터바 */}
      <FilterBar
        tableConfig={tableConfig}
        search={search}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onDownload={() => handleDownload()}
      />

      {/* 데이터 테이블 */}
      {isLoading ? (
        <DataTableSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          title="데이터가 없습니다"
          description="검색 조건을 변경하거나 필터를 초기화해보세요"
          action={{
            label: '필터 초기화',
            onClick: () => {
              setSearch('');
              setFilters({});
            },
          }}
        />
      ) : (
        <>
          <DataTable
            columns={tableConfig.columns}
            data={data.data}
            sort={sort}
            order={order}
            onSortChange={handleSortChange}
            onRowClick={(row) => handleRowClick(row)}
          />

          <DataTablePagination
            page={page}
            limit={50}
            total={data.total}
            hasMore={data.hasMore}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
```

### 4.3 TableSelector 컴포넌트

**파일 위치**: `src/components/data-browse/table-selector.tsx`

```typescript
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TableConfig, TableName } from '@/lib/data-browse/table-config';

type TableSelectorProps = {
  selected: TableName;
  onChange: (table: TableName) => void;
  tables: TableConfig[];
};

export function TableSelector({ selected, onChange, tables }: TableSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">테이블:</span>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {tables.map((table) => {
            const Icon = table.icon;
            return (
              <SelectItem key={table.key} value={table.key}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{table.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### 4.4 FilterBar 컴포넌트

**파일 위치**: `src/components/data-browse/filter-bar.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Search, Download, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FilterPanel } from '@/components/data-browse/filter-panel';
import type { TableConfig } from '@/lib/data-browse/table-config';

type FilterBarProps = {
  tableConfig: TableConfig;
  search: string;
  onSearchChange: (value: string) => void;
  filters: any;
  onFilterChange: (filters: any) => void;
  onDownload: () => void;
};

export function FilterBar({
  tableConfig,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onDownload,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(search);
  const activeFilterCount = Object.keys(filters).length;

  // 디바운스 처리
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    const timer = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  return (
    <div className="flex items-center gap-2">
      {/* 검색 입력 */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`${tableConfig.label} 검색...`}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => {
              setSearchInput('');
              onSearchChange('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 필터 버튼 */}
      {tableConfig.filterConfig && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              필터
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>필터 설정</SheetTitle>
            </SheetHeader>
            <FilterPanel
              filterConfig={tableConfig.filterConfig}
              filters={filters}
              onFilterChange={onFilterChange}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* CSV 다운로드 버튼 */}
      <Button variant="outline" size="sm" onClick={onDownload}>
        <Download className="h-4 w-4 mr-2" />
        CSV 다운로드
      </Button>
    </div>
  );
}
```

### 4.5 DataTable 컴포넌트 (기존 재사용)

기존 `src/components/dashboard/data-table.tsx`를 확장하여 사용합니다.

**주요 수정 사항**:
- 정렬 아이콘 표시
- 행 클릭 이벤트 핸들러 추가
- 컬럼 타입별 렌더링 (badge, link 등)

---

## 5. API 설계

### 5.1 데이터 조회 API

**파일 위치**: `src/app/api/data/browse/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getUserRole } from '@/lib/auth/rbac';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { TABLE_CONFIGS, type TableName } from '@/lib/data-browse/table-config';

const querySchema = z.object({
  table: z.enum(['kpi_metrics', 'publications', 'research_projects', 'budget_executions', 'students']),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  filters: z.string().optional(), // JSON string
});

export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 권한 확인
    const role = await getUserRole();
    if (role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. 쿼리 파라미터 검증
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      table: searchParams.get('table'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
      search: searchParams.get('search'),
      filters: searchParams.get('filters'),
    });

    const { table, page, limit, sort, order, search, filters: filtersStr } = params;
    const filters = filtersStr ? JSON.parse(filtersStr) : {};

    // 4. Supabase 쿼리 빌드
    const supabase = getSupabaseServiceClient();
    const tableConfig = TABLE_CONFIGS[table as TableName];

    // 기본 SELECT (JOIN 포함)
    let query = supabase.from(table).select(
      getSelectClause(table),
      { count: 'exact' }
    );

    // 검색 조건 (OR)
    if (search && tableConfig.searchableColumns.length > 0) {
      const searchConditions = tableConfig.searchableColumns
        .map((col) => `${col}.ilike.%${search}%`)
        .join(',');
      query = query.or(searchConditions);
    }

    // 필터 조건 (AND)
    if (filters.dateRange) {
      query = query
        .gte(filters.dateRange.field, filters.dateRange.start)
        .lte(filters.dateRange.field, filters.dateRange.end);
    }
    if (filters.numberRange) {
      query = query
        .gte(filters.numberRange.field, filters.numberRange.min)
        .lte(filters.numberRange.field, filters.numberRange.max);
    }
    if (filters.select) {
      Object.entries(filters.select).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    if (filters.boolean) {
      Object.entries(filters.boolean).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // 정렬
    const sortColumn = sort || tableConfig.defaultSort;
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // 페이지네이션
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // 5. 쿼리 실행
    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    // 6. 응답
    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: count ? offset + limit < count : false,
    });
  } catch (error) {
    console.error('Data browse API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getSelectClause(table: TableName): string {
  const joins = {
    kpi_metrics: '*, departments(college_name, department_name)',
    publications: '*, departments(college_name, department_name)',
    research_projects: '*, departments(college_name, department_name)',
    budget_executions: '*, research_projects(project_name)',
    students: '*, departments(college_name, department_name)',
  };
  return joins[table] || '*';
}
```

### 5.2 CSV 다운로드 API

**파일 위치**: `src/app/api/data/export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/lib/auth/rbac';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { formatDate } from '@/lib/utils/date';
import { TABLE_CONFIGS, type TableName } from '@/lib/data-browse/table-config';

export async function GET(request: NextRequest) {
  try {
    // 인증 및 권한 확인
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = await getUserRole();
    if (role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get('table') as TableName;
    const filtersStr = searchParams.get('filters');
    const filters = filtersStr ? JSON.parse(filtersStr) : {};

    if (!table || !TABLE_CONFIGS[table]) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    // 데이터 조회 (페이지네이션 없이 전체)
    const supabase = getSupabaseServiceClient();
    let query = supabase.from(table).select(getSelectClause(table));

    // 필터 적용 (browse API와 동일 로직)
    // ... (생략)

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    // CSV 생성
    const csv = convertToCSV(data, TABLE_CONFIGS[table].columns);
    const timestamp = formatDate(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `${table}_${timestamp}.csv`;

    // 응답
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function convertToCSV(data: any[], columns: any[]): string {
  const headers = columns.map((col) => col.header).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = getNestedValue(row, col.key);
        return JSON.stringify(value ?? '');
      })
      .join(',')
  );
  return '\ufeff' + [headers, ...rows].join('\n'); // BOM for Excel
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
```

---

## 6. React Query Hook

**파일 위치**: `src/hooks/api/useDataBrowse.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { DataBrowseParams, DataBrowseResponse } from '@/lib/data-browse/types';

export function useDataBrowse(params: DataBrowseParams) {
  return useQuery<DataBrowseResponse>({
    queryKey: ['data-browse', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('table', params.table);
      searchParams.set('page', String(params.page));
      searchParams.set('limit', String(params.limit));
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.order) searchParams.set('order', params.order);
      if (params.filters?.search) searchParams.set('search', params.filters.search);
      if (params.filters && Object.keys(params.filters).length > 1) {
        const { search, ...restFilters } = params.filters;
        searchParams.set('filters', JSON.stringify(restFilters));
      }

      const response = await fetch(`/api/data/browse?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2분
    retry: 2,
  });
}
```

---

## 7. 충돌 방지 및 통합 전략

### 7.1 기존 컴포넌트 재사용

**재사용 가능한 컴포넌트**:
- ✅ `src/components/layout/dashboard-layout.tsx`
- ✅ `src/components/dashboard/data-table.tsx` (확장 필요)
- ✅ `src/components/dashboard/empty-state.tsx`
- ✅ `src/components/ui/select.tsx`
- ✅ `src/components/ui/input.tsx`
- ✅ `src/components/ui/button.tsx`
- ✅ `src/components/ui/table.tsx`
- ✅ `src/components/ui/sheet.tsx`
- ✅ `src/components/ui/skeleton.tsx`

### 7.2 신규 파일 목록

```
src/
├── app/
│   └── (protected)/
│       └── data/
│           └── browse/
│               └── page.tsx (신규)
├── app/api/
│   └── data/
│       ├── browse/
│       │   └── route.ts (신규)
│       └── export/
│           └── route.ts (신규)
├── components/
│   └── data-browse/
│       ├── data-browser-shell.tsx (신규)
│       ├── data-browser-skeleton.tsx (신규)
│       ├── table-selector.tsx (신규)
│       ├── filter-bar.tsx (신규)
│       ├── filter-panel.tsx (신규)
│       └── data-table-pagination.tsx (신규)
├── hooks/api/
│   └── useDataBrowse.ts (신규)
└── lib/data-browse/
    ├── table-config.ts (신규)
    └── types.ts (신규)
```

### 7.3 공통 모듈 의존성

**의존하는 공통 모듈**:
- `src/lib/auth/rbac.ts` (getUserRole)
- `src/lib/supabase/service-client.ts` (getSupabaseServiceClient)
- `src/lib/utils/date.ts` (formatDate)
- `src/lib/utils/number.ts` (formatNumber)

**충돌 방지**:
- 모든 신규 파일은 `data-browse/` 네임스페이스 내에 격리
- 기존 컴포넌트 수정 최소화 (DataTable만 확장)
- API 라우트는 `/api/data/browse`, `/api/data/export`로 명확히 분리

---

## 8. 단계별 구현 순서

### Phase 1: 기본 구조 (1-2일)

1. **테이블 설정 및 타입 정의**
   - `src/lib/data-browse/table-config.ts` 작성
   - `src/lib/data-browse/types.ts` 작성

2. **API 구현**
   - `src/app/api/data/browse/route.ts` 구현
   - 기본 쿼리 및 페이지네이션 동작 확인

3. **페이지 레이아웃**
   - `src/app/(protected)/data/browse/page.tsx` 작성
   - DashboardLayout 적용

### Phase 2: 핵심 기능 (2-3일)

4. **TableSelector 컴포넌트**
   - 테이블 선택 드롭다운
   - 상태 관리 및 URL 동기화

5. **DataBrowserShell 컴포넌트**
   - 메인 로직 통합
   - React Query 연동

6. **DataTable 확장**
   - 정렬 아이콘 추가
   - 타입별 셀 렌더링 (badge, link 등)

7. **Pagination 컴포넌트**
   - 페이지 이동 UI
   - 총 레코드 수 표시

### Phase 3: 검색 및 필터 (2일)

8. **FilterBar 컴포넌트**
   - 검색 입력 (디바운스)
   - 필터 Sheet 트리거

9. **FilterPanel 컴포넌트**
   - 날짜 범위, 숫자 범위, Select 필터
   - 필터 상태 관리

### Phase 4: 다운로드 기능 (1일)

10. **CSV 다운로드 API**
    - `src/app/api/data/export/route.ts` 구현
    - CSV 변환 로직

11. **다운로드 버튼 연동**
    - FilterBar에 다운로드 버튼
    - 진행률 표시 (선택 사항)

### Phase 5: 테스트 및 최적화 (1-2일)

12. **테스트**
    - 각 테이블별 조회 테스트
    - 검색, 필터, 정렬 동작 확인
    - 대용량 데이터 (1000행+) 테스트

13. **최적화**
    - 쿼리 성능 확인 (EXPLAIN ANALYZE)
    - 인덱스 추가 (필요 시)
    - 로딩 상태 UX 개선

---

## 9. 테스트 계획

### 9.1 단위 테스트

| 테스트 항목 | 입력 | 기대 결과 |
|-----------|------|----------|
| TABLE_CONFIGS 검증 | 각 테이블 설정 | 필수 필드 존재, 타입 일치 |
| getSelectClause | 테이블 이름 | 올바른 JOIN 구문 반환 |
| convertToCSV | 데이터 배열 | 유효한 CSV 문자열 |

### 9.2 통합 테스트

| 테스트 케이스 ID | 시나리오 | 기대 결과 |
|----------------|---------|----------|
| TC-14-01 | 논문 테이블 조회 (기본) | 50행 반환, 총 개수 표시 |
| TC-14-02 | 검색: "AI" 키워드 | 검색어 포함된 논문만 필터링 |
| TC-14-03 | 필터: SCIE 저널 | SCIE 논문만 표시 |
| TC-14-04 | 정렬: 게재일 내림차순 | 최신 논문이 상단에 표시 |
| TC-14-05 | 페이지 이동: 2페이지 | 51-100번 행 표시 |
| TC-14-06 | CSV 다운로드 | 파일 다운로드, UTF-8 인코딩 |
| TC-14-07 | 권한 없음 (viewer) | 403 Forbidden |
| TC-14-08 | 대용량 데이터 (5000행) | 페이지네이션 정상 동작 |

### 9.3 성능 테스트

- **목표 응답 시간**: 50행 조회 < 500ms
- **대용량 데이터**: 1000행 CSV 다운로드 < 5초
- **동시 사용자**: 5명 동시 조회 시 성능 저하 없음

---

## 10. 개선 사항 (v2.0)

### 10.1 고급 기능

- **행 선택 및 삭제**: 체크박스로 여러 행 선택 후 일괄 삭제
- **Excel 다운로드**: XLSX 형식 지원
- **상세 편집 모달**: 행 클릭 시 데이터 수정 가능
- **컬럼 가시성 설정**: 사용자가 표시할 컬럼 선택
- **저장된 필터**: 자주 사용하는 필터 프리셋 저장

### 10.2 UX 개선

- **가상 스크롤링**: react-window를 사용한 대용량 데이터 렌더링
- **고급 검색**: 여러 필드 동시 검색, 정규식 지원
- **북마크**: 특정 검색 조건을 URL로 저장하여 공유
- **실시간 업데이트**: Supabase Realtime으로 데이터 변경 감지

---

## 11. 보안 및 성능 고려사항

### 11.1 보안

- **권한 확인**: 모든 API에서 관리자 권한 검증
- **SQL Injection 방지**: Supabase Prepared Statements 사용
- **XSS 방지**: React 기본 이스케이핑 + DOMPurify (필요 시)
- **대용량 다운로드 제한**: 최대 10,000행으로 제한 (v1.0)

### 11.2 성능

- **인덱스 활용**: 정렬 컬럼에 인덱스 확인
- **COUNT 최적화**: `count: 'exact'` 대신 `count: 'estimated'` 고려 (대용량 데이터)
- **캐싱**: React Query 2분 staleTime
- **디바운스**: 검색 입력 300ms 디바운스

---

## 12. 완료 조건

### 12.1 기능 요구사항

- [ ] 5개 테이블 (KPI, 논문, 연구과제, 예산, 학생) 조회 가능
- [ ] 페이지네이션 (50행/페이지) 정상 동작
- [ ] 텍스트 검색 (디바운스 적용)
- [ ] 날짜, 숫자, Select 필터 동작
- [ ] 컬럼 정렬 (오름차순/내림차순)
- [ ] CSV 다운로드 (UTF-8 BOM, Excel 호환)
- [ ] 권한 확인 (관리자만 접근)

### 12.2 비기능 요구사항

- [ ] 응답 시간: 50행 조회 < 500ms
- [ ] 에러 핸들링: 네트워크 오류, DB 오류 처리
- [ ] 로딩 상태: Skeleton UI 표시
- [ ] 빈 상태: EmptyState 컴포넌트 표시
- [ ] URL 동기화: 검색 조건이 URL에 반영

### 12.3 코드 품질

- [ ] TypeScript strict mode 통과
- [ ] ESLint 경고 없음
- [ ] 컴포넌트 단위 테스트 (주요 로직)
- [ ] 충돌 없음: 기존 코드와 통합 확인

---

## 13. 문서 버전 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2025-11-02 | AI Assistant | 초기 작성: PRD, Userflow, UC-004 기반 |

---

**구현 계획 종료**

이 문서는 `/data/browse` 페이지의 상세 구현 계획을 담고 있으며, 기존 코드베이스와의 충돌을 최소화하고 공통 모듈을 최대한 재사용하도록 설계되었습니다.
