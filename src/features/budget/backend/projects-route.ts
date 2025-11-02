/**
 * 과제별 예산 상세 API Routes
 * Hono 기반 백엔드 API
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import type { AppEnv } from '@/backend/hono/context';

const projectsFilterSchema = z.object({
  year: z.coerce.number().optional(),
  department_id: z.string().optional(),
  funding_agency: z.string().optional(),
  principal_investigator: z.string().optional(),
  status: z.enum(['집행완료', '처리중']).optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['project_number', 'total_budget', 'executed_amount', 'execution_rate'])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export function registerBudgetProjectsRoutes(app: Hono<AppEnv>) {
  const budget = new Hono<AppEnv>();

  // GET /api/budget/projects - 연구과제 목록 및 집행 정보 조회
  budget.get('/', zValidator('query', projectsFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    // 메인 쿼리: 연구과제 + 집행 집계
    let query = supabase
      .from('research_projects')
      .select(
        `
        id,
        project_number,
        project_name,
        principal_investigator,
        funding_agency,
        total_budget,
        created_at,
        departments (
          id,
          college_name,
          department_name
        )
      `
      )
      .order('created_at', { ascending: false });

    // 필터 적용
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    if (filters.funding_agency) {
      query = query.eq('funding_agency', filters.funding_agency);
    }

    if (filters.principal_investigator) {
      query = query.ilike('principal_investigator', `%${filters.principal_investigator}%`);
    }

    if (filters.search) {
      query = query.ilike('project_name', `%${filters.search}%`);
    }

    const { data: projects, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 각 과제별 집행 정보 집계
    const projectsWithExecution = await Promise.all(
      (projects || []).map(async (project) => {
        let execQuery = supabase
          .from('budget_executions')
          .select('execution_amount, status')
          .eq('project_id', project.id);

        // 연도 필터 (집행일자 기준)
        if (filters.year) {
          execQuery = execQuery
            .gte('execution_date', `${filters.year}-01-01`)
            .lte('execution_date', `${filters.year}-12-31`);
        }

        // 상태 필터
        if (filters.status) {
          execQuery = execQuery.eq('status', filters.status);
        }

        const { data: executions } = await execQuery;

        const executed_amount = executions?.reduce(
          (sum, exec) => sum + exec.execution_amount,
          0
        ) ?? 0;

        const execution_rate = project.total_budget > 0
          ? (executed_amount / project.total_budget) * 100
          : 0;

        // 전체 상태 결정
        let status: '집행완료' | '처리중' | '미집행' = '미집행';
        if (executions && executions.length > 0) {
          const hasProcessing = executions.some(e => e.status === '처리중');
          status = hasProcessing ? '처리중' : '집행완료';
        }

        return {
          ...project,
          executed_amount,
          execution_rate: Math.round(execution_rate * 100) / 100,
          execution_count: executions?.length ?? 0,
          status,
        };
      })
    );

    // 정렬
    if (filters.sort_by) {
      projectsWithExecution.sort((a, b) => {
        const aValue = a[filters.sort_by as keyof typeof a] as number;
        const bValue = b[filters.sort_by as keyof typeof b] as number;

        return filters.sort_order === 'desc' ? bValue - aValue : aValue - bValue;
      });
    }

    // 페이지네이션
    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    const paginatedProjects = projectsWithExecution.slice(start, end);

    // 집계 통계
    const total_budget = projectsWithExecution.reduce(
      (sum, p) => sum + p.total_budget,
      0
    );
    const total_executed = projectsWithExecution.reduce(
      (sum, p) => sum + p.executed_amount,
      0
    );
    const avg_execution_rate = projectsWithExecution.length > 0
      ? projectsWithExecution.reduce((sum, p) => sum + p.execution_rate, 0) /
        projectsWithExecution.length
      : 0;

    return c.json({
      projects: paginatedProjects,
      total_count: projectsWithExecution.length,
      page: filters.page,
      limit: filters.limit,
      total_budget,
      total_executed,
      avg_execution_rate: Math.round(avg_execution_rate * 100) / 100,
    });
  });

  // GET /api/budget/projects/filters - 필터 옵션 데이터 조회
  budget.get('/filters', async (c) => {
    const supabase = getSupabaseServiceClient();

    // 연도 목록 (집행일자 기준)
    const { data: yearData } = await supabase
      .from('budget_executions')
      .select('execution_date')
      .order('execution_date', { ascending: false });

    const years = Array.from(
      new Set(
        yearData?.map((row) => new Date(row.execution_date).getFullYear()) ?? []
      )
    ).sort((a, b) => b - a);

    // 학과 목록
    const { data: departments } = await supabase
      .from('departments')
      .select('id, college_name, department_name')
      .order('college_name, department_name');

    // 지원기관 목록
    const { data: agencyData } = await supabase
      .from('research_projects')
      .select('funding_agency')
      .order('funding_agency');

    const funding_agencies = Array.from(
      new Set(agencyData?.map((row) => row.funding_agency) ?? [])
    ).sort();

    // 연구책임자 목록
    const { data: piData } = await supabase
      .from('research_projects')
      .select('principal_investigator')
      .order('principal_investigator');

    const principal_investigators = Array.from(
      new Set(piData?.map((row) => row.principal_investigator) ?? [])
    ).sort();

    return c.json({
      years,
      departments: departments ?? [],
      funding_agencies,
      principal_investigators,
    });
  });

  // GET /api/budget/projects/:projectId/executions - 과제별 집행 내역 상세
  budget.get('/:projectId/executions', async (c) => {
    const projectId = c.req.param('projectId');
    const supabase = getSupabaseServiceClient();

    // 과제 정보
    const { data: project, error: projectError } = await supabase
      .from('research_projects')
      .select(
        `
        *,
        departments (
          college_name,
          department_name
        )
      `
      )
      .eq('id', projectId)
      .single();

    if (projectError) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // 집행 내역
    const { data: executions, error: execError } = await supabase
      .from('budget_executions')
      .select('*')
      .eq('project_id', projectId)
      .order('execution_date', { ascending: false });

    if (execError) {
      return c.json({ error: execError.message }, 500);
    }

    // 집행항목별 집계
    const byItem = (executions || []).reduce((acc, exec) => {
      const existing = acc.find((item) => item.item === exec.execution_item);
      if (existing) {
        existing.amount += exec.execution_amount;
        existing.count += 1;
      } else {
        acc.push({
          item: exec.execution_item,
          amount: exec.execution_amount,
          count: 1,
        });
      }
      return acc;
    }, [] as { item: string; amount: number; count: number }[]);

    // 상태별 집계
    const byStatus = (executions || []).reduce((acc, exec) => {
      const existing = acc.find((item) => item.status === exec.status);
      if (existing) {
        existing.amount += exec.execution_amount;
        existing.count += 1;
      } else {
        acc.push({
          status: exec.status,
          amount: exec.execution_amount,
          count: 1,
        });
      }
      return acc;
    }, [] as { status: string; amount: number; count: number }[]);

    const total_executed = (executions || []).reduce(
      (sum, exec) => sum + exec.execution_amount,
      0
    );

    return c.json({
      project,
      executions: executions || [],
      summary: {
        total_executed,
        by_item: byItem,
        by_status: byStatus,
      },
    });
  });

  app.route('/budget/projects', budget);
}
