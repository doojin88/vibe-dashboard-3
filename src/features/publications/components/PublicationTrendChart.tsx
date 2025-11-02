// src/features/publications/components/PublicationTrendChart.tsx
'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicationTrend } from '../api/usePublicationTrend';
import { usePublicationStore } from '../store/publicationStore';
import type { PublicationTrend } from '../types';

const ChartComponent = dynamic<{ trend: PublicationTrend[] }>(
  () =>
    import('recharts').then((recharts) => {
      const {
        LineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ResponsiveContainer,
      } = recharts;

      function PublicationTrendChartComponent({
        trend,
      }: {
        trend: PublicationTrend[];
      }) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="scie_count" stroke="#3b82f6" name="SCIE" strokeWidth={2} />
              <Line type="monotone" dataKey="kci_count" stroke="#10b981" name="KCI" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      return { default: PublicationTrendChartComponent };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  }
);

export function PublicationTrendChart() {
  const { filters } = usePublicationStore();
  const { data: trend, isLoading } = usePublicationTrend(filters);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>연도별 논문 게재 추이</CardTitle>
          <CardDescription>SCIE/KCI 구분</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>연도별 논문 게재 추이</CardTitle>
        <CardDescription>SCIE/KCI 구분</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartComponent trend={trend || []} />
      </CardContent>
    </Card>
  );
}
