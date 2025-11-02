'use client';

import dynamic from 'next/dynamic';

type DonutChartProps = {
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey: string;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DonutChartInternal = dynamic<DonutChartProps>(
  () =>
    import('recharts').then((recharts) => {
      const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = recharts;

      function DonutChartComponent({ data, nameKey, valueKey }: DonutChartProps) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      return { default: DonutChartComponent };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  }
);

export function DonutChart(props: DonutChartProps) {
  return <DonutChartInternal {...props} />;
}
