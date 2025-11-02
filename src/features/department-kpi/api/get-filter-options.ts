// src/features/department-kpi/api/get-filter-options.ts

import type { KPIFilters, FilterOptions } from '../types';

export async function getFilterOptions(filters: KPIFilters): Promise<FilterOptions> {
  const params = new URLSearchParams();

  if (filters.college_names?.length) {
    params.set('colleges', filters.college_names.join(','));
  }

  const response = await fetch(`/api/department-kpi/filter-options?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch filter options');
  }

  return response.json();
}
