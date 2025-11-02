// src/features/department-kpi/utils/color-coding.ts

export function getEmploymentRateColor(rate: number | null): 'green' | 'yellow' | 'red' {
  if (rate === null) return 'red';
  if (rate >= 80) return 'green';
  if (rate >= 60) return 'yellow';
  return 'red';
}
