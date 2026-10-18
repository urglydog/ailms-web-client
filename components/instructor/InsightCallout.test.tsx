import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { InsightCallout } from './InsightCallout';

describe('InsightCallout', () => {
  it('không có liên kết thì chỉ là hộp thông tin', () => {
    renderWithIntl(<InsightCallout tone="info">Doanh thu tăng 20%</InsightCallout>);
    expect(screen.getByText('Doanh thu tăng 20%')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('có liên kết thì cả hộp là liên kết kèm chữ Xem (dịch được)', () => {
    renderWithIntl(
      <InsightCallout tone="warning" href="/instructor/revenue/reviews">
        Có đánh giá thấp
      </InsightCallout>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/instructor/revenue/reviews');
    expect(link).toHaveTextContent('Xem →');
  });

  it('cảnh báo báo qua role alert cho trình đọc màn hình, thông tin thì không', () => {
    const first = renderWithIntl(<InsightCallout tone="warning">Cảnh báo</InsightCallout>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    first.unmount();
    renderWithIntl(<InsightCallout tone="info">Thông tin</InsightCallout>);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
