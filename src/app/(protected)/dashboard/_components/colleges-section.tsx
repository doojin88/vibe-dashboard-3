'use client';

import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { BarChart } from '@/components/charts/bar-chart';
import { PieChart } from '@/components/charts/pie-chart';
import type { DashboardColleges } from '@/hooks/api/useDashboard';

type CollegesSectionProps = {
  data: DashboardColleges;
};

export function CollegesSection({ data }: CollegesSectionProps) {
  // 취업률 막대 그래프 데이터
  const employmentData = data.colleges.map(college => ({
    name: college.name,
    취업률: college.employmentRate,
  }));

  // 연구비 파이 차트 데이터
  const budgetData = data.colleges.map(college => ({
    name: college.name,
    value: college.researchBudget / 100000000, // 억 단위
    percentage: college.budgetShare,
  }));

  const handleDownloadChart = (chartName: string) => {
    console.log(`Download chart: ${chartName}`);
    // TODO: 차트 다운로드 기능 구현
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">단과대학별 성과 비교</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartWrapper
          title="단과대학별 평균 취업률"
          description={`${data.year}년 기준`}
          onDownload={() => handleDownloadChart('college-employment')}
        >
          <BarChart
            data={employmentData}
            dataKey="취업률"
            xAxisKey="name"
            yAxisLabel="취업률 (%)"
            color="#10b981"
          />
        </ChartWrapper>

        <ChartWrapper
          title="단과대학별 연구비 분포"
          description={`${data.year}년 기준`}
          onDownload={() => handleDownloadChart('college-budget')}
        >
          <PieChart
            data={budgetData}
            dataKey="value"
            nameKey="name"
            showPercentage
          />
        </ChartWrapper>
      </div>
    </div>
  );
}
