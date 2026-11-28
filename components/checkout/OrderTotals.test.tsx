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

describe('OrderTotals với breakdown', () => {
  const base = { original: 249000, promotionDiscount: 74700, couponDiscount: 0, bundleDiscount: 0, total: 174300, couponNotApplied: false };

  it('tách dòng khuyến mãi, không hiện dòng Đã giảm chung', () => {
    renderWithIntl(<OrderTotals count={1} original={249000} total={174300} breakdown={base} />);
    expect(screen.getByText('Khuyến mãi khóa học')).toBeInTheDocument();
    expect(screen.getByText('-74.700đ')).toBeInTheDocument();
    expect(screen.queryByText('Đã giảm')).toBeNull();
  });

  it('mã không cộng dồn: hiện ghi chú, không có dòng mã', () => {
    renderWithIntl(
      <OrderTotals count={1} original={249000} total={174300} couponCode="pydemo30" breakdown={{ ...base, couponNotApplied: true }} />,
    );
    expect(screen.getByText(/PYDEMO30 không cộng dồn/)).toBeInTheDocument();
    expect(screen.queryByText('Mã PYDEMO30')).toBeNull();
  });

  it('mã thay thế khuyến mãi: chỉ có dòng mã', () => {
    renderWithIntl(
      <OrderTotals count={1} original={249000} total={149400} couponCode="PYDEMO30"
        breakdown={{ ...base, promotionDiscount: 0, couponDiscount: 99600, total: 149400 }} />,
    );
    expect(screen.getByText('Mã PYDEMO30')).toBeInTheDocument();
    expect(screen.getByText('-99.600đ')).toBeInTheDocument();
    expect(screen.queryByText('Khuyến mãi khóa học')).toBeNull();
  });
});
