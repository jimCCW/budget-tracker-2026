import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryDonutChart } from '@/features/dashboard/components/CategoryDonutChart';

const categories = [
  { name: 'Food', icon: 'pi-cart', color: '#FF0000', value: 60 },
  { name: 'Transport', icon: 'pi-car', color: '#00FF00', value: 40 },
];

describe('CategoryDonutChart', () => {
  it('renders a legend row for each category', () => {
    render(<CategoryDonutChart categories={categories} total={100} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('shows each category as a percentage of the total', () => {
    render(<CategoryDonutChart categories={categories} total={100} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('renders an empty state when there are no categories', () => {
    render(<CategoryDonutChart categories={[]} total={0} />);
    expect(screen.getByText('No expenses yet this month')).toBeInTheDocument();
  });

  it('does not divide by zero when total is 0', () => {
    render(
      <CategoryDonutChart
        categories={[
          { name: 'Food', icon: 'pi-cart', color: '#FF0000', value: 10 },
        ]}
        total={0}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
