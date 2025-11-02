/**
 * 과제별 예산 상세 페이지
 * /dashboard/budget/projects
 */

'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FilterPanel } from './components/filter-panel';
import { KPISection } from './components/kpi-section';
import { ProjectsTable } from './components/projects-table';
import { useProjectsData } from './hooks/useProjectsData';
import type { ProjectFilters } from './types';

export default function BudgetProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });

  const { data, isLoading, error } = useProjectsData(filters, pagination);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold">과제별 예산 상세</h1>
          <p className="text-muted-foreground mt-2">
            연구과제별 예산 집행 내역을 상세하게 확인하세요.
          </p>
        </div>

        {/* 필터 패널 */}
        <FilterPanel filters={filters} onFilterChange={setFilters} />

        {/* KPI 섹션 */}
        <KPISection
          totalProjects={data?.total_count ?? 0}
          totalBudget={data?.total_budget ?? 0}
          avgExecutionRate={data?.avg_execution_rate ?? 0}
          isLoading={isLoading}
        />

        {/* 에러 상태 */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-center">
            <p className="text-destructive font-medium">
              데이터를 불러오는 중 오류가 발생했습니다.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : '알 수 없는 오류'}
            </p>
          </div>
        )}

        {/* 과제 목록 테이블 */}
        <ProjectsTable
          projects={data?.projects ?? []}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </div>
    </DashboardLayout>
  );
}
