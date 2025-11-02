// src/features/budget/types.ts

export type BudgetExecution = {
  id: string;
  execution_id: string;
  project_id: string;
  execution_date: string; // ISO date string
  execution_item: string;
  execution_amount: number;
  status: '집행완료' | '처리중';
  notes: string | null;
  created_at: string;
};

export type ResearchProject = {
  id: string;
  project_number: string;
  project_name: string;
  principal_investigator: string;
  department_id: string;
  funding_agency: string;
  total_budget: number;
  created_at: string;
};

export type Department = {
  id: string;
  college_name: string;
  department_name: string;
  created_at: string;
};

// 집계 데이터 타입
export type BudgetKPI = {
  totalAmount: number;
  executionRate: number;
  processingAmount: number;
  monthlyChange: number; // 전월 대비 증감률
};

export type MonthlyTrend = {
  month: string; // YYYY-MM
  amount: number;
  items: Record<string, number>; // { "인건비": 300000000, ... }
};

export type ItemBreakdown = Record<string, {
  amount: number;
  percentage: number;
}>;

export type DepartmentBreakdown = {
  department: string;
  amount: number;
  executionRate: number;
};

export type BudgetWarning = {
  projectNumber: string;
  projectName: string;
  totalBudget: number;
  executedAmount: number;
  overageAmount: number;
  executionRate: number;
};

// API 응답 타입
export type BudgetExecutionResponse = {
  kpi: BudgetKPI;
  monthlyTrend: MonthlyTrend[];
  itemBreakdown: ItemBreakdown;
  departmentBreakdown: DepartmentBreakdown[];
  budgetWarnings: BudgetWarning[];
  executions: (BudgetExecution & {
    project: ResearchProject;
    department: Department;
  })[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
};

// 필터 타입
export type BudgetFilters = {
  year?: number;
  department?: string;
  executionItem?: string;
  status?: '집행완료' | '처리중' | 'all';
  page?: number;
  pageSize?: number;
};
