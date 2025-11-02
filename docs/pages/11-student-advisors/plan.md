# Implementation Plan: 지도교수별 현황
# Student Advisors Dashboard

**버전:** 1.0
**작성일:** 2025-11-02
**페이지 경로:** `/dashboard/students/advisors`
**기반 문서:** PRD v1.0, Userflow v1.0, Database v2.0, Common Modules v1.0, UC-006 (학생 현황 관리)

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

교수별 지도학생 수 및 분포를 시각화하여, 학과별 평균 지도학생 수를 파악하고 교수의 지도 부담을 분석합니다. 교수진은 본인의 지도학생 목록을 확인하고, 경영진은 전체 지도 현황을 모니터링할 수 있습니다.

### 1.2 주요 기능

1. **필터링**
   - 학과 선택 (드롭다운)
   - 지도교수 검색 (텍스트 입력, 자동완성)
   - 과정구분 필터 (학사/석사/박사)

2. **통계 시각화**
   - 교수별 지도학생 수 분포 (히스토그램)
   - 과정구분별 분포 (스택 바)
   - 학과별 평균 지도학생 수 (막대 그래프)

3. **교수별 상세 정보**
   - 확장 가능한 테이블 행 (교수 클릭 시 지도학생 목록 표시)
   - 학생 정보 (학번, 이름, 학과, 과정구분, 학적상태)
   - CSV 다운로드 (현재 교수의 지도학생 목록)

### 1.3 사용자 시나리오

**시나리오 1: 교수진의 본인 지도학생 확인**
```
1. 페이지 접속 → 자동으로 본인 이름 필터 적용
2. KPI 카드에서 지도학생 수 확인 (학사/석사/박사 분포)
3. 지도학생 목록 테이블 확인
4. 특정 학생의 학적상태 확인 (재학/휴학 등)
5. 지도학생 목록 CSV 다운로드
```

**시나리오 2: 경영진의 전체 지도 현황 파악**
```
1. 페이지 접속 → 전체 교수 현황 표시
2. KPI 카드에서 총 지도교수 수, 평균 지도학생 수 확인
3. 히스토그램에서 지도학생 수 분포 확인 (1-5명, 6-10명 등)
4. 특정 학과 필터 적용 → 해당 학과 교수별 현황 확인
5. 지도학생이 많은 교수 파악 → 지도 부담 조정 검토
```

**시나리오 3: 학과장의 소속 학과 교수 현황 분석**
```
1. 페이지 접속
2. 학과 필터: "컴퓨터공학과" 선택
3. 소속 교수들의 지도학생 수 비교
4. 특정 교수 행 클릭 → 지도학생 목록 확인
5. 과정구분별 분포 확인 (석사 편중 vs 학사 편중)
```

### 1.4 접근 권한

- **인증 필수**: Clerk 로그인 필요
- **역할**: viewer, administrator 모두 접근 가능
- **교수진 특별 처리**: Clerk User Metadata에서 이름 추출 후 자동 필터 적용
- **RLS**: Application Level에서 제어

---

## 2. 기능 요구사항

### 2.1 필터링 (FR-FILTER)

#### FR-FILTER-001: 학과 필터
- **입력**: 단일 선택 드롭다운
- **데이터 소스**: `departments.department_name` (DISTINCT)
- **기본값**: 전체
- **동작**: 선택 변경 시 즉시 데이터 재조회

#### FR-FILTER-002: 지도교수 검색
- **입력**: 텍스트 입력 필드 (자동완성 지원)
- **데이터 소스**: `students.advisor` (DISTINCT, NOT NULL)
- **동작**: 입력 시 디바운싱(300ms) 후 자동완성 옵션 표시
- **검색 방식**: 부분 일치 (ILIKE)

#### FR-FILTER-003: 과정구분 필터
- **입력**: 체크박스 (다중 선택)
- **옵션**: 학사, 석사, 박사, 석박통합
- **기본값**: 전체 선택
- **동작**: 선택 변경 시 즉시 데이터 재조회

#### FR-FILTER-004: 교수진 자동 필터 적용
- **조건**: Clerk User Metadata에 `name` 필드 존재
- **동작**:
  1. 페이지 로드 시 사용자 정보 조회
  2. 사용자 이름이 교수 목록에 존재하는지 확인
  3. 존재하면 자동으로 지도교수 필터에 이름 적용
  4. "본인 지도학생만 보기" 체크박스 표시 (해제 가능)

#### FR-FILTER-005: 필터 상태 URL 동기화
- **요구사항**: 필터 설정을 URL 쿼리 파라미터로 저장
- **목적**: 공유 가능한 링크, 뒤로가기 지원
- **구현**: Next.js `useSearchParams`, `useRouter`
- **예시**: `/dashboard/students/advisors?department=컴퓨터공학과&advisor=김철수`

#### FR-FILTER-006: 필터 초기화
- **버튼**: "초기화" 버튼 제공
- **동작**: 모든 필터를 기본값으로 리셋 (교수진 자동 필터 제외)
- **결과**: URL 파라미터 제거, 데이터 재조회

### 2.2 KPI 요약 카드 (FR-SUMMARY)

#### FR-SUMMARY-001: 총 지도교수 수
- **표시**: "총 지도교수: 234명"
- **계산**: `COUNT(DISTINCT advisor)` (advisor IS NOT NULL)
- **필터 적용**: 선택된 학과 및 과정구분 필터 반영

#### FR-SUMMARY-002: 평균 지도학생 수
- **표시**: "평균 지도학생: 6.2명"
- **계산**: `총 지도학생 수 / 지도교수 수`
- **필터 적용**: 현재 학적상태가 '재학'인 학생만 포함

#### FR-SUMMARY-003: 최다 지도학생 수
- **표시**: "최다 지도학생: 15명 (김철수 교수)"
- **계산**: 교수별 지도학생 수의 최댓값 및 해당 교수 이름
- **필터 적용**: 현재 필터 조건에서의 최댓값

#### FR-SUMMARY-004: 지도교수 미지정 학생 수
- **표시**: "미지정 학생: 23명"
- **계산**: `COUNT(*) WHERE advisor IS NULL AND enrollment_status = '재학'`
- **색상**: 경고 아이콘 (노란색) - 미지정 학생이 있을 경우

### 2.3 차트 시각화 (FR-CHART)

