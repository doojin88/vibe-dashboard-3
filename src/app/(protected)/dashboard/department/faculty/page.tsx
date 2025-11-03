'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { StackedBarChart } from '@/components/charts/stacked-bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { LineChart } from '@/components/charts/line-chart';
import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useFacultyData } from '@/hooks/api/useFacultyData';
import { FacultyFilterSection } from './components/FacultyFilterSection';
import { Users, UserCheck, UserPlus, UsersRound } from 'lucide-react';

type FacultyFilters = {
  evaluation_years?: number[];
  college_names?: string[];
  department_names?: string[];
};

function FacultyStatusContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FacultyFilters>(() => {
    // URL 파라미터에서 초기값 복원
    const yearParam = searchParams.get('year');
    const collegeParam = searchParams.get('college');
    const deptParam = searchParams.get('dept');

    return {
      evaluation_years: yearParam ? yearParam.split(',').map(Number) : undefined,
      college_names: collegeParam ? collegeParam.split(',') : undefined,
      department_names: deptParam ? deptParam.split(',') : undefined,
    };
  });

  // API 형식에 맞게 필터 변환
  const apiFilters = {
    evaluation_year: filters.evaluation_years,
    college_name: filters.college_names,
    department_name: filters.department_names,
  };

  const { data, isLoading, error } = useFacultyData(apiFilters);

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: Partial<FacultyFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // URL 파라미터 업데이트
    const params = new URLSearchParams();

    if (updatedFilters.evaluation_years && updatedFilters.evaluation_years.length > 0) {
      params.set('year', updatedFilters.evaluation_years.join(','));
    }
    if (updatedFilters.college_names && updatedFilters.college_names.length > 0) {
      params.set('college', updatedFilters.college_names.join(','));
    }
    if (updatedFilters.department_names && updatedFilters.department_names.length > 0) {
      params.set('dept', updatedFilters.department_names.join(','));
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setFilters({});
    router.replace(pathname);
  };

  // 테이블 컬럼 정의
  const tableColumns: ColumnDef<any>[] = [
    {
      id: 'evaluation_year',
      header: '평가년도',
      accessorKey: 'evaluation_year',
      sortable: true,
    },
    {
      id: 'college_name',
      header: '단과대학',
      accessorKey: 'college_name',
      sortable: true,
    },
    {
      id: 'department_name',
      header: '학과',
      accessorKey: 'department_name',
      sortable: true,
    },
    {
      id: 'full_time_faculty',
      header: '전임교원',
      accessorKey: 'full_time_faculty',
      sortable: true,
    },
    {
      id: 'visiting_faculty',
      header: '초빙교원',
      accessorKey: 'visiting_faculty',
      sortable: true,
    },
    {
      id: 'total_faculty',
      header: '총 교원',
      accessorKey: 'total_faculty',
      sortable: true,
    },
    {
      id: 'full_time_ratio',
      header: '전임비율 (%)',
      cell: (row) => `${row.full_time_ratio.toFixed(1)}%`,
      sortable: true,
    },
  ];

  const kpiData = data?.aggregate;
  const chartData = data?.chart;
  const tableData = data?.table;

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
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">교원 현황</h1>
            <p className="text-muted-foreground mt-2">
              학과별 전임/초빙 교원 현황 분석
            </p>
          </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="전임교원"
            value={kpiData?.total_full_time || 0}
            icon={UserCheck}
            description="전임교원 수"
          />
          <KPICard
            title="초빙교원"
            value={kpiData?.total_visiting || 0}
            icon={UserPlus}
            description="초빙교원 수"
          />
          <KPICard
            title="평균 전임비율"
            value={`${(kpiData?.avg_full_time_ratio || 0).toFixed(1)}%`}
            icon={Users}
            description="전임교원 비율"
          />
          <KPICard
            title="총 교원"
            value={(kpiData?.total_full_time || 0) + (kpiData?.total_visiting || 0)}
            icon={UsersRound}
            description="전체 교원 수"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper
            title="학과별 교원 현황"
            description="전임교원 vs 초빙교원"
            isLoading={isLoading}
          >
            {chartData?.byDepartment && chartData.byDepartment.length > 0 ? (
              <StackedBarChart
                data={chartData.byDepartment}
                xAxisKey="department_name"
                dataKeys={['full_time_faculty', 'visiting_faculty']}
                colors={['#3b82f6', '#f97316']}
                labels={['전임교원', '초빙교원']}
              />
            ) : (
              <EmptyState title="데이터가 없습니다" />
            )}
          </ChartWrapper>

          <ChartWrapper
            title="단과대학별 교원 분포"
            description="단과대학별 총 교원 수"
            isLoading={isLoading}
          >
            {chartData?.byCollege && chartData.byCollege.length > 0 ? (
              <DonutChart
                data={chartData.byCollege}
                nameKey="college_name"
                valueKey="total_faculty"
              />
            ) : (
              <EmptyState title="데이터가 없습니다" />
            )}
          </ChartWrapper>
        </div>

        <ChartWrapper
          title="연도별 교원 증감 추이"
          description="전임/초빙 교원 수 변화"
          isLoading={isLoading}
        >
          {chartData?.trend && chartData.trend.length > 0 ? (
            <LineChart
              data={chartData.trend}
              xAxisKey="evaluation_year"
              dataKeys={['total_full_time', 'total_visiting']}
              colors={['#3b82f6', '#f97316']}
            />
          ) : (
            <EmptyState title="데이터가 없습니다" />
          )}
        </ChartWrapper>

          {/* Data Table */}
          <ChartWrapper title="교원 현황 상세" isLoading={isLoading}>
            {tableData && tableData.length > 0 ? (
              <DataTable
                columns={tableColumns}
                data={tableData}
                onSort={(columnId, direction) => {
                  // 정렬 로직 구현 (옵션)
                  console.log('Sort:', columnId, direction);
                }}
              />
            ) : (
              <EmptyState title="데이터가 없습니다" />
            )}
          </ChartWrapper>
        </div>

        {/* 필터 패널 (오른쪽 고정) */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6">
            <FacultyFilterSection
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function FacultyStatusPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex gap-6">
            <div className="flex-1 space-y-6">
              <Skeleton className="h-12 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
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
      <FacultyStatusContent />
    </Suspense>
  );
}
