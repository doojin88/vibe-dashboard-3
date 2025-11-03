import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import type { Database } from '@/lib/supabase/types';

const kpiFilterSchema = z.object({
  evaluation_year: z.coerce.number().optional(),
  college_name: z.string().optional(),
  department_name: z.string().optional(),
});

export function registerKPIRoutes(app: Hono<AppEnv>) {
  const kpi = new Hono<AppEnv>();

  kpi.get('/', zValidator('query', kpiFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('kpi_metrics')
      .select('*, department:departments(college_name, department_name)')
      .order('evaluation_year', { ascending: false });

    if (filters.evaluation_year) {
      query = query.eq('evaluation_year', filters.evaluation_year);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  });

  kpi.get('/aggregate', zValidator('query', kpiFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('kpi_metrics')
      .select('employment_rate');

    if (filters.evaluation_year) {
      query = query.eq('evaluation_year', filters.evaluation_year);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 집계 계산
    type KPIRow = Database['public']['Tables']['kpi_metrics']['Row'];
    const employmentRates = ((data || []) as KPIRow[])
      .filter((item) => item.employment_rate !== null)
      .map((item) => item.employment_rate as number);

    const avgEmploymentRate =
      employmentRates.length > 0
        ? employmentRates.reduce((sum, rate) => sum + rate, 0) / employmentRates.length
        : 0;

    return c.json({
      avg_employment_rate: avgEmploymentRate,
      total_departments: data?.length || 0,
    });
  });

  // GET /api/kpi-metrics/filter-options
  kpi.get('/filter-options', async (c) => {
    const supabase = getSupabaseServiceClient();

    try {
      // 평가년도 옵션
      const { data: yearsData } = await supabase
        .from('kpi_metrics')
        .select('evaluation_year')
        .order('evaluation_year', { ascending: false });

      // 단과대학 옵션
      const { data: collegeData } = await supabase
        .from('departments')
        .select('college_name')
        .order('college_name');

      // 학과 옵션
      const { data: deptData } = await supabase
        .from('departments')
        .select('department_name')
        .order('department_name');

      const years = Array.from(
        new Set((yearsData || []).map((y: any) => y.evaluation_year))
      ) as number[];

      const colleges = Array.from(
        new Set((collegeData || []).map((c: any) => c.college_name))
      ) as string[];

      const departments = Array.from(
        new Set((deptData || []).map((d: any) => d.department_name))
      ) as string[];

      return c.json({
        years,
        colleges,
        departments,
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return c.json({ error: 'Failed to fetch filter options' }, 500);
    }
  });

  app.route('/kpi-metrics', kpi);
}
