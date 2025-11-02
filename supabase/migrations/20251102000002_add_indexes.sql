-- Add Indexes Migration
-- Version: 2.0
-- Created: 2025-11-02

-- users indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_college ON departments(college_name);

-- kpi_metrics indexes
CREATE INDEX IF NOT EXISTS idx_kpi_dept_year ON kpi_metrics(department_id, evaluation_year DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_year ON kpi_metrics(evaluation_year DESC);

-- publications indexes
CREATE INDEX IF NOT EXISTS idx_pub_dept_date ON publications(department_id, publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_pub_date ON publications(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_pub_main_author ON publications(main_author);
CREATE INDEX IF NOT EXISTS idx_pub_journal_grade ON publications(journal_grade);

-- research_projects indexes
CREATE INDEX IF NOT EXISTS idx_project_dept ON research_projects(department_id);
CREATE INDEX IF NOT EXISTS idx_project_pi ON research_projects(principal_investigator);
CREATE INDEX IF NOT EXISTS idx_project_agency ON research_projects(funding_agency);

-- budget_executions indexes
CREATE INDEX IF NOT EXISTS idx_budget_project_date ON budget_executions(project_id, execution_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_date ON budget_executions(execution_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_status ON budget_executions(status);

-- students indexes
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_students_advisor ON students(advisor);
CREATE INDEX IF NOT EXISTS idx_students_program ON students(program_type);

-- upload_logs indexes
CREATE INDEX IF NOT EXISTS idx_upload_status ON upload_logs(status);
CREATE INDEX IF NOT EXISTS idx_upload_created ON upload_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_user ON upload_logs(user_id) WHERE user_id IS NOT NULL;
