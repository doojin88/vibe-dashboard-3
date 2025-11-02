'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICard } from '@/components/dashboard/kpi-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Award, TrendingUp } from 'lucide-react';

export default function ResearchProjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">연구과제 관리</h1>
          <p className="text-muted-foreground">연구과제 현황 및 예산 집행 관리</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="진행 중인 과제" value={0} icon={BookOpen} description="현재 진행 중" />
          <KPICard title="총 예산" value={0} icon={Award} description="전체 연구비" />
          <KPICard title="참여 연구자" value={0} icon={FileText} description="총 연구자 수" />
          <KPICard title="평균 연구비" value="0.00" icon={TrendingUp} description="과제당 평균" />
        </div>

        <Card>
          <CardHeader><CardTitle>연구과제 목록</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              title="연구과제 데이터를 준비 중입니다"
              description="곧 실제 데이터로 업데이트될 예정입니다"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
