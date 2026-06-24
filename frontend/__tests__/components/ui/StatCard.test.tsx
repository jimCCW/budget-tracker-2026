import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/ui/StatCard';

describe('StatCard', () => {
  const baseProps = {
    label: 'Total Income',
    value: '$5,000.00',
    icon: 'pi-arrow-down',
    tintClass: 'bg-success-tint',
    iconColorClass: 'text-success',
  };

  it('renders the label and value', () => {
    render(<StatCard {...baseProps} />);
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('renders the icon class', () => {
    render(<StatCard {...baseProps} />);
    const icon = document.querySelector('.pi.pi-arrow-down');
    expect(icon).toBeInTheDocument();
  });

  it('renders the optional sub text when provided', () => {
    render(<StatCard {...baseProps} sub='vs last month' />);
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('does not render sub text when omitted', () => {
    render(<StatCard {...baseProps} />);
    expect(screen.queryByText('vs last month')).not.toBeInTheDocument();
  });

  it('renders the trend badge when provided', () => {
    render(
      <StatCard {...baseProps} trend={{ tone: 'success', label: '+12%' }} />
    );
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('applies danger styles to trend badge with danger tone', () => {
    render(
      <StatCard {...baseProps} trend={{ tone: 'danger', label: '-5%' }} />
    );
    const badge = screen.getByText('-5%');
    expect(badge.className).toContain('bg-danger-tint');
    expect(badge.className).toContain('text-danger');
  });

  it('applies success styles to trend badge with success tone', () => {
    render(
      <StatCard {...baseProps} trend={{ tone: 'success', label: '+8%' }} />
    );
    const badge = screen.getByText('+8%');
    expect(badge.className).toContain('bg-success-tint');
    expect(badge.className).toContain('text-success');
  });

  it('does not render a trend badge when omitted', () => {
    const { container } = render(<StatCard {...baseProps} />);
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });
});
