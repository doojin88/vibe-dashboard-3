// src/features/budget/components/budget-filters.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { BudgetFilters as BudgetFiltersType } from '../types';

type BudgetFiltersProps = {
  filters: BudgetFiltersType;
  onFiltersChange: (filters: BudgetFiltersType) => void;
};

export function BudgetFilters({ filters, onFiltersChange }: BudgetFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const executionItems = ['인건비', '장비비', '재료비', '여비', '기타'];
  const statuses = [
    { value: 'all', label: '전체' },
    { value: '집행완료', label: '집행완료' },
    { value: '처리중', label: '처리중' },
  ];

  const handleReset = () => {
    onFiltersChange({
      year: currentYear,
      status: 'all',
      page: 1,
      pageSize: 50,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {/* 연도 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">집행 연도</label>
            <Select
              value={filters.year?.toString()}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, year: parseInt(value), page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 집행항목 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">집행항목</label>
            <Select
              value={filters.executionItem || ''}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  executionItem: value || undefined,
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {executionItems.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상태 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">상태</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value as BudgetFiltersType['status'],
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 초기화 버튼 */}
          <div className="flex items-end">
            <Button variant="outline" onClick={handleReset} className="w-full">
              초기화
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
