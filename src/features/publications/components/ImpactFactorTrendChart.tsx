// src/features/publications/components/ImpactFactorTrendChart.tsx
'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useImpactFactorTrend } from '../api/useImpactFactorTrend';
import { usePublicationStore } from '../store/publicationStore';

const ImpactFactorTrendChartInternal = dynamic(
  () =>
    import('recharts').then((recharts) => {
      const {
        LineChart: RechartsLineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ResponsiveContainer,
      } = recharts;

      function ImpactFactorTrendChartComponent({
        chartData,
      }: {
        chartData: Array<{ year: string; avg_impact_factor: string }>;
      }) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avg_impact_factor"
                stroke="#f59e0b"
                name="평균 IF"
                strokeWidth={2}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      }

      return { default: ImpactFactorTrendChartComponent };
    }),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />,
  }
);

export function ImpactFactorTrendChart() {
  const { filters } = usePublicationStore();
  const { data: trend, isLoading } = useImpactFactorTrend(filters);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impact Factor 평균 추이</CardTitle>
          <CardDescription>연도별 평균 IF</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (trend || []).map((item) => ({
    year: item.year,
    avg_impact_factor: item.avg_impact_factor.toFixed(2),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Factor 평균 추이</CardTitle>
        <CardDescription>연도별 평균 IF</CardDescription>
      </CardHeader>
      <CardContent>
        <ImpactFactorTrendChartInternal chartData={chartData} />
      </CardContent>
    </Card>
  );
}
