// src/features/department-kpi/types.ts

export type KPIMetric = {
  id: string;
  evaluation_year: number;
  college_name: string;
  department_name: string;
  employment_rate: number | null;
  full_time_faculty: number | null;
  visiting_faculty: number | null;
  tech_transfer_income: number | null;
  intl_conference_count: number | null;
};

export type KPISummary = {
  department_count: number;
  avg_employment_rate: number | null;
  avg_full_time_faculty: number | null;
  total_tech_transfer_income: number | null;
};

export type KPIFilters = {
  evaluation_years?: number[];
  college_names?: string[];
  department_names?: string[];
};

export type FilterOptions = {
  evaluation_years: number[];
  college_names: string[];
  department_names: string[];
};

// 차트 데이터 타입
export type EmploymentRateChartData = {
  department: string;
  employment_rate: number;
  color: 'green' | 'yellow' | 'red';
};

export type FacultyChartData = {
  department: string;
  full_time_faculty: number;
  visiting_faculty: number;
  total: number;
};

export type TechTransferChartData = {
  rank: number;
  department: string;
  tech_transfer_income: number;
};

export type ConferenceHeatmapData = {
  department: string;
  year: number;
  count: number;
};
