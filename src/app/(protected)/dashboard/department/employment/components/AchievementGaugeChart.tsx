'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type EmploymentData = {
  id: string;
  evaluation_year: number;
  college_name: string;
  department_name: string;
  employment_rate: number;
  achievement_rate: number;
  year_over_year_change: number | null;
};

type AchievementGaugeChartProps = {
  data: EmploymentData[];
  isLoading?: boolean;
};

const TARGET_RATE = 70; // 목표 취업률 70%

export function AchievementGaugeChart({ data, isLoading }: AchievementGaugeChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>목표 대비 달성률 (목표: 70%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>목표 대비 달성률 (목표: 70%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 달성률 계산
  const achievements = data.map((item) => ({
    department_name: item.department_name,
    employment_rate: item.employment_rate,
    achievement_rate: item.achievement_rate,
    status: getAchievementStatus(item.employment_rate),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>목표 대비 달성률 (목표: 70%)</CardTitle>
        <p className="text-sm text-muted-foreground">학과별 취업률 목표 달성 현황</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.slice(0, 9).map((item) => (
            <Card key={item.department_name} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.department_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>취업률</span>
                    <span className="font-semibold">{item.employment_rate.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={Math.min(item.achievement_rate, 100)}
                    className={cn('h-2', getProgressColor(item.status))}
                  />
                  <p className="text-xs text-muted-foreground">
                    달성률: {item.achievement_rate.toFixed(0)}%
                  </p>
                  <div className={cn('text-xs font-medium', getStatusTextColor(item.status))}>
                    {item.status === 'success' && '✓ 목표 달성'}
                    {item.status === 'warning' && '! 목표 근접'}
                    {item.status === 'danger' && '✗ 목표 미달'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getAchievementStatus(rate: number): 'success' | 'warning' | 'danger' {
  if (rate >= TARGET_RATE) return 'success';
  if (rate >= TARGET_RATE * 0.7) return 'warning';
  return 'danger';
}

function getProgressColor(status: 'success' | 'warning' | 'danger'): string {
  switch (status) {
    case 'success':
      return '[&>div]:bg-green-500';
    case 'warning':
      return '[&>div]:bg-yellow-500';
    case 'danger':
      return '[&>div]:bg-red-500';
  }
}

function getStatusTextColor(status: 'success' | 'warning' | 'danger'): string {
  switch (status) {
    case 'success':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'danger':
      return 'text-red-600';
  }
}
