import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/lib/supabase/types';

type KPIMetric = Database['public']['Tables']['kpi_metrics']['Row'] & {
  department: {
    college_name: string;
    department_name: string;
  };
};

type KPIFilters = {
  evaluation_year?: number;
  college_name?: string;
  department_name?: string;
};

export function useKPIMetrics(filters: KPIFilters = {}) {
  return useQuery<KPIMetric[]>({
    queryKey: ['kpi-metrics', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      const response = await fetch(`/api/kpi-metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch KPI metrics');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function useKPIMetricsAggregate(filters: KPIFilters = {}) {
  return useQuery({
    queryKey: ['kpi-metrics-aggregate', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      const response = await fetch(`/api/kpi-metrics/aggregate?${params}`);
      if (!response.ok) throw new Error('Failed to fetch aggregate data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
