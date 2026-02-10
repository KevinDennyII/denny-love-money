
export function calculateMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency.toLowerCase()) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'bi-weekly':
      return (amount * 26) / 12;
    case 'yearly':
    case 'annually':
      return amount / 12;
    case 'bi-monthly': // Every 2 months
      return amount / 2;
    case 'semi-monthly': // Twice a month
      return amount * 2;
    case 'quarterly':
      return amount / 4;
    default: // 'monthly' or unknown
      return amount;
  }
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