#### FR-CHART-001: 교수별 지도학생 수 분포 (히스토그램)
- **차트 유형**: 히스토그램 (Histogram)
- **X축**: 지도학생 수 구간 (1-5명, 6-10명, 11-15명, 16-20명, 21명 이상)
- **Y축**: 교수 수 (명)
- **색상**: 단일 색상 (Blue)
- **툴팁**: 구간, 교수 수
- **인터랙션**: 막대 클릭 시 해당 구간 교수 목록 필터링

**구간 정의**:
```typescript
const HISTOGRAM_BINS = [
  { min: 1, max: 5, label: '1-5명' },
  { min: 6, max: 10, label: '6-10명' },
  { min: 11, max: 15, label: '11-15명' },
  { min: 16, max: 20, label: '16-20명' },
  { min: 21, max: Infinity, label: '21명 이상' },
];
```

**차트 예시 데이터**:
```typescript
[
  { bin: '1-5명', count: 85 },
  { bin: '6-10명', count: 102 },
  { bin: '11-15명', count: 38 },
  { bin: '16-20명', count: 7 },
  { bin: '21명 이상', count: 2 },
]
```

#### FR-CHART-002: 과정구분별 분포 (스택 바)
- **차트 유형**: 수평 스택 막대 그래프 (Stacked Horizontal Bar)
- **X축**: 학생 수 (명)
- **Y축**: 교수명 (상위 20명만 표시)
- **스택 구분**:
  - 학사 (Blue): `COUNT(*) WHERE program_type = '학사'`
  - 석사 (Green): `COUNT(*) WHERE program_type = '석사'`
  - 박사 (Orange): `COUNT(*) WHERE program_type = '박사'`
  - 석박통합 (Purple): `COUNT(*) WHERE program_type = '석박통합'`
- **정렬**: 총 지도학생 수 내림차순
- **툴팁**: 교수명, 과정구분, 학생 수, 비율

**차트 예시 데이터**:
```typescript
[
  {
    advisor: '김철수',
    undergraduate: 4,
    master: 6,
    doctoral: 2,
    integrated: 0,
    total: 12
  },
  // ...
]
```

#### FR-CHART-003: 학과별 평균 지도학생 수 (막대 그래프)
- **차트 유형**: 수평 막대 그래프 (Horizontal Bar Chart)
- **X축**: 평균 지도학생 수 (명)
- **Y축**: 학과명
- **정렬**: 평균 지도학생 수 내림차순
- **색상 코딩**:
  - 10명 이상: Red (과부하)
  - 5-10명: Yellow (적정)
  - 5명 미만: Green (여유)
- **툴팁**: 학과명, 평균 지도학생 수, 총 교수 수
- **인터랙션**: 막대 클릭 시 해당 학과 필터 적용

**차트 예시 데이터**:
```typescript
[
  {
    department: '컴퓨터공학과',
    avg_students: 8.5,
    total_advisors: 15,
    color: 'yellow'
  },
  {
    department: '기계공학과',
    avg_students: 12.3,
    total_advisors: 18,
    color: 'red'
  },
  // ...
]
```

### 2.4 교수별 상세 테이블 (FR-TABLE)

#### FR-TABLE-001: 교수별 통계 테이블
- **컬럼**:
  - 교수명 (advisor)
  - 소속학과 (department_name)
  - 지도학생 수 (total_students)
  - 학사 (undergraduate)
  - 석사 (master)
  - 박사 (doctoral)
  - 석박통합 (integrated)
  - 미지정 학생 제외 여부 표시
- **정렬**: 모든 컬럼 정렬 가능 (기본: 지도학생 수 내림차순)
- **페이지네이션**: 50행/페이지
- **확장 가능 행**: 행 클릭 시 지도학생 목록 표시

#### FR-TABLE-002: 확장 가능 행 (지도학생 목록)
- **트리거**: 테이블 행 클릭 (또는 확장 아이콘 클릭)
- **컬럼**:
  - 학번 (student_number)
  - 이름 (name)
  - 학과 (department_name)
  - 과정구분 (program_type)
  - 학년 (grade)
  - 학적상태 (enrollment_status)
- **정렬**: 학번 오름차순 (기본)
- **하이라이트**: 학적상태가 '휴학'인 학생 노란색 배경

#### FR-TABLE-003: CSV 다운로드
- **버튼**: "CSV 다운로드" 버튼 (교수별 또는 전체)
- **교수별 다운로드**: 확장된 행의 "다운로드" 버튼 클릭
  - 파일명: `advisor_{교수명}_{timestamp}.csv`
  - 데이터: 해당 교수의 지도학생 목록
- **전체 다운로드**: 테이블 상단 "전체 다운로드" 버튼 클릭
  - 파일명: `all_advisors_{timestamp}.csv`
  - 데이터: 현재 필터링된 모든 교수 및 지도학생 정보
- **인코딩**: UTF-8 with BOM (한글 지원)

### 2.5 상세 정보 모달 (FR-MODAL)

#### FR-MODAL-001: 교수 상세 정보 모달 (선택 사항)
- **트리거**: 교수명 클릭 (테이블에서)
- **내용**:
  - 교수 기본 정보 (이름, 소속 학과)
  - 지도학생 통계 (총 인원, 과정별 분포)
  - 연도별 지도학생 추이 (라인 차트) - 향후 확장
  - 지도학생 목록 (페이지네이션)
- **액션**: 닫기, CSV 다운로드

**Note**: MVP에서는 확장 가능 행으로 대체 가능 (모달 생략)

---

## 3. 데이터 설계

### 3.1 데이터 소스

#### 3.1.1 메인 데이터: students (지도교수별 집계)

```sql
SELECT
  s.advisor,
  d.department_name,
  COUNT(*) AS total_students,
  COUNT(*) FILTER (WHERE s.program_type = '학사') AS undergraduate,
  COUNT(*) FILTER (WHERE s.program_type = '석사') AS master,
  COUNT(*) FILTER (WHERE s.program_type = '박사') AS doctoral,
  COUNT(*) FILTER (WHERE s.program_type = '석박통합') AS integrated
FROM students s
JOIN departments d ON d.id = s.department_id
WHERE
  s.enrollment_status = '재학'
  AND s.advisor IS NOT NULL
  AND (d.department_name = $1 OR $1 IS NULL)
  AND (s.advisor ILIKE '%' || $2 || '%' OR $2 IS NULL)
  AND (s.program_type = ANY($3) OR $3 IS NULL)
GROUP BY s.advisor, d.department_name
ORDER BY total_students DESC;
```

