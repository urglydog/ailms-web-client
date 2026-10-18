import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import AdminPaymentsPage from './page';

const row = (over: Record<string, unknown>) => ({
  txnRef: 'abcdef123456', userEmail: 'hv@x.vn', courseTitle: 'Khóa A', amount: 100000, platformFee: 63000, instructorEarning: 37000,
  paymentMethod: 'PAYOS', status: 'PAID', paidAt: '2026-10-01T03:00:00Z', gatewayTxnNo: null, originalAmount: null, discountAmount: 0,
  couponCode: null, revenueSource: 'ORGANIC', ...over,
});

vi.mock('@/lib/api/payments', () => ({
  paymentsApi: {
    listAllAdmin: () =>
      Promise.resolve([row({}), row({ txnRef: 'zzzzzz999999', userEmail: 'khac@x.vn', status: 'FAILED', amount: 50000, revenueSource: 'INSTRUCTOR_REFERRAL' })]),
  },
}));

describe('AdminPaymentsPage', () => {
  it('liệt kê giao dịch với nhãn trạng thái dịch được; cột sắp xếp có aria-sort', async () => {
    renderWithIntl(<AdminPaymentsPage />);
    await waitFor(() => expect(screen.getByText('hv@x.vn')).toBeInTheDocument());
    expect(screen.getByText('Thành công', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Thời gian/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('lọc theo email thu hẹp danh sách', async () => {
    renderWithIntl(<AdminPaymentsPage />);
    await waitFor(() => screen.getByText('hv@x.vn'));
    fireEvent.change(screen.getByPlaceholderText('Nhập email học viên...'), { target: { value: 'khac' } });
    expect(screen.queryByText('hv@x.vn')).toBeNull();
    expect(screen.getByText('khac@x.vn')).toBeInTheDocument();
  });

  it('mở chi tiết thành hộp thoại có tên, Escape đóng', async () => {
    renderWithIntl(<AdminPaymentsPage />);
    await waitFor(() => screen.getByText('hv@x.vn'));
    fireEvent.click(screen.getAllByRole('button', { name: /^Chi tiết/ })[0]!);
    expect(screen.getByRole('dialog', { name: 'Chi tiết giao dịch' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
