export function formatCurrency(amount: number, currency = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency }).format(amount);
}
