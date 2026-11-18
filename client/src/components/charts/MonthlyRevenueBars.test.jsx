import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import MonthlyRevenueBars from './MonthlyRevenueBars.jsx';

const MONTHS = [
  { month: '2026-05', label: 'May', revenue: '0.00' },
  { month: '2026-06', label: 'Jun', revenue: '3200.00' },
  { month: '2026-07', label: 'Jul', revenue: '4100.00' },
  { month: '2026-08', label: 'Aug', revenue: '2700.00' },
  { month: '2026-09', label: 'Sep', revenue: '5000.00' },
  { month: '2026-10', label: 'Oct', revenue: '1500.00' },
];

describe('MonthlyRevenueBars', () => {
  it('labels the chart and lists every month with a formatted amount for screen readers', () => {
    render(<MonthlyRevenueBars months={MONTHS} />);

    expect(screen.getByRole('img', { name: /revenue per month, last 6 months/i })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: '2026-05' })).toBeInTheDocument();
    expect(within(table).getByText('₺5,000.00')).toBeInTheDocument();
    expect(within(table).getByText('₺1,500.00')).toBeInTheDocument();
  });

  it('shows the current month (last bar) value by default', () => {
    render(<MonthlyRevenueBars months={MONTHS} />);

    // The last bar's value is shown without hovering; it also appears once in the sr-only table.
    expect(screen.getAllByText('₺1,500.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Oct')).toBeInTheDocument();
  });
});
