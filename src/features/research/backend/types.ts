import type { Database } from '@/lib/supabase/types';

export type ResearchProject = Database['public']['Tables']['research_projects']['Row'];
export type Publication = Database['public']['Tables']['publications']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];

export type ResearcherPerformance = {
  researcher_name: string;
  department_name: string;
  college_name: string;

  // 연구비 관련
  total_budget: number;
  project_count: number;
  avg_project_budget: number;

  // 논문 관련
  publication_count: number;
  scie_count: number;
  kci_count: number;
  avg_impact_factor: number | null;

  // 과제연계 논문
  project_linked_count: number;
  project_linked_ratio: number;

  // 추가 지표
  funding_agencies: string[];
  latest_publication_date: string | null;
};

export type ResearchersResponse = {
  researchers: ResearcherPerformance[];
  total_count: number;
  filters_applied: {
    researcher_name?: string;
    department_name?: string;
    year_start?: number;
    year_end?: number;
  };
};

export type ResearchersAggregateResponse = {
  total_researchers: number;
  total_budget: number;
  avg_budget_per_researcher: number;
  total_publications: number;
  avg_publications_per_researcher: number;
  overall_project_linked_ratio: number;
  top_by_budget: ResearcherPerformance[];
  top_by_publications: ResearcherPerformance[];
};
