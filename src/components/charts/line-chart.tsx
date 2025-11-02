'use client';

import { useEffect, useState } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type LineChartProps = {
  data: Record<string, unknown>[];
  dataKey?: string;
  dataKeys?: string[];
  xAxisKey: string;
  yAxisLabel?: string;
  color?: string;
  colors?: string[];
};

export function LineChart({
  data,
  dataKey,
  dataKeys,
  xAxisKey,
  yAxisLabel,
  color = '#3b82f6',
  colors = ['#3b82f6', '#10b981', '#8b5cf6'],
}: LineChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const keys = dataKeys || (dataKey ? [dataKey] : []);

  if (!isMounted) {
    return <div className="h-[300px] bg-muted animate-pulse rounded" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {keys.length > 1 && <Legend />}
        {keys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index] || color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
