// src/app/(protected)/dashboard/budget/execution/page.tsx
'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { BudgetExecutionDashboard } from '@/features/budget/components/budget-execution-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

function BudgetExecutionContent() {
  return <BudgetExecutionDashboard />;
}

export default function BudgetExecutionPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DashboardLayout>
      }
    >
      <DashboardLayout>
        <BudgetExecutionContent />
      </DashboardLayout>
    </Suspense>
  );
}
