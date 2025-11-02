'use client';

import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { LineChart } from '@/components/charts/line-chart';
import { BarChart } from '@/components/charts/bar-chart';
import type { DashboardTrends } from '@/hooks/api/useDashboard';

type TrendsSectionProps = {
  data: DashboardTrends;
};

export function TrendsSection({ data }: TrendsSectionProps) {
  // 데이터 변환
  const employmentRateData = data.employmentRate.map(item => ({
    year: String(item.year),
    value: item.value,
  }));

  const incomeData = data.techTransferIncome.map(item => ({
    year: String(item.year),
    value: item.value / 100000000, // 억 단위 변환
  }));

  const publicationsData = data.publications.map(item => ({
    year: String(item.year),
    SCIE: item.scie,
    KCI: item.kci,
    전체: item.total,
  }));

  const handleDownloadChart = (chartName: string) => {
    console.log(`Download chart: ${chartName}`);
    // TODO: 차트 다운로드 기능 구현
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">연도별 트렌드</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartWrapper
          title="취업률 추이"
          description="최근 3년"
          onDownload={() => handleDownloadChart('employment-rate')}
        >
          <LineChart
            data={employmentRateData}
            dataKey="value"
            xAxisKey="year"
            yAxisLabel="취업률 (%)"
            color="#3b82f6"
          />
        </ChartWrapper>

        <ChartWrapper
          title="기술이전 수입"
          description="최근 3년"
          onDownload={() => handleDownloadChart('tech-transfer')}
        >
          <BarChart
            data={incomeData}
            dataKey="value"
            xAxisKey="year"
            yAxisLabel="수입액 (억원)"
            color="#10b981"
          />
        </ChartWrapper>

        <ChartWrapper
          title="논문 게재 수"
          description="최근 3년 (SCIE/KCI)"
          onDownload={() => handleDownloadChart('publications')}
        >
          <LineChart
            data={publicationsData}
            dataKeys={['SCIE', 'KCI']}
            xAxisKey="year"
            yAxisLabel="논문 수 (편)"
            colors={['#3b82f6', '#10b981']}
          />
        </ChartWrapper>
      </div>
    </div>
  );
}
