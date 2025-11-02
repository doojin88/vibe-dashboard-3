// src/features/employment/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const employmentFilterSchema = z.object({
  evaluation_year: z.coerce.number().array().optional(),
  college_name: z.string().array().optional(),
  department_name: z.string().array().optional(),
});

const TARGET_EMPLOYMENT_RATE = 70; // 목표 취업률 70%

export function registerEmploymentRoutes(app: Hono<AppEnv>) {
  const employment = new Hono<AppEnv>();

  // GET /employment/list - 취업률 목록 조회
  employment.get('/list', zValidator('query', employmentFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('kpi_metrics')
      .select(`
        id,
        evaluation_year,
        employment_rate,
        departments!inner (
          college_name,
          department_name
        )
      `);

    // 필터 적용
    if (filters.evaluation_year && filters.evaluation_year.length > 0) {
      query = query.in('evaluation_year', filters.evaluation_year);
    }

    if (filters.college_name && filters.college_name.length > 0) {
      query = query.in('departments.college_name', filters.college_name);
    }

    if (filters.department_name && filters.department_name.length > 0) {
      query = query.in('departments.department_name', filters.department_name);
    }

    const { data, error } = await query.order('evaluation_year', { ascending: false });

    if (error) {
      console.error('Employment list query error:', error);
      return c.json({ error: error.message }, 500);
    }

    if (!data || data.length === 0) {
      return c.json({
        data: [],
        total: 0,
        avgRate: 0,
        achievedCount: 0,
      });
    }

    // 달성률 및 전년 대비 증감 계산
    const enrichedData = calculateAchievementAndChange(data);

    // 집계 데이터 계산
    const avgRate = enrichedData.reduce((sum, item) => sum + item.employment_rate, 0) / enrichedData.length;
    const achievedCount = enrichedData.filter(item => item.employment_rate >= TARGET_EMPLOYMENT_RATE).length;

    return c.json({
      data: enrichedData,
      total: enrichedData.length,
      avgRate: Number(avgRate.toFixed(1)),
      achievedCount,
    });
  });

  // GET /employment/trends - 트렌드 데이터
  employment.get('/trends', async (c) => {
    const department_names = c.req.queries('department_name') || [];
    const start_year = Number(c.req.query('start_year')) || new Date().getFullYear() - 3;
    const end_year = Number(c.req.query('end_year')) || new Date().getFullYear();

    if (department_names.length === 0) {
      return c.json({ trends: [] });
    }

    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('kpi_metrics')
      .select(`
        evaluation_year,
        employment_rate,
        departments!inner (
          department_name
        )
      `)
      .in('departments.department_name', department_names)
      .gte('evaluation_year', start_year)
      .lte('evaluation_year', end_year)
      .not('employment_rate', 'is', null)
      .order('evaluation_year', { ascending: true });

    if (error) {
      console.error('Employment trends query error:', error);
      return c.json({ error: error.message }, 500);
    }

    // 학과별로 그룹화
    const trends = groupByDepartment(data || []);

    return c.json({ trends });
  });

  // GET /employment/college-average - 단과대학별 평균
  employment.get('/college-average', async (c) => {
    const evaluation_year = Number(c.req.query('evaluation_year')) || new Date().getFullYear() - 1;

    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('kpi_metrics')
      .select(`
        employment_rate,
        departments!inner (
          college_name
        )
      `)
      .eq('evaluation_year', evaluation_year)
      .not('employment_rate', 'is', null);

    if (error) {
      console.error('College average query error:', error);
      return c.json({ error: error.message }, 500);
    }

    if (!data || data.length === 0) {
      return c.json({ data: [] });
    }

    // 단과대학별 평균 계산
    const collegeMap = new Map<string, { sum: number; count: number }>();

    data.forEach((item: any) => {
      const collegeName = item.departments.college_name;
      const rate = item.employment_rate;

      if (!collegeMap.has(collegeName)) {
        collegeMap.set(collegeName, { sum: 0, count: 0 });
      }

      const college = collegeMap.get(collegeName)!;
      college.sum += rate;
      college.count += 1;
    });

    const averages = Array.from(collegeMap.entries()).map(([college_name, { sum, count }]) => ({
      college_name,
      avg_employment_rate: Number((sum / count).toFixed(1)),
      department_count: count,
    }));

    return c.json({ data: averages });
  });

  app.route('/employment', employment);
}

// 달성률 및 전년 대비 증감 계산
function calculateAchievementAndChange(data: any[]) {
  return data.map((item) => {
    const achievement_rate = (item.employment_rate / TARGET_EMPLOYMENT_RATE) * 100;

    // 전년 대비 증감 계산
    const prevYearData = data.find(
      (d) =>
        d.departments.department_name === item.departments.department_name &&
        d.evaluation_year === item.evaluation_year - 1
    );

    const year_over_year_change = prevYearData
      ? item.employment_rate - prevYearData.employment_rate
      : null;

    return {
      id: item.id,
      evaluation_year: item.evaluation_year,
      college_name: item.departments.college_name,
      department_name: item.departments.department_name,
      employment_rate: item.employment_rate,
      achievement_rate: Number(achievement_rate.toFixed(1)),
      year_over_year_change: year_over_year_change !== null ? Number(year_over_year_change.toFixed(1)) : null,
    };
  });
}

// 학과별로 그룹화
function groupByDepartment(data: any[]) {
  const grouped = new Map<string, any[]>();

  data.forEach((item) => {
    const deptName = item.departments.department_name;
    if (!grouped.has(deptName)) {
      grouped.set(deptName, []);
    }
    grouped.get(deptName)!.push({
      year: item.evaluation_year,
      employment_rate: item.employment_rate,
    });
  });

  return Array.from(grouped.entries()).map(([department_name, yearlyData]) => ({
    department_name,
    data: yearlyData,
  }));
}
