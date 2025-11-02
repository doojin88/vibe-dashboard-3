import { useQuery } from '@tanstack/react-query';

// Dashboard Overview Types
export type DashboardOverviewKPIs = {
  employmentRate: {
    value: number;
    previousYear: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  publicationCount: {
    value: number;
    scie: number;
    kci: number;
    previousYear: number;
    change: number;
  };
  researchBudget: {
    value: number;
    previousYear: number;
    change: number;
  };
  studentCount: {
    value: number;
    undergraduate: number;
    master: number;
    doctorate: number;
  };
};

export type DashboardOverview = {
  currentYear: number;
  kpis: DashboardOverviewKPIs;
};

// Dashboard Trends Types
export type DashboardTrends = {
  years: number[];
  employmentRate: Array<{ year: number; value: number }>;
  techTransferIncome: Array<{ year: number; value: number }>;
  publications: Array<{ year: number; total: number; scie: number; kci: number }>;
};

// Dashboard Colleges Types
export type DashboardCollege = {
  name: string;
  employmentRate: number;
  departmentCount: number;
  researchBudget: number;
  budgetShare: number;
};

export type DashboardColleges = {
  year: number;
  colleges: DashboardCollege[];
};

// useDashboardOverview Hook
export function useDashboardOverview(year?: number) {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview', { year }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));

      const response = await fetch(`/api/dashboard/overview?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard overview');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// useDashboardTrends Hook
export function useDashboardTrends(years: number = 3) {
  return useQuery<DashboardTrends>({
    queryKey: ['dashboard', 'trends', { years }],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/trends?years=${years}`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// useDashboardColleges Hook
export function useDashboardColleges(year?: number) {
  return useQuery<DashboardColleges>({
    queryKey: ['dashboard', 'colleges', { year }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));

      const response = await fetch(`/api/dashboard/colleges?${params}`);
      if (!response.ok) throw new Error('Failed to fetch colleges data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
