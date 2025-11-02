// src/features/department-kpi/hooks/use-filter-options.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { KPIFilters, FilterOptions } from '../types';
import { getFilterOptions } from '../api/get-filter-options';

export function useFilterOptions(filters: KPIFilters) {
  return useQuery<FilterOptions>({
    queryKey: ['kpi-filter-options', filters.college_names],
    queryFn: () => getFilterOptions(filters),
    staleTime: 10 * 60 * 1000, // 10분 (거의 변하지 않음)
  });
}
