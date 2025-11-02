import { toast } from '@/hooks/use-toast';

export function showErrorToast(error: unknown, fallbackMessage?: string) {
  const message =
    error instanceof Error ? error.message : fallbackMessage ?? '오류가 발생했습니다';

  toast({
    variant: 'destructive',
    title: '오류',
    description: message,
  });
}

export function showSuccessToast(message: string) {
  toast({
    title: '성공',
    description: message,
  });
}
