/**
 * React Query Hook: useFilterOptions
 * 필터 옵션 데이터 조회
 */

import { useQuery } from '@tanstack/react-query';
import type { FiltersResponse } from '../types';

export function useFilterOptions() {
  return useQuery<FiltersResponse>({
    queryKey: ['budget-projects-filters'],
    queryFn: async () => {
      const response = await fetch('/api/budget/projects/filters');
      if (!response.ok) throw new Error('Failed to fetch filter options');

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10분 (필터 옵션은 자주 변경되지 않음)
  });
}
