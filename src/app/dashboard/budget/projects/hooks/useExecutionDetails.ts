/**
 * React Query Hook: useExecutionDetails
 * 특정 과제의 집행 내역 상세 조회
 */

import { useQuery } from '@tanstack/react-query';
import type { ExecutionsResponse } from '../types';

export function useExecutionDetails(projectId: string | null) {
  return useQuery<ExecutionsResponse>({
    queryKey: ['budget-project-executions', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      const response = await fetch(`/api/budget/projects/${projectId}/executions`);
      if (!response.ok) throw new Error('Failed to fetch execution details');

      return response.json();
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
