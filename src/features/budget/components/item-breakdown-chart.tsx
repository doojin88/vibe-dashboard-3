'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBudget, formatPercentage } from '@/lib/utils/number';
import type { ItemBreakdown } from '../types';

type ItemBreakdownChartProps = {
  data: ItemBreakdown;
};

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#a4de6c',
  '#d0ed57',
  '#83a6ed',
  '#8dd1e1',
];

const ChartComponent = dynamic<ItemBreakdownChartProps>(
  () =>
    import('recharts').then((recharts) => {
      const {
        PieChart,
        Pie,
        Cell,
        ResponsiveContainer,
        Tooltip,
        Legend,
      } = recharts;

      function ItemBreakdownChartComponent({ data }: ItemBreakdownChartProps) {
        const chartData = Object.entries(data).map(([name, value]) => ({
          name,
          amount: value.amount,
          percentage: value.percentage,
        }));

        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatBudget(value)}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      return { default: ItemBreakdownChartComponent };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  }
);

export function ItemBreakdownChart({ data }: ItemBreakdownChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    amount: value.amount,
    percentage: value.percentage,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>집행 항목별 구성</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>집행 항목별 구성</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartComponent data={data} />
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {formatPercentage(item.percentage)}
                </span>
                <span className="font-medium">{formatBudget(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

