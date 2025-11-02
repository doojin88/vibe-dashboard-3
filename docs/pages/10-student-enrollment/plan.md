# 재학생 현황 페이지 구현 계획
# /dashboard/students/enrollment

**버전:** 1.0
**작성일:** 2025-11-02
**페이지 경로:** `/dashboard/students/enrollment`
**기반 문서:** PRD v1.0, Userflow v1.0, Database Design v2.0, UC-006

---

## 목차

1. [개요](#1-개요)
2. [페이지 구조](#2-페이지-구조)
3. [데이터 모델](#3-데이터-모델)
4. [API 설계](#4-api-설계)
5. [컴포넌트 설계](#5-컴포넌트-설계)
6. [상태 관리](#6-상태-관리)
7. [구현 단계](#7-구현-단계)
8. [테스트 계획](#8-테스트-계획)

---

## 1. 개요

### 1.1 페이지 목적

재학생 현황을 다각도로 시각화하여 대학 구성원이 학생 분포와 추이를 파악하고, 학생 관리 및 교육 운영 의사결정을 지원합니다.

### 1.2 주요 기능

- **재학생 통계 조회**: 단과대학별, 학과별, 과정구분별 재학생 현황
- **데이터 시각화**: KPI 카드, 도넛 차트, 막대 그래프, 파이 차트
- **필터링**: 단과대학, 학과, 과정구분, 학적상태 필터
- **학생 목록 조회**: 페이지네이션, 정렬, 검색 기능
- **데이터 다운로드**: CSV/Excel 형식으로 다운로드

### 1.3 사용자 역할

- **일반 이용자 (Viewer)**: 전체 재학생 현황 조회 가능
- **교수진**: 본인 지도학생 우선 표시 (선택 사항)
- **관리자**: 동일하게 조회 (수정 권한은 별도 페이지)

### 1.4 접근 권한

- **인증 필수**: Clerk Google OAuth 로그인 필요
- **역할 제한**: 없음 (모든 인증된 사용자 접근 가능)

---

## 2. 페이지 구조

### 2.1 와이어프레임

```
┌─────────────────────────────────────────────────────────────┐
│ Header (공용)                                                │
├───────────┬─────────────────────────────────────────────────┤
│ Sidebar   │ 📊 재학생 현황                                   │
│ (공용)    │                                                  │
│           │ ┌──────────────────────────────────────────────┐│
│           │ │ 🔍 필터                                       ││
│           │ │ [단과대학 ▼] [학과 ▼] [과정구분 ☐] [초기화] ││
│           │ └──────────────────────────────────────────────┘│
│           │                                                  │
│           │ ┌────────┬────────┬────────┬────────┐          │
│           │ │ 📈 총  │ 👨‍🎓 학사│ 👨‍🔬 석사│ 🎓 박사│          │
│           │ │ 8,456명│ 6,234명│ 1,567명│ 655명 │          │
│           │ └────────┴────────┴────────┴────────┘          │
│           │                                                  │
│           │ ┌────────────────┬────────────────┐             │
│           │ │ 🍩 단과대학별   │ 📊 학과별 Top20│             │
│           │ │ 재학생 분포     │ 재학생 수      │             │
│           │ │                 │                │             │
│           │ └────────────────┴────────────────┘             │
│           │                                                  │
│           │ ┌────────────────┬────────────────┐             │
│           │ │ 📊 과정구분별   │ 🥧 학적상태별  │             │
│           │ │ 현황 (Stack)    │ 분포 (Pie)     │             │
│           │ │                 │                │             │
│           │ └────────────────┴────────────────┘             │
│           │                                                  │
│           │ 📋 학생 목록                                     │
│           │ ┌──────────────────────────────────────────┐   │
│           │ │ 🔍 [검색]           [CSV ⬇] [Excel ⬇]    │   │
│           │ ├──────────────────────────────────────────┤   │
│           │ │ 학번 | 이름 | 단과대학 | 학과 | 과정 | 상태│   │
│           │ │ ──────────────────────────────────────── │   │
│           │ │ 2021001 | 김철수 | 공과대학 | 컴공 | 학사│   │
│           │ │ ...                                      │   │
│           │ │                            [1] 2 3 ... ▶│   │
│           │ └──────────────────────────────────────────┘   │
└───────────┴─────────────────────────────────────────────────┘
```

### 2.2 레이아웃 구성

#### 2.2.1 필터 섹션 (상단)
- 단과대학 선택 (드롭다운, 다중 선택 가능)
- 학과 선택 (드롭다운, 단과대학 선택 시 필터링됨)
- 과정구분 선택 (체크박스: 학사, 석사, 박사, 석박통합)
- 학적상태 선택 (체크박스: 재학, 휴학, 졸업) - 기본값: 재학
- "필터 초기화" 버튼

#### 2.2.2 KPI 카드 섹션 (중앙 상단)
4개의 카드:
- 총 재학생 수 (큰 숫자, 아이콘)
- 학사 인원 (파란색 카드)
- 석사 인원 (초록색 카드)
- 박사 인원 (주황색 카드)

#### 2.2.3 차트 섹션 (중앙)
2x2 그리드 레이아웃:
- **왼쪽 상단**: 도넛 차트 - 단과대학별 재학생 분포
- **오른쪽 상단**: 막대 그래프 - 학과별 재학생 수 (Top 20)
- **왼쪽 하단**: 스택 바 - 과정구분별 현황
- **오른쪽 하단**: 파이 차트 - 학적상태별 분포

#### 2.2.4 학생 목록 테이블 (하단)
- 검색창 (학번, 이름 검색)
- CSV/Excel 다운로드 버튼
- 테이블 컬럼: 학번, 이름, 단과대학, 학과, 학년, 과정구분, 학적상태
- 페이지네이션 (50행/페이지)
- 정렬 기능 (컬럼 헤더 클릭)

---

## 3. 데이터 모델

### 3.1 데이터베이스 스키마 (참조)

```sql
-- students 테이블
CREATE TABLE students (
  id UUID PRIMARY KEY,
  student_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  grade INTEGER,
  program_type VARCHAR(20), -- '학사', '석사', '박사', '석박통합'
  enrollment_status VARCHAR(20), -- '재학', '휴학', '졸업', '자퇴', '제적'
  gender VARCHAR(10),
  admission_year INTEGER,
  advisor VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- departments 테이블
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  college_name VARCHAR(100) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 TypeScript 타입 정의

**파일 위치**: `src/features/students/types.ts`

```typescript
// 학생 기본 타입
export type Student = {
  id: string;
  student_number: string;
  name: string;
  department_id: string;
  grade: number | null;
  program_type: '학사' | '석사' | '박사' | '석박통합' | null;
  enrollment_status: '재학' | '휴학' | '졸업' | '자퇴' | '제적' | null;
  gender: '남' | '여' | '기타' | null;
  admission_year: number | null;
  advisor: string | null;
  email: string | null;
  created_at: string;
};

// 학생 + 학과 정보
export type StudentWithDepartment = Student & {
  department: {
    college_name: string;
    department_name: string;
  };
};

// 재학생 통계 요약
export type EnrollmentSummary = {
  total_students: number;
  undergraduate: number;
  master: number;
  doctoral: number;
  integrated: number; // 석박통합
};

// 단과대학별 통계
export type CollegeEnrollment = {
  college_name: string;
  student_count: number;
  undergraduate: number;
  master: number;
  doctoral: number;
  integrated: number;
};

// 학과별 통계
export type DepartmentEnrollment = {
  college_name: string;
  department_name: string;
  student_count: number;
};

// 학적상태별 통계
export type EnrollmentStatusStat = {
  status: string;
  count: number;
  percentage: number;
};

// API 응답 타입
export type EnrollmentStatsResponse = {
  summary: EnrollmentSummary;
  by_college: CollegeEnrollment[];
  by_department: DepartmentEnrollment[];
  by_status: EnrollmentStatusStat[];
};

// 필터 타입
export type EnrollmentFilters = {
  college?: string;
  department?: string;
  program_types?: string[];
  enrollment_statuses?: string[];
};
```

---

## 4. API 설계

### 4.1 API Route 파일 구조

```
src/
  features/
    students/
      backend/
        route.ts                  # Hono 라우터 정의
        queries.ts                # Supabase 쿼리 함수
        schemas.ts                # Zod 스키마 정의
      types.ts                    # 공용 타입 정의
```

### 4.2 API 엔드포인트

#### 4.2.1 GET /api/students/enrollment/stats

**목적**: 재학생 현황 통계 집계 데이터 조회

**쿼리 파라미터**:
```typescript
{
  college?: string;              // 단과대학명
  department?: string;           // 학과명
  program_types?: string;        // 쉼표 구분 (예: "학사,석사")
  enrollment_statuses?: string;  // 쉼표 구분 (예: "재학,휴학")
}
```

**응답 예시**:
```json
{
  "summary": {
    "total_students": 8456,
    "undergraduate": 6234,
    "master": 1567,
    "doctoral": 655,
    "integrated": 0
  },
  "by_college": [
    {
      "college_name": "공과대학",
      "student_count": 2500,
      "undergraduate": 1800,
      "master": 500,
      "doctoral": 200,
      "integrated": 0
    }
  ],
  "by_department": [
    {
      "college_name": "공과대학",
      "department_name": "컴퓨터공학과",
      "student_count": 350
    }
  ],
  "by_status": [
    {
      "status": "재학",
      "count": 7500,
      "percentage": 88.7
    },
    {
      "status": "휴학",
      "count": 800,
      "percentage": 9.5
    }
  ]
}
```

**에러 응답**:
```json
{
  "error": "Unauthorized",
  "message": "세션이 만료되었습니다."
}
```

#### 4.2.2 GET /api/students/list

**목적**: 학생 목록 조회 (페이지네이션)

**쿼리 파라미터**:
```typescript
{
  page?: number;                 // 페이지 번호 (1부터 시작)
  limit?: number;                // 페이지당 행 수 (기본: 50)
  search?: string;               // 검색어 (학번, 이름)
  college?: string;
  department?: string;
  program_types?: string;
  enrollment_statuses?: string;
  sort_by?: string;              // 정렬 컬럼 (기본: student_number)
  sort_order?: 'asc' | 'desc';   // 정렬 방향 (기본: asc)
}
```

**응답 예시**:
```json
{
  "data": [
    {
      "id": "uuid-1",
      "student_number": "2021001",
      "name": "김철수",
      "department": {
        "college_name": "공과대학",
        "department_name": "컴퓨터공학과"
      },
      "grade": 3,
      "program_type": "학사",
      "enrollment_status": "재학",
      "advisor": "홍길동"
    }
  ],
  "pagination": {
    "total": 8456,
    "page": 1,
    "limit": 50,
    "total_pages": 170
  }
}
```

### 4.3 Backend 구현

**파일 위치**: `src/features/students/backend/route.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getEnrollmentStats, getStudentList } from './queries';
import { enrollmentFiltersSchema, studentListSchema } from './schemas';

export function registerStudentsRoutes(app: Hono<AppEnv>) {
  const students = new Hono<AppEnv>();

  // 재학생 통계 API
  students.get(
    '/enrollment/stats',
    zValidator('query', enrollmentFiltersSchema),
    async (c) => {
      try {
        const filters = c.req.valid('query');
        const stats = await getEnrollmentStats(filters);
        return c.json(stats);
      } catch (error) {
        console.error('Error fetching enrollment stats:', error);
        return c.json(
          { error: 'Internal Server Error' },
          500
        );
      }
    }
  );

  // 학생 목록 API
  students.get(
    '/list',
    zValidator('query', studentListSchema),
    async (c) => {
      try {
        const params = c.req.valid('query');
        const result = await getStudentList(params);
        return c.json(result);
      } catch (error) {
        console.error('Error fetching student list:', error);
        return c.json(
          { error: 'Internal Server Error' },
          500
        );
      }
    }
  );

  app.route('/students', students);
}
```

**파일 위치**: `src/features/students/backend/schemas.ts`

```typescript
import { z } from 'zod';

export const enrollmentFiltersSchema = z.object({
  college: z.string().optional(),
  department: z.string().optional(),
  program_types: z.string().optional(),
  enrollment_statuses: z.string().optional(),
});

export const studentListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  search: z.string().optional(),
  college: z.string().optional(),
  department: z.string().optional(),
  program_types: z.string().optional(),
  enrollment_statuses: z.string().optional(),
  sort_by: z.string().optional().default('student_number'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
});
```

**파일 위치**: `src/features/students/backend/queries.ts`

```typescript
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import type {
  EnrollmentFilters,
  EnrollmentStatsResponse,
  StudentWithDepartment,
} from '../types';

export async function getEnrollmentStats(
  filters: EnrollmentFilters
): Promise<EnrollmentStatsResponse> {
  const supabase = getSupabaseServiceClient();

  // WHERE 조건 구성
  let query = supabase
    .from('students')
    .select('*, departments(college_name, department_name)');

  if (filters.college) {
    query = query.eq('departments.college_name', filters.college);
  }

  if (filters.department) {
    query = query.eq('departments.department_name', filters.department);
  }

  if (filters.program_types) {
    const types = filters.program_types.split(',');
    query = query.in('program_type', types);
  }

  if (filters.enrollment_statuses) {
    const statuses = filters.enrollment_statuses.split(',');
    query = query.in('enrollment_status', statuses);
  } else {
    // 기본값: 재학생만
    query = query.eq('enrollment_status', '재학');
  }

  const { data: students, error } = await query;

  if (error) throw error;

  // 집계 계산
  const summary = {
    total_students: students.length,
    undergraduate: students.filter(s => s.program_type === '학사').length,
    master: students.filter(s => s.program_type === '석사').length,
    doctoral: students.filter(s => s.program_type === '박사').length,
    integrated: students.filter(s => s.program_type === '석박통합').length,
  };

  // 단과대학별 집계
  const collegeMap = new Map<string, any>();
  students.forEach(s => {
    const college = s.departments.college_name;
    if (!collegeMap.has(college)) {
      collegeMap.set(college, {
        college_name: college,
        student_count: 0,
        undergraduate: 0,
        master: 0,
        doctoral: 0,
        integrated: 0,
      });
    }
    const stat = collegeMap.get(college)!;
    stat.student_count++;
    if (s.program_type === '학사') stat.undergraduate++;
    if (s.program_type === '석사') stat.master++;
    if (s.program_type === '박사') stat.doctoral++;
    if (s.program_type === '석박통합') stat.integrated++;
  });

  const by_college = Array.from(collegeMap.values());

  // 학과별 집계
  const deptMap = new Map<string, any>();
  students.forEach(s => {
    const key = `${s.departments.college_name}-${s.departments.department_name}`;
    if (!deptMap.has(key)) {
      deptMap.set(key, {
        college_name: s.departments.college_name,
        department_name: s.departments.department_name,
        student_count: 0,
      });
    }
    deptMap.get(key)!.student_count++;
  });

  const by_department = Array.from(deptMap.values())
    .sort((a, b) => b.student_count - a.student_count)
    .slice(0, 20); // Top 20

  // 학적상태별 집계
  const statusMap = new Map<string, number>();
  students.forEach(s => {
    const status = s.enrollment_status || '미지정';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const by_status = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: (count / students.length) * 100,
  }));

  return {
    summary,
    by_college,
    by_department,
    by_status,
  };
}

export async function getStudentList(params: any) {
  const supabase = getSupabaseServiceClient();

  const {
    page = 1,
    limit = 50,
    search,
    college,
    department,
    program_types,
    enrollment_statuses,
    sort_by = 'student_number',
    sort_order = 'asc',
  } = params;

  // 기본 쿼리
  let query = supabase
    .from('students')
    .select('*, departments(college_name, department_name)', { count: 'exact' });

  // 필터링
  if (search) {
    query = query.or(`student_number.ilike.%${search}%,name.ilike.%${search}%`);
  }

  if (college) {
    query = query.eq('departments.college_name', college);
  }

  if (department) {
    query = query.eq('departments.department_name', department);
  }

  if (program_types) {
    const types = program_types.split(',');
    query = query.in('program_type', types);
  }

  if (enrollment_statuses) {
    const statuses = enrollment_statuses.split(',');
    query = query.in('enrollment_status', statuses);
  } else {
    query = query.eq('enrollment_status', '재학');
  }

  // 정렬
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // 페이지네이션
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data,
    pagination: {
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    },
  };
}
```

### 4.4 Hono App 통합

**파일 위치**: `src/backend/hono/app.ts`

```typescript
import { registerStudentsRoutes } from '@/features/students/backend/route';

export const createHonoApp = () => {
  // ... 기존 코드

  registerExampleRoutes(app);
  registerKPIRoutes(app);
  registerStudentsRoutes(app); // 추가

  // ...
};
```

---

## 5. 컴포넌트 설계

### 5.1 컴포넌트 트리

```
Page: /dashboard/students/enrollment
├── DashboardLayout (공용)
│   ├── Header (공용)
│   ├── Sidebar (공용)
│   └── main
│       └── StudentEnrollmentPage (신규)
│           ├── PageHeader (공용)
│           ├── EnrollmentFilters (신규)
│           │   ├── Select (Shadcn)
│           │   ├── Checkbox (Shadcn)
│           │   └── Button (Shadcn)
│           ├── EnrollmentKPICards (신규)
│           │   └── KPICard (공용) x 4
│           ├── EnrollmentCharts (신규)
│           │   ├── ChartWrapper (공용) x 4
│           │   │   ├── DonutChart (공용)
│           │   │   ├── BarChart (공용)
│           │   │   ├── StackedBarChart (신규)
│           │   │   └── PieChart (공용)
│           └── StudentListTable (신규)
│               ├── DataTable (공용)
│               └── DownloadButtons (신규)
```

### 5.2 주요 컴포넌트 구현

#### 5.2.1 StudentEnrollmentPage (메인 페이지)

**파일 위치**: `src/app/dashboard/students/enrollment/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { EnrollmentFilters } from '@/features/students/components/enrollment-filters';
import { EnrollmentKPICards } from '@/features/students/components/enrollment-kpi-cards';
import { EnrollmentCharts } from '@/features/students/components/enrollment-charts';
import { StudentListTable } from '@/features/students/components/student-list-table';
import { useEnrollmentStats } from '@/features/students/hooks/useEnrollmentStats';
import type { EnrollmentFilters as Filters } from '@/features/students/types';

export default function StudentEnrollmentPage() {
  const [filters, setFilters] = useState<Filters>({
    enrollment_statuses: ['재학'], // 기본값
  });

  const { data, isLoading, error } = useEnrollmentStats(filters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="재학생 현황"
          description="단과대학별, 학과별 재학생 분포 및 통계"
        />

        <EnrollmentFilters
          filters={filters}
          onChange={setFilters}
        />

        {isLoading && <div>로딩 중...</div>}
        {error && <div>에러 발생: {error.message}</div>}

        {data && (
          <>
            <EnrollmentKPICards summary={data.summary} />
            <EnrollmentCharts
              byCollege={data.by_college}
              byDepartment={data.by_department}
              byStatus={data.by_status}
              summary={data.summary}
            />
            <StudentListTable filters={filters} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
```

#### 5.2.2 EnrollmentFilters

**파일 위치**: `src/features/students/components/enrollment-filters.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useDepartments } from '@/hooks/api/useDepartments';
import type { EnrollmentFilters } from '../types';

type Props = {
  filters: EnrollmentFilters;
  onChange: (filters: EnrollmentFilters) => void;
};

export function EnrollmentFilters({ filters, onChange }: Props) {
  const { data: departments } = useDepartments();

  const colleges = Array.from(
    new Set(departments?.map(d => d.college_name) || [])
  );

  const filteredDepartments = departments?.filter(
    d => !filters.college || d.college_name === filters.college
  ) || [];

  const programTypes = ['학사', '석사', '박사', '석박통합'];
  const enrollmentStatuses = ['재학', '휴학', '졸업'];

  const handleReset = () => {
    onChange({
      enrollment_statuses: ['재학'],
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 단과대학 */}
          <div className="space-y-2">
            <Label>단과대학</Label>
            <Select
              value={filters.college}
              onValueChange={(value) =>
                onChange({ ...filters, college: value, department: undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {colleges.map(college => (
                  <SelectItem key={college} value={college}>
                    {college}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 학과 */}
          <div className="space-y-2">
            <Label>학과</Label>
            <Select
              value={filters.department}
              onValueChange={(value) =>
                onChange({ ...filters, department: value })
              }
              disabled={!filters.college}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {filteredDepartments.map(dept => (
                  <SelectItem key={dept.id} value={dept.department_name}>
                    {dept.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 과정구분 */}
          <div className="space-y-2">
            <Label>과정구분</Label>
            <div className="flex flex-col gap-2">
              {programTypes.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`program-${type}`}
                    checked={filters.program_types?.includes(type)}
                    onCheckedChange={(checked) => {
                      const current = filters.program_types || [];
                      const next = checked
                        ? [...current, type]
                        : current.filter(t => t !== type);
                      onChange({ ...filters, program_types: next });
                    }}
                  />
                  <label htmlFor={`program-${type}`} className="text-sm">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 학적상태 */}
          <div className="space-y-2">
            <Label>학적상태</Label>
            <div className="flex flex-col gap-2">
              {enrollmentStatuses.map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.enrollment_statuses?.includes(status)}
                    onCheckedChange={(checked) => {
                      const current = filters.enrollment_statuses || [];
                      const next = checked
                        ? [...current, status]
                        : current.filter(s => s !== status);
                      onChange({ ...filters, enrollment_statuses: next });
                    }}
                  />
                  <label htmlFor={`status-${status}`} className="text-sm">
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button variant="outline" onClick={handleReset}>
            필터 초기화
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 5.2.3 EnrollmentKPICards

**파일 위치**: `src/features/students/components/enrollment-kpi-cards.tsx`

```typescript
import { KPICard } from '@/components/dashboard/kpi-card';
import { Users, GraduationCap, UserCheck, Award } from 'lucide-react';
import { formatNumber } from '@/lib/utils/number';
import type { EnrollmentSummary } from '../types';

type Props = {
  summary: EnrollmentSummary;
};

export function EnrollmentKPICards({ summary }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="총 재학생"
        value={`${formatNumber(summary.total_students)}명`}
        icon={Users}
        description="전체 재학생 수"
      />
      <KPICard
        title="학사 과정"
        value={`${formatNumber(summary.undergraduate)}명`}
        icon={GraduationCap}
        description="학사 과정 재학생"
        className="border-blue-200"
      />
      <KPICard
        title="석사 과정"
        value={`${formatNumber(summary.master)}명`}
        icon={UserCheck}
        description="석사 과정 재학생"
        className="border-green-200"
      />
      <KPICard
        title="박사 과정"
        value={`${formatNumber(summary.doctoral)}명`}
        icon={Award}
        description="박사 과정 재학생"
        className="border-orange-200"
      />
    </div>
  );
}
```

#### 5.2.4 EnrollmentCharts

**파일 위치**: `src/features/students/components/enrollment-charts.tsx`

```typescript
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { DonutChart } from '@/components/charts/donut-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { StackedBarChart } from '@/components/charts/stacked-bar-chart';
import { PieChart } from '@/components/charts/pie-chart';
import type {
  CollegeEnrollment,
  DepartmentEnrollment,
  EnrollmentStatusStat,
  EnrollmentSummary,
} from '../types';

type Props = {
  byCollege: CollegeEnrollment[];
  byDepartment: DepartmentEnrollment[];
  byStatus: EnrollmentStatusStat[];
  summary: EnrollmentSummary;
};

export function EnrollmentCharts({
  byCollege,
  byDepartment,
  byStatus,
  summary,
}: Props) {
  // 도넛 차트 데이터
  const donutData = byCollege.map(c => ({
    name: c.college_name,
    value: c.student_count,
  }));

  // 막대 그래프 데이터 (Top 20)
  const barData = byDepartment.slice(0, 20).map(d => ({
    name: d.department_name,
    value: d.student_count,
  }));

  // 스택 바 데이터
  const stackData = [
    {
      name: '과정구분별',
      학사: summary.undergraduate,
      석사: summary.master,
      박사: summary.doctoral,
      석박통합: summary.integrated,
    },
  ];

  // 파이 차트 데이터
  const pieData = byStatus.map(s => ({
    name: s.status,
    value: s.count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartWrapper title="단과대학별 재학생 분포" description="도넛 차트">
        <DonutChart data={donutData} />
      </ChartWrapper>

      <ChartWrapper title="학과별 재학생 수 (Top 20)" description="막대 그래프">
        <BarChart
          data={barData}
          dataKey="value"
          xAxisKey="name"
          yAxisLabel="학생 수"
        />
      </ChartWrapper>

      <ChartWrapper title="과정구분별 현황" description="스택 바">
        <StackedBarChart data={stackData} />
      </ChartWrapper>

      <ChartWrapper title="학적상태별 분포" description="파이 차트">
        <PieChart data={pieData} />
      </ChartWrapper>
    </div>
  );
}
```

#### 5.2.5 StudentListTable

**파일 위치**: `src/features/students/components/student-list-table.tsx`

```typescript
'use client';

import { useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';
import { useStudentList } from '../hooks/useStudentList';
import { downloadCSV } from '@/lib/utils/download';
import type { StudentWithDepartment, EnrollmentFilters } from '../types';

type Props = {
  filters: EnrollmentFilters;
};

export function StudentListTable({ filters }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useStudentList({
    ...filters,
    search,
    page,
    limit: 50,
  });

  const columns: ColumnDef<StudentWithDepartment>[] = [
    {
      id: 'student_number',
      header: '학번',
      accessorKey: 'student_number',
      sortable: true,
    },
    {
      id: 'name',
      header: '이름',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'college',
      header: '단과대학',
      cell: (row) => row.department.college_name,
    },
    {
      id: 'department',
      header: '학과',
      cell: (row) => row.department.department_name,
    },
    {
      id: 'grade',
      header: '학년',
      accessorKey: 'grade',
    },
    {
      id: 'program_type',
      header: '과정구분',
      accessorKey: 'program_type',
    },
    {
      id: 'enrollment_status',
      header: '학적상태',
      accessorKey: 'enrollment_status',
    },
  ];

  const handleDownloadCSV = () => {
    if (data?.data) {
      const csvData = data.data.map(s => ({
        학번: s.student_number,
        이름: s.name,
        단과대학: s.department.college_name,
        학과: s.department.department_name,
        학년: s.grade,
        과정구분: s.program_type,
        학적상태: s.enrollment_status,
      }));
      downloadCSV(csvData, `students_${new Date().toISOString().split('T')[0]}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">학생 목록</h2>
        <div className="flex gap-2">
          <Input
            placeholder="학번 또는 이름 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV 다운로드
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
      />

      {data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {data.pagination.total}건 중 {((page - 1) * 50) + 1}-
            {Math.min(page * 50, data.pagination.total)}건
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              이전
            </Button>
            <span className="py-2 px-4">
              {page} / {data.pagination.total_pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.pagination.total_pages}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5.3 React Query Hooks

**파일 위치**: `src/features/students/hooks/useEnrollmentStats.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { EnrollmentFilters, EnrollmentStatsResponse } from '../types';

export function useEnrollmentStats(filters: EnrollmentFilters) {
  return useQuery<EnrollmentStatsResponse>({
    queryKey: ['enrollment-stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.college) params.set('college', filters.college);
      if (filters.department) params.set('department', filters.department);
      if (filters.program_types?.length) {
        params.set('program_types', filters.program_types.join(','));
      }
      if (filters.enrollment_statuses?.length) {
        params.set('enrollment_statuses', filters.enrollment_statuses.join(','));
      }

      const response = await fetch(`/api/students/enrollment/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch enrollment stats');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
```

**파일 위치**: `src/features/students/hooks/useStudentList.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { StudentWithDepartment } from '../types';

type Params = {
  page?: number;
  limit?: number;
  search?: string;
  college?: string;
  department?: string;
  program_types?: string[];
  enrollment_statuses?: string[];
};

export function useStudentList(params: Params) {
  return useQuery({
    queryKey: ['student-list', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.search) searchParams.set('search', params.search);
      if (params.college) searchParams.set('college', params.college);
      if (params.department) searchParams.set('department', params.department);
      if (params.program_types?.length) {
        searchParams.set('program_types', params.program_types.join(','));
      }
      if (params.enrollment_statuses?.length) {
        searchParams.set('enrollment_statuses', params.enrollment_statuses.join(','));
      }

      const response = await fetch(`/api/students/list?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch student list');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## 6. 상태 관리

### 6.1 상태 관리 전략

- **서버 상태**: React Query (TanStack Query) 사용
- **UI 상태**: React useState 사용
- **URL 상태**: Next.js useSearchParams 사용 (선택 사항)

### 6.2 필터 상태 URL 동기화 (선택 사항)

**파일 위치**: `src/features/students/hooks/useEnrollmentFilters.ts`

```typescript
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { EnrollmentFilters } from '../types';

export function useEnrollmentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<EnrollmentFilters>(() => ({
    college: searchParams.get('college') || undefined,
    department: searchParams.get('department') || undefined,
    program_types: searchParams.get('program_types')?.split(',') || undefined,
    enrollment_statuses: searchParams.get('enrollment_statuses')?.split(',') || ['재학'],
  }));

  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.college) params.set('college', filters.college);
    if (filters.department) params.set('department', filters.department);
    if (filters.program_types?.length) {
      params.set('program_types', filters.program_types.join(','));
    }
    if (filters.enrollment_statuses?.length) {
      params.set('enrollment_statuses', filters.enrollment_statuses.join(','));
    }

    router.push(`?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  return [filters, setFilters] as const;
}
```

---

## 7. 구현 단계

### 7.1 Phase 1: 기본 인프라 (1-2일)

1. **타입 정의**
   - `src/features/students/types.ts` 작성
   - Database 타입과 일치 확인

2. **Backend API 구현**
   - `src/features/students/backend/route.ts`
   - `src/features/students/backend/queries.ts`
   - `src/features/students/backend/schemas.ts`
   - Hono 라우터 등록

3. **React Query Hooks**
   - `useEnrollmentStats.ts`
   - `useStudentList.ts`

### 7.2 Phase 2: UI 컴포넌트 (2-3일)

4. **필터 컴포넌트**
   - `EnrollmentFilters.tsx`
   - 단과대학/학과 드롭다운
   - 과정구분/학적상태 체크박스

5. **KPI 카드**
   - `EnrollmentKPICards.tsx`
   - 공용 KPICard 컴포넌트 재사용

6. **차트 컴포넌트**
   - `EnrollmentCharts.tsx`
   - 도넛 차트, 막대 그래프, 스택 바, 파이 차트
   - StackedBarChart 신규 구현 필요

### 7.3 Phase 3: 테이블 및 다운로드 (1-2일)

7. **학생 목록 테이블**
   - `StudentListTable.tsx`
   - 공용 DataTable 컴포넌트 재사용
   - 페이지네이션, 검색, 정렬

8. **데이터 다운로드**
   - CSV 다운로드 기능
   - Excel 다운로드 기능 (선택 사항)

### 7.4 Phase 4: 통합 및 테스트 (1일)

9. **메인 페이지 통합**
   - `src/app/dashboard/students/enrollment/page.tsx`
   - 모든 컴포넌트 조합
   - 에러 핸들링 및 로딩 상태

10. **테스트 및 디버깅**
    - API 응답 검증
    - 차트 렌더링 확인
    - 필터 동작 확인

### 7.5 총 소요 시간: 5-8일

---

## 8. 테스트 계획

### 8.1 단위 테스트

#### Backend Queries
```typescript
// src/features/students/backend/queries.test.ts
describe('getEnrollmentStats', () => {
  it('should return correct summary', async () => {
    const result = await getEnrollmentStats({});
    expect(result.summary.total_students).toBeGreaterThan(0);
  });

  it('should filter by college', async () => {
    const result = await getEnrollmentStats({ college: '공과대학' });
    expect(result.by_college.every(c => c.college_name === '공과대학')).toBe(true);
  });
});
```

#### React Hooks
```typescript
// src/features/students/hooks/useEnrollmentStats.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useEnrollmentStats } from './useEnrollmentStats';

describe('useEnrollmentStats', () => {
  it('should fetch enrollment stats', async () => {
    const { result } = renderHook(() => useEnrollmentStats({}));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.summary).toBeDefined();
  });
});
```

### 8.2 통합 테스트

#### API Endpoint
```typescript
// src/features/students/backend/route.test.ts
describe('GET /api/students/enrollment/stats', () => {
  it('should return 200 with valid data', async () => {
    const response = await fetch('/api/students/enrollment/stats');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.summary).toBeDefined();
  });

  it('should filter by college', async () => {
    const response = await fetch('/api/students/enrollment/stats?college=공과대학');
    const data = await response.json();
    expect(data.by_college.length).toBeGreaterThan(0);
  });
});
```

### 8.3 E2E 테스트 (선택 사항)

```typescript
// e2e/student-enrollment.spec.ts
import { test, expect } from '@playwright/test';

test('should display enrollment page', async ({ page }) => {
  await page.goto('/dashboard/students/enrollment');

  // KPI 카드 확인
  await expect(page.locator('text=총 재학생')).toBeVisible();

  // 차트 확인
  await expect(page.locator('text=단과대학별 재학생 분포')).toBeVisible();

  // 테이블 확인
  await expect(page.locator('text=학생 목록')).toBeVisible();
});

test('should filter by college', async ({ page }) => {
  await page.goto('/dashboard/students/enrollment');

  // 필터 선택
  await page.click('[placeholder="단과대학 선택"]');
  await page.click('text=공과대학');

  // 결과 확인
  await expect(page.locator('text=공과대학')).toBeVisible();
});
```

### 8.4 테스트 체크리스트

- [ ] API 응답 스키마 검증
- [ ] 필터링 동작 확인 (단과대학, 학과, 과정구분, 학적상태)
- [ ] 페이지네이션 동작 확인
- [ ] 검색 기능 확인
- [ ] CSV 다운로드 확인
- [ ] 빈 상태 UI 확인
- [ ] 에러 상태 UI 확인
- [ ] 로딩 상태 UI 확인
- [ ] 반응형 레이아웃 확인 (모바일, 태블릿)
- [ ] 브라우저 호환성 확인 (Chrome, Firefox, Safari)

---

## 9. 참고 사항

### 9.1 공통 모듈 의존성

이 페이지는 다음 공통 모듈에 의존합니다:

- **레이아웃**: `DashboardLayout`, `Header`, `Sidebar`
- **UI 컴포넌트**: `KPICard`, `DataTable`, `ChartWrapper`, `FilterPanel`
- **차트**: `DonutChart`, `BarChart`, `PieChart`
- **유틸리티**: `formatNumber`, `downloadCSV`
- **Hooks**: `useDepartments`

**중요**: 공통 모듈이 구현되기 전까지는 페이지 개발을 시작할 수 없습니다.

### 9.2 신규 구현 필요 컴포넌트

- **StackedBarChart**: 과정구분별 스택 바 차트
  - 파일 위치: `src/components/charts/stacked-bar-chart.tsx`
  - Recharts의 StackedBarChart 사용

### 9.3 데이터베이스 준비

이 페이지가 정상 동작하려면 다음 데이터가 필요합니다:

- **students 테이블**: 학생 데이터 적재
- **departments 테이블**: 단과대학 및 학과 정보
- **샘플 데이터**: 최소 100건 이상의 학생 데이터

### 9.4 성능 고려사항

- **집계 쿼리 최적화**: students 테이블이 크면 인덱스 필요
  - `department_id`, `enrollment_status`, `program_type` 인덱스
- **페이지네이션**: 학생 목록은 반드시 페이지네이션 적용
- **캐싱**: React Query 5분 캐싱으로 불필요한 API 요청 감소

### 9.5 보안 고려사항

- **개인정보 보호**: 학생 이메일은 기본적으로 비공개 (필요시 마스킹)
- **권한 확인**: API Route에서 Clerk 인증 필수 확인
- **SQL Injection 방지**: Supabase Prepared Statements 사용

---

## 10. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0  | 2025-11-02 | AI Assistant | 초기 작성 |

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design, UC-006을 기반으로 작성되었습니다.
모든 공통 모듈과의 충돌을 방지하고, 일관된 코드 구조를 유지하도록 설계되었습니다.
