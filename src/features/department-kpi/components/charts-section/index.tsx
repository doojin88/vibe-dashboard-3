// src/features/department-kpi/components/charts-section/index.tsx
'use client';

import { useMemo, useState } from 'react';
import { EmploymentRateChart } from './employment-rate-chart';
import { FacultyChart } from './faculty-chart';
import { TechTransferChart } from './tech-transfer-chart';
import { ConferenceHeatmap } from './conference-heatmap';
import type { KPIMetric } from '../../types';
import {
  transformToEmploymentRateChart,
  transformToFacultyChart,
  transformToTechTransferChart,
  transformToConferenceHeatmap,
} from '../../utils/transform-chart-data';

type ChartsSectionProps = {
  metrics: KPIMetric[] | undefined;
  isLoading: boolean;
  onDepartmentClick?: (department: string) => void;
};

export function ChartsSection({
  metrics,
  isLoading,
  onDepartmentClick,
}: ChartsSectionProps) {
  const employmentData = useMemo(
    () => (metrics ? transformToEmploymentRateChart(metrics) : []),
    [metrics]
  );

  const facultyData = useMemo(
    () => (metrics ? transformToFacultyChart(metrics) : []),
    [metrics]
  );

  const techTransferData = useMemo(
    () => (metrics ? transformToTechTransferChart(metrics) : []),
    [metrics]
  );

  const conferenceData = useMemo(
    () => (metrics ? transformToConferenceHeatmap(metrics) : []),
    [metrics]
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <EmploymentRateChart
        data={employmentData}
        isLoading={isLoading}
        onBarClick={onDepartmentClick}
      />
      <FacultyChart data={facultyData} isLoading={isLoading} />
      <TechTransferChart data={techTransferData} isLoading={isLoading} />
      <ConferenceHeatmap data={conferenceData} isLoading={isLoading} />
    </div>
  );
}
