export function formatCurrency(amount: number, currency = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency }).format(
    amount
  );
}

export function formatCurrencyShort(amount: number, currency = 'SGD'): string {
  const abs = Math.abs(amount);
  if (abs >= 1000) {
    const k = (abs / 1000).toFixed(1).replace(/\.0$/, '');
    return (amount < 0 ? '-' : '') + 'S$' + k + 'k';
  }
  return formatCurrency(amount, currency);
}
