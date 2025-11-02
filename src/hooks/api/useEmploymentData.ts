// src/hooks/api/useEmploymentData.ts
import { useQuery } from '@tanstack/react-query';

type FilterState = {
  evaluation_years: number[];
  college_names: string[];
  department_names: string[];
};

type EmploymentData = {
  id: string;
  evaluation_year: number;
  college_name: string;
  department_name: string;
  employment_rate: number;
  achievement_rate: number;
  year_over_year_change: number | null;
};

type EmploymentTrend = {
  department_name: string;
  data: {
    year: number;
    employment_rate: number;
  }[];
};

type CollegeAverage = {
  college_name: string;
  avg_employment_rate: number;
  department_count: number;
};

type EmploymentListResponse = {
  data: EmploymentData[];
  total: number;
  avgRate: number;
  achievedCount: number;
};

export function useEmploymentData(filters: FilterState) {
  return useQuery<EmploymentListResponse>({
    queryKey: ['employment', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      filters.evaluation_years.forEach((y) => params.append('evaluation_year', String(y)));
      filters.college_names.forEach((c) => params.append('college_name', c));
      filters.department_names.forEach((d) => params.append('department_name', d));

      const response = await fetch(`/api/employment/list?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employment data');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useEmploymentTrends(departmentNames: string[], startYear?: number, endYear?: number) {
  return useQuery<{ trends: EmploymentTrend[] }>({
    queryKey: ['employment', 'trends', departmentNames, startYear, endYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      departmentNames.forEach((d) => params.append('department_name', d));

      if (startYear) params.set('start_year', String(startYear));
      if (endYear) params.set('end_year', String(endYear));

      const response = await fetch(`/api/employment/trends?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch trends');
      }

      return response.json();
    },
    enabled: departmentNames.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCollegeAverage(evaluationYear: number) {
  return useQuery<{ data: CollegeAverage[] }>({
    queryKey: ['employment', 'college-average', evaluationYear],
    queryFn: async () => {
      const response = await fetch(`/api/employment/college-average?evaluation_year=${evaluationYear}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch college average');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
