'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FilterPanel, type FilterValue } from '@/components/dashboard/filter-panel';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { StackedBarChart } from '@/components/charts/stacked-bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { LineChart } from '@/components/charts/line-chart';
import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useFacultyData, useFacultyFilters } from '@/hooks/api/useFacultyData';
import { Users, UserCheck, UserPlus, UsersRound } from 'lucide-react';

export default function FacultyStatusPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Record<string, FilterValue>>(() => {
    // URL 파라미터에서 초기값 복원
    const yearParam = searchParams.get('year');
    const collegeParam = searchParams.get('college');
    const deptParam = searchParams.get('dept');

    return {
      evaluation_year: yearParam ? yearParam.split(',').map(Number) : null,
      college_name: collegeParam ? collegeParam.split(',') : null,
      department_name: deptParam ? deptParam.split(',') : null,
    };
  });

  const { data: filtersData, isLoading: isFiltersLoading } = useFacultyFilters();
  const { data, isLoading, error } = useFacultyData(filters);

  // 필터 변경 시 URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.evaluation_year && Array.isArray(filters.evaluation_year)) {
      params.set('year', filters.evaluation_year.join(','));
    }
    if (filters.college_name && Array.isArray(filters.college_name)) {
      params.set('college', filters.college_name.join(','));
    }
    if (filters.department_name && Array.isArray(filters.department_name)) {
      params.set('dept', filters.department_name.join(','));
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  // 필터 설정
  const filterConfig = [
    {
      key: 'evaluation_year',
      label: '평가년도',
      options: (filtersData?.years || []).map((year) => ({
        label: `${year}년`,
        value: String(year),
      })),
    },
    {
      key: 'college_name',
      label: '단과대학',
      options: (filtersData?.colleges || []).map((college) => ({
        label: college,
        value: college,
      })),
    },
    {
      key: 'department_name',
      label: '학과',
      options: (filtersData?.departments || []).map((dept) => ({
        label: dept.department_name,
        value: dept.department_name,
      })),
    },
  ];

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
        <EmptyState
          title="데이터를 불러오는데 실패했습니다"
          description={error.message}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">교원 현황</h1>
          <p className="text-muted-foreground">
            학과별 전임/초빙 교원 현황 분석
          </p>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          filters={filterConfig}
          onFilterChange={setFilters}
          onReset={() => setFilters({})}
        />

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
              labels={['전임교원', '초빙교원']}
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
    </DashboardLayout>
  );
}