**파라미터**:
- `$1`: `department_name` (string | null)
- `$2`: `advisor_search` (string | null)
- `$3`: `program_types[]` (string[] | null)

#### 3.1.2 교수별 지도학생 목록

```sql
SELECT
  s.student_number,
  s.name,
  d.department_name,
  s.program_type,
  s.grade,
  s.enrollment_status
FROM students s
JOIN departments d ON d.id = s.department_id
WHERE
  s.advisor = $1
  AND s.enrollment_status = '재학'
ORDER BY s.student_number ASC;
```

**파라미터**:
- `$1`: `advisor_name` (string)

#### 3.1.3 필터 옵션 데이터

**학과 옵션**:
```sql
SELECT DISTINCT d.department_name
FROM departments d
WHERE EXISTS (
  SELECT 1 FROM students s
  WHERE s.department_id = d.id
    AND s.advisor IS NOT NULL
)
ORDER BY d.department_name;
```

**지도교수 자동완성 옵션**:
```sql
SELECT DISTINCT advisor
FROM students
WHERE advisor IS NOT NULL
  AND advisor ILIKE '%' || $1 || '%'
ORDER BY advisor
LIMIT 10;
```

**파라미터**:
- `$1`: `search_term` (string)

#### 3.1.4 집계 데이터 (KPI 요약)

```sql
-- 총 지도교수 수, 평균 지도학생 수, 최다 지도학생 수
WITH advisor_stats AS (
  SELECT
    s.advisor,
    COUNT(*) AS student_count
  FROM students s
  JOIN departments d ON d.id = s.department_id
  WHERE
    s.enrollment_status = '재학'
    AND s.advisor IS NOT NULL
    AND (d.department_name = $1 OR $1 IS NULL)
    AND (s.program_type = ANY($2) OR $2 IS NULL)
  GROUP BY s.advisor
)
SELECT
  COUNT(*)::INTEGER AS total_advisors,
  AVG(student_count)::NUMERIC(10,1) AS avg_students_per_advisor,
  MAX(student_count)::INTEGER AS max_students,
  (SELECT advisor FROM advisor_stats ORDER BY student_count DESC LIMIT 1) AS top_advisor
FROM advisor_stats;

-- 미지정 학생 수
SELECT COUNT(*)::INTEGER AS unassigned_students
FROM students
WHERE enrollment_status = '재학'
  AND advisor IS NULL;
```

### 3.2 TypeScript 타입 정의

```typescript
// src/types/student-advisors.ts

export type AdvisorStat = {
  advisor: string;
  department_name: string;
  total_students: number;
  undergraduate: number;
  master: number;
  doctoral: number;
  integrated: number;
};

export type AdvisorSummary = {
  total_advisors: number;
  avg_students_per_advisor: number;
  max_students: number;
  top_advisor: string | null;
  unassigned_students: number;
};

export type AdvisorFilters = {
  department_name?: string;
  advisor_search?: string;
  program_types?: ('학사' | '석사' | '박사' | '석박통합')[];
};

export type FilterOptions = {
  department_names: string[];
  advisor_suggestions: string[];
};

export type StudentInfo = {
  student_number: string;
  name: string;
  department_name: string;
  program_type: '학사' | '석사' | '박사' | '석박통합';
  grade: number | null;
  enrollment_status: '재학' | '휴학' | '졸업' | '자퇴' | '제적';
};

// 차트 데이터 타입
export type HistogramData = {
  bin: string; // "1-5명", "6-10명", etc.
  count: number;
};

export type ProgramDistributionData = {
  advisor: string;
  undergraduate: number;
  master: number;
  doctoral: number;
  integrated: number;
  total: number;
};

export type DepartmentAvgData = {
  department: string;
  avg_students: number;
  total_advisors: number;
  color: 'green' | 'yellow' | 'red';
};
```

### 3.3 데이터 변환 로직

#### 3.3.1 히스토그램 데이터 변환

```typescript
const HISTOGRAM_BINS = [
  { min: 1, max: 5, label: '1-5명' },
  { min: 6, max: 10, label: '6-10명' },
  { min: 11, max: 15, label: '11-15명' },
  { min: 16, max: 20, label: '16-20명' },
  { min: 21, max: Infinity, label: '21명 이상' },
] as const;

function transformToHistogram(stats: AdvisorStat[]): HistogramData[] {
  const bins = HISTOGRAM_BINS.map((bin) => ({
    bin: bin.label,
    count: 0,
  }));

  stats.forEach((stat) => {
    const binIndex = HISTOGRAM_BINS.findIndex(
      (bin) => stat.total_students >= bin.min && stat.total_students <= bin.max
    );
    if (binIndex !== -1) {
      bins[binIndex].count += 1;
    }
  });

  return bins;
}
```

#### 3.3.2 학과별 평균 색상 코딩

```typescript
function getDepartmentAvgColor(avgStudents: number): 'green' | 'yellow' | 'red' {
  if (avgStudents >= 10) return 'red';
  if (avgStudents >= 5) return 'yellow';
  return 'green';
}

function transformToDepartmentAvg(
  stats: AdvisorStat[]
): DepartmentAvgData[] {
  const deptMap = new Map<string, { total: number; count: number }>();

  stats.forEach((stat) => {
    const existing = deptMap.get(stat.department_name) ?? { total: 0, count: 0 };
    deptMap.set(stat.department_name, {
      total: existing.total + stat.total_students,
      count: existing.count + 1,
    });
  });

  return Array.from(deptMap.entries())
    .map(([department, { total, count }]) => ({
      department,
      avg_students: total / count,
      total_advisors: count,
      color: getDepartmentAvgColor(total / count),
    }))
    .sort((a, b) => b.avg_students - a.avg_students);
}
```

#### 3.3.3 과정구분별 분포 변환

```typescript
function transformToProgramDistribution(
  stats: AdvisorStat[]
): ProgramDistributionData[] {
  return stats
    .map((stat) => ({
      advisor: stat.advisor,
      undergraduate: stat.undergraduate,
      master: stat.master,
      doctoral: stat.doctoral,
      integrated: stat.integrated,
      total: stat.total_students,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20); // 상위 20명만
}
```

