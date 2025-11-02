'use client';

import dynamic from 'next/dynamic';

type BarChartProps = {
  data: Record<string, unknown>[];
  dataKey: string;
  xAxisKey: string;
  yAxisLabel?: string;
  color?: string;
};

const BarChartInternal = dynamic<BarChartProps>(
  () =>
    import('recharts').then((recharts) => {
      const {
        BarChart: RechartsBarChart,
        Bar,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ResponsiveContainer,
      } = recharts;

      function BarChartComponent({
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

      return { default: BarChartComponent };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  }
);

export function BarChart(props: BarChartProps) {
  return <BarChartInternal {...props} />;
}
