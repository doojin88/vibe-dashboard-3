import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const facultyFilterSchema = z.object({
  evaluation_year: z
    .string()
    .transform((val) => val.split(',').map(Number))
    .optional(),
  college_name: z
    .string()
    .transform((val) => val.split(','))
    .optional(),
  department_name: z
    .string()
    .transform((val) => val.split(','))
    .optional(),
});

export function registerFacultyRoutes(app: Hono<AppEnv>) {
  const faculty = new Hono<AppEnv>();

  faculty.get('/', zValidator('query', facultyFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 기본 쿼리
    let query = supabase
      .from('kpi_metrics')
      .select(
        `
        id,
        evaluation_year,
        full_time_faculty,
        visiting_faculty,
        department:departments!inner(college_name, department_name)
      `
      )
      .not('full_time_faculty', 'is', null)
      .not('visiting_faculty', 'is', null)
      .order('evaluation_year', { ascending: false });

    // 평가년도 필터
    if (filters.evaluation_year && filters.evaluation_year.length > 0) {
      query = query.in('evaluation_year', filters.evaluation_year);
    }

    const { data: rawData, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    if (!rawData) {
      return c.json({ error: 'No data found' }, 404);
    }

    // 데이터 변환
    const data = rawData.map((item: any) => ({
      ...item,
      college_name: item.department.college_name,
      department_name: item.department.department_name,
      total_faculty: (item.full_time_faculty || 0) + (item.visiting_faculty || 0),
      full_time_ratio:
        item.full_time_faculty && item.visiting_faculty
          ? (item.full_time_faculty / (item.full_time_faculty + item.visiting_faculty)) * 100
          : 0,
    }));

    // 단과대학 및 학과 필터 (메모리 내 필터링)
    let filteredData = data;
    if (filters.college_name && filters.college_name.length > 0) {
      filteredData = filteredData.filter((item) =>
        filters.college_name!.includes(item.college_name)
      );
    }
    if (filters.department_name && filters.department_name.length > 0) {
      filteredData = filteredData.filter((item) =>
        filters.department_name!.includes(item.department_name)
      );
    }

    // KPI 집계
    const aggregate = {
      total_full_time: filteredData.reduce((sum, item) => sum + (item.full_time_faculty || 0), 0),
      total_visiting: filteredData.reduce((sum, item) => sum + (item.visiting_faculty || 0), 0),
      total_departments: new Set(filteredData.map((item) => item.department_name)).size,
      avg_full_time_ratio:
        filteredData.length > 0
          ? filteredData.reduce((sum, item) => sum + item.full_time_ratio, 0) / filteredData.length
          : 0,
    };

    // 학과별 차트 데이터 (최신 평가년도 기준)
    const latestYear = Math.max(...filteredData.map((item) => item.evaluation_year));
    const latestYearData = filteredData.filter((item) => item.evaluation_year === latestYear);

    const byDepartment = latestYearData.map((item) => ({
      department_name: item.department_name,
      college_name: item.college_name,
      full_time_faculty: item.full_time_faculty || 0,
      visiting_faculty: item.visiting_faculty || 0,
    }));

    // 단과대학별 집계
    const collegeMap = new Map<string, number>();
    latestYearData.forEach((item) => {
      const current = collegeMap.get(item.college_name) || 0;
      collegeMap.set(item.college_name, current + item.total_faculty);
    });

    const totalFaculty = Array.from(collegeMap.values()).reduce((sum, val) => sum + val, 0);
    const byCollege = Array.from(collegeMap.entries()).map(([college_name, total]) => ({
      college_name,
      total_faculty: total,
      percentage: totalFaculty > 0 ? (total / totalFaculty) * 100 : 0,
    }));

    // 연도별 추이
    const yearMap = new Map<number, { full_time: number; visiting: number }>();
    filteredData.forEach((item) => {
      const current = yearMap.get(item.evaluation_year) || { full_time: 0, visiting: 0 };
      yearMap.set(item.evaluation_year, {
        full_time: current.full_time + (item.full_time_faculty || 0),
        visiting: current.visiting + (item.visiting_faculty || 0),
      });
    });

    const trend = Array.from(yearMap.entries())
      .map(([year, counts]) => ({
        evaluation_year: year,
        total_full_time: counts.full_time,
        total_visiting: counts.visiting,
      }))
      .sort((a, b) => a.evaluation_year - b.evaluation_year);

    return c.json({
      aggregate,
      chart: {
        byDepartment,
        byCollege,
        trend,
      },
      table: filteredData.map((item) => ({
        id: item.id,
        evaluation_year: item.evaluation_year,
        college_name: item.college_name,
        department_name: item.department_name,
        full_time_faculty: item.full_time_faculty || 0,
        visiting_faculty: item.visiting_faculty || 0,
        total_faculty: item.total_faculty,
        full_time_ratio: item.full_time_ratio,
      })),
    });
  });

  faculty.get('/filters', async (c) => {
    const supabase = getSupabaseServiceClient();

    // 평가년도 목록
    const { data: yearsData } = await supabase
      .from('kpi_metrics')
      .select('evaluation_year')
      .not('full_time_faculty', 'is', null)
      .not('visiting_faculty', 'is', null)
      .order('evaluation_year', { ascending: false });

    const years = Array.from(new Set(yearsData?.map((item) => item.evaluation_year) || []));

    // 단과대학 및 학과 목록
    const { data: deptsData } = await supabase
      .from('departments')
      .select('college_name, department_name')
      .order('college_name, department_name');

    const colleges = Array.from(new Set(deptsData?.map((item) => item.college_name) || []));

    return c.json({
      years,
      colleges,
      departments: deptsData || [],
    });
  });

  app.route('/faculty', faculty);
}
