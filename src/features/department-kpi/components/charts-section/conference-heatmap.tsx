// src/features/department-kpi/components/charts-section/conference-heatmap.tsx
'use client';

import { ChartWrapper } from '@/components/charts/chart-wrapper';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ConferenceHeatmapData } from '../../types';

type ConferenceHeatmapProps = {
  data: ConferenceHeatmapData[];
  isLoading?: boolean;
};

// 개최 횟수에 따른 색상 강도
const getColor = (count: number): string => {
  if (count === 0) return '#f3f4f6'; // 흰색
  if (count <= 2) return '#bfdbfe'; // 연한 파란색
  if (count <= 5) return '#60a5fa'; // 중간 파란색
  return '#3b82f6'; // 진한 파란색
};

export function ConferenceHeatmap({ data, isLoading }: ConferenceHeatmapProps) {
  // 연도가 여러 개 선택되지 않았으면 히트맵을 표시하지 않음
  const years = [...new Set(data.map((d) => d.year))];
  if (years.length < 2) {
    return (
      <ChartWrapper
        title="국제학술대회 개최 현황"
        description="연도별 개최 횟수 (히트맵)"
        isLoading={isLoading}
      >
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          2개 이상의 평가년도를 선택하면 히트맵이 표시됩니다.
        </div>
      </ChartWrapper>
    );
  }

  // Scatter chart를 위한 데이터 변환
  const scatterData = data.map((item) => ({
    x: item.department,
    y: item.year,
    z: item.count,
    count: item.count,
  }));

  return (
    <ChartWrapper
      title="국제학술대회 개최 현황"
      description="연도별 개최 횟수 (히트맵)"
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
          <XAxis type="category" dataKey="x" name="학과" />
          <YAxis type="number" dataKey="y" name="연도" />
          <ZAxis type="number" dataKey="z" range={[100, 1000]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ payload }) => {
              if (payload && payload.length > 0) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded-md p-2 shadow-md">
                    <p className="text-sm font-medium">{data.x}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.y}년: {data.count}회
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={scatterData} shape="square">
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.count)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
