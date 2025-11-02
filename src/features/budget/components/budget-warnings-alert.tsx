'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBudget, formatPercentage } from '@/lib/utils/number';
import { AlertTriangle } from 'lucide-react';
import type { BudgetWarning } from '../types';

type BudgetWarningsAlertProps = {
  warnings: BudgetWarning[];
};

export function BudgetWarningsAlert({
  warnings,
}: BudgetWarningsAlertProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>예산 초과 경고</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <p className="text-sm font-medium">
            {warnings.length}개의 연구과제가 예산을 초과하거나 근접했습니다.
          </p>
          <div className="mt-4 space-y-3">
            {warnings.map((warning, index) => (
              <Card key={index} className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {warning.projectNumber} - {warning.projectName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">총 예산:</span>
                    <span className="font-medium">
                      {formatBudget(warning.totalBudget)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">집행금액:</span>
                    <span className="font-medium text-destructive">
                      {formatBudget(warning.executedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">집행률:</span>
                    <span className="font-medium text-destructive">
                      {formatPercentage(warning.executionRate)}
                    </span>
                  </div>
                  {warning.overageAmount > 0 && (
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-muted-foreground">초과금액:</span>
                      <span className="font-bold text-destructive">
                        {formatBudget(warning.overageAmount)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

