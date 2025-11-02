-- Initial Schema Migration for University Dashboard
-- Version: 2.0
-- Created: 2025-11-02

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Tables

-- 2.1 users (사용자)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_role CHECK (role IN ('viewer', 'administrator'))
);

COMMENT ON TABLE users IS 'Clerk 인증 사용자 정보';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk에서 발급한 고유 사용자 ID';
COMMENT ON COLUMN users.role IS '사용자 역할: viewer, administrator';

-- 2.2 departments (단과대학 및 학과)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name VARCHAR(100) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_college_department UNIQUE(college_name, department_name)
);

COMMENT ON TABLE departments IS '단과대학 및 학과 정보';
COMMENT ON COLUMN departments.college_name IS '단과대학명 (예: 공과대학)';
COMMENT ON COLUMN departments.department_name IS '학과명 (예: 컴퓨터공학과)';

-- 2.3 kpi_metrics (학과별 KPI)
CREATE TABLE IF NOT EXISTS kpi_metrics (
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

COMMENT ON TABLE kpi_metrics IS '학과별 연도별 KPI 성과 지표';
COMMENT ON COLUMN kpi_metrics.employment_rate IS '졸업생 취업률 (%)';

-- 2.4 publications (논문 게재)
CREATE TABLE IF NOT EXISTS publications (
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

COMMENT ON TABLE publications IS '논문 게재 정보';
COMMENT ON COLUMN publications.project_linked IS '연구과제 연계 여부';

-- 2.5 research_projects (연구과제)
CREATE TABLE IF NOT EXISTS research_projects (
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

COMMENT ON TABLE research_projects IS '연구과제 기본 정보';
COMMENT ON COLUMN research_projects.total_budget IS '총 연구비 (원)';

-- 2.6 budget_executions (예산 집행)
CREATE TABLE IF NOT EXISTS budget_executions (
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

COMMENT ON TABLE budget_executions IS '연구과제별 예산 집행 내역';

-- 2.7 students (학생)
CREATE TABLE IF NOT EXISTS students (
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

COMMENT ON TABLE students IS '재학생 정보';

-- 2.8 upload_logs (업로드 로그)
CREATE TABLE IF NOT EXISTS upload_logs (
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

COMMENT ON TABLE upload_logs IS '데이터 파일 업로드 이력';
