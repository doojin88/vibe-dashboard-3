import { KPICard } from '@/components/dashboard/kpi-card';
import { FolderKanban, DollarSign, TrendingUp } from 'lucide-react';
import { formatNumber, formatBudget, formatPercentage } from '@/lib/utils/number';
import type { ProjectAggregate } from '@/features/research-projects/types';

type KPISummaryCardsProps = {
  aggregate?: ProjectAggregate;
  isLoading: boolean;
};

export function KPISummaryCards({ aggregate, isLoading }: KPISummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KPICard
        title="총 과제 수"
        value={formatNumber(aggregate?.total_projects || 0)}
        icon={FolderKanban}
        description="전체 연구과제 수"
      />
      <KPICard
        title="총 연구비"
        value={formatBudget(aggregate?.total_budget || 0)}
        icon={DollarSign}
        description="총 연구비 수주액"
      />
      <KPICard
        title="집행률"
        value={formatPercentage(aggregate?.execution_rate || 0)}
        icon={TrendingUp}
        description="예산 대비 집행 비율"
      />
    </div>
  );
}
