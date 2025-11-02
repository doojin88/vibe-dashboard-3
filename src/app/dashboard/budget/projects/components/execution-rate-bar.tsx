/**
 * ExecutionRateBar 컴포넌트
 * 집행률 진행바 (색상 코딩)
 */

'use client';

import { cn } from '@/lib/utils';
import { formatPercentage } from '@/lib/utils/number';

type ExecutionRateBarProps = {
  rate: number;
  className?: string;
};

export function ExecutionRateBar({ rate, className }: ExecutionRateBarProps) {
  // 색상 결정: 0-30% Red, 31-70% Yellow, 71-100% Green
  const getColor = (rate: number) => {
    if (rate <= 30) return 'bg-red-500';
    if (rate <= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = (rate: number) => {
    if (rate <= 30) return 'text-red-600';
    if (rate <= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-medium', getTextColor(rate))}>
          {formatPercentage(rate, 1)}
        </span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', getColor(rate))}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}
