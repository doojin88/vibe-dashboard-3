'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type FilterValue = string | number | null;

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterConfig = {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
};

type FilterPanelProps = {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, FilterValue>) => void;
  onReset?: () => void;
};

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
}: FilterPanelProps) {
  const [values, setValues] = useState<Record<string, FilterValue>>(() => {
    return filters.reduce((acc, filter) => {
      acc[filter.key] = filter.defaultValue ?? null;
      return acc;
    }, {} as Record<string, FilterValue>);
  });

  const handleChange = (key: string, value: string) => {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);
    onFilterChange(nextValues);
  };

  const handleReset = () => {
    const resetValues = filters.reduce((acc, filter) => {
      acc[filter.key] = filter.defaultValue ?? null;
      return acc;
    }, {} as Record<string, FilterValue>);

    setValues(resetValues);
    onFilterChange(resetValues);
    onReset?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <Select
              value={values[filter.key] as string}
              onValueChange={(value) => handleChange(filter.key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`${filter.label} 선택`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button variant="outline" onClick={handleReset} className="w-full">
          초기화
        </Button>
      </CardContent>
    </Card>
  );
}