---

## 4. UI 컴포넌트 구조

### 4.1 컴포넌트 계층 구조

```
StudentAdvisorsPage (페이지)
├── PageHeader (제목, 설명)
├── FilterSection
│   ├── DepartmentFilter (단일 선택)
│   ├── AdvisorSearchInput (자동완성)
│   ├── ProgramTypeFilter (체크박스)
│   └── ResetButton
├── SummarySection
│   ├── KPICard (총 지도교수 수)
│   ├── KPICard (평균 지도학생 수)
│   ├── KPICard (최다 지도학생 수)
│   └── KPICard (미지정 학생 수)
├── ChartsSection
│   ├── HistogramChart (지도학생 수 분포)
│   ├── ProgramDistributionChart (과정구분별 스택 바)
│   └── DepartmentAvgChart (학과별 평균)
└── AdvisorsTableSection
    ├── DownloadButton (전체 CSV)
    └── AdvisorsTable
        └── ExpandableRow (지도학생 목록)
```

### 4.2 파일 구조

```
src/
├── app/
│   └── dashboard/
│       └── students/
│           └── advisors/
│               └── page.tsx  (메인 페이지)
│
├── features/
│   └── student-advisors/
│       ├── api/
│       │   ├── get-advisor-stats.ts
│       │   ├── get-advisor-summary.ts
│       │   ├── get-students-by-advisor.ts
│       │   └── get-filter-options.ts
│       ├── components/
│       │   ├── filter-section.tsx
│       │   ├── summary-section.tsx
│       │   ├── charts-section.tsx
│       │   │   ├── histogram-chart.tsx
│       │   │   ├── program-distribution-chart.tsx
│       │   │   └── department-avg-chart.tsx
│       │   └── advisors-table-section.tsx
│       │       ├── advisors-table.tsx
│       │       └── expandable-row.tsx
│       ├── hooks/
│       │   ├── use-advisor-stats.ts
│       │   ├── use-advisor-summary.ts
│       │   ├── use-students-by-advisor.ts
│       │   ├── use-filter-options.ts
│       │   ├── use-advisor-filters.ts
│       │   └── use-current-user-advisor.ts
│       ├── utils/
│       │   ├── transform-chart-data.ts
│       │   └── color-coding.ts
│       └── types.ts
│
└── backend/
    └── hono/
        └── routes/
            └── student-advisors.ts  (API Routes)
```

### 4.3 주요 컴포넌트 상세

#### 4.3.1 StudentAdvisorsPage (page.tsx)

```typescript
// src/app/dashboard/students/advisors/page.tsx
'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FilterSection } from '@/features/student-advisors/components/filter-section';
import { SummarySection } from '@/features/student-advisors/components/summary-section';
import { ChartsSection } from '@/features/student-advisors/components/charts-section';
import { AdvisorsTableSection } from '@/features/student-advisors/components/advisors-table-section';
import { useAdvisorFilters } from '@/features/student-advisors/hooks/use-advisor-filters';
import { useAdvisorStats } from '@/features/student-advisors/hooks/use-advisor-stats';
import { useAdvisorSummary } from '@/features/student-advisors/hooks/use-advisor-summary';
import { useCurrentUserAdvisor } from '@/features/student-advisors/hooks/use-current-user-advisor';

export default function StudentAdvisorsPage() {
  const { filters, updateFilters, resetFilters } = useAdvisorFilters();
  const { currentUserName, isAdvisor } = useCurrentUserAdvisor();
  const { data: stats, isLoading: statsLoading } = useAdvisorStats(filters);
  const { data: summary, isLoading: summaryLoading } = useAdvisorSummary(filters);

  // 교수진인 경우 본인 이름으로 자동 필터 적용 (초기 한 번만)
  const [autoApplied, setAutoApplied] = useState(false);
  useEffect(() => {
    if (isAdvisor && currentUserName && !autoApplied && !filters.advisor_search) {
      updateFilters({ advisor_search: currentUserName });
      setAutoApplied(true);
    }
  }, [isAdvisor, currentUserName, autoApplied, filters.advisor_search, updateFilters]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold">지도교수별 현황</h1>
          <p className="text-muted-foreground">
            교수별 지도학생 수 및 분포 분석
          </p>
          {isAdvisor && (
            <p className="text-sm text-blue-600 mt-2">
              본인 지도학생 목록이 표시됩니다.
            </p>
          )}
        </div>

        {/* 필터 섹션 */}
        <FilterSection
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          currentUserAdvisor={isAdvisor ? currentUserName : undefined}
        />

        {/* KPI 요약 섹션 */}
        <SummarySection summary={summary} isLoading={summaryLoading} />

        {/* 차트 섹션 */}
        <ChartsSection stats={stats} isLoading={statsLoading} />

        {/* 교수별 테이블 섹션 */}
        <AdvisorsTableSection stats={stats} isLoading={statsLoading} />
      </div>
    </DashboardLayout>
  );
}
```

#### 4.3.2 FilterSection

