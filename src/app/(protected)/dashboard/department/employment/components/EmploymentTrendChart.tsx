'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type EmploymentTrend = {
  department_name: string;
  data: {
    year: number;
    employment_rate: number;
  }[];
};

type EmploymentTrendChartProps = {
  data: EmploymentTrend[];
  isLoading?: boolean;
};

const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
  '#ffb347',
  '#a3e4d7',
  '#f7b7a3',
  '#aab7b8',
];

export function EmploymentTrendChart({ data, isLoading }: EmploymentTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>학과별 취업률 트렌드 (3개년)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>학과별 취업률 트렌드 (3개년)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p>트렌드 데이터가 없습니다</p>
            <p className="text-sm">학과를 선택해주세요</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 데이터 변환: 학과별 → 연도별
  const chartData = transformToYearlyData(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>학과별 취업률 트렌드 (3개년)</CardTitle>
        <p className="text-sm text-muted-foreground">선택된 학과의 연도별 취업률 추이</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis
              label={{ value: '취업률 (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            {data.map((trend, index) => (
              <Line
                key={trend.department_name}
                type="monotone"
                dataKey={trend.department_name}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 데이터 변환 함수
function transformToYearlyData(trends: EmploymentTrend[]) {
  // 모든 연도 추출
  const years = Array.from(new Set(trends.flatMap((t) => t.data.map((d) => d.year)))).sort();

  // 연도별로 데이터 재구성
  return years.map((year) => {
    const entry: Record<string, number | string> = { year };
    trends.forEach((trend) => {
      const dataPoint = trend.data.find((d) => d.year === year);
      entry[trend.department_name] = dataPoint?.employment_rate ?? 0;
    });
    return entry;
  });
}
