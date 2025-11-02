'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import { GraduationCap, FileText, Wallet, Users } from 'lucide-react';
import { formatPercentage, formatNumber, formatBudget } from '@/lib/utils/number';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardOverviewKPIs } from '@/hooks/api/useDashboard';

type KPISummaryProps = {
  data: DashboardOverviewKPIs;
};

export function KPISummary({ data }: KPISummaryProps) {
  const { employmentRate, publicationCount, researchBudget, studentCount } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="평균 취업률"
        value={formatPercentage(employmentRate.value)}
        icon={GraduationCap}
        description="전체 학과 평균"
        trend={
          employmentRate.change !== 0
            ? {
                value: Math.abs(employmentRate.change),
                isPositive: employmentRate.change > 0,
              }
            : undefined
        }
      />

      <KPICard
        title="총 논문 게재 수"
        value={`${formatNumber(publicationCount.value)}편`}
        icon={FileText}
        description={`SCIE ${formatNumber(publicationCount.scie)}편, KCI ${formatNumber(publicationCount.kci)}편`}
      />

      <KPICard
        title="총 연구비"
        value={formatBudget(researchBudget.value)}
        icon={Wallet}
        description="전체 연구과제 합계"
        trend={
          researchBudget.change !== 0
            ? {
                value: Math.abs(researchBudget.change / 100000000), // 억 단위
                isPositive: researchBudget.change > 0,
              }
            : undefined
        }
      />

      <KPICard
        title="재학생 수"
        value={`${formatNumber(studentCount.value)}명`}
        icon={Users}
        description={`학사 ${formatNumber(studentCount.undergraduate)} / 석사 ${formatNumber(studentCount.master)} / 박사 ${formatNumber(studentCount.doctorate)}`}
      />
    </div>
  );
}

export function KPISummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
