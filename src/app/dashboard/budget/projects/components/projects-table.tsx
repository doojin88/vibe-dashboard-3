/**
 * ProjectsTable 컴포넌트
 * 과제 목록 테이블 (확장 가능한 행)
 */

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
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { ExecutionRateBar } from './execution-rate-bar';
import { ExecutionDetailsPanel } from './execution-details-panel';
import { formatBudget } from '@/lib/utils/number';
import { downloadCSV } from '@/lib/utils/download';
import type { ProjectWithBudgetInfo } from '../types';

type ProjectsTableProps = {
  projects: ProjectWithBudgetInfo[];
  isLoading: boolean;
  pagination: { page: number; limit: number };
  onPaginationChange: (pagination: { page: number; limit: number }) => void;
};

export function ProjectsTable({
  projects,
  isLoading,
  pagination,
  onPaginationChange,
}: ProjectsTableProps) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const handleRowClick = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const handleDownloadCSV = () => {
    const csvData = projects.map((project) => ({
      과제번호: project.project_number,
      과제명: project.project_name,
      연구책임자: project.principal_investigator,
      단과대학: project.department?.college_name ?? '-',
      학과: project.department?.department_name ?? '-',
      지원기관: project.funding_agency,
      총연구비: project.total_budget,
      집행금액: project.executed_amount,
      집행률: project.execution_rate,
      상태: project.status,
    }));

    downloadCSV(csvData, `과제별예산상세_${new Date().toISOString().split('T')[0]}`);
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          과제 목록 (총 {projects.length}건)
        </h2>
        <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
          <Download className="h-4 w-4 mr-2" />
          CSV 다운로드
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>과제번호</TableHead>
              <TableHead>과제명</TableHead>
              <TableHead>연구책임자</TableHead>
              <TableHead>소속학과</TableHead>
              <TableHead>지원기관</TableHead>
              <TableHead className="text-right">총연구비</TableHead>
              <TableHead className="text-right">집행금액</TableHead>
              <TableHead className="w-[200px]">집행률</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <>
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(project.id)}
                >
                  <TableCell>
                    {expandedProjectId === project.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {project.project_number}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {project.project_name}
                  </TableCell>
                  <TableCell>{project.principal_investigator}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.department?.college_name ?? '-'} /{' '}
                    {project.department?.department_name ?? '-'}
                  </TableCell>
                  <TableCell>{project.funding_agency}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatBudget(project.total_budget)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatBudget(project.executed_amount)}
                  </TableCell>
                  <TableCell>
                    <ExecutionRateBar rate={project.execution_rate} />
                  </TableCell>
                </TableRow>
                {expandedProjectId === project.id && (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <ExecutionDetailsPanel projectId={project.id} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4">
        <Button
          variant="outline"
          onClick={() =>
            onPaginationChange({
              ...pagination,
              page: pagination.page - 1,
            })
          }
          disabled={pagination.page === 1}
        >
          이전
        </Button>
        <span className="text-sm">
          페이지 {pagination.page}
        </span>
        <Button
          variant="outline"
          onClick={() =>
            onPaginationChange({
              ...pagination,
              page: pagination.page + 1,
            })
          }
          disabled={projects.length < pagination.limit}
        >
          다음
        </Button>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>과제번호</TableHead>
              <TableHead>과제명</TableHead>
              <TableHead>연구책임자</TableHead>
              <TableHead>소속학과</TableHead>
              <TableHead>지원기관</TableHead>
              <TableHead className="text-right">총연구비</TableHead>
              <TableHead className="text-right">집행금액</TableHead>
              <TableHead className="w-[200px]">집행률</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-2 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-semibold">검색 결과가 없습니다</p>
      <p className="text-sm text-muted-foreground mt-2">
        필터 조건을 변경하거나 초기화해주세요.
      </p>
    </div>
  );
}
