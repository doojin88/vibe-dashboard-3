'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getYearOptions } from '@/lib/utils/date';
import type { ProjectFilters } from '@/features/research-projects/types';

type FilterPanelProps = {
  filters: ProjectFilters;
  onFilterChange: (filters: ProjectFilters) => void;
};

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<ProjectFilters>(filters);

  const yearOptions = getYearOptions(2020);

  const statusOptions = [
    { label: '전체', value: '' },
    { label: '집행완료', value: '집행완료' },
    { label: '처리중', value: '처리중' },
  ];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: ProjectFilters = {};
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">연도</label>
          <Select
            value={localFilters.year?.toString() || ''}
            onValueChange={(value) =>
              setLocalFilters({ ...localFilters, year: value ? Number(value) : undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {yearOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">진행 상태</label>
          <Select
            value={localFilters.status || ''}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                status: value ? (value as '집행완료' | '처리중') : undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApply} className="flex-1">
            적용
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex-1">
            초기화
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
