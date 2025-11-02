'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICard } from '@/components/dashboard/kpi-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Users, Award, TrendingUp } from 'lucide-react';

export default function StudentAdvisorsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">지도교수별 현황</h1>
          <p className="text-muted-foreground">지도교수별 학생 현황 및 분석</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="총 지도교수" value={0} icon={UserCircle} description="전체 지도교수" />
          <KPICard title="총 학생" value={0} icon={Users} description="지도받는 학생" />
          <KPICard title="평균 지도학생" value="0명" icon={Award} description="교수당 평균" />
          <KPICard title="최대 지도학생" value="0명" icon={TrendingUp} description="최대값" />
        </div>

        <Card>
          <CardHeader><CardTitle>지도교수 목록</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              title="지도교수 데이터를 준비 중입니다"
              description="곧 실제 데이터로 업데이트될 예정입니다"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
