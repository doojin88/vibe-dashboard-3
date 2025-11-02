'use client';

import { DataTable, type ColumnDef } from '@/components/dashboard/data-table';
import { formatBudget, formatNumber, formatPercentage } from '@/lib/utils/number';
import { Badge } from '@/components/ui/badge';
import type { ResearcherPerformance } from '../../backend/types';

type ResearchersTableProps = {
  researchers: ResearcherPerformance[];
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
};

export function ResearchersTable({ researchers, onSort }: ResearchersTableProps) {
  const columns: ColumnDef<ResearcherPerformance>[] = [
    {
      id: 'researcher_name',
      header: '연구자명',
      accessorKey: 'researcher_name',
      sortable: true,
    },
    {
      id: 'department_name',
      header: '소속 학과',
      accessorKey: 'department_name',
    },
    {
      id: 'total_budget',
      header: '총 연구비',
      sortable: true,
      cell: (row) => formatBudget(row.total_budget),
    },
    {
      id: 'project_count',
      header: '과제 수',
      sortable: true,
      cell: (row) => `${formatNumber(row.project_count)}건`,
    },
    {
      id: 'publication_count',
      header: '논문 수',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span>{formatNumber(row.publication_count)}편</span>
          {row.scie_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              SCIE {row.scie_count}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'project_linked_ratio',
      header: '과제연계 비율',
      sortable: true,
      cell: (row) => {
        const ratio = row.project_linked_ratio;
        const colorClass = ratio >= 50 ? 'text-green-600' : ratio >= 30 ? 'text-yellow-600' : 'text-red-600';
        return <span className={colorClass}>{formatPercentage(ratio, 1)}</span>;
      },
    },
    {
      id: 'avg_impact_factor',
      header: '평균 IF',
      cell: (row) => (row.avg_impact_factor ? formatNumber(row.avg_impact_factor, 2) : 'N/A'),
    },
  ];

  return <DataTable columns={columns} data={researchers} onSort={onSort} />;
}
