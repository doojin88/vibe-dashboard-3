'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type BarChartProps = {
  data: Record<string, unknown>[];
  dataKey: string;
  xAxisKey: string;
  yAxisLabel?: string;
  color?: string;
};

export function BarChart({
  data,
  dataKey,
  xAxisKey,
  yAxisLabel,
  color = '#8884d8',
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey} fill={color} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
