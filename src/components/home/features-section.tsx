'use client';

import Link from 'next/link';
import { LayoutDashboard, Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: LayoutDashboard,
    title: '대시보드 조회',
    description: '전체 대학 핵심 지표를 한눈에 파악하고, 학과별 성과를 비교할 수 있습니다.',
  },
  {
    icon: Upload,
    title: '데이터 업로드',
    description: 'CSV 파일을 업로드하여 데이터베이스에 적재하고 검증할 수 있습니다. (관리자 전용)',
  },
  {
    icon: FileText,
    title: '분석 리포트',
    description: '학과별 KPI, 논문 게재 현황, 연구비 집행 등 다양한 분석 리포트를 제공합니다.',
  },
];

export function FeaturesSection() {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        const isDashboard = feature.title === '대시보드 조회';
        
        const cardContent = (
          <Card className={isDashboard ? "border-slate-700 bg-slate-900/60 cursor-pointer transition-all hover:bg-slate-900/80 hover:border-slate-600" : "border-slate-700 bg-slate-900/60"}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
                <Icon className="h-6 w-6 text-slate-200" />
              </div>
              <CardTitle className="text-slate-100">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        );
        
        return (
          <div key={feature.title}>
            {isDashboard ? (
              <Link href="/dashboard" className="block">
                {cardContent}
              </Link>
            ) : (
              cardContent
            )}
          </div>
        );
      })}
    </section>
  );
}
