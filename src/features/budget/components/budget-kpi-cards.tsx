// src/features/budget/components/budget-kpi-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatBudget, formatPercentage } from '@/lib/utils/number';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Clock } from 'lucide-react';
import type { BudgetKPI } from '../types';

type BudgetKPICardsProps = {
  kpi: BudgetKPI;
};

export function BudgetKPICards({ kpi }: BudgetKPICardsProps) {
  const getExecutionRateColor = (rate: number) => {
    if (rate >= 100) return 'text-red-600';
    if (rate >= 95) return 'text-yellow-600';
    if (rate >= 90) return 'text-green-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* 총 집행금액 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 집행금액</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBudget(kpi.totalAmount)}</div>
          <p className="text-xs text-muted-foreground">집행완료 건</p>
        </CardContent>
      </Card>

      {/* 평균 집행률 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 집행률</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getExecutionRateColor(kpi.executionRate)}`}>
            {formatPercentage(kpi.executionRate)}
          </div>
          <Progress value={Math.min(kpi.executionRate, 100)} className="mt-2" />
          {kpi.executionRate >= 100 && (
            <p className="text-xs text-red-600 mt-1">예산 초과</p>
          )}
          {kpi.executionRate >= 95 && kpi.executionRate < 100 && (
            <p className="text-xs text-yellow-600 mt-1">주의 필요</p>
          )}
        </CardContent>
      </Card>

      {/* 처리중 금액 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">처리중 금액</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBudget(kpi.processingAmount)}</div>
          <p className="text-xs text-muted-foreground">진행 중인 집행</p>
        </CardContent>
      </Card>

      {/* 전월 대비 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전월 대비</CardTitle>
          {kpi.monthlyChange > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              kpi.monthlyChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {kpi.monthlyChange > 0 ? '+' : ''}
            {formatPercentage(kpi.monthlyChange)}
          </div>
          <p className="text-xs text-muted-foreground">증감률</p>
        </CardContent>
      </Card>
    </div>
  );
}
