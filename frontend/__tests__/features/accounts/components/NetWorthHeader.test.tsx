import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetWorthHeader } from '@/features/accounts/components/NetWorthHeader';

const defaultProps = {
  netWorth: 50000,
  liquidAmount: 20000,
  investmentAmount: 30000,
  creditAmount: 5000,
  isLoading: false,
};

describe('NetWorthHeader', () => {
  describe('loading state', () => {
    it('renders 4 skeleton placeholder divs when isLoading is true', () => {
      const { container } = render(
        <NetWorthHeader {...defaultProps} isLoading={true} />
      );
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(4);
    });

    it('does not render any stat labels while loading', () => {
      render(<NetWorthHeader {...defaultProps} isLoading={true} />);
      expect(screen.queryByText('Net Worth')).not.toBeInTheDocument();
      expect(screen.queryByText('Liquid')).not.toBeInTheDocument();
    });
  });

  describe('data state', () => {
    it('renders the Net Worth stat card', () => {
      render(<NetWorthHeader {...defaultProps} />);
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
    });

    it('renders the Liquid stat card with sub text', () => {
      render(<NetWorthHeader {...defaultProps} />);
      expect(screen.getByText('Liquid')).toBeInTheDocument();
      expect(screen.getByText('Bank & cash - credit')).toBeInTheDocument();
    });

    it('renders the Investments stat card with sub text', () => {
      render(<NetWorthHeader {...defaultProps} />);
      expect(screen.getByText('Investments')).toBeInTheDocument();
      expect(screen.getByText('Stocks & crypto')).toBeInTheDocument();
    });

    it('renders the Credit stat card with sub text', () => {
      render(<NetWorthHeader {...defaultProps} />);
      expect(screen.getByText('Credit')).toBeInTheDocument();
      expect(screen.getByText('Total owed')).toBeInTheDocument();
    });

    it('displays the formatted net worth value', () => {
      render(<NetWorthHeader {...defaultProps} netWorth={50000} />);
      expect(screen.getByText(/50,000/)).toBeInTheDocument();
    });

    it('displays the formatted liquid amount', () => {
      render(<NetWorthHeader {...defaultProps} liquidAmount={20000} />);
      expect(screen.getByText(/20,000/)).toBeInTheDocument();
    });

    it('displays the formatted investment amount', () => {
      render(<NetWorthHeader {...defaultProps} investmentAmount={30000} />);
      expect(screen.getByText(/30,000/)).toBeInTheDocument();
    });

    it('displays the formatted credit amount', () => {
      render(<NetWorthHeader {...defaultProps} creditAmount={5000} />);
      // investmentAmount is 30000 so /5,000/ only matches the credit amount
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });

    it('renders 4 stat cards (no skeletons)', () => {
      const { container } = render(<NetWorthHeader {...defaultProps} />);
      expect(container.querySelectorAll('.animate-pulse')).toHaveLength(0);
    });
  });
});
