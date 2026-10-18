import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { RevenueBars } from './RevenueBars';

const SERIES = [
  { day: '2026-10-08', value: 70000 },
  { day: '2026-10-09', value: 0 },
  { day: '2026-10-10', value: 150000 },
];

describe('RevenueBars', () => {
  it('có mô tả tổng và ngày cao nhất cho trình đọc màn hình', () => {
    renderWithIntl(<RevenueBars series={SERIES} />);
    const chart = screen.getByRole('img');
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('220.000đ'));
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('150.000đ'));
  });

  it('vẽ một cột cho mỗi ngày, cột cao nhất có chiều cao 100%', () => {
    renderWithIntl(<RevenueBars series={SERIES} />);
    const bars = screen.getAllByTestId('bar');
    expect(bars).toHaveLength(3);
    expect(bars[2]).toHaveStyle({ height: '100%' });
    expect(bars[1]).toHaveStyle({ height: '2px' });
  });

  it('không có doanh thu nào thì hiện lời báo trống thay cho biểu đồ', () => {
    renderWithIntl(<RevenueBars series={SERIES.map((p) => ({ ...p, value: 0 }))} />);
    expect(screen.getByText('Chưa có doanh thu trong 30 ngày qua.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
