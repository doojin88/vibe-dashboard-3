'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ResearchersFilter } from '../../backend/schema';
import type { ResearchersResponse, ResearchersAggregateResponse } from '../../backend/types';

export function useResearchers(
  filters: Partial<ResearchersFilter> = {},
  options?: Omit<UseQueryOptions<ResearchersResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ResearchersResponse>({
    queryKey: ['researchers', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/research/researchers?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch researchers');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
    ...options,
  });
}

export function useResearchersAggregate(
  filters: Partial<ResearchersFilter> = {},
  options?: Omit<UseQueryOptions<ResearchersAggregateResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ResearchersAggregateResponse>({
    queryKey: ['researchers-aggregate', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/research/researchers/aggregate?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch aggregate');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
