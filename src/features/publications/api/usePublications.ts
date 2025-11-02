// src/features/publications/api/usePublications.ts
import { useQuery } from '@tanstack/react-query';
import type { PublicationFilters, PublicationWithDepartment } from '../types';

type UsePublicationsParams = PublicationFilters & {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
};

type PublicationsResponse = {
  items: PublicationWithDepartment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function usePublications(params: UsePublicationsParams = {}) {
  return useQuery<PublicationsResponse>({
    queryKey: ['publications', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.year) params.year.forEach((y) => searchParams.append('year', String(y)));
      if (params.college_name)
        params.college_name.forEach((c) => searchParams.append('college_name', c));
      if (params.department_name)
        params.department_name.forEach((d) => searchParams.append('department_name', d));
      if (params.journal_grade)
        params.journal_grade.forEach((g) => searchParams.append('journal_grade', g));
      if (params.main_author) searchParams.set('main_author', params.main_author);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.order) searchParams.set('order', params.order);

      const response = await fetch(`/api/publications?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch publications');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
