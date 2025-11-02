// src/features/department-kpi/hooks/use-kpi-summary.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { KPIFilters, KPISummary } from '../types';
import { getKPISummary } from '../api/get-kpi-summary';

export function useKPISummary(filters: KPIFilters) {
  return useQuery<KPISummary>({
    queryKey: ['kpi-summary', filters],
    queryFn: () => getKPISummary(filters),
    staleTime: 5 * 60 * 1000, // 5분
  });
}
