'use client';

import dynamic from 'next/dynamic';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { BarChart } from '@/components/charts/bar-chart';
import { formatBudget, formatNumber } from '@/lib/utils/number';
import type { ResearcherPerformance } from '../../backend/types';

type ResearchersChartProps = {
  researchers: ResearcherPerformance[];
};

export function ResearchersBudgetChart({ researchers }: ResearchersChartProps) {
  const top20 = researchers.slice(0, 20);

  const chartData = top20.map((r) => ({
    name: r.researcher_name,
    연구비: r.total_budget / 100000000, // 억원 단위
  }));

  return (
    <ChartWrapper title="연구자별 연구비 순위" description="Top 20">
      <BarChart
        data={chartData}
        dataKey="연구비"
        xAxisKey="name"
        yAxisLabel="연구비 (억원)"
        color="#3b82f6"
      />
    </ChartWrapper>
  );
}

const ScatterChartComponent = dynamic<ResearchersChartProps>(
  () =>
    import('recharts').then((recharts) => {
      const {
        ScatterChart,
        Scatter,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ResponsiveContainer,
      } = recharts;

      function BudgetVsPublicationsChartComponent({ researchers }: ResearchersChartProps) {
        const chartData = researchers.map((r) => ({
          name: r.researcher_name,
          budget: r.total_budget / 100000000, // 억원
          publications: r.publication_count,
        }));

        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="budget"
                name="연구비"
                unit="억원"
                label={{ value: '연구비 (억원)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="publications"
                name="논문 수"
                label={{ value: '논문 수', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-sm">연구비: {formatBudget(data.budget * 100000000)}</p>
                        <p className="text-sm">논문 수: {formatNumber(data.publications)}편</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={chartData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      }

      return { default: BudgetVsPublicationsChartComponent };
    }),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  }
);

export function BudgetVsPublicationsChart(props: ResearchersChartProps) {
  return (
    <ChartWrapper title="연구비 vs 논문 수" description="산점도 (Scatter Plot)">
      <ScatterChartComponent {...props} />
    </ChartWrapper>
  );
}
