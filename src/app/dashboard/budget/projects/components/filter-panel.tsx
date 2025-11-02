/**
 * FilterPanel 컴포넌트
 * 과제별 예산 상세 페이지 필터 패널
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { ProjectFilters } from '../types';
import { useFilterOptions } from '../hooks/useFilterOptions';

type FilterPanelProps = {
  filters: ProjectFilters;
  onFilterChange: (filters: ProjectFilters) => void;
};

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const { data: filterOptions, isLoading } = useFilterOptions();

  const handleReset = () => {
    onFilterChange({});
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>필터</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 연도 선택 */}
        <div className="space-y-2">
          <Label>연도</Label>
          <Select
            value={filters.year?.toString() ?? ''}
            onValueChange={(value) =>
              onFilterChange({ ...filters, year: value ? Number(value) : undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {filterOptions?.years.map((year: number) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 학과 선택 */}
        <div className="space-y-2">
          <Label>학과</Label>
          <Select
            value={filters.department_id ?? ''}
            onValueChange={(value) =>
              onFilterChange({ ...filters, department_id: value || undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {filterOptions?.departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.college_name} / {dept.department_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 지원기관 선택 */}
        <div className="space-y-2">
          <Label>지원기관</Label>
          <Select
            value={filters.funding_agency ?? ''}
            onValueChange={(value) =>
              onFilterChange({ ...filters, funding_agency: value || undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {filterOptions?.funding_agencies.map((agency: string) => (
                <SelectItem key={agency} value={agency}>
                  {agency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 과제명 검색 */}
        <div className="space-y-2">
          <Label>과제명 검색</Label>
          <Input
            placeholder="과제명 입력"
            value={filters.search ?? ''}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value || undefined })
            }
          />
        </div>

        {/* 연구책임자 검색 */}
        <div className="space-y-2">
          <Label>연구책임자</Label>
          <Input
            placeholder="이름 입력"
            value={filters.principal_investigator ?? ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                principal_investigator: e.target.value || undefined,
              })
            }
          />
        </div>

        {/* 집행 상태 */}
        <div className="space-y-2">
          <Label>집행 상태</Label>
          <RadioGroup
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                status: value === 'all' ? undefined : (value as '집행완료' | '처리중'),
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">전체</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="집행완료" id="completed" />
              <Label htmlFor="completed">집행완료</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="처리중" id="processing" />
              <Label htmlFor="processing">처리중</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 초기화 버튼 */}
        <div className="flex items-end">
          <Button variant="outline" onClick={handleReset} className="w-full">
            필터 초기화
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
