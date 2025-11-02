'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICard } from '@/components/dashboard/kpi-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, UserCheck, TrendingUp } from 'lucide-react';

export default function StudentEnrollmentPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">학생 재학 현황</h1>
          <p className="text-muted-foreground">학과별 재학생 현황 및 추이 분석</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="총 재학생" value={0} icon={GraduationCap} description="전체 재학생 수" />
          <KPICard title="학사" value={0} icon={Users} description="학사 과정" />
          <KPICard title="대학원" value={0} icon={UserCheck} description="석박사 과정" />
          <KPICard title="재학률" value="0%" icon={TrendingUp} description="재학 비율" />
        </div>

        <Card>
          <CardHeader><CardTitle>재학생 목록</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              title="재학생 데이터를 준비 중입니다"
              description="곧 실제 데이터로 업데이트될 예정입니다"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
