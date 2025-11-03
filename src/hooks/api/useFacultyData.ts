import { useQuery } from '@tanstack/react-query';

type FacultyFilters = {
  evaluation_year?: number[];
  college_name?: string[];
  department_name?: string[];
};

type FacultyAggregate = {
  total_full_time: number;
  total_visiting: number;
  total_departments: number;
  avg_full_time_ratio: number;
};

type DepartmentFacultyData = {
  department_name: string;
  college_name: string;
  full_time_faculty: number;
  visiting_faculty: number;
};

type CollegeFacultyData = {
  college_name: string;
  total_faculty: number;
  percentage: number;
};

type YearlyTrendData = {
  evaluation_year: number;
  total_full_time: number;
  total_visiting: number;
};

type FacultyTableRow = {
  id: string;
  evaluation_year: number;
  college_name: string;
  department_name: string;
  full_time_faculty: number;
  visiting_faculty: number;
  total_faculty: number;
  full_time_ratio: number;
};

type FacultyDataResponse = {
  aggregate: FacultyAggregate;
  chart: {
    byDepartment: DepartmentFacultyData[];
    byCollege: CollegeFacultyData[];
    trend: YearlyTrendData[];
  };
  table: FacultyTableRow[];
};

export function useFacultyData(filters: FacultyFilters = {}) {
  return useQuery<FacultyDataResponse>({
    queryKey: ['faculty', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/faculty?${params}`);
      if (!response.ok) throw new Error('Failed to fetch faculty data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

type FacultyFiltersResponse = {
  years: number[];
  colleges: string[];
  departments: Array<{
    college_name: string;
    department_name: string;
  }>;
};

export function useFacultyFilters() {
  return useQuery<FacultyFiltersResponse>({
    queryKey: ['faculty', 'filters'],
    queryFn: async () => {
      const response = await fetch('/api/faculty/filters');
      if (!response.ok) throw new Error('Failed to fetch filters');

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10분
  });
}
