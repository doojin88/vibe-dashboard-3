/**
 * React Query Hook: useProjectsData
 * 과제 목록 및 예산 정보 조회
 */

import { useQuery } from '@tanstack/react-query';
import type { ProjectFilters, ProjectsResponse } from '../types';

type Pagination = { page: number; limit: number };

export function useProjectsData(filters: ProjectFilters, pagination: Pagination) {
  return useQuery<ProjectsResponse>({
    queryKey: ['budget-projects', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams();

      // 필터 파라미터 추가
      if (filters.year) params.set('year', filters.year.toString());
      if (filters.department_id) params.set('department_id', filters.department_id);
      if (filters.funding_agency) params.set('funding_agency', filters.funding_agency);
      if (filters.principal_investigator)
        params.set('principal_investigator', filters.principal_investigator);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.sort_by) params.set('sort_by', filters.sort_by);
      if (filters.sort_order) params.set('sort_order', filters.sort_order);

      // 페이지네이션
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const response = await fetch(`/api/budget/projects?${params}`);
      if (!response.ok) throw new Error('Failed to fetch projects');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
