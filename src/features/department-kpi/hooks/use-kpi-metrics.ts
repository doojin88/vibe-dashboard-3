// src/features/department-kpi/hooks/use-kpi-metrics.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { KPIFilters, KPIMetric } from '../types';
import { getKPIMetrics } from '../api/get-kpi-metrics';

export function useKPIMetrics(filters: KPIFilters) {
  return useQuery<KPIMetric[]>({
    queryKey: ['kpi-metrics', filters],
    queryFn: () => getKPIMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5분
  });
}
