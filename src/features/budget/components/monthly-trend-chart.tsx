// src/features/budget/components/monthly-trend-chart.tsx
'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBudget } from '@/lib/utils/number';
import type { MonthlyTrend } from '../types';

type MonthlyTrendChartProps = {
  data: MonthlyTrend[];
};

const ChartComponent = dynamic<MonthlyTrendChartProps>(
  () =>
    import('recharts').then((recharts) => {
      const {
        LineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ResponsiveContainer,
      } = recharts;

      function MonthlyTrendChartComponent({ data }: MonthlyTrendChartProps) {
        // 모든 집행 항목 수집
        const allItems = new Set<string>();
        data.forEach((month) => {
          Object.keys(month.items).forEach((item) => allItems.add(item));
        });

        // 차트 데이터 변환
        const chartData = data.map((month) => ({
          month: month.month,
          ...month.items,
        }));

        // 색상 매핑
        const colors = [
          '#8884d8',
          '#82ca9d',
          '#ffc658',
          '#ff8042',
          '#a4de6c',
          '#d0ed57',
          '#83a6ed',
        ];

        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => formatBudget(value)}
              />
              <Tooltip
                formatter={(value: number) => formatBudget(value)}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              {Array.from(allItems).map((item, index) => (
                <Line
                  key={item}
                  type="monotone"
                  dataKey={item}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }

      return { default: MonthlyTrendChartComponent };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  }
);

export function MonthlyTrendChart(props: MonthlyTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>월별 집행금액 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartComponent {...props} />
      </CardContent>
    </Card>
  );
}
