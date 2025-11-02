import { ChartWrapper } from '@/components/charts/chart-wrapper';
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
import { formatBudget } from '@/lib/utils/number';
import type { TimelineData } from '@/features/research-projects/types';

type ExecutionTimelineChartProps = {
  data?: TimelineData[];
  isLoading: boolean;
};

export function ExecutionTimelineChart({ data, isLoading }: ExecutionTimelineChartProps) {
  const chartData = data?.map((item) => ({
    month: item.month,
    total: item.total_amount,
    ...item.by_item,
  })) || [];

  // Extract execution items for color mapping
  const items = Array.from(
    new Set(data?.flatMap((d) => Object.keys(d.by_item)) || [])
  );

  const ITEM_COLORS: Record<string, string> = {
    '인건비': '#8884d8',
    '장비비': '#82ca9d',
    '재료비': '#ffc658',
    '기타': '#ff8042',
  };

  return (
    <ChartWrapper
      title="연구비 집행 추이"
      description="최근 12개월"
      isLoading={isLoading}
    >
      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          데이터가 없습니다
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatBudget(value)} />
            <Tooltip
              formatter={(value: number) => formatBudget(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#000"
              strokeWidth={2}
              name="총 집행액"
            />
            {items.map((item) => (
              <Line
                key={item}
                type="monotone"
                dataKey={item}
                stroke={ITEM_COLORS[item] || '#999'}
                name={item}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
