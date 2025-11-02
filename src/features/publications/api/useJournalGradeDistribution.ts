// src/features/publications/api/useJournalGradeDistribution.ts
import { useQuery } from '@tanstack/react-query';
import type { PublicationFilters, JournalGradeDistribution } from '../types';

export function useJournalGradeDistribution(filters: PublicationFilters = {}) {
  return useQuery<JournalGradeDistribution[]>({
    queryKey: ['publications', 'grade-distribution', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (filters.year) filters.year.forEach((y) => searchParams.append('year', String(y)));
      if (filters.college_name)
        filters.college_name.forEach((c) => searchParams.append('college_name', c));
      if (filters.department_name)
        filters.department_name.forEach((d) => searchParams.append('department_name', d));
      if (filters.journal_grade)
        filters.journal_grade.forEach((g) => searchParams.append('journal_grade', g));
      if (filters.main_author) searchParams.set('main_author', filters.main_author);

      const response = await fetch(`/api/publications/grade-distribution?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch grade distribution');

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
