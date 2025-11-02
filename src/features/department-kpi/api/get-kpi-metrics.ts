// src/features/department-kpi/api/get-kpi-metrics.ts

import type { KPIFilters, KPIMetric } from '../types';

export async function getKPIMetrics(filters: KPIFilters): Promise<KPIMetric[]> {
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

  const response = await fetch(`/api/department-kpi/metrics?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch KPI metrics');
  }

  return response.json();
}
