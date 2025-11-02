-- Seed Data Migration
-- Version: 2.0
-- Created: 2025-11-02
-- Note: Sample data for testing purposes

-- 1. Insert sample departments
INSERT INTO departments (college_name, department_name) VALUES
('공과대학', '컴퓨터공학과'),
('공과대학', '기계공학과'),
('공과대학', '전자공학과'),
('경영대학', '경영학과'),
('경영대학', '회계학과'),
('자연과학대학', '수학과'),
('자연과학대학', '물리학과'),
('인문대학', '영어영문학과'),
('인문대학', '국어국문학과'),
('사회과학대학', '심리학과')
ON CONFLICT (college_name, department_name) DO NOTHING;

-- Note: Other tables will be populated via CSV uploads
-- This migration only creates the basic department structure
