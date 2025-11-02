'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICard } from '@/components/dashboard/kpi-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Award, BookOpen, TrendingUp } from 'lucide-react';

export default function ResearchersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">연구자 성과</h1>
          <p className="text-muted-foreground">연구자별 논문 및 과제 성과 분석</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="총 연구자" value={0} icon={Users} description="전체 연구자 수" />
          <KPICard title="논문 발표" value={0} icon={BookOpen} description="총 논문 수" />
          <KPICard title="연구과제" value={0} icon={Award} description="총 과제 수" />
          <KPICard title="평균 성과" value="0" icon={TrendingUp} description="연구자당 평균" />
        </div>

        <Card>
          <CardHeader><CardTitle>연구자 목록</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              title="연구자 데이터를 준비 중입니다"
              description="곧 실제 데이터로 업데이트될 예정입니다"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
