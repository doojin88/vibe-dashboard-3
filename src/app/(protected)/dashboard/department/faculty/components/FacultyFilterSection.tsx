'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { useFacultyFilters } from '@/hooks/api/useFacultyData';

type FacultyFilters = {
  evaluation_years?: number[];
  college_names?: string[];
  department_names?: string[];
};

type FacultyFilterSectionProps = {
  filters: FacultyFilters;
  onFilterChange: (filters: Partial<FacultyFilters>) => void;
  onReset: () => void;
};

export function FacultyFilterSection({
  filters,
  onFilterChange,
  onReset,
}: FacultyFilterSectionProps) {
  const { data: options, isLoading } = useFacultyFilters();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 평가년도 필터 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">평가년도</label>
          <MultiSelect
            options={options?.years.map((year) => ({
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
            options={options?.colleges.map((college) => ({
              label: college,
              value: college,
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
            options={options?.departments.map((dept) => ({
              label: dept.department_name,
              value: dept.department_name,
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

        {/* 초기화 버튼 */}
        <Button variant="outline" onClick={onReset} className="w-full">
          필터 초기화
        </Button>
      </CardContent>
    </Card>
  );
}

