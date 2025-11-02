'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatBudget, formatPercentage } from '@/lib/utils/number';
import type { DepartmentBreakdown } from '../types';

type DepartmentBreakdownChartProps = {
  data: DepartmentBreakdown[];
};

export function DepartmentBreakdownChart({
  data,
}: DepartmentBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>학과별 집행 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.department,
    amount: item.amount,
    executionRate: item.executionRate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>학과별 집행 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => formatBudget(value)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'amount') {
                  return formatBudget(value);
                }
                return `${formatPercentage(value)}`;
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="amount"
              fill="#8884d8"
              name="집행금액"
            />
            <Bar
              yAxisId="right"
              dataKey="executionRate"
              fill="#82ca9d"
              name="집행률"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

