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

  app.route('/kpi-metrics', kpi);
}
