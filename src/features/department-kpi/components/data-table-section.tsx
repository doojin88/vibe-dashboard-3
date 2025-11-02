// src/features/department-kpi/components/data-table-section.tsx
'use client';

import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import type { KPIMetric } from '../types';

type DataTableSectionProps = {
  metrics: KPIMetric[] | undefined;
  isLoading: boolean;
};

const columns: ColumnDef<KPIMetric>[] = [
  {
    id: 'evaluation_year',
    header: '평가년도',
    accessorKey: 'evaluation_year',
    sortable: true,
  },
  {
    id: 'college_name',
    header: '단과대학',
    accessorKey: 'college_name',
    sortable: true,
  },
  {
    id: 'department_name',
    header: '학과',
    accessorKey: 'department_name',
    sortable: true,
  },
  {
    id: 'employment_rate',
    header: '취업률 (%)',
    cell: (row) =>
      row.employment_rate !== null ? row.employment_rate.toFixed(1) : 'N/A',
    sortable: true,
  },
  {
    id: 'full_time_faculty',
    header: '전임교원 (명)',
    cell: (row) => row.full_time_faculty ?? 'N/A',
    sortable: true,
  },
  {
    id: 'visiting_faculty',
    header: '초빙교원 (명)',
    cell: (row) => row.visiting_faculty ?? 'N/A',
    sortable: true,
  },
  {
    id: 'tech_transfer_income',
    header: '기술이전 수입 (억원)',
    cell: (row) =>
      row.tech_transfer_income !== null
        ? row.tech_transfer_income.toFixed(1)
        : 'N/A',
    sortable: true,
  },
  {
    id: 'intl_conference_count',
    header: '국제학술대회 (회)',
    cell: (row) => row.intl_conference_count ?? 'N/A',
    sortable: true,
  },
];

export function DataTableSection({ metrics, isLoading }: DataTableSectionProps) {
  const [sortColumn, setSortColumn] = useState<string>('evaluation_year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = useMemo(() => {
    if (!metrics) return [];

    const sorted = [...metrics].sort((a, b) => {
      const aValue = a[sortColumn as keyof KPIMetric];
      const bValue = b[sortColumn as keyof KPIMetric];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [metrics, sortColumn, sortDirection]);

  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    setSortColumn(columnId);
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleDownload = () => {
    if (!metrics || metrics.length === 0) return;

    const headers = [
      '평가년도',
      '단과대학',
      '학과',
      '취업률 (%)',
      '전임교원 (명)',
      '초빙교원 (명)',
      '기술이전 수입 (억원)',
      '국제학술대회 (회)',
    ];

    const csvContent = [
      headers.join(','),
      ...metrics.map((row) =>
        [
          row.evaluation_year,
          row.college_name,
          row.department_name,
          row.employment_rate ?? '',
          row.full_time_faculty ?? '',
          row.visiting_faculty ?? '',
          row.tech_transfer_income ?? '',
          row.intl_conference_count ?? '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `department_kpi_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>KPI 메트릭 테이블</CardTitle>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          CSV 다운로드
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={sortedData}
          onSort={handleSort}
        />
      </CardContent>
    </Card>
  );
}
