import { useQuery } from '@tanstack/react-query';
import type { ProjectWithDetails, ProjectFilters, ProjectAggregate } from '../types';

export function useResearchProjects(filters: ProjectFilters = {}) {
  return useQuery<{ data: ProjectWithDetails[]; total: number }>({
    queryKey: ['research-projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value));
      });

      const response = await fetch(`/api/research-projects?${params}`);
      if (!response.ok) throw new Error('Failed to fetch research projects');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useResearchProjectsAggregate(filters: Omit<ProjectFilters, 'status' | 'limit' | 'offset'> = {}) {
  return useQuery<ProjectAggregate>({
    queryKey: ['research-projects-aggregate', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value));
      });

      const response = await fetch(`/api/research-projects/aggregate?${params}`);
      if (!response.ok) throw new Error('Failed to fetch aggregate data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
