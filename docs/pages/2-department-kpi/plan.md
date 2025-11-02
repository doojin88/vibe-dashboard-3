# Implementation Plan: 학과별 KPI 대시보드
# Department KPI Dashboard

**버전:** 1.0
**작성일:** 2025-11-02
**페이지 경로:** `/dashboard/department/kpi`
**기반 문서:** PRD v1.0, Userflow v1.0, Database v2.0, Common Modules v1.0

---

## 목차

1. [페이지 개요](#1-페이지-개요)
2. [기능 요구사항](#2-기능-요구사항)
3. [데이터 설계](#3-데이터-설계)
4. [UI 컴포넌트 구조](#4-ui-컴포넌트-구조)
5. [상태 관리](#5-상태-관리)
6. [API 설계](#6-api-설계)
7. [구현 단계](#7-구현-단계)
8. [테스트 계획](#8-테스트-계획)
9. [성능 최적화](#9-성능-최적화)
10. [의존성 및 제약사항](#10-의존성-및-제약사항)

---

## 1. 페이지 개요

### 1.1 목적

학과별 상세 KPI 분석을 통해 각 학과의 성과를 비교하고, 취업률, 교원 현황, 기술이전 수입, 국제학술대회 개최 현황을 시각화합니다.

### 1.2 주요 기능

1. **다차원 필터링**
   - 평가년도 (다중 선택)
   - 단과대학 (다중 선택)
   - 학과 (다중 선택)

2. **KPI 시각화**
   - 학과별 취업률 비교 (막대 그래프)
   - 교원 현황 (전임/초빙 스택 바)
   - 기술이전 수입 Top 10 (순위 차트)
   - 국제학술대회 개최 현황 (히트맵)

3. **데이터 테이블**
   - 전체 KPI 메트릭 테이블
   - 정렬 및 페이지네이션
   - CSV 다운로드

### 1.3 사용자 시나리오

**시나리오 1: 경영진의 학과 성과 비교**
```
1. 페이지 접속 → 최신 평가년도 자동 선택
2. 필터 설정: 평가년도 2023, 단과대학 "공과대학"
3. 학과별 취업률 비교 차트 확인
4. 기술이전 수입 Top 10 확인
5. 특정 학과 클릭 → 상세 정보 모달
6. CSV 다운로드
```

**시나리오 2: 학과장의 자기 학과 성과 확인**
```
1. 페이지 접속
2. 필터 설정: 학과 "컴퓨터공학과"
3. 연도별 취업률 추이 확인
4. 교원 현황 파악
5. 경쟁 학과와 비교 (필터 추가)
```

### 1.4 접근 권한

- **인증 필수**: Clerk 로그인 필요
- **역할**: viewer, administrator 모두 접근 가능
- **RLS**: Application Level에서 제어

---

## 2. 기능 요구사항

### 2.1 필터링 (FR-FILTER)

#### FR-FILTER-001: 평가년도 필터
- **입력**: 다중 선택 드롭다운
- **데이터 소스**: `kpi_metrics.evaluation_year` (DISTINCT)
- **기본값**: 최신 년도
- **동작**: 선택 변경 시 즉시 데이터 재조회

#### FR-FILTER-002: 단과대학 필터
- **입력**: 다중 선택 드롭다운
- **데이터 소스**: `departments.college_name` (DISTINCT)
- **기본값**: 전체
- **동작**: 선택 시 학과 필터 옵션 업데이트 (연쇄 필터링)

#### FR-FILTER-003: 학과 필터
- **입력**: 다중 선택 드롭다운
- **데이터 소스**: `departments.department_name` (단과대학 필터링 적용)
- **기본값**: 전체
- **동작**: 선택 변경 시 즉시 데이터 재조회

#### FR-FILTER-004: 필터 상태 URL 동기화
- **요구사항**: 필터 설정을 URL 쿼리 파라미터로 저장
- **목적**: 공유 가능한 링크, 뒤로가기 지원
- **구현**: Next.js `useSearchParams`, `useRouter`
- **예시**: `/dashboard/department/kpi?year=2023&college=공과대학&dept=컴퓨터공학과`

#### FR-FILTER-005: 필터 초기화
- **버튼**: "초기화" 버튼 제공
- **동작**: 모든 필터를 기본값으로 리셋
- **결과**: URL 파라미터 제거, 데이터 재조회

### 2.2 KPI 요약 카드 (FR-SUMMARY)

#### FR-SUMMARY-001: 선택된 학과 수
- **표시**: "선택된 학과: 5개"
- **계산**: 필터링된 결과의 고유 학과 수

#### FR-SUMMARY-002: 평균 취업률
- **표시**: "평균 취업률: 75.2%"
- **계산**: 필터링된 학과의 `employment_rate` 가중 평균
- **가중치**: 학과별 졸업생 수 (데이터 없으면 단순 평균)

#### FR-SUMMARY-003: 평균 전임교원 수
- **표시**: "평균 전임교원: 12명"
- **계산**: 필터링된 학과의 `full_time_faculty` 평균

#### FR-SUMMARY-004: 총 기술이전 수입
- **표시**: "기술이전 수입: 52.3억원"
- **계산**: 필터링된 학과의 `tech_transfer_income` 합계

### 2.3 차트 시각화 (FR-CHART)

#### FR-CHART-001: 학과별 취업률 비교 (막대 그래프)
- **차트 유형**: 수평 막대 그래프 (Horizontal Bar Chart)
- **X축**: 취업률 (%)
- **Y축**: 학과명
- **정렬**: 취업률 내림차순 (상위 20개만 표시)
- **색상 코딩**:
  - 80% 이상: Green
  - 60-80%: Yellow
  - 60% 미만: Red
- **인터랙션**: 막대 클릭 시 상세 정보 모달
- **툴팁**: 학과명, 취업률, 전임교원 수

**차트 예시 데이터**:
```typescript
[
  { department: "컴퓨터공학과", employment_rate: 85.5, color: "green" },
  { department: "기계공학과", employment_rate: 78.2, color: "yellow" },
  { department: "전자공학과", employment_rate: 72.1, color: "yellow" },
  // ...
]
```

#### FR-CHART-002: 교원 현황 (스택 바 차트)
- **차트 유형**: 수평 스택 막대 그래프 (Stacked Horizontal Bar)
- **X축**: 교원 수 (명)
- **Y축**: 학과명
- **스택 구분**:
  - 전임교원 (Blue): `full_time_faculty`
  - 초빙교원 (Green): `visiting_faculty`
- **정렬**: 총 교원 수 내림차순
- **툴팁**: 학과명, 전임/초빙 교원 수, 비율

**차트 예시 데이터**:
```typescript
[
  {
    department: "컴퓨터공학과",
    full_time_faculty: 15,
    visiting_faculty: 3,
    total: 18
  },
  // ...
]
```

#### FR-CHART-003: 기술이전 수입 Top 10 (순위 차트)
- **차트 유형**: 수평 막대 그래프 (Top 10)
- **X축**: 기술이전 수입 (억원)
- **Y축**: 학과명 (순위 표시)
- **정렬**: 기술이전 수입 내림차순
- **표시**: 상위 10개 학과만
- **색상**: 그라데이션 (1위 진한 색 → 10위 연한 색)
- **툴팁**: 순위, 학과명, 기술이전 수입

**차트 예시 데이터**:
```typescript
[
  { rank: 1, department: "컴퓨터공학과", tech_transfer_income: 12.5 },
  { rank: 2, department: "전자공학과", tech_transfer_income: 8.3 },
  // ...
]
```

#### FR-CHART-004: 국제학술대회 개최 현황 (히트맵)
- **차트 유형**: 히트맵 (Heatmap)
- **X축**: 학과명
- **Y축**: 평가년도
- **색상**: 개최 횟수에 따라 색상 강도 변화
  - 0회: 흰색
  - 1-2회: 연한 파란색
  - 3-5회: 중간 파란색
  - 5회 이상: 진한 파란색
- **툴팁**: 학과명, 연도, 개최 횟수
- **조건**: 평가년도 필터가 다중 선택된 경우만 표시

**차트 예시 데이터**:
```typescript
[
  { department: "컴퓨터공학과", year: 2023, count: 5 },
  { department: "컴퓨터공학과", year: 2022, count: 3 },
  { department: "기계공학과", year: 2023, count: 2 },
  // ...
]
```

### 2.4 데이터 테이블 (FR-TABLE)

#### FR-TABLE-001: KPI 메트릭 테이블
- **컬럼**:
  - 평가년도
  - 단과대학
  - 학과
  - 취업률 (%)
  - 전임교원 (명)
  - 초빙교원 (명)
  - 기술이전 수입 (억원)
  - 국제학술대회 (회)
- **정렬**: 모든 컬럼 정렬 가능 (클릭)
- **페이지네이션**: 50행/페이지
- **필터링**: 전역 필터 적용
- **하이라이트**: 취업률 80% 이상 행 강조

#### FR-TABLE-002: CSV 다운로드
- **버튼**: "CSV 다운로드" 버튼
- **파일명**: `department_kpi_{timestamp}.csv`
- **데이터**: 현재 필터링된 전체 데이터
- **인코딩**: UTF-8 with BOM (한글 지원)

### 2.5 상세 정보 모달 (FR-MODAL)

#### FR-MODAL-001: 학과 상세 정보
- **트리거**: 차트 막대 클릭, 테이블 행 클릭
- **내용**:
  - 학과 기본 정보 (단과대학, 학과명)
  - 전체 KPI 메트릭 (최신 년도)
  - 연도별 취업률 추이 (라인 차트)
  - 교원 현황 상세
  - 기술이전 수입 추이
- **액션**: 닫기, CSV 다운로드

---

## 3. 데이터 설계

### 3.1 데이터 소스

#### 3.1.1 메인 데이터: kpi_metrics

```sql
SELECT
  k.id,
  k.evaluation_year,
  d.college_name,
  d.department_name,
  k.employment_rate,
  k.full_time_faculty,
  k.visiting_faculty,
  k.tech_transfer_income,
  k.intl_conference_count
FROM kpi_metrics k
JOIN departments d ON d.id = k.department_id
WHERE
  (k.evaluation_year = ANY($1) OR $1 IS NULL)
  AND (d.college_name = ANY($2) OR $2 IS NULL)
  AND (d.department_name = ANY($3) OR $3 IS NULL)
ORDER BY k.evaluation_year DESC, d.college_name, d.department_name;
```

**파라미터**:
- `$1`: `evaluation_year[]` (number[])
- `$2`: `college_name[]` (string[])
- `$3`: `department_name[]` (string[])

#### 3.1.2 필터 옵션 데이터

**평가년도 옵션**:
```sql
SELECT DISTINCT evaluation_year
FROM kpi_metrics
ORDER BY evaluation_year DESC;
```

**단과대학 옵션**:
```sql
SELECT DISTINCT college_name
FROM departments
ORDER BY college_name;
```

**학과 옵션 (단과대학 필터링)**:
```sql
SELECT DISTINCT department_name
FROM departments
WHERE college_name = ANY($1) OR $1 IS NULL
ORDER BY department_name;
```

#### 3.1.3 집계 데이터 (KPI 요약)

```sql
SELECT
  COUNT(DISTINCT d.id) AS department_count,
  AVG(k.employment_rate) AS avg_employment_rate,
  AVG(k.full_time_faculty) AS avg_full_time_faculty,
  SUM(k.tech_transfer_income) AS total_tech_transfer_income
FROM kpi_metrics k
JOIN departments d ON d.id = k.department_id
WHERE
  (k.evaluation_year = ANY($1) OR $1 IS NULL)
  AND (d.college_name = ANY($2) OR $2 IS NULL)
  AND (d.department_name = ANY($3) OR $3 IS NULL);
```

### 3.2 TypeScript 타입 정의

```typescript
// src/types/department-kpi.ts

export type KPIMetric = {
  id: string;
  evaluation_year: number;
  college_name: string;
  department_name: string;
  employment_rate: number | null;
  full_time_faculty: number | null;
  visiting_faculty: number | null;
  tech_transfer_income: number | null;
  intl_conference_count: number | null;
};

export type KPISummary = {
  department_count: number;
  avg_employment_rate: number | null;
  avg_full_time_faculty: number | null;
  total_tech_transfer_income: number | null;
};

export type KPIFilters = {
  evaluation_years?: number[];
  college_names?: string[];
  department_names?: string[];
};

export type FilterOptions = {
  evaluation_years: number[];
  college_names: string[];
  department_names: string[];
};

// 차트 데이터 타입
export type EmploymentRateChartData = {
  department: string;
  employment_rate: number;
  color: 'green' | 'yellow' | 'red';
};

export type FacultyChartData = {
  department: string;
  full_time_faculty: number;
  visiting_faculty: number;
  total: number;
};

export type TechTransferChartData = {
  rank: number;
  department: string;
  tech_transfer_income: number;
};

export type ConferenceHeatmapData = {
  department: string;
  year: number;
  count: number;
};
```

### 3.3 데이터 변환 로직

#### 3.3.1 취업률 색상 코딩
```typescript
function getEmploymentRateColor(rate: number | null): 'green' | 'yellow' | 'red' {
  if (rate === null) return 'red';
  if (rate >= 80) return 'green';
  if (rate >= 60) return 'yellow';
  return 'red';
}
```

#### 3.3.2 차트 데이터 변환
```typescript
function transformToEmploymentRateChart(
  metrics: KPIMetric[]
): EmploymentRateChartData[] {
  return metrics
    .filter((m) => m.employment_rate !== null)
    .map((m) => ({
      department: m.department_name,
      employment_rate: m.employment_rate!,
      color: getEmploymentRateColor(m.employment_rate),
    }))
    .sort((a, b) => b.employment_rate - a.employment_rate)
    .slice(0, 20); // 상위 20개만
}

function transformToFacultyChart(metrics: KPIMetric[]): FacultyChartData[] {
  return metrics
    .map((m) => ({
      department: m.department_name,
      full_time_faculty: m.full_time_faculty ?? 0,
      visiting_faculty: m.visiting_faculty ?? 0,
      total: (m.full_time_faculty ?? 0) + (m.visiting_faculty ?? 0),
    }))
    .sort((a, b) => b.total - a.total);
}

function transformToTechTransferChart(
  metrics: KPIMetric[]
): TechTransferChartData[] {
  return metrics
    .filter((m) => m.tech_transfer_income !== null && m.tech_transfer_income > 0)
    .map((m) => ({
      department: m.department_name,
      tech_transfer_income: m.tech_transfer_income!,
    }))
    .sort((a, b) => b.tech_transfer_income - a.tech_transfer_income)
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
}

function transformToConferenceHeatmap(
  metrics: KPIMetric[]
): ConferenceHeatmapData[] {
  return metrics
    .filter((m) => m.intl_conference_count !== null)
    .map((m) => ({
      department: m.department_name,
      year: m.evaluation_year,
      count: m.intl_conference_count!,
    }));
}
```

---

## 4. UI 컴포넌트 구조

### 4.1 컴포넌트 계층 구조

```
DepartmentKPIPage (페이지)
├── PageHeader (제목, 설명)
├── FilterSection
│   ├── YearFilter (다중 선택)
│   ├── CollegeFilter (다중 선택)
│   ├── DepartmentFilter (다중 선택)
│   └── ResetButton
├── SummarySection
│   ├── KPICard (선택된 학과 수)
│   ├── KPICard (평균 취업률)
│   ├── KPICard (평균 전임교원)
│   └── KPICard (총 기술이전 수입)
├── ChartsSection
│   ├── EmploymentRateChart (막대 그래프)
│   ├── FacultyChart (스택 바)
│   ├── TechTransferChart (순위 차트)
│   └── ConferenceHeatmap (히트맵)
└── DataTableSection
    ├── DownloadButton (CSV)
    └── KPIDataTable (테이블 + 페이지네이션)

DepartmentDetailModal (모달)
├── ModalHeader
├── BasicInfo
├── TrendChart (연도별 취업률)
├── FacultyDetail
└── ModalActions
```

### 4.2 파일 구조

```
src/
├── app/
│   └── dashboard/
│       └── department/
│           └── kpi/
│               └── page.tsx  (메인 페이지)
│
├── features/
│   └── department-kpi/
│       ├── api/
│       │   ├── get-kpi-metrics.ts
│       │   ├── get-kpi-summary.ts
│       │   └── get-filter-options.ts
│       ├── components/
│       │   ├── filter-section.tsx
│       │   ├── summary-section.tsx
│       │   ├── charts-section.tsx
│       │   │   ├── employment-rate-chart.tsx
│       │   │   ├── faculty-chart.tsx
│       │   │   ├── tech-transfer-chart.tsx
│       │   │   └── conference-heatmap.tsx
│       │   ├── data-table-section.tsx
│       │   └── department-detail-modal.tsx
│       ├── hooks/
│       │   ├── use-kpi-metrics.ts
│       │   ├── use-kpi-summary.ts
│       │   ├── use-filter-options.ts
│       │   └── use-kpi-filters.ts
│       ├── utils/
│       │   ├── transform-chart-data.ts
│       │   └── color-coding.ts
│       └── types.ts
│
└── backend/
    └── hono/
        └── routes/
            └── department-kpi.ts  (API Routes)
```

### 4.3 주요 컴포넌트 상세

#### 4.3.1 DepartmentKPIPage (page.tsx)

```typescript
// src/app/dashboard/department/kpi/page.tsx
'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FilterSection } from '@/features/department-kpi/components/filter-section';
import { SummarySection } from '@/features/department-kpi/components/summary-section';
import { ChartsSection } from '@/features/department-kpi/components/charts-section';
import { DataTableSection } from '@/features/department-kpi/components/data-table-section';
import { useKPIFilters } from '@/features/department-kpi/hooks/use-kpi-filters';
import { useKPIMetrics } from '@/features/department-kpi/hooks/use-kpi-metrics';
import { useKPISummary } from '@/features/department-kpi/hooks/use-kpi-summary';

export default function DepartmentKPIPage() {
  const { filters, updateFilters, resetFilters } = useKPIFilters();
  const { data: metrics, isLoading: metricsLoading } = useKPIMetrics(filters);
  const { data: summary, isLoading: summaryLoading } = useKPISummary(filters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold">학과별 KPI 대시보드</h1>
          <p className="text-muted-foreground">
            학과별 상세 KPI 분석 및 비교
          </p>
        </div>

        {/* 필터 섹션 */}
        <FilterSection
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
        />

        {/* KPI 요약 섹션 */}
        <SummarySection summary={summary} isLoading={summaryLoading} />

        {/* 차트 섹션 */}
        <ChartsSection metrics={metrics} isLoading={metricsLoading} />

        {/* 데이터 테이블 섹션 */}
        <DataTableSection metrics={metrics} isLoading={metricsLoading} />
      </div>
    </DashboardLayout>
  );
}
```

#### 4.3.2 FilterSection

```typescript
// src/features/department-kpi/components/filter-section.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { useFilterOptions } from '@/features/department-kpi/hooks/use-filter-options';
import type { KPIFilters } from '@/features/department-kpi/types';

type FilterSectionProps = {
  filters: KPIFilters;
  onFilterChange: (filters: Partial<KPIFilters>) => void;
  onReset: () => void;
};

export function FilterSection({
  filters,
  onFilterChange,
  onReset,
}: FilterSectionProps) {
  const { data: options, isLoading } = useFilterOptions(filters);

  return (
    <Card>
      <CardHeader>
        <CardTitle>필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 평가년도 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">평가년도</label>
            <MultiSelect
              options={options?.evaluation_years.map((year) => ({
                label: `${year}년`,
                value: String(year),
              })) ?? []}
              value={filters.evaluation_years?.map(String) ?? []}
              onChange={(values) =>
                onFilterChange({
                  evaluation_years: values.map(Number),
                })
              }
              placeholder="평가년도 선택"
              disabled={isLoading}
            />
          </div>

          {/* 단과대학 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">단과대학</label>
            <MultiSelect
              options={options?.college_names.map((name) => ({
                label: name,
                value: name,
              })) ?? []}
              value={filters.college_names ?? []}
              onChange={(values) =>
                onFilterChange({
                  college_names: values,
                  // 단과대학 변경 시 학과 필터 초기화
                  department_names: undefined,
                })
              }
              placeholder="단과대학 선택"
              disabled={isLoading}
            />
          </div>

          {/* 학과 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">학과</label>
            <MultiSelect
              options={options?.department_names.map((name) => ({
                label: name,
                value: name,
              })) ?? []}
              value={filters.department_names ?? []}
              onChange={(values) =>
                onFilterChange({
                  department_names: values,
                })
              }
              placeholder="학과 선택"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 초기화 버튼 */}
        <Button variant="outline" onClick={onReset} className="w-full">
          필터 초기화
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 4.3.3 EmploymentRateChart

```typescript
// src/features/department-kpi/components/charts-section/employment-rate-chart.tsx
'use client';

import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { EmploymentRateChartData } from '@/features/department-kpi/types';

type EmploymentRateChartProps = {
  data: EmploymentRateChartData[];
  isLoading?: boolean;
  onBarClick?: (department: string) => void;
};

const COLOR_MAP = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

export function EmploymentRateChart({
  data,
  isLoading,
  onBarClick,
}: EmploymentRateChartProps) {
  return (
    <ChartWrapper
      title="학과별 취업률 비교"
      description="상위 20개 학과"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} unit="%" />
          <YAxis type="category" dataKey="department" width={100} />
          <Tooltip
            formatter={(value: number) => `${value.toFixed(1)}%`}
            labelFormatter={(label) => `학과: ${label}`}
          />
          <Bar
            dataKey="employment_rate"
            onClick={(data) => onBarClick?.(data.department)}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLOR_MAP[entry.color]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
```

---

## 5. 상태 관리

### 5.1 URL 상태 관리 (필터)

```typescript
// src/features/department-kpi/hooks/use-kpi-filters.ts
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { KPIFilters } from '../types';

export function useKPIFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL에서 필터 파싱
  const filters: KPIFilters = useMemo(() => {
    const years = searchParams.get('years');
    const colleges = searchParams.get('colleges');
    const departments = searchParams.get('departments');

    return {
      evaluation_years: years ? years.split(',').map(Number) : undefined,
      college_names: colleges ? colleges.split(',') : undefined,
      department_names: departments ? departments.split(',') : undefined,
    };
  }, [searchParams]);

  // 필터 업데이트
  const updateFilters = useCallback(
    (newFilters: Partial<KPIFilters>) => {
      const params = new URLSearchParams(searchParams);

      // 새로운 필터 적용
      const merged = { ...filters, ...newFilters };

      // URL 파라미터 설정
      if (merged.evaluation_years?.length) {
        params.set('years', merged.evaluation_years.join(','));
      } else {
        params.delete('years');
      }

      if (merged.college_names?.length) {
        params.set('colleges', merged.college_names.join(','));
      } else {
        params.delete('colleges');
      }

      if (merged.department_names?.length) {
        params.set('departments', merged.department_names.join(','));
      } else {
        params.delete('departments');
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, searchParams, router, pathname]
  );

  // 필터 초기화
  const resetFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
```

### 5.2 서버 상태 관리 (React Query)

```typescript
// src/features/department-kpi/hooks/use-kpi-metrics.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { KPIFilters, KPIMetric } from '../types';
import { getKPIMetrics } from '../api/get-kpi-metrics';

export function useKPIMetrics(filters: KPIFilters) {
  return useQuery<KPIMetric[]>({
    queryKey: ['kpi-metrics', filters],
    queryFn: () => getKPIMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5분
    enabled: true, // 항상 활성화 (필터 없어도 전체 조회)
  });
}

// src/features/department-kpi/hooks/use-kpi-summary.ts
export function useKPISummary(filters: KPIFilters) {
  return useQuery({
    queryKey: ['kpi-summary', filters],
    queryFn: () => getKPISummary(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// src/features/department-kpi/hooks/use-filter-options.ts
export function useFilterOptions(filters: KPIFilters) {
  return useQuery({
    queryKey: ['kpi-filter-options', filters.college_names],
    queryFn: () => getFilterOptions(filters),
    staleTime: 10 * 60 * 1000, // 10분 (거의 변하지 않음)
  });
}
```

### 5.3 로컬 상태 관리 (모달)

```typescript
// src/features/department-kpi/components/department-detail-modal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DepartmentDetailModalProps = {
  department: string | null;
  onClose: () => void;
};

export function DepartmentDetailModal({
  department,
  onClose,
}: DepartmentDetailModalProps) {
  const [isOpen, setIsOpen] = useState(!!department);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  // 모달이 열릴 때 상세 데이터 조회
  const { data, isLoading } = useQuery({
    queryKey: ['department-detail', department],
    queryFn: () => getDepartmentDetail(department!),
    enabled: !!department,
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{department} 상세 정보</DialogTitle>
        </DialogHeader>
        {/* 상세 정보 렌더링 */}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. API 설계

### 6.1 API Routes (Hono)

```typescript
// src/backend/hono/routes/department-kpi.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const kpiFilterSchema = z.object({
  years: z.string().optional(), // "2021,2022,2023"
  colleges: z.string().optional(), // "공과대학,경영대학"
  departments: z.string().optional(), // "컴퓨터공학과,기계공학과"
});

export function registerDepartmentKPIRoutes(app: Hono<AppEnv>) {
  const kpi = new Hono<AppEnv>();

  // GET /api/department-kpi/metrics
  kpi.get('/metrics', zValidator('query', kpiFilterSchema), async (c) => {
    const { years, colleges, departments } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('kpi_metrics')
      .select(`
        id,
        evaluation_year,
        employment_rate,
        full_time_faculty,
        visiting_faculty,
        tech_transfer_income,
        intl_conference_count,
        departments (
          college_name,
          department_name
        )
      `);

    // 필터 적용
    if (years) {
      const yearArray = years.split(',').map(Number);
      query = query.in('evaluation_year', yearArray);
    }

    if (colleges) {
      const collegeArray = colleges.split(',');
      query = query.in('departments.college_name', collegeArray);
    }

    if (departments) {
      const deptArray = departments.split(',');
      query = query.in('departments.department_name', deptArray);
    }

    query = query.order('evaluation_year', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 데이터 변환 (Supabase JOIN 결과 평탄화)
    const transformed = data.map((row) => ({
      id: row.id,
      evaluation_year: row.evaluation_year,
      college_name: row.departments.college_name,
      department_name: row.departments.department_name,
      employment_rate: row.employment_rate,
      full_time_faculty: row.full_time_faculty,
      visiting_faculty: row.visiting_faculty,
      tech_transfer_income: row.tech_transfer_income,
      intl_conference_count: row.intl_conference_count,
    }));

    return c.json(transformed);
  });

  // GET /api/department-kpi/summary
  kpi.get('/summary', zValidator('query', kpiFilterSchema), async (c) => {
    const { years, colleges, departments } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 집계 쿼리 실행
    // PostgreSQL 집계 함수 사용
    const { data, error } = await supabase.rpc('get_kpi_summary', {
      p_years: years ? years.split(',').map(Number) : null,
      p_colleges: colleges ? colleges.split(',') : null,
      p_departments: departments ? departments.split(',') : null,
    });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  });

  // GET /api/department-kpi/filter-options
  kpi.get('/filter-options', zValidator('query', kpiFilterSchema), async (c) => {
    const { colleges } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 평가년도 옵션
    const { data: years } = await supabase
      .from('kpi_metrics')
      .select('evaluation_year')
      .order('evaluation_year', { ascending: false });

    // 단과대학 옵션
    const { data: collegeList } = await supabase
      .from('departments')
      .select('college_name')
      .order('college_name');

    // 학과 옵션 (단과대학 필터링)
    let deptQuery = supabase
      .from('departments')
      .select('department_name')
      .order('department_name');

    if (colleges) {
      deptQuery = deptQuery.in('college_name', colleges.split(','));
    }

    const { data: deptList } = await deptQuery;

    return c.json({
      evaluation_years: Array.from(new Set(years?.map((y) => y.evaluation_year) ?? [])),
      college_names: Array.from(new Set(collegeList?.map((c) => c.college_name) ?? [])),
      department_names: Array.from(new Set(deptList?.map((d) => d.department_name) ?? [])),
    });
  });

  app.route('/department-kpi', kpi);
}
```

### 6.2 PostgreSQL Stored Procedure (집계 최적화)

```sql
-- get_kpi_summary 함수 생성
CREATE OR REPLACE FUNCTION get_kpi_summary(
  p_years INTEGER[],
  p_colleges TEXT[],
  p_departments TEXT[]
)
RETURNS TABLE(
  department_count BIGINT,
  avg_employment_rate NUMERIC,
  avg_full_time_faculty NUMERIC,
  total_tech_transfer_income NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT d.id)::BIGINT,
    AVG(k.employment_rate),
    AVG(k.full_time_faculty::NUMERIC),
    SUM(k.tech_transfer_income)
  FROM kpi_metrics k
  JOIN departments d ON d.id = k.department_id
  WHERE
    (p_years IS NULL OR k.evaluation_year = ANY(p_years))
    AND (p_colleges IS NULL OR d.college_name = ANY(p_colleges))
    AND (p_departments IS NULL OR d.department_name = ANY(p_departments));
END;
$$;
```

### 6.3 API 클라이언트 함수

```typescript
// src/features/department-kpi/api/get-kpi-metrics.ts
import type { KPIFilters, KPIMetric } from '../types';

export async function getKPIMetrics(filters: KPIFilters): Promise<KPIMetric[]> {
  const params = new URLSearchParams();

  if (filters.evaluation_years?.length) {
    params.set('years', filters.evaluation_years.join(','));
  }
  if (filters.college_names?.length) {
    params.set('colleges', filters.college_names.join(','));
  }
  if (filters.department_names?.length) {
    params.set('departments', filters.department_names.join(','));
  }

  const response = await fetch(`/api/department-kpi/metrics?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch KPI metrics');
  }

  return response.json();
}

// src/features/department-kpi/api/get-kpi-summary.ts
export async function getKPISummary(filters: KPIFilters) {
  const params = new URLSearchParams();
  // ... (동일한 파라미터 설정)

  const response = await fetch(`/api/department-kpi/summary?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch KPI summary');
  }

  return response.json();
}

// src/features/department-kpi/api/get-filter-options.ts
export async function getFilterOptions(filters: KPIFilters) {
  const params = new URLSearchParams();
  if (filters.college_names?.length) {
    params.set('colleges', filters.college_names.join(','));
  }

  const response = await fetch(`/api/department-kpi/filter-options?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch filter options');
  }

  return response.json();
}
```

---

## 7. 구현 단계

### Phase 1: 기본 구조 (1주)

**Day 1-2: 프로젝트 설정 및 타입 정의**
- [ ] 디렉토리 구조 생성
- [ ] TypeScript 타입 정의 (`types.ts`)
- [ ] 공통 모듈 확인 (Layout, KPICard 등)

**Day 3-4: API 구현**
- [ ] Hono 라우트 구현 (`department-kpi.ts`)
- [ ] PostgreSQL Stored Procedure 생성 (`get_kpi_summary`)
- [ ] API 클라이언트 함수 작성
- [ ] Postman/Thunder Client로 API 테스트

**Day 5-7: 필터 및 데이터 로딩**
- [ ] `useKPIFilters` 훅 구현
- [ ] `useKPIMetrics`, `useKPISummary`, `useFilterOptions` 훅 구현
- [ ] `FilterSection` 컴포넌트 구현
- [ ] URL 파라미터 동기화 테스트

### Phase 2: 시각화 (1주)

**Day 8-9: KPI 요약 섹션**
- [ ] `SummarySection` 컴포넌트 구현
- [ ] KPICard 재사용 (공통 모듈)
- [ ] 로딩 상태 및 에러 처리

**Day 10-11: 차트 구현 (1)**
- [ ] `EmploymentRateChart` 구현
- [ ] `FacultyChart` 구현
- [ ] 색상 코딩 및 인터랙션

**Day 12-13: 차트 구현 (2)**
- [ ] `TechTransferChart` 구현
- [ ] `ConferenceHeatmap` 구현
- [ ] 툴팁 및 반응형 처리

**Day 14: 차트 통합**
- [ ] `ChartsSection` 컴포넌트 통합
- [ ] 차트 레이아웃 및 그리드 설정

### Phase 3: 데이터 테이블 및 모달 (3-4일)

**Day 15-16: 데이터 테이블**
- [ ] `KPIDataTable` 컴포넌트 구현
- [ ] 정렬 및 페이지네이션
- [ ] CSV 다운로드 기능

**Day 17-18: 상세 모달**
- [ ] `DepartmentDetailModal` 컴포넌트 구현
- [ ] 모달 데이터 조회 (개별 API)
- [ ] 연도별 추이 차트

### Phase 4: 통합 및 테스트 (2-3일)

**Day 19-20: 페이지 통합**
- [ ] `DepartmentKPIPage` 전체 통합
- [ ] 레이아웃 및 스타일링 최종 점검
- [ ] 반응형 디자인 테스트

**Day 21: 최종 테스트 및 배포**
- [ ] E2E 테스트 (수동)
- [ ] 성능 측정 (Lighthouse)
- [ ] 버그 수정 및 최적화

---

## 8. 테스트 계획

### 8.1 단위 테스트

**타입 유틸리티 함수**:
```typescript
// src/features/department-kpi/utils/__tests__/color-coding.test.ts
import { getEmploymentRateColor } from '../color-coding';

describe('getEmploymentRateColor', () => {
  it('should return green for rate >= 80', () => {
    expect(getEmploymentRateColor(85)).toBe('green');
    expect(getEmploymentRateColor(80)).toBe('green');
  });

  it('should return yellow for 60 <= rate < 80', () => {
    expect(getEmploymentRateColor(75)).toBe('yellow');
    expect(getEmploymentRateColor(60)).toBe('yellow');
  });

  it('should return red for rate < 60', () => {
    expect(getEmploymentRateColor(59)).toBe('red');
    expect(getEmploymentRateColor(0)).toBe('red');
  });

  it('should return red for null', () => {
    expect(getEmploymentRateColor(null)).toBe('red');
  });
});
```

### 8.2 통합 테스트

**API 테스트** (Postman/Thunder Client):
```
GET /api/department-kpi/metrics?years=2023&colleges=공과대학
→ 200 OK, 데이터 반환 확인

GET /api/department-kpi/summary?years=2023
→ 200 OK, 집계 데이터 확인

GET /api/department-kpi/filter-options
→ 200 OK, 필터 옵션 확인
```

### 8.3 E2E 테스트 (수동)

**시나리오 1: 필터 적용**
1. 페이지 접속
2. 평가년도 "2023" 선택
3. 단과대학 "공과대학" 선택
4. 차트 및 테이블 데이터 확인
5. URL 파라미터 확인: `?years=2023&colleges=공과대학`

**시나리오 2: 차트 인터랙션**
1. 취업률 차트에서 막대 클릭
2. 상세 모달 오픈 확인
3. 모달 데이터 확인
4. 모달 닫기

**시나리오 3: CSV 다운로드**
1. 필터 적용
2. "CSV 다운로드" 버튼 클릭
3. 파일 다운로드 확인
4. Excel에서 파일 열어 데이터 확인

### 8.4 성능 테스트

**Lighthouse 측정**:
- Performance Score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s

**React Query DevTools**:
- 캐시 히트율 확인
- 불필요한 재fetch 확인

---

## 9. 성능 최적화

### 9.1 데이터 페칭 최적화

**React Query 캐싱**:
```typescript
export function useKPIMetrics(filters: KPIFilters) {
  return useQuery({
    queryKey: ['kpi-metrics', filters],
    queryFn: () => getKPIMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    cacheTime: 10 * 60 * 1000, // 10분간 메모리 보관
  });
}
```

**병렬 요청**:
```typescript
// 필터 옵션과 메트릭 데이터 병렬 조회
const { data: options } = useFilterOptions(filters);
const { data: metrics } = useKPIMetrics(filters);
// React Query가 자동으로 병렬 요청
```

**디바운싱** (필요시):
```typescript
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const debouncedFilters = useDebouncedValue(filters, 300);
const { data } = useKPIMetrics(debouncedFilters);
```

### 9.2 차트 렌더링 최적화

**메모이제이션**:
```typescript
const chartData = useMemo(
  () => transformToEmploymentRateChart(metrics ?? []),
  [metrics]
);
```

**가상화** (대량 데이터 시):
```typescript
// react-window 사용 (테이블이 100행 이상일 때)
import { FixedSizeList } from 'react-window';
```

### 9.3 번들 최적화

**동적 임포트**:
```typescript
// 모달은 사용 시에만 로드
const DepartmentDetailModal = dynamic(
  () => import('./department-detail-modal'),
  { ssr: false }
);
```

**차트 라이브러리 트리 쉐이킹**:
```typescript
// 전체 Recharts 임포트 대신 필요한 컴포넌트만
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
```

### 9.4 이미지 및 에셋 최적화

- 차트 SVG 아이콘: Next.js Image 컴포넌트 사용
- 로딩 스켈레톤: Tailwind CSS 애니메이션 활용 (JS 불필요)

---

## 10. 의존성 및 제약사항

### 10.1 의존 모듈

**공통 모듈 (반드시 먼저 구현 필요)**:
- `src/components/layout/dashboard-layout.tsx`
- `src/components/dashboard/kpi-card.tsx`
- `src/components/charts/chart-wrapper.tsx`
- `src/lib/supabase/service-client.ts`
- `src/lib/auth/rbac.ts`

**외부 라이브러리**:
- `recharts`: 차트 라이브러리
- `@tanstack/react-query`: 서버 상태 관리
- `zod`: 스키마 검증
- `date-fns`: 날짜 포맷팅

### 10.2 데이터베이스 의존성

**필수 테이블**:
- `departments`
- `kpi_metrics`

**필수 Stored Procedure**:
- `get_kpi_summary()`

**마이그레이션**:
```sql
-- 20251102000004_add_kpi_summary_function.sql
CREATE OR REPLACE FUNCTION get_kpi_summary(...) ...;
```

### 10.3 제약사항

**기술적 제약**:
- 차트는 Recharts 라이브러리 사용 (다른 라이브러리 금지)
- 필터는 URL 파라미터로만 관리 (로컬 스토리지 사용 금지)
- 페이지네이션은 Offset 방식 (Cursor 방식 미사용)

**데이터 제약**:
- kpi_metrics 테이블에 데이터가 없으면 빈 상태 UI 표시
- 평가년도가 1개만 있으면 히트맵 차트 숨김
- 학과가 20개 이상이면 취업률 차트는 상위 20개만 표시

**성능 제약**:
- 초기 로딩 시간 < 2초 (3G 네트워크)
- 차트 렌더링 시간 < 500ms
- 필터 적용 후 데이터 로드 < 1초

### 10.4 향후 확장 고려사항

**Phase 2 기능**:
- 차트 PNG/SVG 다운로드
- 히트맵 확대/축소 (줌)
- 학과 비교 모드 (2개 학과 나란히 비교)
- 목표 설정 및 달성률 표시

**Phase 3 기능**:
- 실시간 데이터 업데이트 (Supabase Realtime)
- AI 기반 인사이트 (취업률 예측)
- 커스텀 리포트 생성

---

## 부록

### A. 샘플 데이터

```typescript
// 테스트용 샘플 데이터
const SAMPLE_KPI_METRICS: KPIMetric[] = [
  {
    id: '1',
    evaluation_year: 2023,
    college_name: '공과대학',
    department_name: '컴퓨터공학과',
    employment_rate: 85.5,
    full_time_faculty: 15,
    visiting_faculty: 3,
    tech_transfer_income: 12.5,
    intl_conference_count: 5,
  },
  {
    id: '2',
    evaluation_year: 2023,
    college_name: '공과대학',
    department_name: '기계공학과',
    employment_rate: 78.2,
    full_time_faculty: 18,
    visiting_faculty: 2,
    tech_transfer_income: 8.3,
    intl_conference_count: 3,
  },
  // ...
];
```

### B. 에러 메시지

| 에러 상황 | 메시지 | 복구 방안 |
|----------|--------|----------|
| API 실패 | "데이터를 불러오는 중 오류가 발생했습니다" | 재시도 버튼 |
| 데이터 없음 | "선택한 필터에 해당하는 데이터가 없습니다" | 필터 초기화 버튼 |
| 네트워크 오류 | "네트워크 연결을 확인해주세요" | 재시도 버튼 |
| 권한 없음 | "접근 권한이 없습니다" | 대시보드로 돌아가기 |

### C. 개발 체크리스트

**Phase 1 완료 조건**:
- [ ] API 엔드포인트 3개 모두 정상 작동
- [ ] 필터 URL 동기화 정상 작동
- [ ] React Query 캐싱 확인

**Phase 2 완료 조건**:
- [ ] 차트 4개 모두 정상 렌더링
- [ ] 툴팁 및 인터랙션 정상 작동
- [ ] 반응형 디자인 확인 (모바일/태블릿/데스크톱)

**Phase 3 완료 조건**:
- [ ] 데이터 테이블 정렬/페이지네이션 정상 작동
- [ ] CSV 다운로드 정상 작동
- [ ] 상세 모달 오픈/닫기 정상 작동

**Phase 4 완료 조건**:
- [ ] E2E 테스트 시나리오 3개 모두 통과
- [ ] Lighthouse Performance Score > 90
- [ ] 에러 핸들링 모든 케이스 확인

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design, Common Modules 문서를 기반으로 작성되었으며, 학과별 KPI 대시보드 페이지의 완전한 구현을 위한 단계별 가이드를 제공합니다.
