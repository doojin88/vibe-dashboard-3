// src/features/department-kpi/api/get-kpi-summary.ts

import type { KPIFilters, KPISummary } from '../types';

export async function getKPISummary(filters: KPIFilters): Promise<KPISummary> {
  const params = new URLSearchParams();

  if (filters.evaluation_years?.length) {
    params.set('years', filters.evaluation_years.join(','));
  }
  if (filters.college_names?.length) {
    params.set('colleges', filters.college_names.join(','));
  }
  if (filters.department_names?.length) {
    params.set('departments', filters.department_names.join(','));
  }

  const response = await fetch(`/api/department-kpi/summary?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch KPI summary');
  }

  return response.json();
}
