'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

type EmploymentDataTableProps = {
  data: EmploymentData[];
  isLoading?: boolean;
  onDownloadCSV: () => void;
};

type SortConfig = {
  key: keyof EmploymentData;
  direction: 'asc' | 'desc';
};

export function EmploymentDataTable({ data, isLoading, onDownloadCSV }: EmploymentDataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'evaluation_year',
    direction: 'desc',
  });

  const handleSort = (key: keyof EmploymentData) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">취업률 상세 데이터</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            데이터를 불러오는 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">취업률 상세 데이터</h3>
          <Button onClick={onDownloadCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV 다운로드
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            데이터가 없습니다
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('evaluation_year')}
                      className="hover:bg-transparent"
                    >
                      평가년도
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('college_name')}
                      className="hover:bg-transparent"
                    >
                      단과대학
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('department_name')}
                      className="hover:bg-transparent"
                    >
                      학과
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('employment_rate')}
                      className="hover:bg-transparent"
                    >
                      취업률
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('achievement_rate')}
                      className="hover:bg-transparent"
                    >
                      목표 달성률
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">전년 대비</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.evaluation_year}</TableCell>
                    <TableCell>{row.college_name}</TableCell>
                    <TableCell>{row.department_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {row.employment_rate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={getAchievementColor(row.achievement_rate)}>
                        {row.achievement_rate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.year_over_year_change !== null ? (
                        <span
                          className={cn(
                            'font-medium',
                            row.year_over_year_change >= 0 ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {row.year_over_year_change > 0 ? '+' : ''}
                          {row.year_over_year_change.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getAchievementColor(rate: number): string {
  if (rate >= 100) return 'text-green-600 font-semibold';
  if (rate >= 70) return 'text-yellow-600';
  return 'text-red-600';
}
