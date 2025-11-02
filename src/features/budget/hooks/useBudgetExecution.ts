// src/features/budget/hooks/useBudgetExecution.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { BudgetExecutionResponse, BudgetFilters } from '../types';

export function useBudgetExecution(filters: BudgetFilters = {}) {
  return useQuery<BudgetExecutionResponse>({
    queryKey: ['budget-execution', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/budget/execution?${params}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '예산 집행 현황 데이터를 불러오는데 실패했습니다.');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  });
}
