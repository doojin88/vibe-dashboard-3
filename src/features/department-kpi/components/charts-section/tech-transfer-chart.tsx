// src/features/department-kpi/components/charts-section/tech-transfer-chart.tsx
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
import type { TechTransferChartData } from '../../types';

type TechTransferChartProps = {
  data: TechTransferChartData[];
  isLoading?: boolean;
};

// 그라데이션 색상 (1위 진한 색 → 10위 연한 색)
const getColor = (rank: number): string => {
  const intensity = 1 - (rank - 1) * 0.08; // 1.0 → 0.28
  const r = Math.round(59 * intensity);
  const g = Math.round(130 * intensity);
  const b = Math.round(246 * intensity);
  return `rgb(${r}, ${g}, ${b})`;
};

export function TechTransferChart({ data, isLoading }: TechTransferChartProps) {
  return (
    <ChartWrapper
      title="기술이전 수입 Top 10"
      description="상위 10개 학과"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" unit="억원" />
          <YAxis
            type="category"
            dataKey="department"
            width={100}
            tickFormatter={(value, index) => `${data[index]?.rank}. ${value}`}
          />
          <Tooltip
            formatter={(value: number) => `${value.toFixed(1)}억원`}
            labelFormatter={(label, payload) =>
              payload && payload[0]
                ? `${payload[0].payload.rank}위 - ${label}`
                : label
            }
          />
          <Bar dataKey="tech_transfer_income">
            {data.map((entry) => (
              <Cell key={`cell-${entry.rank}`} fill={getColor(entry.rank)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
