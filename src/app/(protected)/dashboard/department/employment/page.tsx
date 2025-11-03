'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TrendingUp, CheckCircle, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmploymentFilterPanel } from './components/EmploymentFilterPanel';
import { EmploymentTrendChart } from './components/EmploymentTrendChart';
import { CollegeAveragePieChart } from './components/CollegeAveragePieChart';
import { AchievementGaugeChart } from './components/AchievementGaugeChart';
import { EmploymentDataTable } from './components/EmploymentDataTable';
import { useEmploymentData, useEmploymentTrends, useCollegeAverage } from '@/hooks/api/useEmploymentData';

type FilterState = {
  evaluation_years: number[];
  college_names: string[];
  department_names: string[];
};

function EmploymentAnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터에서 필터 상태 초기화
  const [filters, setFilters] = useState<FilterState>(() => {
    const years = searchParams.getAll('year').map(Number);
    const colleges = searchParams.getAll('college');
    const depts = searchParams.getAll('dept');

    return {
      evaluation_years: years.length > 0 ? years : [new Date().getFullYear() - 1],
      college_names: colleges,
      department_names: depts,
    };
  });

  // API 데이터 페칭
  const { data: employmentData, isLoading, error } = useEmploymentData(filters);

  // 트렌드 차트용 데이터 (최대 5개 학과)
  const selectedDepartments = filters.department_names.length > 0
    ? filters.department_names.slice(0, 5)
    : (employmentData?.data || []).slice(0, 5).map(d => d.department_name);

  const { data: trendsData } = useEmploymentTrends(
    selectedDepartments,
    filters.evaluation_years[0] - 2,
    filters.evaluation_years[0]
  );

  // 단과대학별 평균
  const { data: collegeAvgData } = useCollegeAverage(filters.evaluation_years[0]);

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);

    // URL 파라미터 업데이트
    const params = new URLSearchParams();
    newFilters.evaluation_years.forEach((y) => params.append('year', String(y)));
    newFilters.college_names.forEach((c) => params.append('college', c));
    newFilters.department_names.forEach((d) => params.append('dept', d));

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    if (!employmentData?.data || employmentData.data.length === 0) return;

    const headers = ['평가년도', '단과대학', '학과', '취업률(%)', '목표달성률(%)', '전년대비(%)'];
    const csvContent = [
      headers.join(','),
      ...employmentData.data.map((row) =>
        [
          row.evaluation_year,
          row.college_name,
          row.department_name,
          row.employment_rate.toFixed(1),
          row.achievement_rate.toFixed(1),
          row.year_over_year_change !== null ? row.year_over_year_change.toFixed(1) : '-',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `취업률분석_${filters.evaluation_years[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <DashboardLayout>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-red-600">데이터 로딩 실패</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
          </p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        {/* 메인 콘텐츠 영역 (왼쪽) */}
        <div className="flex-1 space-y-6">
          {/* 페이지 헤더 */}
          <div>
            <h1 className="text-3xl font-bold">취업률 분석</h1>
            <p className="text-muted-foreground mt-2">
              학과별 취업률 현황 및 분석
            </p>
          </div>

          {/* KPI 카드 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 취업률</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '-' : `${employmentData?.avgRate ?? 0}%`}
                </div>
                <p className="text-xs text-muted-foreground">선택된 조건 기준</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">목표 달성 학과</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '-' : `${employmentData?.achievedCount ?? 0}개`}
                </div>
                <p className="text-xs text-muted-foreground">취업률 70% 이상</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">분석 대상</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '-' : `${employmentData?.total ?? 0}개`}
                </div>
                <p className="text-xs text-muted-foreground">학과</p>
              </CardContent>
            </Card>
          </div>

          {/* 차트 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmploymentTrendChart data={trendsData?.trends ?? []} isLoading={isLoading} />
            <CollegeAveragePieChart data={collegeAvgData?.data ?? []} isLoading={isLoading} />
          </div>

          <AchievementGaugeChart data={employmentData?.data ?? []} isLoading={isLoading} />

          {/* 데이터 테이블 */}
          <EmploymentDataTable
            data={employmentData?.data ?? []}
            isLoading={isLoading}
            onDownloadCSV={handleDownloadCSV}
          />
        </div>

        {/* 필터 패널 (오른쪽 고정) */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6">
            <EmploymentFilterPanel filters={filters} onChange={handleFilterChange} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function EmploymentAnalysisPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex gap-6">
            <div className="flex-1 space-y-6">
              <Skeleton className="h-12 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="w-80">
              <Skeleton className="h-96" />
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <EmploymentAnalysisContent />
    </Suspense>
  );
}
