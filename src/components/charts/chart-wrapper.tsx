import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ChartWrapperProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  onDownload?: () => void;
};

export function ChartWrapper({
  title,
  description,
  children,
  isLoading,
  onDownload,
}: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
