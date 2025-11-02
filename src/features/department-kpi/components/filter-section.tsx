// src/features/department-kpi/components/filter-section.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { useFilterOptions } from '../hooks/use-filter-options';
import type { KPIFilters } from '../types';

type FilterSectionProps = {
  filters: KPIFilters;
  onFilterChange: (filters: Partial<KPIFilters>) => void;
  onReset: () => void;
};

export function FilterSection({
  filters,
  onFilterChange,
  onReset,
}: FilterSectionProps) {
  const { data: options, isLoading } = useFilterOptions(filters);

  return (
    <Card>
      <CardHeader>
        <CardTitle>필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 평가년도 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">평가년도</label>
            <MultiSelect
              options={options?.evaluation_years.map((year) => ({
                label: `${year}년`,
                value: String(year),
              })) ?? []}
              value={filters.evaluation_years?.map(String) ?? []}
              onChange={(values) =>
                onFilterChange({
                  evaluation_years: values.map(Number),
                })
              }
              placeholder="평가년도 선택"
              disabled={isLoading}
            />
          </div>

          {/* 단과대학 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">단과대학</label>
            <MultiSelect
              options={options?.college_names.map((name) => ({
                label: name,
                value: name,
              })) ?? []}
              value={filters.college_names ?? []}
              onChange={(values) =>
                onFilterChange({
                  college_names: values,
                  // 단과대학 변경 시 학과 필터 초기화
                  department_names: undefined,
                })
              }
              placeholder="단과대학 선택"
              disabled={isLoading}
            />
          </div>

          {/* 학과 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">학과</label>
            <MultiSelect
              options={options?.department_names.map((name) => ({
                label: name,
                value: name,
              })) ?? []}
              value={filters.department_names ?? []}
              onChange={(values) =>
                onFilterChange({
                  department_names: values,
                })
              }
              placeholder="학과 선택"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 초기화 버튼 */}
        <Button variant="outline" onClick={onReset} className="w-full">
          필터 초기화
        </Button>
      </CardContent>
    </Card>
  );
}
