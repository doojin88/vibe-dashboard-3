-- Sample Data Migration
-- Version: 1.0
-- Created: 2025-11-03
-- Description: Comprehensive sample data for university dashboard testing

-- =============================================================================
-- 1. Insert Departments
-- =============================================================================
INSERT INTO departments (college_name, department_name) VALUES
('공과대학', '컴퓨터공학과'),
('공과대학', '전자공학과'),
('공과대학', '산업공학과'),
('인문대학', '국어국문학과'),
('인문대학', '철학과'),
('사범대학', '교육학과')
ON CONFLICT (college_name, department_name) DO NOTHING;

-- =============================================================================
-- 2. Insert KPI Metrics (학과별 KPI)
-- =============================================================================
-- Get department IDs for reference
WITH dept_ids AS (
  SELECT id, college_name, department_name FROM departments
)
INSERT INTO kpi_metrics (
  department_id,
  evaluation_year,
  employment_rate,
  full_time_faculty,
  visiting_faculty,
  tech_transfer_income,
  intl_conference_count
)
SELECT
  d.id,
  year,
  employment_rate::decimal,
  full_time_faculty,
  visiting_faculty,
  tech_transfer_income::decimal,
  intl_conference_count
FROM (VALUES
  -- 2023 Data
  ('공과대학', '컴퓨터공학과', 2023, 85.5, 15, 4, 8.5, 2),
  ('공과대학', '전자공학과', 2023, 88.2, 18, 3, 12.1, 3),
  ('인문대학', '국어국문학과', 2023, 65.7, 12, 2, 0.5, 1),
  ('인문대학', '철학과', 2023, 62.1, 8, 1, 0.1, 0),
  -- 2024 Data
  ('공과대학', '컴퓨터공학과', 2024, 87.1, 16, 5, 10.2, 3),
  ('공과대학', '전자공학과', 2024, 89.0, 18, 4, 15.8, 2),
  ('인문대학', '국어국문학과', 2024, 68.2, 12, 2, 0.8, 1),
  ('인문대학', '철학과', 2024, 63.5, 8, 2, 0.2, 1),
  -- 2025 Data
  ('공과대학', '컴퓨터공학과', 2025, 88.0, 17, 5, 13.5, 4),
  ('공과대학', '전자공학과', 2025, 90.5, 19, 5, 22.0, 3),
  ('인문대학', '국어국문학과', 2025, 70.1, 11, 3, 1.1, 2),
  ('인문대학', '철학과', 2025, 64.0, 9, 2, 0.3, 1)
) AS v(college, department, year, employment_rate, full_time_faculty, visiting_faculty, tech_transfer_income, intl_conference_count)
JOIN dept_ids d ON d.college_name = v.college AND d.department_name = v.department
ON CONFLICT (department_id, evaluation_year) DO NOTHING;

-- =============================================================================
-- 3. Insert Publications (논문 게재)
-- =============================================================================
WITH dept_ids AS (
  SELECT id, college_name, department_name FROM departments
)
INSERT INTO publications (
  publication_id,
  department_id,
  title,
  main_author,
  co_authors,
  journal_name,
  journal_grade,
  impact_factor,
  publication_date,
  project_linked
)
SELECT
  pub_id,
  d.id,
  title,
  main_author,
  co_authors,
  journal_name,
  journal_grade,
  impact_factor::decimal,
  pub_date::date,
  project_linked
FROM (VALUES
  ('PUB-23-001', '공과대학', '전자공학과', 'A Study on Low-Power Semiconductor Design', '김민준', '박지훈;최민서', 'IEEE Transactions on Circuits and Systems', 'SCIE', 3.9, '2023-02-18', true),
  ('PUB-23-002', '인문대학', '철학과', '현대 분석철학의 언어적 전회에 관한 고찰', '윤지원', '강예원', '철학연구', 'KCI', NULL, '2023-05-22', false),
  ('PUB-24-001', '공과대학', '컴퓨터공학과', 'Deep Learning based Anomaly Detection in Real-Time Traffic', '이서연', '정현우;김유진;한지민', 'Expert Systems with Applications', 'SCIE', 8.5, '2024-01-30', true),
  ('PUB-24-002', '공과대학', '전자공학과', 'Next-Generation Display Material Analysis', '김민준', '윤태영', 'Journal of Materials Chemistry C', 'SCIE', 6.4, '2024-04-11', true),
  ('PUB-24-003', '인문대학', '국어국문학과', '1920년대 시문학에 나타난 모더니즘 수용 양상', '박서정', '이수빈', '한국현대문학연구', 'KCI', NULL, '2024-07-29', false),
  ('PUB-25-001', '공과대학', '컴퓨터공학과', 'Federated Learning for Privacy-Preserving AI', '이서연', '정현우', 'IEEE Internet of Things Journal', 'SCIE', 10.6, '2025-06-15', true)
) AS v(pub_id, college, department, title, main_author, co_authors, journal_name, journal_grade, impact_factor, pub_date, project_linked)
JOIN dept_ids d ON d.college_name = v.college AND d.department_name = v.department
ON CONFLICT (publication_id) DO NOTHING;

-- =============================================================================
-- 4. Insert Research Projects (연구과제)
-- =============================================================================
WITH dept_ids AS (
  SELECT id, college_name, department_name FROM departments
)
INSERT INTO research_projects (
  project_number,
  project_name,
  principal_investigator,
  department_id,
  funding_agency,
  total_budget
)
SELECT
  project_num,
  project_name,
  pi,
  d.id,
  funding_agency,
  total_budget
