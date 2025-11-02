import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { researchersFilterSchema } from './schema';
import { ResearcherService } from './service';

export function registerResearchRoutes(app: Hono<AppEnv>) {
  const research = new Hono<AppEnv>();

  // GET /api/research/researchers
  research.get('/researchers', zValidator('query', researchersFilterSchema), async (c) => {
    try {
      const filters = c.req.valid('query');
      const supabase = getSupabaseServiceClient();
      const service = new ResearcherService(supabase);

      const researchers = await service.getResearchers(filters);

      return c.json({
        researchers,
        total_count: researchers.length,
        filters_applied: {
          researcher_name: filters.researcher_name,
          department_name: filters.department_name,
          year_start: filters.year_start,
          year_end: filters.year_end,
        },
      });
    } catch (error) {
      console.error('Error fetching researchers:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        500
      );
    }
  });

  // GET /api/research/researchers/aggregate
  research.get('/researchers/aggregate', zValidator('query', researchersFilterSchema), async (c) => {
    try {
      const filters = c.req.valid('query');
      const supabase = getSupabaseServiceClient();
      const service = new ResearcherService(supabase);

      const aggregate = await service.getAggregate(filters);

      return c.json(aggregate);
    } catch (error) {
      console.error('Error fetching aggregate:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        500
      );
    }
  });

  app.route('/research', research);
}
