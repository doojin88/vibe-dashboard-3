-- Enable Row Level Security Migration
-- Version: 2.0
-- Created: 2025-11-02
-- Note: RLS policies are simplified for Clerk + Supabase integration
-- Application-level authentication is used instead of complex RLS policies

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create simple policies for service role access
-- Service role has full access to all tables

-- users table
CREATE POLICY "Service role full access" ON users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- departments table
CREATE POLICY "Service role full access" ON departments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- kpi_metrics table
CREATE POLICY "Service role full access" ON kpi_metrics
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- publications table
CREATE POLICY "Service role full access" ON publications
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- research_projects table
CREATE POLICY "Service role full access" ON research_projects
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- budget_executions table
CREATE POLICY "Service role full access" ON budget_executions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- students table
CREATE POLICY "Service role full access" ON students
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- upload_logs table
CREATE POLICY "Service role full access" ON upload_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
