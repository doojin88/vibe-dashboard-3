// src/features/department-kpi/utils/transform-chart-data.ts

import type {
  KPIMetric,
  EmploymentRateChartData,
  FacultyChartData,
  TechTransferChartData,
  ConferenceHeatmapData,
} from '../types';
import { getEmploymentRateColor } from './color-coding';

export function transformToEmploymentRateChart(
  metrics: KPIMetric[]
): EmploymentRateChartData[] {
  return metrics
    .filter((m) => m.employment_rate !== null)
    .map((m) => ({
      department: m.department_name,
      employment_rate: m.employment_rate!,
      color: getEmploymentRateColor(m.employment_rate),
    }))
    .sort((a, b) => b.employment_rate - a.employment_rate)
    .slice(0, 20); // 상위 20개만
}

export function transformToFacultyChart(metrics: KPIMetric[]): FacultyChartData[] {
  return metrics
    .map((m) => ({
      department: m.department_name,
      full_time_faculty: m.full_time_faculty ?? 0,
      visiting_faculty: m.visiting_faculty ?? 0,
      total: (m.full_time_faculty ?? 0) + (m.visiting_faculty ?? 0),
    }))
    .sort((a, b) => b.total - a.total);
}

export function transformToTechTransferChart(
  metrics: KPIMetric[]
): TechTransferChartData[] {
  return metrics
    .filter((m) => m.tech_transfer_income !== null && m.tech_transfer_income > 0)
    .map((m) => ({
      department: m.department_name,
      tech_transfer_income: m.tech_transfer_income!,
    }))
    .sort((a, b) => b.tech_transfer_income - a.tech_transfer_income)
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
}

export function transformToConferenceHeatmap(
  metrics: KPIMetric[]
): ConferenceHeatmapData[] {
  return metrics
    .filter((m) => m.intl_conference_count !== null)
    .map((m) => ({
      department: m.department_name,
      year: m.evaluation_year,
      count: m.intl_conference_count!,
    }));
}
