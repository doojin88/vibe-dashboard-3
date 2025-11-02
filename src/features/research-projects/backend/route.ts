import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const projectFilterSchema = z.object({
  year: z.coerce.number().optional(),
  funding_agency: z.string().optional(),
  department_id: z.string().uuid().optional(),
  status: z.enum(['집행완료', '처리중']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const aggregateFilterSchema = z.object({
  year: z.coerce.number().optional(),
  funding_agency: z.string().optional(),
  department_id: z.string().uuid().optional(),
});

export function registerResearchProjectRoutes(app: Hono<AppEnv>) {
  const projects = new Hono<AppEnv>();

  // GET /api/research-projects
  projects.get('/', zValidator('query', projectFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('research_projects')
      .select(`
        *,
        department:departments(college_name, department_name),
        executions:budget_executions(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters.funding_agency) {
      query = query.eq('funding_agency', filters.funding_agency);
    }

    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    // Pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // Calculate execution rate for each project
    const projectsWithRate = (data || []).map((project: any) => {
      const totalExecuted = (project.executions || []).reduce(
        (sum: number, exec: any) => sum + (exec.execution_amount || 0),
        0
      );

      return {
        ...project,
        total_executed: totalExecuted,
        execution_rate: project.total_budget > 0
          ? (totalExecuted / project.total_budget) * 100
          : 0,
      };
    }) || [];

    return c.json({
      data: projectsWithRate,
      total: count || 0,
    });
  });

  // GET /api/research-projects/aggregate
  projects.get('/aggregate', zValidator('query', aggregateFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 1. Fetch all projects with department and executions
    let projectQuery = supabase
      .from('research_projects')
      .select(`
        *,
        department:departments(college_name, department_name),
        executions:budget_executions(*)
      `);

    if (filters.funding_agency) {
      projectQuery = projectQuery.eq('funding_agency', filters.funding_agency);
    }

    if (filters.department_id) {
      projectQuery = projectQuery.eq('department_id', filters.department_id);
    }

    const { data: projects, error: projectError } = await projectQuery;

    if (projectError) {
      return c.json({ error: projectError.message }, 500);
    }

    // 2. Calculate aggregate metrics
    const totalProjects = (projects || []).length;
    const totalBudget = (projects || []).reduce((sum: number, p: any) => sum + (p.total_budget || 0), 0);
    const totalExecuted = (projects || []).reduce((sum: number, p: any) => {
      return sum + ((p.executions || []).reduce((eSum: number, e: any) => eSum + (e.execution_amount || 0), 0));
    }, 0);
    const executionRate = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

    // 3. Aggregate by funding agency
    const byAgency = new Map<string, { budget: number; count: number }>();
    (projects || []).forEach((project: any) => {
      const agency = project.funding_agency;
      const current = byAgency.get(agency) || { budget: 0, count: 0 };
      byAgency.set(agency, {
        budget: current.budget + (project.total_budget || 0),
        count: current.count + 1,
      });
    });

    const byFundingAgency = Array.from(byAgency.entries())
      .map(([agency, data]) => ({
        funding_agency: agency,
        total_budget: data.budget,
        project_count: data.count,
        percentage: totalBudget > 0 ? (data.budget / totalBudget) * 100 : 0,
      }))
      .sort((a, b) => b.total_budget - a.total_budget);

    // 4. Aggregate by department (top 10)
    const byDept = new Map<string, {
      college: string;
      dept: string;
      budget: number;
      count: number;
    }>();

    (projects || []).forEach((project: any) => {
      const key = project.department_id;
      const current = byDept.get(key) || {
        college: (project.department as any)?.college_name || '',
        dept: (project.department as any)?.department_name || '',
        budget: 0,
        count: 0,
      };
      byDept.set(key, {
        ...current,
        budget: current.budget + (project.total_budget || 0),
        count: current.count + 1,
      });
    });

    const byDepartment = Array.from(byDept.values())
      .map((data) => ({
        college_name: data.college,
        department_name: data.dept,
        total_budget: data.budget,
        project_count: data.count,
      }))
      .sort((a, b) => b.total_budget - a.total_budget)
      .slice(0, 10);

    // 5. Aggregate by status
    const allExecutions = (projects || []).flatMap((p: any) => p.executions || []) as any[];
    const byStatus = new Map<string, number>();

    allExecutions.forEach((exec: any) => {
      const status = exec.status;
      byStatus.set(status, (byStatus.get(status) || 0) + 1);
    });

    const statusData = Array.from(byStatus.entries()).map(([status, count]) => ({
      status: status as '집행완료' | '처리중',
      count,
      percentage: allExecutions.length > 0 ? (count / allExecutions.length) * 100 : 0,
    }));

    // 6. Timeline (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const timelineMap = new Map<string, { total: number; byItem: Map<string, number> }>();

    allExecutions
      .filter((exec: any) => new Date(exec.execution_date) >= twelveMonthsAgo)
      .forEach((exec: any) => {
        const month = exec.execution_date.substring(0, 7); // YYYY-MM
        const current = timelineMap.get(month) || { total: 0, byItem: new Map() };

        current.total += exec.execution_amount || 0;
        current.byItem.set(
          exec.execution_item,
          (current.byItem.get(exec.execution_item) || 0) + (exec.execution_amount || 0)
        );

        timelineMap.set(month, current);
      });

    const executionTimeline = Array.from(timelineMap.entries())
      .map(([month, data]) => ({
        month,
        total_amount: data.total,
        by_item: Object.fromEntries(data.byItem),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return c.json({
      total_projects: totalProjects,
      total_budget: totalBudget,
      total_executed: totalExecuted,
      execution_rate: executionRate,
      by_funding_agency: byFundingAgency,
      by_department: byDepartment,
      by_status: statusData,
      execution_timeline: executionTimeline,
    });
  });

  app.route('/research-projects', projects);
}
