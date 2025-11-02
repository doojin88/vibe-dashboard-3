import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerKPIRoutes } from '@/features/kpi/backend/route';
import { registerBudgetProjectsRoutes } from '@/features/budget/backend/projects-route';
import { registerBudgetExecutionRoutes } from '@/features/budget/backend/route';
import { registerFacultyRoutes } from '@/features/faculty/backend/route';
import { registerDashboardRoutes } from '@/features/dashboard/backend/route';
import { registerPublicationRoutes } from '@/features/publications/backend/route';
import { registerEmploymentRoutes } from '@/features/employment/backend/route';
import { registerResearchRoutes } from '@/features/research/backend/route';
import { registerResearchProjectRoutes } from '@/features/research-projects/backend/route';
import { registerDepartmentKPIRoutes } from '@/features/department-kpi/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerKPIRoutes(app);
  registerBudgetProjectsRoutes(app);
  registerBudgetExecutionRoutes(app);
  registerFacultyRoutes(app);
  registerDashboardRoutes(app);
  registerPublicationRoutes(app);
  registerEmploymentRoutes(app);
  registerResearchRoutes(app);
  registerResearchProjectRoutes(app);
  registerDepartmentKPIRoutes(app);

  singletonApp = app;

  return app;
};
