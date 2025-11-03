// src/app/dashboard/department/kpi/page.tsx
'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FilterSection } from '@/features/department-kpi/components/filter-section';
import { SummarySection } from '@/features/department-kpi/components/summary-section';
import { ChartsSection } from '@/features/department-kpi/components/charts-section';
import { DataTableSection } from '@/features/department-kpi/components/data-table-section';
import { useKPIFilters } from '@/features/department-kpi/hooks/use-kpi-filters';
import { useKPIMetrics } from '@/features/department-kpi/hooks/use-kpi-metrics';
import { useKPISummary } from '@/features/department-kpi/hooks/use-kpi-summary';
import { Skeleton } from '@/components/ui/skeleton';

function DepartmentKPIContent() {
  const { filters, updateFilters, resetFilters } = useKPIFilters();
  const { data: metrics, isLoading: metricsLoading } = useKPIMetrics(filters);
  const { data: summary, isLoading: summaryLoading } = useKPISummary(filters);

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        {/* 메인 콘텐츠 영역 (왼쪽) */}
        <div className="flex-1 space-y-6">
          {/* 페이지 헤더 */}
          <div>
            <h1 className="text-3xl font-bold">학과별 KPI 대시보드</h1>
            <p className="text-muted-foreground mt-2">
              학과별 상세 KPI 분석 및 비교
            </p>
          </div>

          {/* KPI 요약 섹션 */}
          <SummarySection summary={summary} isLoading={summaryLoading} />

          {/* 차트 섹션 */}
          <ChartsSection metrics={metrics} isLoading={metricsLoading} />

          {/* 데이터 테이블 섹션 */}
          <DataTableSection metrics={metrics} isLoading={metricsLoading} />
        </div>

        {/* 필터 패널 (오른쪽 고정) */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6">
            <FilterSection
              filters={filters}
              onFilterChange={updateFilters}
              onReset={resetFilters}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DepartmentKPIPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex gap-6">
            <div className="flex-1 space-y-6">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="w-80">
              <Skeleton className="h-96" />
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <DepartmentKPIContent />
    </Suspense>
  );
}
