'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type PieChartProps = {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey: string;
  showPercentage?: boolean;
  colors?: string[];
};

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function PieChart({
  data,
  dataKey,
  nameKey,
  showPercentage = false,
  colors = DEFAULT_COLORS,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          label={showPercentage ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%` : undefined}
          labelLine={showPercentage}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
