export const SAMPLE = {
  user: { name: 'Alex Tan', email: 'alex.tan@example.com' },
  balance: 12480.5,
  monthIncome: 5840,
  monthExpense: 3210.45,
  topExpenses: [
    { name: 'Housing & Bills', icon: 'pi-home', color: '#6366F1', value: 1450 },
    {
      name: 'Food & Dining',
      icon: 'pi-shopping-cart',
      color: '#FF6363',
      value: 624.2,
    },
    { name: 'Transport', icon: 'pi-car', color: '#10B981', value: 312.8 },
    {
      name: 'Shopping',
      icon: 'pi-shopping-bag',
      color: '#F59E0B',
      value: 268.1,
    },
    { name: 'Entertainment', icon: 'pi-star', color: '#A855F7', value: 155.35 },
  ],
  budgets: [
    { name: 'Food & Dining', spent: 624.2, limit: 800, color: '#FF6363' },
    { name: 'Transport', spent: 312.8, limit: 400, color: '#10B981' },
    { name: 'Shopping', spent: 268.1, limit: 250, color: '#F59E0B' },
    { name: 'Entertainment', spent: 155.35, limit: 200, color: '#A855F7' },
  ],
  recent: [
    {
      name: 'Category A merchant',
      cat: 'Food & Dining',
      icon: 'pi-shopping-cart',
      color: '#FF6363',
      amt: -18.4,
      when: 'Today',
    },
    {
      name: 'Salary — Company X',
      cat: 'Income',
      icon: 'pi-briefcase',
      color: '#10B981',
      amt: 5200.0,
      when: 'Today',
    },
    {
      name: 'Category B subscription',
      cat: 'Entertainment',
      icon: 'pi-star',
      color: '#A855F7',
      amt: -14.99,
      when: 'Yesterday',
    },
    {
      name: 'Category C transport',
      cat: 'Transport',
      icon: 'pi-car',
      color: '#10B981',
      amt: -32.5,
      when: 'Yesterday',
    },
    {
      name: 'Category D groceries',
      cat: 'Food & Dining',
      icon: 'pi-shopping-cart',
      color: '#FF6363',
      amt: -86.2,
      when: 'May 14',
    },
    {
      name: 'Refund — Store',
      cat: 'Shopping',
      icon: 'pi-shopping-bag',
      color: '#F59E0B',
      amt: 24.0,
      when: 'May 13',
    },
  ],
  goals: [
    { name: 'Emergency fund', saved: 2400, target: 6000, color: '#6366F1' },
    { name: 'Trip to Tokyo', saved: 1450, target: 3500, color: '#FF6363' },
    { name: 'New laptop', saved: 800, target: 2200, color: '#A855F7' },
  ],
};

export function fmt(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (n < 0 ? '-' : '') + 'S$' + s;
}

export function fmtShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000)
    return (
      (n < 0 ? '-' : '') +
      'S$' +
      (abs / 1000).toFixed(1).replace(/\.0$/, '') +
      'k'
    );
  return fmt(n);
}
