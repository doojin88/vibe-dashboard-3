// src/features/department-kpi/components/charts-section/faculty-chart.tsx
'use client';

import dynamic from 'next/dynamic';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import type { FacultyChartData } from '../../types';

type FacultyChartProps = {
  data: FacultyChartData[];
  isLoading?: boolean;
};

const FacultyChartInternal = dynamic(
  () =>
    import('recharts').then((recharts) => {
      const {
        BarChart: RechartsBarChart,
        Bar,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ResponsiveContainer,
      } = recharts;

      function FacultyChartComponent({
        data,
      }: {
        data: FacultyChartData[];
      }) {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="department" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="full_time_faculty" stackId="a" fill="#3b82f6" name="전임교원" />
              <Bar dataKey="visiting_faculty" stackId="a" fill="#22c55e" name="초빙교원" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );
      }

      return { default: FacultyChartComponent };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[400px] bg-muted animate-pulse rounded" />,
  }
);

export function FacultyChart({ data, isLoading }: FacultyChartProps) {
  return (
    <ChartWrapper
      title="교원 현황"
      description="전임/초빙 교원 구분"
      isLoading={isLoading}
    >
      <FacultyChartInternal data={data} />
    </ChartWrapper>
  );
}
