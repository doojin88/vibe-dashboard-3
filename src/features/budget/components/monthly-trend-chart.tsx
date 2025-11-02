// src/features/budget/components/monthly-trend-chart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatBudget } from '@/lib/utils/number';
import type { MonthlyTrend } from '../types';

type MonthlyTrendChartProps = {
  data: MonthlyTrend[];
};

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>월별 집행금액 추이</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
