import { ChartWrapper } from '@/components/charts/chart-wrapper';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatBudget } from '@/lib/utils/number';
import type { DepartmentData } from '@/features/research-projects/types';

type DepartmentBudgetChartProps = {
  data?: DepartmentData[];
  isLoading: boolean;
};

export function DepartmentBudgetChart({ data, isLoading }: DepartmentBudgetChartProps) {
  const chartData = data?.map((item) => ({
    name: item.department_name,
    budget: item.total_budget,
    count: item.project_count,
  })) || [];

  return (
    <ChartWrapper
      title="학과별 총 연구비"
      description="상위 10개 학과"
      isLoading={isLoading}
    >
      {chartData.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          데이터가 없습니다
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => formatBudget(value)} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip
              formatter={(value: number) => formatBudget(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend />
            <Bar dataKey="budget" fill="#8884d8" name="총 연구비" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
