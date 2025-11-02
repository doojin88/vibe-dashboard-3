// src/features/publications/types.ts
import type { Database } from '@/lib/supabase/types';

export type Publication = Database['public']['Tables']['publications']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];

export type PublicationWithDepartment = Publication & {
  department: Pick<Department, 'college_name' | 'department_name'> | null;
};

export type PublicationFilters = {
  year?: number[];
  college_name?: string[];
  department_name?: string[];
  journal_grade?: string[];
  main_author?: string;
};

export type PublicationKPI = {
  total_count: number;
  scie_count: number;
  kci_count: number;
  avg_impact_factor: number | null;
};

export type PublicationTrend = {
  year: number;
  total_count: number;
  scie_count: number;
  kci_count: number;
};

export type JournalGradeDistribution = {
  journal_grade: string;
  count: number;
  percentage: number;
};

export type DepartmentPublicationCount = {
  department_id: string;
  college_name: string;
  department_name: string;
  count: number;
};

export type ImpactFactorTrend = {
  year: number;
  avg_impact_factor: number;
};

export type AuthorRanking = {
  main_author: string;
  department_name: string;
  publication_count: number;
  avg_impact_factor: number | null;
};
