# Database Design Document
# 대학교 데이터 시각화 대시보드

**버전:** 2.0
**작성일:** 2025-11-02
**프로젝트명:** University Dashboard - Vibe Dashboard 2
**데이터베이스:** Supabase (PostgreSQL 15+)
**기반 문서:** PRD v1.0, Userflow v1.0

---

## 목차

1. [데이터베이스 개요](#1-데이터베이스-개요)
2. [데이터 플로우](#2-데이터-플로우)
3. [데이터베이스 스키마](#3-데이터베이스-스키마)
4. [관계 모델링](#4-관계-모델링)
5. [데이터 무결성 제약조건](#5-데이터-무결성-제약조건)
6. [인덱스 전략](#6-인덱스-전략)
7. [보안 및 접근 제어](#7-보안-및-접근-제어)
8. [마이그레이션 전략](#8-마이그레이션-전략)
9. [백업 및 복구 전략](#9-백업-및-복구-전략)
10. [성능 최적화](#10-성능-최적화)
11. [변경 이력](#11-변경-이력)

---

## 1. 데이터베이스 개요

### 1.1 데이터베이스 선택

**Supabase (PostgreSQL 15+)**
- 오픈소스 Firebase 대안
- PostgreSQL 기반의 강력한 관계형 데이터베이스
- Row Level Security (RLS) 지원
- Real-time subscriptions
- 자동 백업

### 1.2 설계 원칙

1. **최소 복잡성**: MVP에 필요한 최소한의 구조만 구현
2. **정규화**: 제3정규형(3NF) 준수로 데이터 중복 최소화
3. **성능**: 실제 쿼리 패턴에 기반한 인덱싱
4. **무결성**: Foreign Key 및 제약조건으로 데이터 일관성 보장
5. **보안**: RLS를 통한 행 수준 접근 제어 (Clerk 연동)
6. **확장성**: 단순하지만 확장 가능한 구조

### 1.3 데이터 규모 예상 (3년)

| 테이블 | 예상 레코드 수 | 증가율 |
|--------|--------------|--------|
| departments | ~100개 | 저성장 |
| kpi_metrics | ~1,500개 | 연간 500개 |
| publications | ~3,000개 | 연간 1,000개 |
| research_projects | ~600개 | 연간 200개 |
| budget_executions | ~6,000개 | 연간 2,000개 |
| students | ~30,000명 | 연간 10,000명 증가 |
| users | ~100명 | 저성장 |
| upload_logs | ~1,500개 | 연간 500개 |

**예상 데이터 볼륨**: ~50MB (3년 후)

---

## 2. 데이터 플로우

### 2.1 데이터 입력 플로우

```
CSV 파일 (Ecount 추출)
    ↓
[관리자 업로드] (/data/upload)
    ↓
Supabase Storage (temp-uploads)
    ↓
[데이터 검증] (/data/validation)
    ├── 스키마 검증 (Zod)
    ├── 데이터 타입 검증
    ├── 중복 검사
    └── 외래키 참조 무결성 확인
    ↓
[적재 승인]
    ↓
PostgreSQL 트랜잭션
    ├── departments 자동 생성/업데이트
    ├── 메인 테이블 Upsert (ON CONFLICT)
    └── upload_logs 기록
    ↓
대시보드 캐시 무효화 (React Query)
    ↓
[대시보드 조회]
```

### 2.2 데이터 조회 플로우

```
[사용자 요청] (/dashboard/*)
    ↓
Clerk 인증 확인 (Middleware)
    ↓
Supabase RLS 검증
    ↓
PostgreSQL 쿼리 실행
    ├── SELECT with JOIN
    ├── 집계 함수 (COUNT, SUM, AVG)
    └── 필터링 (WHERE, ORDER BY)
    ↓
React Query 캐싱 (5분)
    ↓
차트 라이브러리 렌더링
    ↓
[대시보드 표시]
```

### 2.3 사용자 인증 플로우

```
[Google 로그인] (Clerk)
    ↓
Clerk User 생성
    ↓
Application Level Sync
    ↓
Supabase users 테이블
    ├── INSERT (신규)
    └── UPDATE (기존)
    ↓
role 기반 접근 제어 (RBAC)
```

---

## 3. 데이터베이스 스키마

### 3.1 ERD (Entity Relationship Diagram)

```
┌─────────────┐         ┌──────────────────┐
│   users     │         │   departments    │
│─────────────│         │──────────────────│
│ id (PK)     │         │ id (PK)          │
│ clerk_id    │         │ college_name     │
│ email       │         │ department_name  │
│ role        │         │ created_at       │
└─────────────┘         └──────────────────┘
      │                          │
      │                          │ (1:N)
      │                    ┌─────┴─────┬──────────────┬───────────┐
      │                    │           │              │           │
      │                    ▼           ▼              ▼           ▼
      │              ┌──────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────┐
      │              │kpi_      │ │publications │ │students  │ │research_ │
      │              │metrics   │ │─────────────│ │──────────│ │projects  │
      │              │──────────│ │id (PK)      │ │id (PK)   │ │──────────│
      │              │id (PK)   │ │dept_id (FK) │ │dept_id   │ │id (PK)   │
      │              │dept_id   │ │pub_id       │ │(FK)      │ │project_no│
      │              │(FK)      │ │title        │ │student_no│ │dept_id   │
      │              │eval_year │ │main_author  │ │name      │ │(FK)      │
      │              └──────────┘ │journal_name │ └──────────┘ │pi        │
      │                           │journal_grade│              │total_    │
      │                           │pub_date     │              │budget    │
      │                           └─────────────┘              └──────────┘
      │                                                              │
      │                                                              │ (1:N)
      │                                                              ▼
      │                                                      ┌──────────────┐
      │                                                      │budget_       │
      │                                                      │executions    │
      │                                                      │──────────────│
      │                                                      │id (PK)       │
      │                                                      │exec_id       │
      │                                                      │project_id(FK)│
      │                                                      │exec_date     │
      │ (1:N)                                                │exec_amount   │
      ▼                                                      │status        │
┌─────────────┐                                             └──────────────┘
│upload_logs  │
│─────────────│
│id (PK)      │
│user_id (FK) │
│file_name    │
│data_type    │
│status       │
└─────────────┘
```

### 3.2 테이블 상세 정의

#### 3.2.1 users (사용자)

**목적**: Clerk 인증 사용자 정보 동기화 및 역할 관리

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_role CHECK (role IN ('viewer', 'administrator'))
);

CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS 'Clerk 인증 사용자 정보';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk에서 발급한 고유 사용자 ID';
COMMENT ON COLUMN users.role IS '사용자 역할: viewer, administrator';
```

**변경사항 (v2.0)**:
- `role` 인덱스 추가 (RBAC 쿼리 최적화)
- email UNIQUE 제약 제거 (Clerk가 관리)

---

#### 3.2.2 departments (단과대학 및 학과)

**목적**: 대학 조직 구조 관리

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name VARCHAR(100) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_college_department UNIQUE(college_name, department_name)
);

CREATE INDEX idx_departments_college ON departments(college_name);

COMMENT ON TABLE departments IS '단과대학 및 학과 정보';
COMMENT ON COLUMN departments.college_name IS '단과대학명 (예: 공과대학)';
COMMENT ON COLUMN departments.department_name IS '학과명 (예: 컴퓨터공학과)';
```

**설계 결정**:
- 단과대학과 학과를 하나의 테이블로 관리 (비정규화)
- 이유: 메타데이터 없고, 조인 오버헤드 감소, 쿼리 단순화

---

#### 3.2.3 kpi_metrics (학과별 KPI)

**목적**: 학과별 연도별 KPI 성과 지표 저장

```sql
CREATE TABLE kpi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  evaluation_year INTEGER NOT NULL,
  employment_rate DECIMAL(5,2),
  full_time_faculty INTEGER,
  visiting_faculty INTEGER,
  tech_transfer_income DECIMAL(10,2),
  intl_conference_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_dept_year UNIQUE(department_id, evaluation_year),
  CONSTRAINT check_employment_rate CHECK (employment_rate >= 0 AND employment_rate <= 100),
  CONSTRAINT check_positive_faculty CHECK (full_time_faculty >= 0 AND visiting_faculty >= 0),
  CONSTRAINT check_positive_income CHECK (tech_transfer_income >= 0),
  CONSTRAINT check_positive_conference CHECK (intl_conference_count >= 0),
  CONSTRAINT check_eval_year CHECK (evaluation_year >= 2000 AND evaluation_year <= 2100)
);

CREATE INDEX idx_kpi_dept_year ON kpi_metrics(department_id, evaluation_year DESC);
CREATE INDEX idx_kpi_year ON kpi_metrics(evaluation_year DESC);

COMMENT ON TABLE kpi_metrics IS '학과별 연도별 KPI 성과 지표';
COMMENT ON COLUMN kpi_metrics.employment_rate IS '졸업생 취업률 (%)';
```

**변경사항 (v2.0)**:
- `ON DELETE CASCADE` → `RESTRICT` (실수 방지)
- 복합 인덱스 최적화 (dept + year DESC)
- evaluation_year 범위 체크 추가

**CSV 매핑**:
- `department_kpi.csv` → `kpi_metrics`

---

#### 3.2.4 publications (논문 게재)

**목적**: 논문 게재 정보 저장 및 관리

```sql
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  main_author VARCHAR(100) NOT NULL,
  co_authors TEXT,
  journal_name VARCHAR(200) NOT NULL,
  journal_grade VARCHAR(20),
  impact_factor DECIMAL(6,3),
  publication_date DATE NOT NULL,
  project_linked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_impact_factor CHECK (impact_factor IS NULL OR impact_factor >= 0),
  CONSTRAINT check_journal_grade CHECK (journal_grade IN ('SCIE', 'SSCI', 'A&HCI', 'SCOPUS', 'KCI', 'Other')),
  CONSTRAINT check_pub_date CHECK (publication_date <= CURRENT_DATE)
);

CREATE INDEX idx_pub_dept_date ON publications(department_id, publication_date DESC);
CREATE INDEX idx_pub_date ON publications(publication_date DESC);
CREATE INDEX idx_pub_main_author ON publications(main_author);
CREATE INDEX idx_pub_journal_grade ON publications(journal_grade);

COMMENT ON TABLE publications IS '논문 게재 정보';
COMMENT ON COLUMN publications.project_linked IS '연구과제 연계 여부';
```

**변경사항 (v2.0)**:
- publication_date 미래 날짜 체크 추가
- 인덱스 순서 최적화 (dept + date DESC)
- Full-text search 인덱스 제거 (MVP 불필요)

**CSV 매핑**:
- `publication_list.csv` → `publications`

---

#### 3.2.5 research_projects (연구과제)

**목적**: 연구과제 기본 정보 저장

```sql
CREATE TABLE research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(300) NOT NULL,
  principal_investigator VARCHAR(100) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  funding_agency VARCHAR(200) NOT NULL,
  total_budget BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_positive_budget CHECK (total_budget >= 0)
);

CREATE INDEX idx_project_dept ON research_projects(department_id);
CREATE INDEX idx_project_pi ON research_projects(principal_investigator);
CREATE INDEX idx_project_agency ON research_projects(funding_agency);

COMMENT ON TABLE research_projects IS '연구과제 기본 정보';
COMMENT ON COLUMN research_projects.total_budget IS '총 연구비 (원)';
```

**변경사항 (v2.0)**:
- PI, funding_agency 인덱스 추가 (실제 쿼리 패턴 반영)

**CSV 매핑**:
- `research_project_data.csv` → `research_projects`

---

#### 3.2.6 budget_executions (예산 집행)

**목적**: 연구과제별 예산 집행 내역 저장

```sql
CREATE TABLE budget_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE RESTRICT,
  execution_date DATE NOT NULL,
  execution_item VARCHAR(100) NOT NULL,
  execution_amount BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_positive_amount CHECK (execution_amount >= 0),
  CONSTRAINT check_status CHECK (status IN ('집행완료', '처리중')),
  CONSTRAINT check_exec_date CHECK (execution_date <= CURRENT_DATE)
);

CREATE INDEX idx_budget_project_date ON budget_executions(project_id, execution_date DESC);
CREATE INDEX idx_budget_date ON budget_executions(execution_date DESC);
CREATE INDEX idx_budget_status ON budget_executions(status);

COMMENT ON TABLE budget_executions IS '연구과제별 예산 집행 내역';
```

**변경사항 (v2.0)**:
- execution_date 미래 날짜 체크 추가
- 복합 인덱스 최적화

**CSV 매핑**:
- `research_project_data.csv` → `budget_executions`

---

#### 3.2.7 students (학생)

**목적**: 재학생 정보 관리

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  grade INTEGER,
  program_type VARCHAR(20),
  enrollment_status VARCHAR(20),
  gender VARCHAR(10),
  admission_year INTEGER,
  advisor VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_grade CHECK (grade >= 1 AND grade <= 8),
  CONSTRAINT check_program_type CHECK (program_type IN ('학사', '석사', '박사', '석박통합')),
  CONSTRAINT check_enrollment_status CHECK (enrollment_status IN ('재학', '휴학', '졸업', '자퇴', '제적')),
  CONSTRAINT check_gender CHECK (gender IN ('남', '여', '기타')),
  CONSTRAINT check_admission_year CHECK (admission_year >= 1900 AND admission_year <= 2100)
);

CREATE INDEX idx_students_dept ON students(department_id);
CREATE INDEX idx_students_enrollment ON students(enrollment_status);
CREATE INDEX idx_students_advisor ON students(advisor);
CREATE INDEX idx_students_program ON students(program_type);

COMMENT ON TABLE students IS '재학생 정보';
```

**변경사항 (v2.0)**:
- 이메일 암호화 제거 (오버엔지니어링)
- 인덱스 최적화

**CSV 매핑**:
- `student_roster.csv` → `students`

---

#### 3.2.8 upload_logs (업로드 로그)

**목적**: 데이터 파일 업로드 이력 추적

```sql
CREATE TABLE upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(200) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  data_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  rows_processed INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_file_size CHECK (file_size >= 0),
  CONSTRAINT check_rows_processed CHECK (rows_processed >= 0),
  CONSTRAINT check_data_type CHECK (data_type IN ('department_kpi', 'publication_list', 'research_project_data', 'student_roster')),
  CONSTRAINT check_status CHECK (status IN ('uploaded', 'validated', 'completed', 'failed'))
);

CREATE INDEX idx_upload_status ON upload_logs(status);
CREATE INDEX idx_upload_created ON upload_logs(created_at DESC);
CREATE INDEX idx_upload_user ON upload_logs(user_id) WHERE user_id IS NOT NULL;

COMMENT ON TABLE upload_logs IS '데이터 파일 업로드 이력';
```

**변경사항 (v2.0)**:
- partial index 추가 (user_id WHERE NOT NULL)
- 데이터 보관 정책: 1년 후 자동 삭제 (별도 스크립트)

---

## 4. 관계 모델링

### 4.1 Primary Keys

모든 테이블은 UUID 타입의 Primary Key 사용:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**UUID 사용 이유**:
- 분산 환경에서 충돌 없는 고유 ID 생성
- 보안: Sequential ID 노출 방지
- 확장성: 여러 데이터 소스 통합 시 충돌 방지

### 4.2 Foreign Keys

**ON DELETE 전략**:
- **RESTRICT** (기본): 데이터 무결성 최우선, 실수로 인한 데이터 손실 방지
- **SET NULL**: upload_logs.user_id (사용자 삭제 시 로그 유지)
- **CASCADE**: 사용하지 않음 (명시적 삭제만 허용)

```sql
-- departments → 다른 테이블
department_id UUID REFERENCES departments(id) ON DELETE RESTRICT

-- research_projects → budget_executions
project_id UUID REFERENCES research_projects(id) ON DELETE RESTRICT

-- users → upload_logs
user_id UUID REFERENCES users(id) ON DELETE SET NULL
```

### 4.3 관계 다이어그램

```
departments (1) ─────< (N) kpi_metrics
departments (1) ─────< (N) publications
departments (1) ─────< (N) research_projects
departments (1) ─────< (N) students

research_projects (1) ─────< (N) budget_executions

users (1) ─────< (N) upload_logs
```

---

## 5. 데이터 무결성 제약조건

### 5.1 NOT NULL 제약

모든 필수 필드는 NOT NULL:

```sql
publication_id VARCHAR(50) UNIQUE NOT NULL
title TEXT NOT NULL
main_author VARCHAR(100) NOT NULL
```

### 5.2 UNIQUE 제약

```sql
-- users
clerk_user_id VARCHAR(100) UNIQUE NOT NULL

-- departments
CONSTRAINT unique_college_department UNIQUE(college_name, department_name)

-- kpi_metrics
CONSTRAINT unique_dept_year UNIQUE(department_id, evaluation_year)

-- publications, research_projects, budget_executions, students
-- 각각 고유 식별자 UNIQUE 제약
```

### 5.3 CHECK 제약

#### 범위 제약
```sql
-- 취업률: 0-100%
CONSTRAINT check_employment_rate CHECK (employment_rate >= 0 AND employment_rate <= 100)

-- 교원 수: 음수 불가
CONSTRAINT check_positive_faculty CHECK (full_time_faculty >= 0 AND visiting_faculty >= 0)

-- 날짜: 미래 날짜 방지
CONSTRAINT check_pub_date CHECK (publication_date <= CURRENT_DATE)
```

#### ENUM 제약
```sql
-- users.role
CONSTRAINT check_role CHECK (role IN ('viewer', 'administrator'))

-- publications.journal_grade
CONSTRAINT check_journal_grade CHECK (journal_grade IN ('SCIE', 'SSCI', 'A&HCI', 'SCOPUS', 'KCI', 'Other'))

-- students.enrollment_status
CONSTRAINT check_enrollment_status CHECK (enrollment_status IN ('재학', '휴학', '졸업', '자퇴', '제적'))
```

### 5.4 DEFAULT 제약

```sql
-- 모든 테이블
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- 특정 테이블
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
role VARCHAR(20) NOT NULL DEFAULT 'viewer'
project_linked BOOLEAN NOT NULL DEFAULT FALSE
```

---

## 6. 인덱스 전략

### 6.1 인덱스 설계 원칙

1. **실제 쿼리 패턴 기반**: PRD와 Userflow에 명시된 쿼리만 인덱싱
2. **복합 인덱스 우선**: WHERE + ORDER BY 패턴에 복합 인덱스
3. **선택도 고려**: 카디널리티 높은 컬럼 우선
4. **Write 비용 고려**: MVP에 불필요한 인덱스 제거

### 6.2 Primary Key 인덱스 (자동 생성)

PostgreSQL이 자동으로 생성하는 인덱스:

```sql
CREATE UNIQUE INDEX {table_name}_pkey ON {table_name}(id);
```

### 6.3 Foreign Key 인덱스

```sql
-- kpi_metrics
CREATE INDEX idx_kpi_dept_year ON kpi_metrics(department_id, evaluation_year DESC);

-- publications
CREATE INDEX idx_pub_dept_date ON publications(department_id, publication_date DESC);

-- research_projects
CREATE INDEX idx_project_dept ON research_projects(department_id);

-- budget_executions
CREATE INDEX idx_budget_project_date ON budget_executions(project_id, execution_date DESC);

-- students
CREATE INDEX idx_students_dept ON students(department_id);

-- upload_logs
CREATE INDEX idx_upload_user ON upload_logs(user_id) WHERE user_id IS NOT NULL;
```

### 6.4 조회 성능 최적화 인덱스

#### 필터링 주요 컬럼
```sql
-- kpi_metrics: 연도별 필터링
CREATE INDEX idx_kpi_year ON kpi_metrics(evaluation_year DESC);

-- publications: 날짜, 저자, 등급
CREATE INDEX idx_pub_date ON publications(publication_date DESC);
CREATE INDEX idx_pub_main_author ON publications(main_author);
CREATE INDEX idx_pub_journal_grade ON publications(journal_grade);

-- research_projects: PI, 지원기관
CREATE INDEX idx_project_pi ON research_projects(principal_investigator);
CREATE INDEX idx_project_agency ON research_projects(funding_agency);

-- budget_executions: 날짜, 상태
CREATE INDEX idx_budget_date ON budget_executions(execution_date DESC);
CREATE INDEX idx_budget_status ON budget_executions(status);

-- students: 학적상태, 지도교수, 과정구분
CREATE INDEX idx_students_enrollment ON students(enrollment_status);
CREATE INDEX idx_students_advisor ON students(advisor);
CREATE INDEX idx_students_program ON students(program_type);

-- upload_logs: 상태, 날짜
CREATE INDEX idx_upload_status ON upload_logs(status);
CREATE INDEX idx_upload_created ON upload_logs(created_at DESC);

-- users: 역할
CREATE INDEX idx_users_role ON users(role);

-- departments: 단과대학
CREATE INDEX idx_departments_college ON departments(college_name);
```

### 6.5 인덱스 유지보수

#### 정기 분석 (월 1회)
```sql
-- 통계 정보 업데이트
ANALYZE kpi_metrics;
ANALYZE publications;
ANALYZE research_projects;
ANALYZE budget_executions;
ANALYZE students;
```

#### 인덱스 모니터링
```sql
-- 사용되지 않는 인덱스 조회
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 6.6 제거된 인덱스 (v2.0)

MVP에 불필요한 인덱스 제거:
- Full-text search 인덱스 (publications.title, research_projects.project_name)
- Materialized View 인덱스 (MVP에서 사용 안 함)

---

## 7. 보안 및 접근 제어

### 7.1 Row Level Security (RLS)

**중요**: Clerk와 Supabase 통합 시 RLS 정책은 **Application Level에서 제어**합니다.
Clerk는 PostgreSQL의 `auth.uid()`를 설정하지 않으므로, RLS 정책은 단순화합니다.

#### 7.1.1 RLS 활성화

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_logs ENABLE ROW LEVEL SECURITY;
```

#### 7.1.2 RLS 정책 (단순화)

**접근 제어 방식**: Application Level (Next.js API Routes)에서 Clerk 인증 확인 후 Supabase Service Role Key 사용

```sql
-- 기본 정책: Service Role만 전체 접근 허용
-- Anon key는 접근 불가 (Application Level에서 인증 후 요청)

-- users 테이블
CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 다른 모든 테이블도 동일
CREATE POLICY "Service role full access"
  ON departments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access"
  ON kpi_metrics FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ... (나머지 테이블 동일)
```

**변경사항 (v2.0)**:
- 복잡한 RLS 정책 제거 (Clerk 통합 시 작동 안 함)
- Application Level 인증으로 단순화
- Service Role Key만 전체 접근 허용

### 7.2 Application Level 접근 제어

#### Next.js API Route 패턴

```typescript
// app/api/dashboard/kpi/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 1. Clerk 인증 확인
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Supabase Service Role Client 생성
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key 사용
    { auth: { persistSession: false } }
  );

  // 3. 사용자 권한 확인 (필요시)
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_user_id', userId)
    .single();

  if (user?.role !== 'administrator') {
    return new Response('Forbidden', { status: 403 });
  }

  // 4. 데이터 조회
  const { data, error } = await supabase
    .from('kpi_metrics')
    .select('*')
    .order('evaluation_year', { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data);
}
```

### 7.3 데이터 암호화

#### 전송 암호화
- Supabase 연결 시 SSL/TLS 필수 (기본 제공)
- HTTPS 통신 강제 (Vercel)

#### 저장 암호화
- Supabase 자동 암호화 (AES-256)
- 추가 암호화 불필요 (오버엔지니어링)

### 7.4 환경 변수 관리

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (RLS 활성화 시 제한된 접근)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (서버 사이드 전용, 전체 접근)
```

**중요**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하지 않음

---

## 8. 마이그레이션 전략

### 8.1 마이그레이션 도구

**Supabase Migrations** 사용:
- SQL 기반 버전 관리
- `supabase/migrations/` 디렉토리

### 8.2 마이그레이션 파일 구조

```
/supabase
  /migrations
    20251102000001_initial_schema.sql
    20251102000002_add_indexes.sql
    20251102000003_enable_rls.sql
```

### 8.3 초기 스키마 마이그레이션

**20251102000001_initial_schema.sql**:

```sql
-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tables (순서: 의존성 없는 것부터)
CREATE TABLE users (...);
CREATE TABLE departments (...);
CREATE TABLE kpi_metrics (...);
CREATE TABLE publications (...);
CREATE TABLE research_projects (...);
CREATE TABLE budget_executions (...);
CREATE TABLE students (...);
CREATE TABLE upload_logs (...);

-- 3. Comments
COMMENT ON TABLE users IS 'Clerk 인증 사용자 정보';
-- ... (모든 테이블 및 컬럼 설명)
```

**20251102000002_add_indexes.sql**:

```sql
-- Foreign Key 인덱스
CREATE INDEX idx_kpi_dept_year ON kpi_metrics(department_id, evaluation_year DESC);
-- ...

-- 조회 성능 최적화 인덱스
CREATE INDEX idx_kpi_year ON kpi_metrics(evaluation_year DESC);
-- ...
```

**20251102000003_enable_rls.sql**:

```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ...

-- RLS 정책
CREATE POLICY "Service role full access" ON users ...;
-- ...
```

### 8.4 롤백 전략

```sql
-- 20251102000001_initial_schema.down.sql
DROP TABLE IF EXISTS upload_logs CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS budget_executions CASCADE;
DROP TABLE IF EXISTS research_projects CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS kpi_metrics CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### 8.5 마이그레이션 실행

```bash
# 로컬 개발
supabase migration up

# 프로덕션 배포
supabase db push
```

---

## 9. 백업 및 복구 전략

### 9.1 Supabase 자동 백업

**Pro 플랜** (권장):
- 일일 자동 백업 (30일 보관)
- Point-in-Time Recovery (PITR) 지원

**무료 플랜** (MVP):
- 일일 자동 백업 (7일 보관)

### 9.2 수동 백업 (선택 사항)

```bash
# 전체 데이터베이스 백업
pg_dump \
  --host=db.{project_ref}.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --format=custom \
  --file=backup_$(date +%Y%m%d).dump

# 특정 테이블 백업
pg_dump --table=kpi_metrics --table=publications --format=custom --file=dashboard_data.dump
```

### 9.3 백업 스케줄 (MVP)

| 백업 유형 | 빈도 | 보관 기간 |
|----------|------|----------|
| 자동 백업 | 매일 자동 | 7일 (무료 플랜) |
| 수동 백업 | 주 1회 | 1개월 |

### 9.4 복구 절차

```bash
# 전체 복구
pg_restore \
  --host=db.{project_ref}.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --clean \
  backup_20251102.dump
```

### 9.5 재해 복구 계획

#### RTO (Recovery Time Objective): 4시간
- 백업 파일 확인: 30분
- 새 Supabase 프로젝트 생성: 1시간
- 백업 복구: 2시간
- 검증 및 테스트: 30분

#### RPO (Recovery Point Objective): 24시간
- 일일 백업 기준 최대 24시간 데이터 손실

---

## 10. 성능 최적화

### 10.1 쿼리 최적화 패턴

#### 10.1.1 집계 쿼리

**좋은 예**:
```sql
-- 데이터베이스에서 집계
SELECT
  evaluation_year,
  AVG(employment_rate) AS avg_employment_rate,
  COUNT(*) AS department_count
FROM kpi_metrics
GROUP BY evaluation_year
ORDER BY evaluation_year DESC;
```

**나쁜 예**:
```typescript
// 애플리케이션에서 집계 (X)
const data = await supabase.from('kpi_metrics').select('*');
const avg = data.reduce((sum, row) => sum + row.employment_rate, 0) / data.length;
```

#### 10.1.2 JOIN 최적화

**좋은 예**:
```sql
-- 단일 JOIN 쿼리
SELECT
  p.*,
  d.college_name,
  d.department_name
FROM publications p
JOIN departments d ON d.id = p.department_id
WHERE p.publication_date >= '2023-01-01'
ORDER BY p.publication_date DESC;
```

**나쁜 예**:
```typescript
// N+1 쿼리 (X)
const publications = await supabase.from('publications').select('*');
for (const pub of publications) {
  const dept = await supabase.from('departments').select('*').eq('id', pub.department_id);
}
```

#### 10.1.3 페이지네이션

**Keyset Pagination (권장)**:
```sql
-- 다음 페이지
SELECT *
FROM publications
WHERE publication_date < '2024-01-01'
ORDER BY publication_date DESC
LIMIT 50;
```

**Offset Pagination (간단)**:
```sql
SELECT *
FROM publications
ORDER BY publication_date DESC
LIMIT 50 OFFSET 100;
```

### 10.2 인덱스 활용

#### EXPLAIN ANALYZE
```sql
EXPLAIN ANALYZE
SELECT *
FROM publications p
JOIN departments d ON d.id = p.department_id
WHERE p.journal_grade = 'SCIE'
  AND p.publication_date >= '2023-01-01'
ORDER BY p.publication_date DESC;

-- 결과 확인: Index Scan 사용 여부 체크
```

### 10.3 Connection Pooling

Supabase 기본 제공:
- **Transaction Mode**: 일반 쿼리 (기본값)
- **Session Mode**: 복잡한 트랜잭션

### 10.4 캐싱 전략

#### Application Level (React Query)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
    },
  },
});
```

### 10.5 배치 처리

```typescript
// 좋은 예: 배치 INSERT
const batchSize = 1000;
for (let i = 0; i < csvData.length; i += batchSize) {
  const batch = csvData.slice(i, i + batchSize);
  await supabase.from('publications').insert(batch);
}
```

### 10.6 모니터링

#### 느린 쿼리 조회
```sql
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 11. 변경 이력

### v2.0 (2025-11-02)

**주요 변경사항**:

1. **보안 설계 단순화**
   - RLS 정책 단순화 (Clerk 통합 고려)
   - Application Level 인증으로 변경
   - 불필요한 이메일 암호화 제거

2. **인덱스 최적화**
   - Full-text search 인덱스 제거
   - 실제 쿼리 패턴 기반 인덱스 추가
   - 복합 인덱스 순서 최적화

3. **제약조건 강화**
   - `ON DELETE RESTRICT`로 변경 (실수 방지)
   - 날짜 미래값 체크 추가
   - evaluation_year, admission_year 범위 체크

4. **오버엔지니어링 제거**
   - Audit Log 테이블 제거
   - Materialized View 제거 (MVP에서 불필요)
   - 복잡한 백업 스케줄 단순화

5. **실용성 개선**
   - 데이터 보관 정책 추가
   - Partial index 적용 (upload_logs.user_id)
   - 주석 및 설명 보강

**마이그레이션 가이드**:
```sql
-- v1.0 → v2.0 마이그레이션
-- 1. 기존 데이터 백업
-- 2. audit_logs 테이블 삭제 (사용 안 함)
-- 3. RLS 정책 재설정
-- 4. 인덱스 재생성
```

---

## 부록

### A. 유용한 쿼리 모음

#### 대시보드 KPI 쿼리
```sql
-- 전체 평균 취업률
SELECT AVG(employment_rate) AS avg_employment_rate
FROM kpi_metrics
WHERE evaluation_year = 2023;

-- 단과대학별 평균 취업률
SELECT
  d.college_name,
  AVG(k.employment_rate) AS avg_employment_rate,
  COUNT(DISTINCT d.id) AS department_count
FROM kpi_metrics k
JOIN departments d ON d.id = k.department_id
WHERE k.evaluation_year = 2023
GROUP BY d.college_name
ORDER BY avg_employment_rate DESC;

-- 연도별 논문 게재 수
SELECT
  EXTRACT(YEAR FROM publication_date) AS year,
  COUNT(*) AS publication_count,
  COUNT(*) FILTER (WHERE journal_grade = 'SCIE') AS scie_count,
  COUNT(*) FILTER (WHERE journal_grade = 'KCI') AS kci_count
FROM publications
GROUP BY year
ORDER BY year DESC;
```

### B. 데이터 정리 스크립트

```sql
-- 1년 이상 된 upload_logs 삭제 (월 1회 실행)
DELETE FROM upload_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

### C. 초기 샘플 데이터

```sql
-- users
INSERT INTO users (clerk_user_id, email, name, role) VALUES
('user_2abc123', 'admin@university.edu', '관리자', 'administrator'),
('user_2abc456', 'viewer@university.edu', '일반사용자', 'viewer');

-- departments
INSERT INTO departments (college_name, department_name) VALUES
('공과대학', '컴퓨터공학과'),
('공과대학', '기계공학과'),
('경영대학', '경영학과');
```

---

**문서 종료**

이 데이터베이스 설계는 YC 스타트업 CTO의 기준에 따라 다음을 준수합니다:
- 간결성: MVP에 필요한 최소한의 구조
- 확장성: 단순하지만 확장 가능한 설계
- 실용성: 오버엔지니어링 배제, 실제 요구사항만 반영
