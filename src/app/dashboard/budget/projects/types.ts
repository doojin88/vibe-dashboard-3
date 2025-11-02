/**
 * 과제별 예산 상세 페이지 타입 정의
 * /dashboard/budget/projects
 */

export type ProjectFilters = {
  year?: number;
  department_id?: string;
  funding_agency?: string;
  principal_investigator?: string;
  status?: '집행완료' | '처리중';
  search?: string;
  sort_by?: 'project_number' | 'total_budget' | 'executed_amount' | 'execution_rate';
  sort_order?: 'asc' | 'desc';
};

export type ProjectWithBudgetInfo = {
  id: string;
  project_number: string;
  project_name: string;
  principal_investigator: string;
  department: {
    id: string;
    college_name: string;
    department_name: string;
  };
  funding_agency: string;
  total_budget: number;
  executed_amount: number; // 총 집행금액 (집계)
  execution_rate: number; // 집행률 (%)
  execution_count: number; // 집행 건수
  status: '집행완료' | '처리중' | '미집행'; // 전체 상태
  created_at: string;
};

export type ProjectsResponse = {
  projects: ProjectWithBudgetInfo[];
  total_count: number;
  page: number;
  limit: number;
  total_budget: number;
  total_executed: number;
  avg_execution_rate: number;
};

export type ExecutionDetail = {
  id: string;
  execution_id: string;
  execution_date: string;
  execution_item: string;
  execution_amount: number;
  status: '집행완료' | '처리중';
  notes?: string;
  created_at: string;
};

export type ExecutionsResponse = {
  project: {
    id: string;
    project_number: string;
    project_name: string;
    principal_investigator: string;
    department: {
      college_name: string;
      department_name: string;
    };
    funding_agency: string;
    total_budget: number;
    created_at: string;
  };
  executions: ExecutionDetail[];
  summary: {
    total_executed: number;
    by_item: {
      item: string;
      amount: number;
      count: number;
    }[];
    by_status: {
      status: string;
      count: number;
      amount: number;
    }[];
  };
};

export type FiltersResponse = {
  years: number[];
  departments: {
    id: string;
    college_name: string;
    department_name: string;
  }[];
  funding_agencies: string[];
  principal_investigators: string[];
};
