// src/hooks/api/usePublications.ts
'use client';

import { useQuery } from '@tanstack/react-query';

type PublicationFilters = {
  publication_year?: number[];
  college_name?: string[];
  department_name?: string[];
  journal_grade?: string[];
  main_author?: string;
  page?: number;
  limit?: number;
};

export function usePublications(filters: PublicationFilters = {}) {
  return useQuery({
    queryKey: ['publications', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.publication_year) {
        filters.publication_year.forEach(y => params.append('publication_year', String(y)));
      }
      if (filters.college_name) {
        filters.college_name.forEach(c => params.append('college_name', c));
      }
      if (filters.department_name) {
        filters.department_name.forEach(d => params.append('department_name', d));
      }
      if (filters.journal_grade) {
        filters.journal_grade.forEach(j => params.append('journal_grade', j));
      }
      if (filters.main_author) {
        params.set('main_author', filters.main_author);
      }
      if (filters.page) {
        params.set('page', String(filters.page));
      }
      if (filters.limit) {
        params.set('limit', String(filters.limit));
      }

      const response = await fetch(`/api/publications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch publications');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

export function usePublicationAggregate(filters: Omit<PublicationFilters, 'page' | 'limit'> = {}) {
  return useQuery({
    queryKey: ['publications', 'aggregate', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.publication_year) {
        filters.publication_year.forEach(y => params.append('publication_year', String(y)));
      }
      if (filters.college_name) {
        filters.college_name.forEach(c => params.append('college_name', c));
      }
      if (filters.department_name) {
        filters.department_name.forEach(d => params.append('department_name', d));
      }
      if (filters.journal_grade) {
        filters.journal_grade.forEach(j => params.append('journal_grade', j));
      }
      if (filters.main_author) {
        params.set('main_author', filters.main_author);
      }

      const response = await fetch(`/api/publications/aggregate?${params}`);
      if (!response.ok) throw new Error('Failed to fetch aggregate data');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicationFilterOptions() {
  return useQuery({
    queryKey: ['publications', 'filter-options'],
    queryFn: async () => {
      const response = await fetch('/api/publications/filter-options');
      if (!response.ok) throw new Error('Failed to fetch filter options');

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10분
  });
}