```typescript
// src/features/student-advisors/components/filter-section.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useFilterOptions } from '@/features/student-advisors/hooks/use-filter-options';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { AdvisorFilters } from '@/features/student-advisors/types';

const PROGRAM_TYPES = ['학사', '석사', '박사', '석박통합'] as const;

type FilterSectionProps = {
  filters: AdvisorFilters;
  onFilterChange: (filters: Partial<AdvisorFilters>) => void;
  onReset: () => void;
  currentUserAdvisor?: string;
};

export function FilterSection({
  filters,
  onFilterChange,
  onReset,
  currentUserAdvisor,
}: FilterSectionProps) {
  const [advisorSearch, setAdvisorSearch] = useState(filters.advisor_search ?? '');
  const debouncedSearch = useDebouncedValue(advisorSearch, 300);
  const { data: options, isLoading } = useFilterOptions(debouncedSearch);

  // 디바운싱된 검색어를 필터에 적용
  useEffect(() => {
    if (debouncedSearch !== filters.advisor_search) {
      onFilterChange({ advisor_search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

  const handleProgramTypeChange = (type: string, checked: boolean) => {
    const current = filters.program_types ?? [];
    const updated = checked
      ? [...current, type]
      : current.filter((t) => t !== type);
    onFilterChange({ program_types: updated.length > 0 ? updated : undefined });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 학과 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">학과</label>
            <Select
              value={filters.department_name ?? ''}
              onValueChange={(value) =>
                onFilterChange({ department_name: value || undefined })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체 학과" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {options?.department_names.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 지도교수 검색 (자동완성) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">지도교수 검색</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="교수 이름 입력"
                value={advisorSearch}
                onChange={(e) => setAdvisorSearch(e.target.value)}
                disabled={isLoading}
              />
              {/* 자동완성 드롭다운 */}
              {advisorSearch && options?.advisor_suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {options.advisor_suggestions.map((advisor) => (
                    <div
                      key={advisor}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setAdvisorSearch(advisor);
                        onFilterChange({ advisor_search: advisor });
                      }}
                    >
                      {advisor}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {currentUserAdvisor && (
              <p className="text-xs text-blue-600">
                본인 지도학생이 자동으로 필터링됩니다.
              </p>
            )}
          </div>
        </div>

        {/* 과정구분 필터 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">과정구분</label>
          <div className="flex flex-wrap gap-4">
            {PROGRAM_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`program-${type}`}
                  checked={filters.program_types?.includes(type) ?? true}
                  onCheckedChange={(checked) =>
                    handleProgramTypeChange(type, checked as boolean)
                  }
                />
                <label htmlFor={`program-${type}`} className="text-sm cursor-pointer">
                  {type}
                </label>
              </div>
            ))}
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

#### 4.3.3 ExpandableRow (확장 가능 테이블 행)

```typescript
// src/features/student-advisors/components/advisors-table-section/expandable-row.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useStudentsByAdvisor } from '@/features/student-advisors/hooks/use-students-by-advisor';
import { downloadCSV } from '@/lib/utils/download';
import type { AdvisorStat } from '@/features/student-advisors/types';

type ExpandableRowProps = {
  advisor: AdvisorStat;
};

