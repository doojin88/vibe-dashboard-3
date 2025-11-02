'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatBudget } from '@/lib/utils/number';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { BudgetExecutionResponse } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ExecutionTableProps = {
  executions: BudgetExecutionResponse['executions'];
  pagination: BudgetExecutionResponse['pagination'];
  onPageChange: (page: number) => void;
};

export function ExecutionTable({
  executions,
  pagination,
  onPageChange,
}: ExecutionTableProps) {
  if (executions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>집행 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const currentPage = pagination.page;

  return (
    <Card>
      <CardHeader>
        <CardTitle>집행 내역</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>집행일자</TableHead>
              <TableHead>과제번호</TableHead>
              <TableHead>과제명</TableHead>
              <TableHead>학과</TableHead>
              <TableHead>집행항목</TableHead>
              <TableHead className="text-right">집행금액</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((execution) => (
              <TableRow key={execution.id}>
                <TableCell>
                  {format(new Date(execution.execution_date), 'yyyy-MM-dd', {
                    locale: ko,
                  })}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {execution.project.project_number}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {execution.project.project_name}
                </TableCell>
                <TableCell>
                  {execution.department.department_name}
                </TableCell>
                <TableCell>{execution.execution_item}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatBudget(execution.execution_amount)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      execution.status === '집행완료'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}
                  >
                    {execution.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              전체 {pagination.total}건 중{' '}
              {(currentPage - 1) * pagination.pageSize + 1}-
              {Math.min(currentPage * pagination.pageSize, pagination.total)}
              건 표시
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </Button>
              <div className="text-sm">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

