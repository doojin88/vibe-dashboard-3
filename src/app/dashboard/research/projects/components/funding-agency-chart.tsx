'use client';

import { useEffect, useState } from 'react';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatBudget } from '@/lib/utils/number';
import type { AgencyData } from '@/features/research-projects/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

type FundingAgencyChartProps = {
  data?: AgencyData[];
  isLoading: boolean;
};

export function FundingAgencyChart({ data, isLoading }: FundingAgencyChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const chartData = data?.map((item) => ({
    name: item.funding_agency,
    value: item.total_budget,
    count: item.project_count,
  })) || [];

  if (!isMounted) {
    return (
      <ChartWrapper title="지원기관별 연구비 분포" isLoading={isLoading}>
        <div className="h-[300px] bg-muted animate-pulse rounded" />
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper title="지원기관별 연구비 분포" isLoading={isLoading}>
      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          데이터가 없습니다
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatBudget(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
