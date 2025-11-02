'use client';

import { Users, DollarSign, FileText, LinkIcon } from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { formatBudget, formatNumber, formatPercentage } from '@/lib/utils/number';
import type { ResearchersAggregateResponse } from '../../backend/types';

type ResearchersKPICardsProps = {
  data: ResearchersAggregateResponse;
  isLoading: boolean;
};

export function ResearchersKPICards({ data, isLoading }: ResearchersKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <KPICard key={i} title="로딩 중..." value="--" icon={Users} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="총 연구자 수"
        value={formatNumber(data.total_researchers)}
        icon={Users}
        description="연구과제 수행 또는 논문 게재"
      />
      <KPICard
        title="총 연구비"
        value={formatBudget(data.total_budget)}
        icon={DollarSign}
        description={`평균 ${formatBudget(data.avg_budget_per_researcher)}/인`}
      />
      <KPICard
        title="총 논문 수"
        value={formatNumber(data.total_publications)}
        icon={FileText}
        description={`평균 ${formatNumber(data.avg_publications_per_researcher, 1)}/인`}
      />
      <KPICard
        title="과제연계 논문 비율"
        value={formatPercentage(data.overall_project_linked_ratio, 1)}
        icon={LinkIcon}
        description="전체 논문 중 과제 연계"
      />
    </div>
  );
}
