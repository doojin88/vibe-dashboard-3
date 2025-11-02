'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from 'lucide-react';

export default function DataBrowsePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">데이터 조회</h1>
          <p className="text-muted-foreground">데이터베이스에 저장된 원본 데이터 조회</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              테이블 선택
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="조회할 테이블 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kpi_metrics">학과 KPI</SelectItem>
                <SelectItem value="publications">논문 게재</SelectItem>
                <SelectItem value="research_projects">연구과제</SelectItem>
                <SelectItem value="students">학생 명단</SelectItem>
                <SelectItem value="departments">학과 정보</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>데이터 조회 결과</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              title="테이블을 선택해주세요"
              description="위에서 조회할 테이블을 선택하면 데이터가 표시됩니다"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
