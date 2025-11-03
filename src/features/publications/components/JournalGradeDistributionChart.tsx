// src/features/publications/components/JournalGradeDistributionChart.tsx
'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournalGradeDistribution } from '../api/useJournalGradeDistribution';
import { usePublicationStore } from '../store/publicationStore';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

const JournalGradeDistributionChartInternal = dynamic(
  () =>
    import('recharts').then((recharts) => {
      const {
        PieChart: RechartsPieChart,
        Pie,
        Cell,
        ResponsiveContainer,
        Tooltip,
        Legend,
      } = recharts;

      function JournalGradeDistributionChartComponent({
        chartData,
      }: {
        chartData: Array<{ name: string; value: number; percentage: number }>;
      }) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string, props: any) => [
                `${value}건 (${props.payload.percentage}%)`,
                props.payload.name
              ]} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      }

      return { default: JournalGradeDistributionChartComponent };
    }),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />,
  }
);

export function JournalGradeDistributionChart() {
  const { filters } = usePublicationStore();
  const { data: distribution, isLoading } = useJournalGradeDistribution(filters);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>저널 등급별 분포</CardTitle>
          <CardDescription>비율 및 절대 수</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (distribution || []).map((item) => ({
    name: item.journal_grade,
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>저널 등급별 분포</CardTitle>
        <CardDescription>비율 및 절대 수</CardDescription>
      </CardHeader>
      <CardContent>
        <JournalGradeDistributionChartInternal chartData={chartData} />
      </CardContent>
    </Card>
  );
}
