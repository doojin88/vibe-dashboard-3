// src/features/budget/components/budget-execution-dashboard.tsx
'use client';

import { useState } from 'react';
import { useBudgetExecution } from '../hooks/useBudgetExecution';
import { BudgetFilters } from './budget-filters';
import { BudgetKPICards } from './budget-kpi-cards';
import { MonthlyTrendChart } from './monthly-trend-chart';
import { ItemBreakdownChart } from './item-breakdown-chart';
import { DepartmentBreakdownChart } from './department-breakdown-chart';
import { BudgetWarningsAlert } from './budget-warnings-alert';
import { ExecutionTable } from './execution-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { BudgetFilters as BudgetFiltersType } from '../types';

export function BudgetExecutionDashboard() {
  const [filters, setFilters] = useState<BudgetFiltersType>({
    year: new Date().getFullYear(),
    status: 'all',
    page: 1,
    pageSize: 50,
  });

  const { data, isLoading, isError, error } = useBudgetExecution(filters);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">예산 집행 현황</h1>
        <p className="text-muted-foreground">
          연구과제별 예산 집행 내역을 추적하고 분석합니다
        </p>
      </div>

      {/* 필터 섹션 */}
      <BudgetFilters filters={filters} onFiltersChange={setFilters} />

      {/* KPI 카드 */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data ? (
        <>
          <BudgetKPICards kpi={data.kpi} />

          {/* 예산 초과 경고 */}
          {data.budgetWarnings.length > 0 && (
            <BudgetWarningsAlert warnings={data.budgetWarnings} />
          )}

          {/* 차트 그리드 */}
          <div className="grid gap-6 md:grid-cols-2">
            <MonthlyTrendChart data={data.monthlyTrend} />
            <ItemBreakdownChart data={data.itemBreakdown} />
          </div>

          <DepartmentBreakdownChart data={data.departmentBreakdown} />

          {/* 집행 내역 테이블 */}
          <ExecutionTable
            executions={data.executions}
            pagination={data.pagination}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        </>
      ) : null}
    </div>
  );
}
