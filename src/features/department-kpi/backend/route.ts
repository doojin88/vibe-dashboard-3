// src/features/department-kpi/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';

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
    const supabase = c.var.supabase;

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
      // Supabase nested filter
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
    const transformed = data.map((row: any) => ({
      id: row.id,
      evaluation_year: row.evaluation_year,
      college_name: row.departments?.college_name,
      department_name: row.departments?.department_name,
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
    const supabase = c.var.supabase;

    // 필터 조건 생성
    let query = supabase
      .from('kpi_metrics')
      .select(`
        employment_rate,
        full_time_faculty,
        tech_transfer_income,
        department_id,
        departments!inner (
          college_name,
          department_name
        )
      `);

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

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 집계 계산
    const department_count = new Set(data.map((row: any) => row.department_id)).size;

    const validEmploymentRates = data
      .map((row: any) => row.employment_rate)
      .filter((rate: any) => rate !== null);

    const avg_employment_rate =
      validEmploymentRates.length > 0
        ? validEmploymentRates.reduce((sum: number, rate: number) => sum + rate, 0) /
          validEmploymentRates.length
        : null;

    const validFaculty = data
      .map((row: any) => row.full_time_faculty)
      .filter((faculty: any) => faculty !== null);

    const avg_full_time_faculty =
      validFaculty.length > 0
        ? validFaculty.reduce((sum: number, faculty: number) => sum + faculty, 0) /
          validFaculty.length
        : null;

    const total_tech_transfer_income = data
      .map((row: any) => row.tech_transfer_income ?? 0)
      .reduce((sum: number, income: number) => sum + income, 0);

    return c.json({
      department_count,
      avg_employment_rate,
      avg_full_time_faculty,
      total_tech_transfer_income,
    });
  });

  // GET /api/department-kpi/filter-options
  kpi.get('/filter-options', zValidator('query', kpiFilterSchema), async (c) => {
    const { colleges } = c.req.valid('query');
    const supabase = c.var.supabase;

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
      evaluation_years: Array.from(
        new Set(years?.map((y: any) => y.evaluation_year) ?? [])
      ),
      college_names: Array.from(
        new Set(collegeList?.map((c: any) => c.college_name) ?? [])
      ),
      department_names: Array.from(
        new Set(deptList?.map((d: any) => d.department_name) ?? [])
      ),
    });
  });

  app.route('/department-kpi', kpi);
}
