"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KPISummary, KPISummarySkeleton } from "./_components/kpi-summary";
import { TrendsSection } from "./_components/trends-section";
import { CollegesSection } from "./_components/colleges-section";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useDashboardOverview, useDashboardTrends, useDashboardColleges } from "@/hooks/api/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const router = useRouter();

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useDashboardOverview();
  const { data: trends, isLoading: trendsLoading, error: trendsError } = useDashboardTrends();
  const { data: colleges, isLoading: collegesLoading, error: collegesError } = useDashboardColleges();

  const isLoading = overviewLoading || trendsLoading || collegesLoading;
  const hasError = overviewError || trendsError || collegesError;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">메인 대시보드</h1>
          <p className="text-muted-foreground">전체 대학 핵심 지표 한눈에 파악</p>
        </div>

        {/* KPI 카드 섹션 */}
        {overviewLoading ? (
          <KPISummarySkeleton />
        ) : overviewError ? (
          <EmptyState
            title="KPI 데이터를 불러올 수 없습니다"
            description={overviewError.message}
          />
        ) : overview ? (
          <KPISummary data={overview.kpis} />
        ) : (
          <EmptyState title="KPI 데이터를 불러올 수 없습니다" />
        )}

        {/* 연도별 트렌드 */}
        {trendsLoading ? (
          <Card className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid gap-6 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[300px]" />
              ))}
            </div>
          </Card>
        ) : trendsError ? (
          <EmptyState
            title="트렌드 데이터를 불러올 수 없습니다"
            description={trendsError.message}
          />
        ) : trends ? (
          <TrendsSection data={trends} />
        ) : (
          <EmptyState title="트렌드 데이터를 불러올 수 없습니다" />
        )}

        {/* 단과대학별 성과 */}
        {collegesLoading ? (
          <Card className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid gap-6 lg:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-[300px]" />
              ))}
            </div>
          </Card>
        ) : collegesError ? (
          <EmptyState
            title="단과대학 데이터를 불러올 수 없습니다"
            description={collegesError.message}
          />
        ) : colleges ? (
          <CollegesSection data={colleges} />
        ) : (
          <EmptyState
            title="단과대학 데이터를 불러올 수 없습니다"
            action={{
              label: "데이터 업로드",
              onClick: () => router.push("/data/upload")
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
