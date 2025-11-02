'use client';

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

type StackedBarChartProps = {
  data: Record<string, unknown>[];
  xAxisKey: string;
  dataKeys: string[];
  colors?: string[];
  labels?: string[];
};

export function StackedBarChart({
  data,
  xAxisKey,
  dataKeys,
  colors = ['#3b82f6', '#f97316'],
  labels,
}: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xAxisKey}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={colors[index % colors.length]}
            name={labels?.[index] || key}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
