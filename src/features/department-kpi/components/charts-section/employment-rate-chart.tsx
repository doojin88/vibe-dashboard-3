// src/features/department-kpi/components/charts-section/employment-rate-chart.tsx
'use client';

import { ChartWrapper } from '@/components/charts/chart-wrapper';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { EmploymentRateChartData } from '../../types';

type EmploymentRateChartProps = {
  data: EmploymentRateChartData[];
  isLoading?: boolean;
  onBarClick?: (department: string) => void;
};

const COLOR_MAP = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

export function EmploymentRateChart({
  data,
  isLoading,
  onBarClick,
}: EmploymentRateChartProps) {
  return (
    <ChartWrapper
      title="학과별 취업률 비교"
      description="상위 20개 학과"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} unit="%" />
          <YAxis type="category" dataKey="department" width={100} />
          <Tooltip
            formatter={(value: number) => `${value.toFixed(1)}%`}
            labelFormatter={(label) => `학과: ${label}`}
          />
          <Bar
            dataKey="employment_rate"
            onClick={(data: any) => onBarClick?.(data.department)}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLOR_MAP[entry.color]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
