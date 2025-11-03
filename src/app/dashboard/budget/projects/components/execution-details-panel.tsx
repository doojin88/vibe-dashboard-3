/**
 * ExecutionDetailsPanel 컴포넌트
 * 과제별 집행 내역 상세 패널 (확장 행)
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useExecutionDetails } from '../hooks/useExecutionDetails';
import { formatBudget } from '@/lib/utils/number';
import { formatDate } from '@/lib/utils/date';
import { downloadCSV } from '@/lib/utils/download';

type ExecutionDetailsPanelProps = {
  projectId: string;
};

export function ExecutionDetailsPanel({ projectId }: ExecutionDetailsPanelProps) {
  const { data, isLoading, error } = useExecutionDetails(projectId);

  if (isLoading) {
    return (
      <div className="p-6 bg-muted/20">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-muted/20 text-center">
        <p className="text-destructive">데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const handleDownloadCSV = () => {
    const csvData = data.executions.map((exec) => ({
      집행ID: exec.execution_id,
      집행일자: exec.execution_date,
      집행항목: exec.execution_item,
      집행금액: exec.execution_amount,
      상태: exec.status,
      비고: exec.notes ?? '',
    }));

    downloadCSV(
      csvData,
      `집행내역_${data.project.project_number}_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="p-6 bg-muted/20 space-y-6">
      {/* 과제 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>과제 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">과제번호</p>
            <p className="font-mono">{data.project.project_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">과제명</p>
            <p className="font-medium">{data.project.project_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">연구책임자</p>
            <p>{data.project.principal_investigator}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">소속학과</p>
            <p>
              {data.project.department?.college_name ?? '-'} /{' '}
              {data.project.department?.department_name ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">지원기관</p>
            <p>{data.project.funding_agency}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">총 연구비</p>
            <p className="font-bold text-lg">{formatBudget(data.project.total_budget)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">총 집행금액</p>
            <p className="font-bold text-lg text-primary">
              {formatBudget(data.summary.total_executed)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">집행률</p>
            <p className="font-bold text-lg">
              {((data.summary.total_executed / data.project.total_budget) * 100).toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 집행항목별 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>집행항목별 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.summary.by_item.map((item) => (
              <div key={item.item} className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{item.item}</p>
                <p className="font-bold text-lg">{formatBudget(item.amount)}</p>
                <p className="text-xs text-muted-foreground">{item.count}건</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 집행 내역 테이블 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>집행 내역 ({data.executions.length}건)</CardTitle>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV 다운로드
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>집행ID</TableHead>
                  <TableHead>집행일자</TableHead>
                  <TableHead>집행항목</TableHead>
                  <TableHead className="text-right">집행금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.executions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      집행 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.executions.map((exec) => (
                    <TableRow key={exec.id}>
                      <TableCell className="font-mono text-sm">
                        {exec.execution_id}
                      </TableCell>
                      <TableCell>{formatDate(exec.execution_date)}</TableCell>
                      <TableCell>{exec.execution_item}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatBudget(exec.execution_amount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            exec.status === '집행완료'
                              ? 'text-green-600 font-medium'
                              : 'text-yellow-600 font-medium'
                          }
                        >
                          {exec.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exec.notes ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
