'use client';

import dynamic from 'next/dynamic';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import type { StatusData } from '@/features/research-projects/types';

const COLORS = {
  '집행완료': '#00C49F',
  '처리중': '#FFBB28',
};

type StatusChartProps = {
  data?: StatusData[];
  isLoading: boolean;
};

const StatusChartInternal = dynamic(
  () =>
    import('recharts').then((recharts) => {
      const {
        PieChart: RechartsPieChart,
        Pie,
        Cell,
        ResponsiveContainer,
        Tooltip,
        Legend,
      } = recharts;

      function StatusChartComponent({
        chartData,
      }: {
        chartData: Array<{ name: string; value: number }>;
      }) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      }

      return { default: StatusChartComponent };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  }
);

export function StatusChart({ data, isLoading }: StatusChartProps) {
  const chartData = data?.map((item) => ({
    name: item.status,
    value: item.count,
  })) || [];

  return (
    <ChartWrapper title="과제별 진행 상태" isLoading={isLoading}>
      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          데이터가 없습니다
        </div>
      ) : (
        <StatusChartInternal chartData={chartData} />
      )}
    </ChartWrapper>
  );
}