FROM (VALUES
  ('NRF-2023-015', '차세대 AI 반도체 설계', '김민준', '공과대학', '전자공학과', '한국연구재단', 500000000),
  ('IITP-A-23-101', '자율주행 시뮬레이션 고도화', '이서연', '공과대학', '컴퓨터공학과', '정보통신기획평가원', 800000000),
  ('SME-2024-TECH-01', '중소기업 맞춤형 ERP 개발', '박서준', '공과대학', '산업공학과', '중소벤처기업부', 300000000),
  ('NRF-2025-002', '고대 철학 텍스트의 디지털 아카이빙', '최은경', '인문대학', '철학과', '한국연구재단', 80000000)
) AS v(project_num, project_name, pi, college, department, funding_agency, total_budget)
JOIN dept_ids d ON d.college_name = v.college AND d.department_name = v.department
ON CONFLICT (project_number) DO NOTHING;

-- =============================================================================
-- 5. Insert Budget Executions (예산 집행)
-- =============================================================================
WITH project_ids AS (
  SELECT id, project_number FROM research_projects
)
INSERT INTO budget_executions (
  execution_id,
  project_id,
  execution_date,
  execution_item,
  execution_amount,
  status,
  notes
)
SELECT
  exec_id,
  p.id,
  exec_date::date,
  exec_item,
  exec_amount,
  exec_status,
  notes
FROM (VALUES
  ('T2301001', 'NRF-2023-015', '2023-03-15', '연구장비 도입', 120000000, '집행완료', 'A-1급 스펙트로미터'),
  ('T2301002', 'IITP-A-23-101', '2023-04-20', '외부전문가 활용비', 8000000, '집행완료', NULL),
  ('T2301003', 'NRF-2023-015', '2023-05-10', '시약 및 재료비', 25500000, '집행완료', NULL),
  ('T2402001', 'SME-2024-TECH-01', '2024-02-28', '인건비', 50000000, '집행완료', '참여연구원 3개월 급여'),
  ('T2402002', 'IITP-A-23-101', '2024-03-05', '고성능 서버 임대', 45000000, '처리중', '견적서 검토 단계'),
  ('T2503001', 'NRF-2025-002', '2025-04-10', '국외여비', 4500000, '집행완료', '그리스 학회 참가'),
  ('T2503002', 'SME-2024-TECH-01', '2025-05-20', '기술이전료', 15000000, '집행완료', NULL),
  ('T2503003', 'IITP-A-23-101', '2025-06-01', '인건비', 120000000, '집행완료', NULL)
) AS v(exec_id, project_num, exec_date, exec_item, exec_amount, exec_status, notes)
JOIN project_ids p ON p.project_number = v.project_num
ON CONFLICT (execution_id) DO NOTHING;

-- =============================================================================
-- 6. Insert Students (재학생)
-- =============================================================================
WITH dept_ids AS (
  SELECT id, college_name, department_name FROM departments
)
INSERT INTO students (
  student_number,
  name,
  department_id,
  grade,
  program_type,
  enrollment_status,
  gender,
  admission_year,
  advisor,
  email
)
SELECT
  student_num,
  student_name,
  d.id,
  grade,
  program_type,
  enrollment_status,
  gender,
  admission_year,
  advisor,
  email
FROM (VALUES
  ('20201101', '김유진', '공과대학', '컴퓨터공학과', 4, '학사', '재학', '여', 2020, '이서연', 'yjkim@university.ac.kr'),
  ('20211205', '박지훈', '공과대학', '전자공학과', 3, '학사', '재학', '남', 2021, '김민준', 'jhpark@university.ac.kr'),
  ('20221302', '이수빈', '인문대학', '국어국문학과', 2, '학사', '재학', '여', 2022, '박서정', 'sblee@university.ac.kr'),
  ('20192101', '정현우', '공과대학', '컴퓨터공학과', NULL, '석사', '재학', '남', 2024, '이서연', 'hwjung@university.ac.kr'),
  ('20201215', '최민서', '공과대학', '전자공학과', 4, '학사', '휴학', '여', 2020, '김민준', 'mschoi@university.ac.kr'),
  ('20231308', '강예원', '인문대학', '철학과', 1, '학사', '재학', '여', 2023, NULL, 'ywkang@university.ac.kr'),
  ('20222203', '윤태영', '공과대학', '전자공학과', NULL, '석사', '재학', '남', 2025, '김민준', 'tyyoon@university.ac.kr'),
  ('20211120', '한지민', '공과대학', '컴퓨터공학과', 3, '학사', '재학', '여', 2021, '이서연', 'jmhan@university.ac.kr'),
  ('20181401', '서준호', '사범대학', '교육학과', 4, '학사', '졸업', '남', 2018, '최은경', 'jhseo@university.ac.kr')
) AS v(student_num, student_name, college, department, grade, program_type, enrollment_status, gender, admission_year, advisor, email)
JOIN dept_ids d ON d.college_name = v.college AND d.department_name = v.department
ON CONFLICT (student_number) DO NOTHING;

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Summary:
-- - Departments: 6 entries
-- - KPI Metrics: 12 entries (3 years × 4 departments)
-- - Publications: 6 entries
-- - Research Projects: 4 entries
-- - Budget Executions: 8 entries
-- - Students: 9 entries
