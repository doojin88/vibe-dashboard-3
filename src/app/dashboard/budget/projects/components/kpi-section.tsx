/**
 * KPISection 컴포넌트
 * 과제별 예산 상세 KPI 카드 섹션
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import { formatBudget, formatPercentage } from '@/lib/utils/number';

type KPISectionProps = {
  totalProjects: number;
  totalBudget: number;
  avgExecutionRate: number;
  isLoading?: boolean;
};

export function KPISection({
  totalProjects,
  totalBudget,
  avgExecutionRate,
  isLoading,
}: KPISectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 총 과제 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 과제 수</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProjects.toLocaleString()}건</div>
        </CardContent>
      </Card>

      {/* 총 연구비 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 연구비</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBudget(totalBudget)}</div>
        </CardContent>
      </Card>

      {/* 평균 집행률 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 집행률</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(avgExecutionRate)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
