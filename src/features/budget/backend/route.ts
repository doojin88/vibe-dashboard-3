// src/features/budget/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import type {
  BudgetExecutionResponse,
  BudgetKPI,
  MonthlyTrend,
  ItemBreakdown,
  DepartmentBreakdown,
  BudgetWarning
} from '../types';

const budgetQuerySchema = z.object({
  year: z.coerce.number().optional(),
  department: z.string().optional(),
  executionItem: z.string().optional(),
  status: z.enum(['집행완료', '처리중', 'all']).optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(50),
});

export function registerBudgetExecutionRoutes(app: Hono<AppEnv>) {
  const budget = new Hono<AppEnv>();

  budget.get('/execution', zValidator('query', budgetQuerySchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    try {
      // 1. KPI 계산
      const kpiData = await calculateKPI(supabase, filters);

      // 2. 월별 추이
      const monthlyTrend = await getMonthlyTrend(supabase, filters);

      // 3. 집행항목별 비율
      const itemBreakdown = await getItemBreakdown(supabase, filters);

      // 4. 학과별 집행금액
      const departmentBreakdown = await getDepartmentBreakdown(supabase, filters);

      // 5. 예산 초과 경고
      const budgetWarnings = await getBudgetWarnings(supabase, filters);

      // 6. 집행 내역 (페이지네이션)
      const { executions, total } = await getExecutions(supabase, filters);

      const response: BudgetExecutionResponse = {
        kpi: kpiData,
        monthlyTrend,
        itemBreakdown,
        departmentBreakdown,
        budgetWarnings,
        executions,
        pagination: {
          total,
          page: filters.page,
          pageSize: filters.pageSize,
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('Budget execution error:', error);
      return c.json(
        { error: 'Internal Server Error', message: '데이터를 불러오는 중 오류가 발생했습니다.' },
        500
      );
    }
  });

  app.route('/budget', budget);
}

// KPI 계산 함수
async function calculateKPI(supabase: any, filters: any): Promise<BudgetKPI> {
  const currentYear = filters.year || new Date().getFullYear();

  // 총 집행금액 및 처리중 금액 조회
  let query = supabase
    .from('budget_executions')
    .select('execution_amount, status, execution_date');

  if (filters.year) {
    const startDate = `${filters.year}-01-01`;
    const endDate = `${filters.year}-12-31`;
    query = query.gte('execution_date', startDate).lte('execution_date', endDate);
  }

  if (filters.executionItem) {
    query = query.eq('execution_item', filters.executionItem);
  }

  const { data: executions, error } = await query;

  if (error) throw error;

  const totalAmount = executions
    ?.filter((e: any) => e.status === '집행완료')
    .reduce((sum: number, e: any) => sum + e.execution_amount, 0) || 0;

  const processingAmount = executions
    ?.filter((e: any) => e.status === '처리중')
    .reduce((sum: number, e: any) => sum + e.execution_amount, 0) || 0;

  // 총 예산 조회
  const { data: projects } = await supabase
    .from('research_projects')
    .select('total_budget');

  const totalBudget = projects?.reduce((sum: number, p: any) => sum + p.total_budget, 0) || 1;

  const executionRate = (totalAmount / totalBudget) * 100;

  // 전월 대비 증감률 계산
  const currentMonth = new Date().getMonth();
  const currentMonthExecutions = executions?.filter((e: any) => {
    const month = new Date(e.execution_date).getMonth();
    return month === currentMonth && e.status === '집행완료';
  }) || [];

  const lastMonthExecutions = executions?.filter((e: any) => {
    const month = new Date(e.execution_date).getMonth();
    return month === currentMonth - 1 && e.status === '집행완료';
  }) || [];

  const currentMonthAmount = currentMonthExecutions.reduce((sum: number, e: any) => sum + e.execution_amount, 0);
  const lastMonthAmount = lastMonthExecutions.reduce((sum: number, e: any) => sum + e.execution_amount, 0);

  const monthlyChange = lastMonthAmount > 0
    ? ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
    : 0;

  return {
    totalAmount,
    executionRate,
    processingAmount,
    monthlyChange,
  };
}

// 월별 추이 조회
async function getMonthlyTrend(supabase: any, filters: any): Promise<MonthlyTrend[]> {
  const year = filters.year || new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  let query = supabase
    .from('budget_executions')
    .select('execution_date, execution_item, execution_amount, status')
    .eq('status', '집행완료')
    .gte('execution_date', startDate)
    .lte('execution_date', endDate)
    .order('execution_date', { ascending: true });

  if (filters.executionItem) {
    query = query.eq('execution_item', filters.executionItem);
  }

  const { data: executions, error } = await query;

  if (error) throw error;

  // 월별로 그룹화
  const monthlyData = new Map<string, { amount: number; items: Record<string, number> }>();

  executions?.forEach((execution: any) => {
    const month = execution.execution_date.substring(0, 7); // YYYY-MM

    if (!monthlyData.has(month)) {
      monthlyData.set(month, { amount: 0, items: {} });
    }

    const data = monthlyData.get(month)!;
    data.amount += execution.execution_amount;

    if (!data.items[execution.execution_item]) {
      data.items[execution.execution_item] = 0;
    }
    data.items[execution.execution_item] += execution.execution_amount;
  });

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      amount: data.amount,
      items: data.items,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// 집행항목별 비율
async function getItemBreakdown(supabase: any, filters: any): Promise<ItemBreakdown> {
  const year = filters.year || new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  let query = supabase
    .from('budget_executions')
    .select('execution_item, execution_amount')
    .eq('status', '집행완료')
    .gte('execution_date', startDate)
    .lte('execution_date', endDate);

  if (filters.executionItem) {
    query = query.eq('execution_item', filters.executionItem);
  }

  const { data: executions, error } = await query;

  if (error) throw error;

  const itemTotals = new Map<string, number>();
  let total = 0;

  executions?.forEach((execution: any) => {
    const current = itemTotals.get(execution.execution_item) || 0;
    itemTotals.set(execution.execution_item, current + execution.execution_amount);
    total += execution.execution_amount;
  });

  const breakdown: ItemBreakdown = {};

  itemTotals.forEach((amount, item) => {
    breakdown[item] = {
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    };
  });

  return breakdown;
}

// 학과별 집행금액
async function getDepartmentBreakdown(supabase: any, filters: any): Promise<DepartmentBreakdown[]> {
  const year = filters.year || new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from('budget_executions')
    .select(`
      execution_amount,
      status,
      research_projects (
        total_budget,
        departments (
          department_name
        )
      )
    `)
    .gte('execution_date', startDate)
    .lte('execution_date', endDate);

  if (error) throw error;

  const deptData = new Map<string, { amount: number; totalBudget: number }>();

  data?.forEach((item: any) => {
    const deptName = item.research_projects?.departments?.department_name;
    if (!deptName) return;

    if (!deptData.has(deptName)) {
      deptData.set(deptName, { amount: 0, totalBudget: 0 });
    }

    const dept = deptData.get(deptName)!;

    if (item.status === '집행완료') {
      dept.amount += item.execution_amount;
    }
    dept.totalBudget = item.research_projects?.total_budget || 0;
  });

  return Array.from(deptData.entries())
    .map(([department, data]) => ({
      department,
      amount: data.amount,
      executionRate: data.totalBudget > 0 ? (data.amount / data.totalBudget) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// 예산 초과 경고
async function getBudgetWarnings(supabase: any, filters: any): Promise<BudgetWarning[]> {
  const year = filters.year || new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from('research_projects')
    .select(`
      project_number,
      project_name,
      total_budget,
      budget_executions (
        execution_amount,
        status,
        execution_date
      )
    `);

  if (error) throw error;

  const warnings: BudgetWarning[] = [];

  data?.forEach((project: any) => {
    const executedAmount = project.budget_executions
      ?.filter((e: any) => {
        const date = new Date(e.execution_date);
        return date >= new Date(startDate) && date <= new Date(endDate) && e.status === '집행완료';
      })
      .reduce((sum: number, e: any) => sum + e.execution_amount, 0) || 0;

    const executionRate = (executedAmount / project.total_budget) * 100;

    if (executionRate > 100) {
      warnings.push({
        projectNumber: project.project_number,
        projectName: project.project_name,
        totalBudget: project.total_budget,
        executedAmount,
        overageAmount: executedAmount - project.total_budget,
        executionRate,
      });
    }
  });

  return warnings.sort((a, b) => b.executionRate - a.executionRate);
}

// 집행 내역 조회 (페이지네이션)
async function getExecutions(supabase: any, filters: any) {
  const year = filters.year || new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  let query = supabase
    .from('budget_executions')
    .select(`
      *,
      research_projects (
        id,
        project_number,
        project_name,
        principal_investigator,
        department_id,
        funding_agency,
        total_budget,
        created_at,
        departments (
          id,
          college_name,
          department_name,
          created_at
        )
      )
    `, { count: 'exact' })
    .gte('execution_date', startDate)
    .lte('execution_date', endDate)
    .order('execution_date', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.executionItem) {
    query = query.eq('execution_item', filters.executionItem);
  }

  // 페이지네이션
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  const executions = data?.map((item: any) => ({
    ...item,
    project: {
      id: item.research_projects.id,
      project_number: item.research_projects.project_number,
      project_name: item.research_projects.project_name,
      principal_investigator: item.research_projects.principal_investigator,
      department_id: item.research_projects.department_id,
      funding_agency: item.research_projects.funding_agency,
      total_budget: item.research_projects.total_budget,
      created_at: item.research_projects.created_at,
    },
    department: item.research_projects.departments,
  })) || [];

  return {
    executions,
    total: count || 0,
  };
}
