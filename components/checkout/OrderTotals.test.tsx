import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { OrderTotals } from './OrderTotals';

describe('OrderTotals', () => {
  it('có giảm giá: hiện tạm tính, số tiền đã giảm và tổng cộng', () => {
    renderWithIntl(<OrderTotals count={2} original={500000} total={400000} />);
    expect(screen.getByText('Tạm tính (2 khóa học)')).toBeInTheDocument();
    expect(screen.getByText('500.000đ')).toBeInTheDocument();
    expect(screen.getByText('-100.000đ')).toBeInTheDocument();
    expect(screen.getByText('400.000đ')).toBeInTheDocument();
  });

  it('không giảm giá thì ẩn dòng Đã giảm', () => {
    renderWithIntl(<OrderTotals count={1} original={200000} total={200000} />);
    expect(screen.queryByText('Đã giảm')).toBeNull();
    expect(screen.getByText('Tạm tính')).toBeInTheDocument();
  });

  it('có dòng Đã chọn khi truyền số khóa đang chọn', () => {
    renderWithIntl(<OrderTotals count={2} selectedOf={{ selected: 1, total: 3 }} original={0} total={0} />);
    expect(screen.getByText('1 / 3 khóa học')).toBeInTheDocument();
  });
});
