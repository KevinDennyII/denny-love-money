export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatCompactCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return formatCurrency(num);
}

export function getDebtPayoffProgress(currentBalance: number | string, originalBalance: number | string | null): number {
  const current = typeof currentBalance === 'string' ? parseFloat(currentBalance) : currentBalance;
  const original = originalBalance 
    ? (typeof originalBalance === 'string' ? parseFloat(originalBalance) : originalBalance)
    : current;
  
  if (original === 0) return 100;
  const paidOff = original - current;
  return Math.min(100, Math.max(0, (paidOff / original) * 100));
}