export function ExpandableRow({ advisor }: ExpandableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: students, isLoading } = useStudentsByAdvisor(
    advisor.advisor,
    isExpanded
  );

  const handleDownload = () => {
    if (students) {
      downloadCSV(students, `advisor_${advisor.advisor}_${Date.now()}`);
    }
  };

  return (
    <>
      {/* 메인 행 */}
      <TableRow
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell className="font-medium">{advisor.advisor}</TableCell>
        <TableCell>{advisor.department_name}</TableCell>
        <TableCell className="text-right font-bold">{advisor.total_students}</TableCell>
        <TableCell className="text-right">{advisor.undergraduate}</TableCell>
        <TableCell className="text-right">{advisor.master}</TableCell>
        <TableCell className="text-right">{advisor.doctoral}</TableCell>
        <TableCell className="text-right">{advisor.integrated}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={!students}
          >
            <Download className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {/* 확장된 행 (지도학생 목록) */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-gray-50 p-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            ) : students && students.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">지도학생 목록 ({students.length}명)</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">학번</th>
                        <th className="px-3 py-2 text-left">이름</th>
                        <th className="px-3 py-2 text-left">학과</th>
                        <th className="px-3 py-2 text-left">과정구분</th>
                        <th className="px-3 py-2 text-center">학년</th>
                        <th className="px-3 py-2 text-center">학적상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr
                          key={student.student_number}
                          className={
                            student.enrollment_status === '휴학'
                              ? 'bg-yellow-50'
                              : ''
                          }
                        >
                          <td className="px-3 py-2">{student.student_number}</td>
                          <td className="px-3 py-2">{student.name}</td>
                          <td className="px-3 py-2">{student.department_name}</td>
                          <td className="px-3 py-2">{student.program_type}</td>
                          <td className="px-3 py-2 text-center">{student.grade ?? '-'}</td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={
                                student.enrollment_status === '휴학'
                                  ? 'text-yellow-600 font-medium'
                                  : ''
                              }
                            >
                              {student.enrollment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">지도학생이 없습니다.</p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
```

---

## 5. 상태 관리

### 5.1 URL 상태 관리 (필터)

```typescript
// src/features/student-advisors/hooks/use-advisor-filters.ts
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { AdvisorFilters } from '../types';

export function useAdvisorFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL에서 필터 파싱
  const filters: AdvisorFilters = useMemo(() => {
    const dept = searchParams.get('department');
    const advisor = searchParams.get('advisor');
    const programs = searchParams.get('programs');

    return {
      department_name: dept ?? undefined,
      advisor_search: advisor ?? undefined,
      program_types: programs ? programs.split(',') : undefined,
    };
  }, [searchParams]);

  // 필터 업데이트
  const updateFilters = useCallback(
    (newFilters: Partial<AdvisorFilters>) => {
      const params = new URLSearchParams(searchParams);
      const merged = { ...filters, ...newFilters };

      // URL 파라미터 설정
      if (merged.department_name) {
        params.set('department', merged.department_name);
      } else {
        params.delete('department');
      }

      if (merged.advisor_search) {
        params.set('advisor', merged.advisor_search);
      } else {
        params.delete('advisor');
      }

      if (merged.program_types?.length) {
        params.set('programs', merged.program_types.join(','));
      } else {
        params.delete('programs');
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

### 5.2 교수진 자동 필터 적용

```typescript
// src/features/student-advisors/hooks/use-current-user-advisor.ts
'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';

export function useCurrentUserAdvisor() {
  const { user, isLoaded } = useUser();

  // Clerk User Metadata에서 이름 추출
  const currentUserName = user?.fullName ?? user?.firstName ?? null;

  // 현재 사용자가 교수인지 확인 (advisor 목록에 존재하는지)
  const { data: isAdvisor } = useQuery({
    queryKey: ['is-current-user-advisor', currentUserName],
    queryFn: async () => {
      if (!currentUserName) return false;

      const response = await fetch(
        `/api/student-advisors/check-advisor?name=${encodeURIComponent(currentUserName)}`
      );

      if (!response.ok) return false;

      const data = await response.json();
      return data.isAdvisor;
    },
    enabled: isLoaded && !!currentUserName,
    staleTime: 10 * 60 * 1000, // 10분 (거의 변하지 않음)
  });

  return {
    currentUserName,
    isAdvisor: isAdvisor ?? false,
  };
}
```

### 5.3 서버 상태 관리 (React Query)

```typescript
// src/features/student-advisors/hooks/use-advisor-stats.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdvisorFilters, AdvisorStat } from '../types';
import { getAdvisorStats } from '../api/get-advisor-stats';

export function useAdvisorStats(filters: AdvisorFilters) {
  return useQuery<AdvisorStat[]>({
    queryKey: ['advisor-stats', filters],
    queryFn: () => getAdvisorStats(filters),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// src/features/student-advisors/hooks/use-students-by-advisor.ts
export function useStudentsByAdvisor(advisorName: string, enabled: boolean) {
  return useQuery({
    queryKey: ['students-by-advisor', advisorName],
    queryFn: () => getStudentsByAdvisor(advisorName),
    enabled, // 확장된 경우만 조회
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## 6. API 설계

### 6.1 API Routes (Hono)

```typescript
// src/backend/hono/routes/student-advisors.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const advisorFilterSchema = z.object({
  department: z.string().optional(),
  advisor: z.string().optional(),
  programs: z.string().optional(), // "학사,석사,박사"
});

export function registerStudentAdvisorsRoutes(app: Hono<AppEnv>) {
  const advisors = new Hono<AppEnv>();

  // GET /api/student-advisors/stats
  advisors.get('/stats', zValidator('query', advisorFilterSchema), async (c) => {
    const { department, advisor, programs } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('students')
      .select(`
        advisor,
        program_type,
        departments!inner (
          department_name
        )
      `)
      .eq('enrollment_status', '재학')
      .not('advisor', 'is', null);

    // 필터 적용
    if (department) {
      query = query.eq('departments.department_name', department);
    }

    if (advisor) {
      query = query.ilike('advisor', `%${advisor}%`);
    }

    if (programs) {
      const programArray = programs.split(',');
      query = query.in('program_type', programArray);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 집계 로직 (애플리케이션 레벨)
    const statsMap = new Map<string, {
      advisor: string;
      department_name: string;
      undergraduate: number;
      master: number;
      doctoral: number;
      integrated: number;
    }>();

    data.forEach((row) => {
      const key = `${row.advisor}-${row.departments.department_name}`;
      const existing = statsMap.get(key) ?? {
        advisor: row.advisor,
        department_name: row.departments.department_name,
        undergraduate: 0,
        master: 0,
        doctoral: 0,
        integrated: 0,
      };

      switch (row.program_type) {
        case '학사':
          existing.undergraduate += 1;
          break;
        case '석사':
          existing.master += 1;
          break;
        case '박사':
          existing.doctoral += 1;
          break;
        case '석박통합':
          existing.integrated += 1;
          break;
      }

      statsMap.set(key, existing);
    });

    const result = Array.from(statsMap.values()).map((stat) => ({
      ...stat,
      total_students:
        stat.undergraduate + stat.master + stat.doctoral + stat.integrated,
    }));

    return c.json(result);
  });

  // GET /api/student-advisors/summary
  advisors.get('/summary', zValidator('query', advisorFilterSchema), async (c) => {
    const { department, programs } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 지도교수 통계
    let statsQuery = supabase.rpc('get_advisor_summary', {
      p_department: department ?? null,
      p_programs: programs ? programs.split(',') : null,
    });

    // 미지정 학생 수
    let unassignedQuery = supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('enrollment_status', '재학')
      .is('advisor', null);

    if (department) {
      unassignedQuery = unassignedQuery
        .eq('departments.department_name', department);
    }

    const [{ data: summary, error: summaryError }, { count: unassignedCount }] =
      await Promise.all([statsQuery, unassignedQuery]);

    if (summaryError) {
      return c.json({ error: summaryError.message }, 500);
    }

    return c.json({
      ...summary,
      unassigned_students: unassignedCount ?? 0,
    });
  });

  // GET /api/student-advisors/students
  advisors.get('/students', z.object({ advisor: z.string() }), async (c) => {
    const { advisor } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('students')
      .select(`
        student_number,
        name,
        program_type,
        grade,
        enrollment_status,
        departments (
          department_name
        )
      `)
      .eq('advisor', advisor)
      .eq('enrollment_status', '재학')
      .order('student_number');

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const transformed = data.map((row) => ({
      student_number: row.student_number,
      name: row.name,
      department_name: row.departments.department_name,
      program_type: row.program_type,
      grade: row.grade,
      enrollment_status: row.enrollment_status,
    }));

    return c.json(transformed);
  });

  // GET /api/student-advisors/check-advisor
  advisors.get('/check-advisor', z.object({ name: z.string() }), async (c) => {
    const { name } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('students')
      .select('advisor')
      .eq('advisor', name)
      .limit(1)
      .single();

    return c.json({ isAdvisor: !!data && !error });
  });

  // GET /api/student-advisors/filter-options
  advisors.get('/filter-options', zValidator('query', z.object({ search: z.string().optional() })), async (c) => {
    const { search } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 학과 옵션
    const { data: deptList } = await supabase
      .from('departments')
      .select('department_name')
      .order('department_name');

    // 지도교수 자동완성 옵션
    let advisorQuery = supabase
      .from('students')
      .select('advisor')
      .not('advisor', 'is', null)
      .order('advisor')
      .limit(10);

    if (search) {
      advisorQuery = advisorQuery.ilike('advisor', `%${search}%`);
    }

    const { data: advisorList } = await advisorQuery;

    return c.json({
      department_names: Array.from(new Set(deptList?.map((d) => d.department_name) ?? [])),
      advisor_suggestions: Array.from(new Set(advisorList?.map((a) => a.advisor) ?? [])),
    });
  });

  app.route('/student-advisors', advisors);
}
```

### 6.2 PostgreSQL Stored Procedure

```sql
-- get_advisor_summary 함수 생성
CREATE OR REPLACE FUNCTION get_advisor_summary(
  p_department TEXT,
  p_programs TEXT[]
)
RETURNS TABLE(
  total_advisors INTEGER,
  avg_students_per_advisor NUMERIC,
  max_students INTEGER,
  top_advisor TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_advisors INTEGER;
  v_total_students INTEGER;
  v_max_students INTEGER;
  v_top_advisor TEXT;
BEGIN
  -- 교수별 지도학생 수 계산
  WITH advisor_counts AS (
    SELECT
      s.advisor,
      COUNT(*) AS student_count
    FROM students s
    JOIN departments d ON d.id = s.department_id
    WHERE
      s.enrollment_status = '재학'
      AND s.advisor IS NOT NULL
      AND (p_department IS NULL OR d.department_name = p_department)
      AND (p_programs IS NULL OR s.program_type = ANY(p_programs))
    GROUP BY s.advisor
  )
  SELECT
    COUNT(*)::INTEGER,
    SUM(student_count)::INTEGER,
    MAX(student_count)::INTEGER,
    (SELECT advisor FROM advisor_counts ORDER BY student_count DESC LIMIT 1)
  INTO v_total_advisors, v_total_students, v_max_students, v_top_advisor
  FROM advisor_counts;

  RETURN QUERY
  SELECT
    v_total_advisors,
    CASE
      WHEN v_total_advisors > 0 THEN (v_total_students::NUMERIC / v_total_advisors)
      ELSE 0
    END,
    COALESCE(v_max_students, 0),
    v_top_advisor;
END;
$$;
```

---

## 7. 구현 단계

### Phase 1: 기본 구조 및 API (1주)

**Day 1-2: 프로젝트 설정**
- [ ] 디렉토리 구조 생성
- [ ] TypeScript 타입 정의 (`types.ts`)
- [ ] 공통 모듈 확인 (Layout, KPICard 등)

**Day 3-4: API 구현**
- [ ] Hono 라우트 구현 (`student-advisors.ts`)
- [ ] PostgreSQL Stored Procedure 생성 (`get_advisor_summary`)
- [ ] API 클라이언트 함수 작성
- [ ] Postman/Thunder Client로 API 테스트

**Day 5-7: 필터 및 데이터 로딩**
- [ ] `useAdvisorFilters` 훅 구현
- [ ] `useCurrentUserAdvisor` 훅 구현 (교수진 자동 필터)
- [ ] `useAdvisorStats`, `useAdvisorSummary` 훅 구현
- [ ] `FilterSection` 컴포넌트 구현 (자동완성 포함)
- [ ] URL 파라미터 동기화 테스트

### Phase 2: 시각화 (1주)

**Day 8-9: KPI 요약 섹션**
- [ ] `SummarySection` 컴포넌트 구현
- [ ] KPICard 재사용 (공통 모듈)
- [ ] 미지정 학생 수 경고 표시
- [ ] 로딩 상태 및 에러 처리

**Day 10-12: 차트 구현**
- [ ] `HistogramChart` 구현 (지도학생 수 분포)
- [ ] `ProgramDistributionChart` 구현 (과정구분별 스택 바)
- [ ] `DepartmentAvgChart` 구현 (학과별 평균)
- [ ] 차트 데이터 변환 로직 (`transform-chart-data.ts`)
- [ ] 색상 코딩 유틸리티 (`color-coding.ts`)

**Day 13-14: 차트 통합**
- [ ] `ChartsSection` 컴포넌트 통합
- [ ] 차트 레이아웃 및 그리드 설정
- [ ] 반응형 디자인 확인

### Phase 3: 테이블 및 확장 기능 (3-4일)

**Day 15-16: 교수별 테이블**
- [ ] `AdvisorsTable` 컴포넌트 구현
- [ ] 정렬 및 페이지네이션
- [ ] 전체 CSV 다운로드 기능

**Day 17-18: 확장 가능 행**
- [ ] `ExpandableRow` 컴포넌트 구현
- [ ] `useStudentsByAdvisor` 훅 구현
- [ ] 지도학생 목록 표시
- [ ] 교수별 CSV 다운로드
- [ ] 휴학 학생 하이라이트

### Phase 4: 통합 및 테스트 (2-3일)

**Day 19-20: 페이지 통합**
- [ ] `StudentAdvisorsPage` 전체 통합
- [ ] 교수진 자동 필터 적용 테스트
- [ ] 레이아웃 및 스타일링 최종 점검
- [ ] 반응형 디자인 테스트

**Day 21: 최종 테스트 및 배포**
- [ ] E2E 테스트 (수동)
- [ ] 성능 측정 (Lighthouse)
- [ ] 버그 수정 및 최적화

---

## 8. 테스트 계획

### 8.1 단위 테스트

**데이터 변환 함수**:
```typescript
// src/features/student-advisors/utils/__tests__/transform-chart-data.test.ts
import { transformToHistogram } from '../transform-chart-data';

describe('transformToHistogram', () => {
  it('should correctly bin advisor stats', () => {
    const stats = [
      { advisor: 'A', total_students: 3, ... },
      { advisor: 'B', total_students: 8, ... },
      { advisor: 'C', total_students: 15, ... },
    ];

    const result = transformToHistogram(stats);

    expect(result).toEqual([
      { bin: '1-5명', count: 1 },
      { bin: '6-10명', count: 1 },
      { bin: '11-15명', count: 1 },
      { bin: '16-20명', count: 0 },
      { bin: '21명 이상', count: 0 },
    ]);
  });
});
```

### 8.2 통합 테스트

**API 테스트**:
```
GET /api/student-advisors/stats?department=컴퓨터공학과
→ 200 OK, 데이터 반환 확인

GET /api/student-advisors/summary
→ 200 OK, 집계 데이터 확인

GET /api/student-advisors/students?advisor=김철수
→ 200 OK, 지도학생 목록 확인

GET /api/student-advisors/check-advisor?name=김철수
→ 200 OK, { isAdvisor: true }
```

### 8.3 E2E 테스트 (수동)

**시나리오 1: 교수진 자동 필터**
1. 교수 계정으로 로그인
2. 페이지 접속
3. 자동으로 본인 이름 필터 적용 확인
4. 지도학생 목록 확인
5. CSV 다운로드

**시나리오 2: 확장 가능 행**
1. 페이지 접속
2. 특정 교수 행 클릭
3. 지도학생 목록 확장 확인
4. 학생 정보 확인
5. 휴학 학생 하이라이트 확인

**시나리오 3: 필터 적용**
1. 학과 필터 선택
2. 지도교수 검색어 입력 (자동완성 확인)
3. 과정구분 필터 변경
4. 차트 및 테이블 업데이트 확인
5. URL 파라미터 확인

---

## 9. 성능 최적화

### 9.1 데이터 페칭 최적화

**React Query 캐싱**:
```typescript
export function useAdvisorStats(filters: AdvisorFilters) {
  return useQuery({
    queryKey: ['advisor-stats', filters],
    queryFn: () => getAdvisorStats(filters),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    cacheTime: 10 * 60 * 1000,
  });
}
```

**조건부 데이터 로딩**:
```typescript
export function useStudentsByAdvisor(advisorName: string, enabled: boolean) {
  return useQuery({
    queryKey: ['students-by-advisor', advisorName],
    queryFn: () => getStudentsByAdvisor(advisorName),
    enabled, // 확장된 경우만 조회
    staleTime: 5 * 60 * 1000,
  });
}
```

**디바운싱**:
```typescript
const debouncedSearch = useDebouncedValue(advisorSearch, 300);
const { data: options } = useFilterOptions(debouncedSearch);
```

### 9.2 차트 렌더링 최적화

**메모이제이션**:
```typescript
const histogramData = useMemo(
  () => transformToHistogram(stats ?? []),
  [stats]
);

const programDistData = useMemo(
  () => transformToProgramDistribution(stats ?? []),
  [stats]
);
```

### 9.3 테이블 최적화

**가상화** (100행 이상 시):
```typescript
import { FixedSizeList } from 'react-window';

// 교수가 100명 이상일 때만 가상화 적용
{stats.length > 100 ? (
  <FixedSizeList
    height={600}
    itemCount={stats.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <ExpandableRow advisor={stats[index]} style={style} />
    )}
  </FixedSizeList>
) : (
  stats.map((advisor) => <ExpandableRow key={advisor.advisor} advisor={advisor} />)
)}
```

---

## 10. 의존성 및 제약사항

### 10.1 의존 모듈

**공통 모듈 (반드시 먼저 구현 필요)**:
- `src/components/layout/dashboard-layout.tsx`
- `src/components/dashboard/kpi-card.tsx`
- `src/components/charts/chart-wrapper.tsx`
- `src/lib/supabase/service-client.ts`
- `src/lib/auth/rbac.ts`
- `src/hooks/use-debounced-value.ts`

**외부 라이브러리**:
- `recharts`: 차트 라이브러리
- `@tanstack/react-query`: 서버 상태 관리
- `@clerk/nextjs`: 인증 및 사용자 정보
- `zod`: 스키마 검증
- `react-window`: 가상화 (선택 사항)

### 10.2 데이터베이스 의존성

**필수 테이블**:
- `students`
- `departments`

**필수 Stored Procedure**:
- `get_advisor_summary()`

**마이그레이션**:
```sql
-- 20251102000005_add_advisor_summary_function.sql
CREATE OR REPLACE FUNCTION get_advisor_summary(...) ...;
```

### 10.3 제약사항

**기술적 제약**:
- 차트는 Recharts 라이브러리 사용
- 필터는 URL 파라미터로만 관리
- 페이지네이션은 Offset 방식
- 확장 가능 행은 한 번에 하나만 열림 (선택 사항)

**데이터 제약**:
- students 테이블에 `advisor IS NOT NULL AND enrollment_status = '재학'`인 데이터만 표시
- 미지정 학생은 별도 KPI 카드로만 표시
- 교수가 20명 이상이면 과정구분 차트는 상위 20명만 표시

**성능 제약**:
- 초기 로딩 시간 < 2초 (3G 네트워크)
- 차트 렌더링 시간 < 500ms
- 확장 가능 행 오픈 < 1초

### 10.4 향후 확장 고려사항

**Phase 2 기능**:
- 교수별 지도학생 연도별 추이 (라인 차트)
- 교수 상세 모달 (학생 정보 풍부화)
- 학생 개인정보 보호 모드 (이름 마스킹)
- 교수별 알림 기능 (휴학생 발생 시)

**Phase 3 기능**:
- 지도 부담 자동 조정 제안 (AI 기반)
- 학생 배정 시뮬레이션
- 교수 평가 연계 (지도 실적)

---

## 부록

### A. 샘플 데이터

```typescript
// 테스트용 샘플 데이터
const SAMPLE_ADVISOR_STATS: AdvisorStat[] = [
  {
    advisor: '김철수',
    department_name: '컴퓨터공학과',
    total_students: 12,
    undergraduate: 4,
    master: 6,
    doctoral: 2,
    integrated: 0,
  },
  {
    advisor: '이영희',
    department_name: '기계공학과',
    total_students: 8,
    undergraduate: 2,
    master: 4,
    doctoral: 2,
    integrated: 0,
  },
  // ...
];
```

### B. 에러 메시지

| 에러 상황 | 메시지 | 복구 방안 |
|----------|--------|----------|
| API 실패 | "데이터를 불러오는 중 오류가 발생했습니다" | 재시도 버튼 |
| 데이터 없음 | "조회된 지도교수가 없습니다" | 필터 초기화 버튼 |
| 네트워크 오류 | "네트워크 연결을 확인해주세요" | 재시도 버튼 |
| 권한 없음 | "접근 권한이 없습니다" | 대시보드로 돌아가기 |

### C. 개발 체크리스트

**Phase 1 완료 조건**:
- [ ] API 엔드포인트 5개 모두 정상 작동
- [ ] 필터 URL 동기화 정상 작동
- [ ] 교수진 자동 필터 적용 확인
- [ ] React Query 캐싱 확인

**Phase 2 완료 조건**:
- [ ] 차트 3개 모두 정상 렌더링
- [ ] 히스토그램 클릭 시 필터링 작동
- [ ] 색상 코딩 정상 표시
- [ ] 반응형 디자인 확인

**Phase 3 완료 조건**:
- [ ] 확장 가능 행 오픈/닫기 정상 작동
- [ ] 지도학생 목록 정상 표시
- [ ] 휴학 학생 하이라이트 확인
- [ ] CSV 다운로드 (교수별, 전체) 정상 작동

**Phase 4 완료 조건**:
- [ ] E2E 테스트 시나리오 3개 모두 통과
- [ ] Lighthouse Performance Score > 90
- [ ] 에러 핸들링 모든 케이스 확인
- [ ] 교수진 계정으로 테스트 완료

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design, Common Modules, UC-006 문서를 기반으로 작성되었으며, 지도교수별 현황 페이지의 완전한 구현을 위한 단계별 가이드를 제공합니다.
