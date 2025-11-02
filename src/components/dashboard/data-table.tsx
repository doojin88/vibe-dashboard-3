'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

export type ColumnDef<TData> = {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  cell?: (row: TData) => React.ReactNode;
  sortable?: boolean;
};

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
};

export function DataTable<TData>({
  columns,
  data,
  onSort,
}: DataTableProps<TData>) {
  const handleSort = (columnId: string) => {
    if (onSort) {
      // 간단한 구현: 항상 토글
      onSort(columnId, 'asc');
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id}>
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.id)}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {column.cell
                      ? column.cell(row)
                      : column.accessorKey
                      ? String(row[column.accessorKey])
                      : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
