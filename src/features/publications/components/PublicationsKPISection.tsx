// src/features/publications/components/PublicationsKPISection.tsx
'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import { usePublicationKPI } from '../api/usePublicationKPI';
import { usePublicationStore } from '../store/publicationStore';
import { FileText, Award, BookOpen, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PublicationsKPISection() {
  const { filters } = usePublicationStore();
  const { data: kpi, isLoading } = usePublicationKPI(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="총 논문 수"
        value={kpi?.total_count || 0}
        icon={FileText}
        description="전체 논문 게재 수"
      />
      <KPICard
        title="SCIE 논문"
        value={kpi?.scie_count || 0}
        icon={Award}
        description="SCIE 등급 논문"
      />
      <KPICard
        title="KCI 논문"
        value={kpi?.kci_count || 0}
        icon={BookOpen}
        description="KCI 등급 논문"
      />
      <KPICard
        title="평균 Impact Factor"
        value={kpi?.avg_impact_factor?.toFixed(2) || 'N/A'}
        icon={TrendingUp}
        description="평균 IF"
      />
    </div>
  );
}
