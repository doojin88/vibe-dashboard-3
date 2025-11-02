'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICard } from '@/components/dashboard/kpi-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Award, TrendingUp } from 'lucide-react';

export default function PublicationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">논문 게재 현황</h1>
          <p className="text-muted-foreground">학과별 논문 게재 실적 및 저널 등급 분석</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="총 논문 수" value={0} icon={BookOpen} description="전체 게재 논문" />
          <KPICard title="SCIE 논문" value={0} icon={Award} description="SCIE 등급 논문" />
          <KPICard title="KCI 논문" value={0} icon={FileText} description="KCI 등급 논문" />
          <KPICard title="평균 Impact Factor" value="0.00" icon={TrendingUp} description="Impact Factor 평균" />
        </div>

        <Card>
          <CardHeader><CardTitle>논문 목록</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              title="논문 데이터를 준비 중입니다"
              description="곧 실제 데이터로 업데이트될 예정입니다"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
