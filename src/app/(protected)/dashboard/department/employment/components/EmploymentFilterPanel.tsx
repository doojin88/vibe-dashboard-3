'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type FilterState = {
  evaluation_years: number[];
  college_names: string[];
  department_names: string[];
};

type EmploymentFilterPanelProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

export function EmploymentFilterPanel({ filters, onChange }: EmploymentFilterPanelProps) {
  // 필터 옵션 조회
  const { data: filterOptions } = useQuery<{
    years: number[];
    colleges: string[];
    departments: string[];
  }>({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const response = await fetch('/api/kpi-metrics/filter-options');
      if (!response.ok) throw new Error('Failed to fetch filter options');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10분
  });

  const currentYear = filters.evaluation_years[0] || new Date().getFullYear() - 1;
  const currentCollege = filters.college_names[0] || '';
  const currentDepartment = filters.department_names[0] || '';

  const handleYearChange = (value: string) => {
    onChange({
      ...filters,
      evaluation_years: [Number(value)],
    });
  };

  const handleCollegeChange = (value: string) => {
    onChange({
      ...filters,
      college_names: value ? [value] : [],
      department_names: [], // 단과대학 변경 시 학과 초기화
    });
  };

  const handleDepartmentChange = (value: string) => {
    onChange({
      ...filters,
      department_names: value ? [value] : [],
    });
  };

  const handleReset = () => {
    onChange({
      evaluation_years: [new Date().getFullYear() - 1],
      college_names: [],
      department_names: [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 평가년도 */}
        <div className="space-y-2">
          <Label htmlFor="year-select">평가년도</Label>
          <Select value={String(currentYear)} onValueChange={handleYearChange}>
            <SelectTrigger id="year-select">
              <SelectValue placeholder="평가년도 선택" />
            </SelectTrigger>
            <SelectContent>
              {(filterOptions?.years || []).map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 단과대학 */}
        <div className="space-y-2">
          <Label htmlFor="college-select">단과대학</Label>
          <Select value={currentCollege} onValueChange={handleCollegeChange}>
            <SelectTrigger id="college-select">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {(filterOptions?.colleges || []).map((college) => (
                <SelectItem key={college} value={college}>
                  {college}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 학과 */}
        <div className="space-y-2">
          <Label htmlFor="dept-select">학과</Label>
          <Select
            value={currentDepartment}
            onValueChange={handleDepartmentChange}
            disabled={!currentCollege}
          >
            <SelectTrigger id="dept-select">
              <SelectValue placeholder={currentCollege ? '전체' : '단과대학을 먼저 선택하세요'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {(filterOptions?.departments || [])
                .filter((dept) => !currentCollege || true) // 실제로는 단과대학별 필터링 필요
                .map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleReset} className="w-full">
          필터 초기화
        </Button>
      </CardContent>
    </Card>
  );
}
