// src/features/department-kpi/hooks/use-kpi-filters.ts
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { KPIFilters } from '../types';

export function useKPIFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL에서 필터 파싱
  const filters: KPIFilters = useMemo(() => {
    const years = searchParams.get('years');
    const colleges = searchParams.get('colleges');
    const departments = searchParams.get('departments');

    return {
      evaluation_years: years ? years.split(',').map(Number) : undefined,
      college_names: colleges ? colleges.split(',') : undefined,
      department_names: departments ? departments.split(',') : undefined,
    };
  }, [searchParams]);

  // 필터 업데이트
  const updateFilters = useCallback(
    (newFilters: Partial<KPIFilters>) => {
      const params = new URLSearchParams(searchParams);

      // 새로운 필터 적용
      const merged = { ...filters, ...newFilters };

      // URL 파라미터 설정
      if (merged.evaluation_years?.length) {
        params.set('years', merged.evaluation_years.join(','));
      } else {
        params.delete('years');
      }

      if (merged.college_names?.length) {
        params.set('colleges', merged.college_names.join(','));
      } else {
        params.delete('colleges');
      }

      if (merged.department_names?.length) {
        params.set('departments', merged.department_names.join(','));
      } else {
        params.delete('departments');
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, searchParams, router, pathname]
  );

  // 필터 초기화
  const resetFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
