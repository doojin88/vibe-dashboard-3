import type { Database } from '@/lib/supabase/types';

// Database types
export type ResearchProject = Database['public']['Tables']['research_projects']['Row'];
export type BudgetExecution = Database['public']['Tables']['budget_executions']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];

// Joined project data with details
export type ProjectWithDetails = ResearchProject & {
  department: Pick<Department, 'college_name' | 'department_name'> | null;
  executions: BudgetExecution[];
  total_executed: number;
  execution_rate: number;
};

// Filter types
export type ProjectFilters = {
  year?: number;
  funding_agency?: string;
  department_id?: string;
  status?: '집행완료' | '처리중';
  limit?: number;
  offset?: number;
};

// Aggregate data types
export type ProjectAggregate = {
  total_projects: number;
  total_budget: number;
  total_executed: number;
  execution_rate: number;
  by_funding_agency: AgencyData[];
  by_department: DepartmentData[];
  by_status: StatusData[];
  execution_timeline: TimelineData[];
};

export type AgencyData = {
  funding_agency: string;
  total_budget: number;
  project_count: number;
  percentage: number;
};

export type DepartmentData = {
  department_name: string;
  college_name: string;
  total_budget: number;
  project_count: number;
};

export type StatusData = {
  status: '집행완료' | '처리중';
  count: number;
  percentage: number;
};

export type TimelineData = {
  month: string;
  total_amount: number;
  by_item: {
    [key: string]: number;
  };
};
