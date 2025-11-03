// src/features/publications/components/DepartmentPublicationChart.tsx
'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepartmentPublicationCount } from '../api/useDepartmentPublicationCount';
import { usePublicationStore } from '../store/publicationStore';

const DepartmentPublicationChartInternal = dynamic(
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

      function DepartmentPublicationChartComponent({
        chartData,
      }: {
        chartData: Array<{ name: string; count: number }>;
      }) {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="논문 수" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );
      }

      return { default: DepartmentPublicationChartComponent };
    }),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />,
  }
);

export function DepartmentPublicationChart() {
  const { filters } = usePublicationStore();
  const { data: departmentCounts, isLoading } = useDepartmentPublicationCount(filters);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>학과별 논문 게재 수</CardTitle>
          <CardDescription>Top 20 학과</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (departmentCounts || []).map((item) => ({
    name: item.department_name,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>학과별 논문 게재 수</CardTitle>
        <CardDescription>Top 20 학과</CardDescription>
      </CardHeader>
      <CardContent>
        <DepartmentPublicationChartInternal chartData={chartData} />
      </CardContent>
    </Card>
  );
}
