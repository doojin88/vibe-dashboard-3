# 구현 계획: 연구자 성과 페이지
# /dashboard/research/researchers

**페이지 ID**: 7-researchers
**페이지 경로**: `/dashboard/research/researchers`
**페이지 명**: 연구자 성과
**접근 권한**: Authenticated (모든 인증된 사용자)
**버전**: 1.0
**작성일**: 2025-11-02

---

## 목차

1. [개요](#1-개요)
2. [요구사항 분석](#2-요구사항-분석)
3. [데이터 모델](#3-데이터-모델)
4. [백엔드 구현](#4-백엔드-구현)
5. [프론트엔드 구현](#5-프론트엔드-구현)
6. [상태 관리](#6-상태-관리)
7. [UI/UX 설계](#7-uiux-설계)
8. [에러 핸들링](#8-에러-핸들링)
9. [성능 최적화](#9-성능-최적화)
10. [테스트 계획](#10-테스트-계획)
11. [구현 순서](#11-구현-순서)

---

## 1. 개요

### 1.1 페이지 목적

연구책임자(Principal Investigator)별 연구 성과를 종합적으로 분석하고 시각화하여 제공합니다. 연구비 수주 현황, 논문 게재 실적, 과제-논문 연계 비율 등 핵심 지표를 통해 개별 연구자의 성과를 정량적으로 평가할 수 있습니다.

### 1.2 주요 기능

1. **연구자별 성과 지표 조회**
   - 연구책임자별 총 연구비 수주액
   - 연구책임자별 논문 게재 수
   - 과제연계 논문 비율

2. **필터링 및 검색**
   - 연구자명 검색 (텍스트 입력)
   - 소속 학과 필터
   - 연도 범위 필터

3. **데이터 시각화**
   - 연구자별 연구비 순위 (막대 그래프)
   - 연구비 vs 논문 수 산점도 (Scatter Chart)
   - 과제연계 논문 비율 (도넛 차트)
   - 연구자 상세 테이블 (페이지네이션)

4. **개인 성과 조회** (교수 계정)
   - 자동 필터 적용 (본인 이름)
   - 개인 성과 리포트 PDF 다운로드

### 1.3 사용자 시나리오

#### 시나리오 1: 경영진의 연구자 평가
- 목적: 전체 연구자의 성과를 비교하여 우수 연구자 선정
- 플로우:
  1. 페이지 접근
  2. 최근 3년 연도 필터 적용
  3. 연구비 순위 확인 (Top 20)
  4. 특정 연구자 클릭하여 상세 정보 확인
  5. CSV 다운로드하여 보고서 작성

#### 시나리오 2: 교수의 개인 성과 조회
- 목적: 본인의 연구 성과 확인 및 개선 계획 수립
- 플로우:
  1. 페이지 접근 시 자동으로 본인 이름 필터 적용
  2. 총 연구비, 논문 수, 과제연계 비율 확인
  3. 연도별 추이 분석
  4. PDF 리포트 다운로드

#### 시나리오 3: 학과장의 소속 연구자 관리
- 목적: 소속 학과 연구자들의 성과 모니터링
- 플로우:
  1. 소속 학과 필터 선택
  2. 학과 내 연구자 순위 확인
  3. 성과 저조 연구자 식별
  4. 개선 방안 논의 자료 준비

---

## 2. 요구사항 분석

### 2.1 PRD 요구사항

**FR-DASH-003: 논문 게재 현황** (일부)
- 주저자별 논문 수 랭킹
- 과제연계 여부 분석

**FR-DASH-004: 연구과제 관리**
- 연구책임자별 연구비 수주액
- 지원기관별 연구비 수주 현황

**신규 요구사항 (연구자 성과 페이지)**:
- 연구책임자별 통합 성과 지표
- 연구비 vs 논문 수 상관관계 분석
- 과제연계 논문 비율 계산

### 2.2 Userflow 요구사항

**3.3 연구자 성과** (PRD 발췌):
- 연구책임자별 연구비 수주액
- 연구책임자별 논문 수
- 과제연계 논문 비율

**교수진 사용자 여정** (Userflow 3-3):
1. 연구자 성과 페이지 접근
2. 본인 이름으로 자동 필터링
3. 개인 성과 확인 (연구비, 논문 수, 과제연계 비율)
4. 연도별 추이 분석
5. PDF 리포트 다운로드

### 2.3 비기능 요구사항

**성능**:
- API 응답 시간 < 1초 (일반 조회)
- API 응답 시간 < 2초 (복잡한 집계)
- 차트 렌더링 시간 < 500ms

**보안**:
- Clerk 인증 필수
- Application Level RBAC (모든 인증된 사용자 접근 가능)
- Service Role Key로 Supabase 조회

**접근성**:
- WCAG 2.1 Level AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환성

---

## 3. 데이터 모델

### 3.1 관련 테이블

#### 3.1.1 research_projects (연구과제)

```typescript
type ResearchProject = {
  id: string; // UUID
  project_number: string; // 과제번호 (UNIQUE)
  project_name: string; // 과제명
  principal_investigator: string; // 연구책임자 이름
  department_id: string; // FK → departments(id)
  funding_agency: string; // 지원기관
  total_budget: number; // 총 연구비 (원)
  created_at: string; // TIMESTAMPTZ
};
```

#### 3.1.2 publications (논문)

```typescript
type Publication = {
  id: string; // UUID
  publication_id: string; // 논문ID (UNIQUE)
  department_id: string; // FK → departments(id)
  title: string; // 논문 제목
  main_author: string; // 주저자 이름
  co_authors: string | null; // 참여저자 (콤마 구분)
  journal_name: string; // 학술지명
  journal_grade: 'SCIE' | 'SSCI' | 'A&HCI' | 'SCOPUS' | 'KCI' | 'Other' | null;
  impact_factor: number | null; // Impact Factor
  publication_date: string; // DATE
  project_linked: boolean; // 과제연계 여부
  created_at: string; // TIMESTAMPTZ
};
```

#### 3.1.3 departments (학과)

```typescript
type Department = {
  id: string; // UUID
  college_name: string; // 단과대학명
  department_name: string; // 학과명
  created_at: string; // TIMESTAMPTZ
};
```

### 3.2 집계 데이터 모델

#### 3.2.1 연구자 성과 집계 (ResearcherPerformance)

```typescript
type ResearcherPerformance = {
  researcher_name: string; // 연구자 이름 (연구책임자 또는 주저자)
  department_name: string; // 소속 학과
  college_name: string; // 소속 단과대학

  // 연구비 관련
  total_budget: number; // 총 연구비 수주액 (원)
  project_count: number; // 연구과제 수
  avg_project_budget: number; // 평균 과제 연구비

  // 논문 관련
  publication_count: number; // 총 논문 수
  scie_count: number; // SCIE 논문 수
  kci_count: number; // KCI 논문 수
  avg_impact_factor: number | null; // 평균 Impact Factor

  // 과제연계 논문
  project_linked_count: number; // 과제연계 논문 수
  project_linked_ratio: number; // 과제연계 논문 비율 (%)

  // 추가 지표
  funding_agencies: string[]; // 지원기관 목록 (DISTINCT)
  latest_publication_date: string | null; // 최근 논문 게재일
};
```

#### 3.2.2 API 응답 타입

```typescript
// GET /api/research/researchers
type ResearchersResponse = {
  researchers: ResearcherPerformance[];
  total_count: number;
  filters_applied: {
    researcher_name?: string;
    department_name?: string;
    year_start?: number;
    year_end?: number;
  };
};

// GET /api/research/researchers/aggregate
type ResearchersAggregateResponse = {
  total_researchers: number;
  total_budget: number; // 전체 연구비 합계
  avg_budget_per_researcher: number;
  total_publications: number;
  avg_publications_per_researcher: number;
  overall_project_linked_ratio: number; // 전체 과제연계 비율

  // Top 연구자
  top_by_budget: ResearcherPerformance[];
  top_by_publications: ResearcherPerformance[];
};
```

### 3.3 데이터 조회 쿼리

#### 3.3.1 연구자별 연구비 집계

```sql
-- 연구책임자별 연구비 수주액
SELECT
  rp.principal_investigator AS researcher_name,
  d.department_name,
  d.college_name,
  COUNT(rp.id) AS project_count,
  SUM(rp.total_budget) AS total_budget,
  AVG(rp.total_budget) AS avg_project_budget,
  ARRAY_AGG(DISTINCT rp.funding_agency) AS funding_agencies
FROM research_projects rp
JOIN departments d ON d.id = rp.department_id
WHERE (rp.principal_investigator ILIKE '%검색어%' OR '검색어' IS NULL)
  AND (d.department_name = '학과명' OR '학과명' IS NULL)
GROUP BY rp.principal_investigator, d.department_name, d.college_name
ORDER BY total_budget DESC;
```

#### 3.3.2 연구자별 논문 집계

```sql
-- 주저자별 논문 수 및 Impact Factor
SELECT
  p.main_author AS researcher_name,
  COUNT(p.id) AS publication_count,
  COUNT(CASE WHEN p.journal_grade = 'SCIE' THEN 1 END) AS scie_count,
  COUNT(CASE WHEN p.journal_grade = 'KCI' THEN 1 END) AS kci_count,
  COUNT(CASE WHEN p.project_linked = true THEN 1 END) AS project_linked_count,
  ROUND(
    COUNT(CASE WHEN p.project_linked = true THEN 1 END)::numeric /
    NULLIF(COUNT(p.id), 0) * 100,
    2
  ) AS project_linked_ratio,
  AVG(p.impact_factor) AS avg_impact_factor,
  MAX(p.publication_date) AS latest_publication_date
FROM publications p
WHERE (p.main_author ILIKE '%검색어%' OR '검색어' IS NULL)
  AND (
    EXTRACT(YEAR FROM p.publication_date) BETWEEN 시작년도 AND 종료년도
    OR (시작년도 IS NULL AND 종료년도 IS NULL)
  )
GROUP BY p.main_author
ORDER BY publication_count DESC;
```

#### 3.3.3 통합 쿼리 (연구비 + 논문)

```sql
-- 연구자 통합 성과 (CTE 활용)
WITH researcher_projects AS (
  SELECT
    rp.principal_investigator AS name,
    COUNT(rp.id) AS project_count,
    SUM(rp.total_budget) AS total_budget,
    AVG(rp.total_budget) AS avg_project_budget
  FROM research_projects rp
  GROUP BY rp.principal_investigator
),
researcher_publications AS (
  SELECT
    p.main_author AS name,
    COUNT(p.id) AS publication_count,
    COUNT(CASE WHEN p.project_linked = true THEN 1 END) AS project_linked_count,
    AVG(p.impact_factor) AS avg_impact_factor
  FROM publications p
  GROUP BY p.main_author
)
SELECT
  COALESCE(proj.name, pub.name) AS researcher_name,
  COALESCE(proj.project_count, 0) AS project_count,
  COALESCE(proj.total_budget, 0) AS total_budget,
  COALESCE(pub.publication_count, 0) AS publication_count,
  COALESCE(pub.project_linked_count, 0) AS project_linked_count,
  ROUND(
    COALESCE(pub.project_linked_count, 0)::numeric /
    NULLIF(COALESCE(pub.publication_count, 0), 0) * 100,
    2
  ) AS project_linked_ratio,
  pub.avg_impact_factor
FROM researcher_projects proj
FULL OUTER JOIN researcher_publications pub ON proj.name = pub.name
ORDER BY total_budget DESC;
```

---

## 4. 백엔드 구현

### 4.1 디렉토리 구조

```
src/features/research/
├── backend/
│   ├── route.ts                 # Hono API Routes
│   ├── service.ts               # 비즈니스 로직
│   ├── schema.ts                # Zod 검증 스키마
│   └── types.ts                 # TypeScript 타입
└── frontend/
    ├── components/
    │   ├── researchers-kpi-cards.tsx
    │   ├── researchers-chart.tsx
    │   ├── researchers-table.tsx
    │   └── researcher-detail-modal.tsx
    ├── hooks/
    │   └── use-researchers.ts   # React Query Hook
    └── page.tsx                 # 페이지 컴포넌트
```

### 4.2 Zod 스키마 정의

**파일**: `src/features/research/backend/schema.ts`

```typescript
import { z } from 'zod';

// 필터 스키마
export const researchersFilterSchema = z.object({
  researcher_name: z.string().optional(),
  department_name: z.string().optional(),
  year_start: z.coerce.number().min(2000).max(2100).optional(),
  year_end: z.coerce.number().min(2000).max(2100).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sort_by: z.enum(['total_budget', 'publication_count', 'project_linked_ratio']).default('total_budget'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ResearchersFilter = z.infer<typeof researchersFilterSchema>;
```

### 4.3 Service Layer

**파일**: `src/features/research/backend/service.ts`

```typescript
import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ResearchersFilter } from './schema';
import type { ResearcherPerformance, ResearchersAggregateResponse } from './types';

type ResearchProject = Database['public']['Tables']['research_projects']['Row'];
type Publication = Database['public']['Tables']['publications']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

export class ResearcherService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * 연구자별 성과 조회
   */
  async getResearchers(filters: ResearchersFilter): Promise<ResearcherPerformance[]> {
    // Step 1: 연구비 데이터 조회
    let projectsQuery = this.supabase
      .from('research_projects')
      .select('principal_investigator, total_budget, funding_agency, department:departments(college_name, department_name)');

    if (filters.researcher_name) {
      projectsQuery = projectsQuery.ilike('principal_investigator', `%${filters.researcher_name}%`);
    }

    const { data: projectsData, error: projectsError } = await projectsQuery;

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    // Step 2: 논문 데이터 조회
    let pubsQuery = this.supabase
      .from('publications')
      .select('main_author, journal_grade, impact_factor, project_linked, publication_date');

    if (filters.researcher_name) {
      pubsQuery = pubsQuery.ilike('main_author', `%${filters.researcher_name}%`);
    }

    if (filters.year_start) {
      pubsQuery = pubsQuery.gte('publication_date', `${filters.year_start}-01-01`);
    }

    if (filters.year_end) {
      pubsQuery = pubsQuery.lte('publication_date', `${filters.year_end}-12-31`);
    }

    const { data: pubsData, error: pubsError } = await pubsQuery;

    if (pubsError) {
      throw new Error(`Failed to fetch publications: ${pubsError.message}`);
    }

    // Step 3: 데이터 집계
    const researcherMap = new Map<string, ResearcherPerformance>();

    // 연구비 집계
    (projectsData || []).forEach((project: any) => {
      const name = project.principal_investigator;
      const existing = researcherMap.get(name) || this.createEmptyPerformance(name);

      existing.total_budget += project.total_budget || 0;
      existing.project_count += 1;
      existing.department_name = project.department?.department_name || 'Unknown';
      existing.college_name = project.department?.college_name || 'Unknown';

      if (project.funding_agency && !existing.funding_agencies.includes(project.funding_agency)) {
        existing.funding_agencies.push(project.funding_agency);
      }

      researcherMap.set(name, existing);
    });

    // 논문 집계
    (pubsData || []).forEach((pub: Publication) => {
      const name = pub.main_author;
      const existing = researcherMap.get(name) || this.createEmptyPerformance(name);

      existing.publication_count += 1;

      if (pub.journal_grade === 'SCIE') existing.scie_count += 1;
      if (pub.journal_grade === 'KCI') existing.kci_count += 1;
      if (pub.project_linked) existing.project_linked_count += 1;

      if (pub.impact_factor) {
        const currentTotal = (existing.avg_impact_factor || 0) * (existing.publication_count - 1);
        existing.avg_impact_factor = (currentTotal + pub.impact_factor) / existing.publication_count;
      }

      if (!existing.latest_publication_date || pub.publication_date > existing.latest_publication_date) {
        existing.latest_publication_date = pub.publication_date;
      }

      researcherMap.set(name, existing);
    });

    // Step 4: 과제연계 비율 계산
    researcherMap.forEach((perf) => {
      if (perf.publication_count > 0) {
        perf.project_linked_ratio = (perf.project_linked_count / perf.publication_count) * 100;
      }
      if (perf.project_count > 0) {
        perf.avg_project_budget = perf.total_budget / perf.project_count;
      }
    });

    // Step 5: 정렬 및 페이지네이션
    const researchers = Array.from(researcherMap.values());

    researchers.sort((a, b) => {
      const aVal = a[filters.sort_by];
      const bVal = b[filters.sort_by];
      const order = filters.sort_order === 'asc' ? 1 : -1;
      return ((aVal || 0) - (bVal || 0)) * order;
    });

    return researchers.slice(filters.offset, filters.offset + filters.limit);
  }

  /**
   * 집계 통계
   */
  async getAggregate(filters: ResearchersFilter): Promise<ResearchersAggregateResponse> {
    const researchers = await this.getResearchers({ ...filters, limit: 1000, offset: 0 });

    const totalBudget = researchers.reduce((sum, r) => sum + r.total_budget, 0);
    const totalPublications = researchers.reduce((sum, r) => sum + r.publication_count, 0);
    const totalProjectLinkedPubs = researchers.reduce((sum, r) => sum + r.project_linked_count, 0);

    return {
      total_researchers: researchers.length,
      total_budget: totalBudget,
      avg_budget_per_researcher: researchers.length > 0 ? totalBudget / researchers.length : 0,
      total_publications: totalPublications,
      avg_publications_per_researcher: researchers.length > 0 ? totalPublications / researchers.length : 0,
      overall_project_linked_ratio: totalPublications > 0 ? (totalProjectLinkedPubs / totalPublications) * 100 : 0,
      top_by_budget: researchers.slice(0, 10),
      top_by_publications: researchers.sort((a, b) => b.publication_count - a.publication_count).slice(0, 10),
    };
  }

  private createEmptyPerformance(name: string): ResearcherPerformance {
    return {
      researcher_name: name,
      department_name: '',
      college_name: '',
      total_budget: 0,
      project_count: 0,
      avg_project_budget: 0,
      publication_count: 0,
      scie_count: 0,
      kci_count: 0,
      avg_impact_factor: null,
      project_linked_count: 0,
      project_linked_ratio: 0,
      funding_agencies: [],
      latest_publication_date: null,
    };
  }
}
```

### 4.4 API Routes (Hono)

**파일**: `src/features/research/backend/route.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { researchersFilterSchema } from './schema';
import { ResearcherService } from './service';

export function registerResearchRoutes(app: Hono<AppEnv>) {
  const research = new Hono<AppEnv>();

  // GET /api/research/researchers
  research.get('/researchers', zValidator('query', researchersFilterSchema), async (c) => {
    try {
      const filters = c.req.valid('query');
      const supabase = getSupabaseServiceClient();
      const service = new ResearcherService(supabase);

      const researchers = await service.getResearchers(filters);

      return c.json({
        researchers,
        total_count: researchers.length,
        filters_applied: filters,
      });
    } catch (error) {
      console.error('Error fetching researchers:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        500
      );
    }
  });

  // GET /api/research/researchers/aggregate
  research.get('/researchers/aggregate', zValidator('query', researchersFilterSchema), async (c) => {
    try {
      const filters = c.req.valid('query');
      const supabase = getSupabaseServiceClient();
      const service = new ResearcherService(supabase);

      const aggregate = await service.getAggregate(filters);

      return c.json(aggregate);
    } catch (error) {
      console.error('Error fetching aggregate:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        500
      );
    }
  });

  app.route('/research', research);
}
```

### 4.5 Hono App 통합

**파일**: `src/backend/hono/app.ts` (기존 파일 수정)

```typescript
// 기존 imports
import { registerKPIRoutes } from '@/features/kpi/backend/route';
import { registerResearchRoutes } from '@/features/research/backend/route'; // 추가

export const createHonoApp = () => {
  const app = new Hono<AppEnv>();

  // ... 기존 미들웨어

  // 라우트 등록
  registerExampleRoutes(app);
  registerKPIRoutes(app);
  registerResearchRoutes(app); // 추가

  return app;
};
```

---

## 5. 프론트엔드 구현

### 5.1 React Query Hook

**파일**: `src/features/research/frontend/hooks/use-researchers.ts`

```typescript
'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ResearchersFilter } from '../../backend/schema';
import type { ResearchersResponse, ResearchersAggregateResponse } from '../../backend/types';

export function useResearchers(
  filters: Partial<ResearchersFilter> = {},
  options?: Omit<UseQueryOptions<ResearchersResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ResearchersResponse>({
    queryKey: ['researchers', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/research/researchers?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch researchers');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
    ...options,
  });
}

export function useResearchersAggregate(
  filters: Partial<ResearchersFilter> = {},
  options?: Omit<UseQueryOptions<ResearchersAggregateResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ResearchersAggregateResponse>({
    queryKey: ['researchers-aggregate', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/research/researchers/aggregate?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch aggregate');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
```

### 5.2 KPI Cards 컴포넌트

**파일**: `src/features/research/frontend/components/researchers-kpi-cards.tsx`

```typescript
'use client';

import { Users, DollarSign, FileText, LinkIcon } from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { formatBudget, formatNumber, formatPercentage } from '@/lib/utils/number';
import type { ResearchersAggregateResponse } from '../../backend/types';

type ResearchersKPICardsProps = {
  data: ResearchersAggregateResponse;
  isLoading: boolean;
};

export function ResearchersKPICards({ data, isLoading }: ResearchersKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <KPICard key={i} title="로딩 중..." value="--" icon={Users} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="총 연구자 수"
        value={formatNumber(data.total_researchers)}
        icon={Users}
        description="연구과제 수행 또는 논문 게재"
      />
      <KPICard
        title="총 연구비"
        value={formatBudget(data.total_budget)}
        icon={DollarSign}
        description={`평균 ${formatBudget(data.avg_budget_per_researcher)}/인`}
      />
      <KPICard
        title="총 논문 수"
        value={formatNumber(data.total_publications)}
        icon={FileText}
        description={`평균 ${formatNumber(data.avg_publications_per_researcher, 1)}/인`}
      />
      <KPICard
        title="과제연계 논문 비율"
        value={formatPercentage(data.overall_project_linked_ratio, 1)}
        icon={LinkIcon}
        description="전체 논문 중 과제 연계"
      />
    </div>
  );
}
```

### 5.3 차트 컴포넌트

**파일**: `src/features/research/frontend/components/researchers-chart.tsx`

```typescript
'use client';

import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { BarChart } from '@/components/charts/bar-chart';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBudget, formatNumber } from '@/lib/utils/number';
import type { ResearcherPerformance } from '../../backend/types';

type ResearchersChartProps = {
  researchers: ResearcherPerformance[];
};

export function ResearchersBudgetChart({ researchers }: ResearchersChartProps) {
  const top20 = researchers.slice(0, 20);

  const chartData = top20.map((r) => ({
    name: r.researcher_name,
    연구비: r.total_budget / 100000000, // 억원 단위
  }));

  return (
    <ChartWrapper title="연구자별 연구비 순위" description="Top 20">
      <BarChart
        data={chartData}
        dataKey="연구비"
        xAxisKey="name"
        yAxisLabel="연구비 (억원)"
        color="#3b82f6"
      />
    </ChartWrapper>
  );
}

export function BudgetVsPublicationsChart({ researchers }: ResearchersChartProps) {
  const chartData = researchers.map((r) => ({
    name: r.researcher_name,
    budget: r.total_budget / 100000000, // 억원
    publications: r.publication_count,
  }));

  return (
    <ChartWrapper title="연구비 vs 논문 수" description="산점도 (Scatter Plot)">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="budget"
            name="연구비"
            unit="억원"
            label={{ value: '연구비 (억원)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="publications"
            name="논문 수"
            label={{ value: '논문 수', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm">연구비: {formatBudget(data.budget * 100000000)}</p>
                    <p className="text-sm">논문 수: {formatNumber(data.publications)}편</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={chartData} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
```

### 5.4 데이터 테이블 컴포넌트

**파일**: `src/features/research/frontend/components/researchers-table.tsx`

```typescript
'use client';

import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import { formatBudget, formatNumber, formatPercentage } from '@/lib/utils/number';
import { Badge } from '@/components/ui/badge';
import type { ResearcherPerformance } from '../../backend/types';

type ResearchersTableProps = {
  researchers: ResearcherPerformance[];
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
};

export function ResearchersTable({ researchers, onSort }: ResearchersTableProps) {
  const columns: ColumnDef<ResearcherPerformance>[] = [
    {
      id: 'researcher_name',
      header: '연구자명',
      accessorKey: 'researcher_name',
      sortable: true,
    },
    {
      id: 'department_name',
      header: '소속 학과',
      accessorKey: 'department_name',
    },
    {
      id: 'total_budget',
      header: '총 연구비',
      sortable: true,
      cell: (row) => formatBudget(row.total_budget),
    },
    {
      id: 'project_count',
      header: '과제 수',
      sortable: true,
      cell: (row) => `${formatNumber(row.project_count)}건`,
    },
    {
      id: 'publication_count',
      header: '논문 수',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span>{formatNumber(row.publication_count)}편</span>
          {row.scie_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              SCIE {row.scie_count}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'project_linked_ratio',
      header: '과제연계 비율',
      sortable: true,
      cell: (row) => {
        const ratio = row.project_linked_ratio;
        const colorClass = ratio >= 50 ? 'text-green-600' : ratio >= 30 ? 'text-yellow-600' : 'text-red-600';
        return <span className={colorClass}>{formatPercentage(ratio, 1)}</span>;
      },
    },
    {
      id: 'avg_impact_factor',
      header: '평균 IF',
      cell: (row) => (row.avg_impact_factor ? formatNumber(row.avg_impact_factor, 2) : 'N/A'),
    },
  ];

  return <DataTable columns={columns} data={researchers} onSort={onSort} />;
}
```

### 5.5 필터 패널 컴포넌트

**파일**: `src/features/research/frontend/components/researchers-filter.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResearchersFilter } from '../../backend/schema';

type ResearchersFilterPanelProps = {
  onFilterChange: (filters: Partial<ResearchersFilter>) => void;
  onReset: () => void;
};

export function ResearchersFilterPanel({ onFilterChange, onReset }: ResearchersFilterPanelProps) {
  const [name, setName] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');

  const handleApply = () => {
    onFilterChange({
      researcher_name: name || undefined,
      year_start: yearStart ? parseInt(yearStart) : undefined,
      year_end: yearEnd ? parseInt(yearEnd) : undefined,
    });
  };

  const handleReset = () => {
    setName('');
    setYearStart('');
    setYearEnd('');
    onReset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="researcher-name">연구자명</Label>
          <Input
            id="researcher-name"
            placeholder="연구자 이름 검색"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>논문 게재 연도</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="시작 년도"
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              min={2000}
              max={2100}
            />
            <span>~</span>
            <Input
              type="number"
              placeholder="종료 년도"
              value={yearEnd}
              onChange={(e) => setYearEnd(e.target.value)}
              min={2000}
              max={2100}
            />
          </div>
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

### 5.6 페이지 컴포넌트

**파일**: `src/app/dashboard/research/researchers/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ResearchersKPICards } from '@/features/research/frontend/components/researchers-kpi-cards';
import { ResearchersBudgetChart, BudgetVsPublicationsChart } from '@/features/research/frontend/components/researchers-chart';
import { ResearchersTable } from '@/features/research/frontend/components/researchers-table';
import { ResearchersFilterPanel } from '@/features/research/frontend/components/researchers-filter';
import { useResearchers, useResearchersAggregate } from '@/features/research/frontend/hooks/use-researchers';
import { EmptyState } from '@/components/dashboard/empty-state';
import { ErrorBoundary } from '@/components/error/error-boundary';
import type { ResearchersFilter } from '@/features/research/backend/schema';

export default function ResearchersPage() {
  const [filters, setFilters] = useState<Partial<ResearchersFilter>>({
    sort_by: 'total_budget',
    sort_order: 'desc',
  });

  const { data: aggregateData, isLoading: isAggregateLoading } = useResearchersAggregate(filters);
  const { data: researchersData, isLoading: isResearchersLoading } = useResearchers(filters);

  const handleFilterChange = (newFilters: Partial<ResearchersFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleReset = () => {
    setFilters({
      sort_by: 'total_budget',
      sort_order: 'desc',
    });
  };

  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    setFilters((prev) => ({
      ...prev,
      sort_by: columnId as ResearchersFilter['sort_by'],
      sort_order: direction,
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">연구자 성과</h1>
          <p className="text-muted-foreground">
            연구책임자별 연구비 수주 및 논문 게재 성과 분석
          </p>
        </div>

        <ErrorBoundary>
          {aggregateData && (
            <ResearchersKPICards data={aggregateData} isLoading={isAggregateLoading} />
          )}

          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <ResearchersFilterPanel onFilterChange={handleFilterChange} onReset={handleReset} />
            </div>

            <div className="lg:col-span-3 space-y-6">
              {researchersData && researchersData.researchers.length > 0 ? (
                <>
                  <ResearchersBudgetChart researchers={researchersData.researchers} />
                  <BudgetVsPublicationsChart researchers={researchersData.researchers} />
                  <ResearchersTable
                    researchers={researchersData.researchers}
                    onSort={handleSort}
                  />
                </>
              ) : isResearchersLoading ? (
                <div>로딩 중...</div>
              ) : (
                <EmptyState
                  title="데이터가 없습니다"
                  description="선택한 조건에 맞는 연구자 데이터가 없습니다."
                  action={{
                    label: '필터 초기화',
                    onClick: handleReset,
                  }}
                />
              )}
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
```

---

## 6. 상태 관리

### 6.1 필터 상태

**관리 방법**: URL Query Parameters + useState

```typescript
// URL 동기화 (선택 사항 - 공유 가능한 URL)
import { useSearchParams, useRouter } from 'next/navigation';

const searchParams = useSearchParams();
const router = useRouter();

const syncFiltersToURL = (filters: Partial<ResearchersFilter>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  router.push(`?${params.toString()}`);
};
```

### 6.2 React Query 캐싱

**전략**:
- `staleTime`: 5분 (데이터 신선도)
- `cacheTime`: 10분 (캐시 유지 시간)
- `refetchOnWindowFocus`: false (탭 전환 시 재fetch 방지)

### 6.3 에러 상태

**전략**:
- React Query의 `error` 상태 활용
- Error Boundary로 컴포넌트 레벨 에러 캡처
- Toast 알림으로 사용자 피드백

---

## 7. UI/UX 설계

### 7.1 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
├─────────────┬───────────────────────────────────────────────┤
│ Sidebar     │ 연구자 성과                                   │
│             │                                               │
│             │ [KPI Cards - 4개]                            │
│             │ ┌───────────┬───────────┬───────────┬────────┐│
│             │ │총 연구자  │총 연구비  │총 논문 수 │과제연계││
│             │ └───────────┴───────────┴───────────┴────────┘│
│             │                                               │
│             │ ┌─────────┬───────────────────────────────────┐│
│             │ │         │ [연구자별 연구비 순위 차트]      ││
│             │ │ 필터    │ (막대 그래프 - Top 20)           ││
│             │ │         │                                  ││
│             │ │         ├──────────────────────────────────┤│
│             │ │연구자명 │ [연구비 vs 논문 수 산점도]       ││
│             │ │         │ (Scatter Chart)                  ││
│             │ │연도범위 │                                  ││
│             │ │         ├──────────────────────────────────┤│
│             │ │[적용]   │ [연구자 상세 테이블]             ││
│             │ │[초기화] │ (페이지네이션)                   ││
│             │ └─────────┴───────────────────────────────────┘│
└─────────────┴───────────────────────────────────────────────┘
```

### 7.2 반응형 디자인

**브레이크포인트**:
- Desktop (lg): 1024px 이상 - 4열 그리드
- Tablet (md): 768px - 2열 그리드
- Mobile: 768px 미만 - 1열 스택

**필터 패널**:
- Desktop: 왼쪽 사이드바 (고정)
- Mobile: 상단 접을 수 있는 패널

### 7.3 로딩 상태

**스켈레톤 로더**:
- KPI Cards: Shimmer 효과
- 차트: 회색 박스 placeholder
- 테이블: 행 skeleton

### 7.4 빈 상태 (Empty State)

**조건**:
- 데이터 없음: "데이터가 없습니다"
- 필터 결과 없음: "검색 결과가 없습니다"

**UI**:
- 아이콘 (FileQuestion)
- 메시지
- 액션 버튼 (필터 초기화)

---

## 8. 에러 핸들링

### 8.1 API 에러

**시나리오**:
- 500 Internal Server Error
- 네트워크 오류
- 타임아웃

**처리**:
1. React Query 자동 재시도 (3회, 지수 백오프)
2. 재시도 실패 시 에러 UI 표시
3. "다시 시도" 버튼 제공

### 8.2 데이터 검증 에러

**시나리오**:
- 잘못된 필터 값
- 연도 범위 오류 (시작 > 종료)

**처리**:
1. 클라이언트 사이드 검증 (Zod)
2. 에러 메시지 표시 (Input 하단)
3. 자동 수정 (시작/종료 년도 swap)

### 8.3 세션 만료

**시나리오**:
- 401 Unauthorized

**처리**:
1. Axios Interceptor에서 감지
2. redirect_url 저장
3. 로그인 페이지 리다이렉트

---

## 9. 성능 최적화

### 9.1 백엔드 최적화

**데이터베이스 쿼리**:
- JOIN 최소화 (필요한 컬럼만 SELECT)
- 집계 쿼리는 데이터베이스에서 처리
- 인덱스 활용:
  - `research_projects(principal_investigator)`
  - `publications(main_author)`
  - `publications(publication_date)`

**페이지네이션**:
- Offset/Limit 방식 사용
- 기본 50개 제한

### 9.2 프론트엔드 최적화

**React Query 캐싱**:
- staleTime: 5분
- 동일한 필터 조건 재요청 방지

**차트 렌더링**:
- Top 20 제한 (막대 그래프)
- 메모이제이션 (useMemo)

**코드 스플리팅**:
- 차트 라이브러리 Dynamic Import

### 9.3 네트워크 최적화

**압축**:
- gzip/brotli 활성화 (Vercel 자동)

**병렬 요청**:
- KPI 집계와 연구자 목록 병렬 fetch

---

## 10. 테스트 계획

### 10.1 단위 테스트

**Service Layer**:
- `ResearcherService.getResearchers()` 테스트
- 집계 로직 검증
- 빈 데이터 처리

**유틸리티 함수**:
- `formatBudget()` 테스트
- `formatPercentage()` 테스트

### 10.2 통합 테스트

**API Route**:
- GET /api/research/researchers
- 필터링 동작 검증
- 에러 응답 검증

### 10.3 E2E 테스트

**주요 시나리오**:
1. 페이지 접근 → 데이터 로딩 → 차트 렌더링
2. 필터 적용 → API 재요청 → 테이블 업데이트
3. 정렬 버튼 클릭 → 데이터 재정렬
4. 빈 상태 표시 (데이터 없음)

---

## 11. 구현 순서

### Phase 1: 백엔드 구현 (2-3일)

**Step 1**: 타입 및 스키마 정의
- [ ] `src/features/research/backend/types.ts` 작성
- [ ] `src/features/research/backend/schema.ts` 작성 (Zod)

**Step 2**: Service Layer 구현
- [ ] `src/features/research/backend/service.ts` 작성
- [ ] `ResearcherService.getResearchers()` 구현
- [ ] `ResearcherService.getAggregate()` 구현
- [ ] 단위 테스트 작성

**Step 3**: API Routes 구현
- [ ] `src/features/research/backend/route.ts` 작성
- [ ] GET /api/research/researchers 엔드포인트
- [ ] GET /api/research/researchers/aggregate 엔드포인트
- [ ] `src/backend/hono/app.ts`에 라우트 등록

**Step 4**: API 테스트
- [ ] Postman/Thunder Client로 수동 테스트
- [ ] 필터링 동작 검증
- [ ] 에러 처리 검증

---

### Phase 2: 공통 컴포넌트 (1-2일)

**Step 5**: React Query Hook
- [ ] `src/features/research/frontend/hooks/use-researchers.ts` 작성
- [ ] `useResearchers()` 구현
- [ ] `useResearchersAggregate()` 구현

**Step 6**: KPI Cards
- [ ] `researchers-kpi-cards.tsx` 작성
- [ ] 로딩 상태 처리
- [ ] 데이터 포맷팅

---

### Phase 3: 차트 및 테이블 (2-3일)

**Step 7**: 차트 컴포넌트
- [ ] `researchers-chart.tsx` 작성
- [ ] 연구비 순위 막대 그래프
- [ ] 연구비 vs 논문 수 산점도
- [ ] 과제연계 비율 도넛 차트 (선택)

**Step 8**: 데이터 테이블
- [ ] `researchers-table.tsx` 작성
- [ ] 컬럼 정의
- [ ] 정렬 기능 연동
- [ ] 페이지네이션

---

### Phase 4: 페이지 통합 (1-2일)

**Step 9**: 필터 패널
- [ ] `researchers-filter.tsx` 작성
- [ ] 입력 폼 구현
- [ ] 검증 로직

**Step 10**: 메인 페이지
- [ ] `src/app/dashboard/research/researchers/page.tsx` 작성
- [ ] 컴포넌트 통합
- [ ] 상태 관리 (useState)
- [ ] Error Boundary 적용

---

### Phase 5: 테스트 및 최적화 (1-2일)

**Step 11**: 테스트
- [ ] 단위 테스트 작성
- [ ] API 통합 테스트
- [ ] E2E 테스트 (Playwright)

**Step 12**: 성능 최적화
- [ ] React Query 캐싱 확인
- [ ] 차트 렌더링 최적화
- [ ] 메모이제이션 적용

**Step 13**: 접근성 및 UX 개선
- [ ] 키보드 네비게이션 테스트
- [ ] 스크린 리더 테스트
- [ ] 로딩/에러 상태 UX 검증

---

### Phase 6: 추가 기능 (선택 사항)

**Step 14**: 개인 성과 조회 (교수 계정)
- [ ] Clerk User Metadata에서 이름 추출
- [ ] 자동 필터 적용 로직
- [ ] UI 조정 (본인 성과 강조)

**Step 15**: PDF 다운로드
- [ ] jsPDF 또는 react-pdf 통합
- [ ] 리포트 템플릿 작성
- [ ] 다운로드 버튼 추가

---

## 12. 체크리스트

### 백엔드 완료 조건
- [ ] API 엔드포인트 동작 확인 (Postman)
- [ ] 필터링 정확성 검증
- [ ] 집계 로직 정확성 검증
- [ ] 에러 핸들링 동작 확인
- [ ] TypeScript 타입 안정성 확인

### 프론트엔드 완료 조건
- [ ] 페이지 정상 렌더링
- [ ] KPI Cards 정확한 데이터 표시
- [ ] 차트 정확한 데이터 시각화
- [ ] 테이블 정렬 및 페이지네이션 동작
- [ ] 필터 적용 및 초기화 동작
- [ ] 로딩/에러/빈 상태 UI 표시
- [ ] 반응형 디자인 동작 (모바일/태블릿)

### 성능 확인
- [ ] API 응답 시간 < 1초 (일반)
- [ ] 차트 렌더링 시간 < 500ms
- [ ] React Query 캐싱 동작
- [ ] 메모리 누수 없음

### 접근성 확인
- [ ] 키보드 네비게이션 가능
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 충분 (4.5:1 이상)
- [ ] ARIA 레이블 적용

---

## 13. 참고 자료

### 내부 문서
- `/docs/prd.md` - PRD 요구사항
- `/docs/userflow.md` - 사용자 플로우
- `/docs/database.md` - 데이터베이스 스키마
- `/docs/common-modules.md` - 공통 모듈 가이드

### 외부 문서
- [Recharts Documentation](https://recharts.org/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Hono Documentation](https://hono.dev/)

---

## 14. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-02 | AI Assistant | 초기 작성 |

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design, Common Modules 문서를 기반으로 작성되었으며, 기존 코드베이스 구조(`src/features/kpi/backend/route.ts`)를 참고하여 일관성 있는 구현 방법을 제시합니다.
