// src/features/department-kpi/components/summary-section.tsx
'use client';

import { Building2, TrendingUp, Users, DollarSign } from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { KPISummary } from '../types';

type SummarySectionProps = {
  summary: KPISummary | undefined;
  isLoading: boolean;
};

export function SummarySection({ summary, isLoading }: SummarySectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="선택된 학과"
        value={`${summary?.department_count ?? 0}개`}
        icon={Building2}
        description="필터링된 학과 수"
      />
      <KPICard
        title="평균 취업률"
        value={
          summary?.avg_employment_rate !== null && summary?.avg_employment_rate !== undefined
            ? `${summary.avg_employment_rate.toFixed(1)}%`
            : 'N/A'
        }
        icon={TrendingUp}
        description="선택된 학과 평균"
      />
      <KPICard
        title="평균 전임교원"
        value={
          summary?.avg_full_time_faculty !== null && summary?.avg_full_time_faculty !== undefined
            ? `${Math.round(summary.avg_full_time_faculty)}명`
            : 'N/A'
        }
        icon={Users}
        description="학과당 평균"
      />
      <KPICard
        title="총 기술이전 수입"
        value={
          summary?.total_tech_transfer_income !== null && summary?.total_tech_transfer_income !== undefined
            ? `${summary.total_tech_transfer_income.toFixed(1)}억원`
            : 'N/A'
        }
        icon={DollarSign}
        description="선택된 학과 합계"
      />
    </div>
  );
}
