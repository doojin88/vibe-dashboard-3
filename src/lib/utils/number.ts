export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatBudget(value: number): string {
  if (value >= 100000000) {
    // 억 단위
    return `${formatNumber(value / 100000000, 1)}억원`;
  } else if (value >= 10000) {
    // 만 단위
    return `${formatNumber(value / 10000, 1)}만원`;
  }
  return `${formatNumber(value)}원`;
}
