import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import AdminPaymentsPage from './page';

const row = (over: Record<string, unknown>) => ({
  txnRef: 'abcdef123456', userEmail: 'hv@x.vn', courseTitle: 'Khóa A', amount: 100000, platformFee: 63000, instructorEarning: 37000,
  paymentMethod: 'PAYOS', status: 'PAID', paidAt: '2026-10-01T03:00:00Z', gatewayTxnNo: null, originalAmount: null, discountAmount: 0,
  couponCode: null, revenueSource: 'ORGANIC', ...over,
});

// useQuery giả: chỉ trả dữ liệu khi trang đã bật truy vấn (tức là sau khi bấm Tìm), giống hành vi thật.
vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { enabled?: boolean }) => ({
    data: opts.enabled
      ? { items: [row({}), row({ txnRef: 'zzzzzz999999', userEmail: 'khac@x.vn', status: 'FAILED', amount: 50000, revenueSource: 'INSTRUCTOR_REFERRAL' })], total: 2, page: 0, size: 10 }
      : undefined,
    isFetching: false,
    isError: false,
  }),
}));
vi.mock('@/lib/auth/token', () => ({ getAccessToken: () => 'token' }));
vi.mock('@/lib/api/payments', () => ({ paymentsApi: { searchAdmin: vi.fn() } }));
vi.mock('@/lib/api/invoices', () => ({ adminInvoicesApi: { list: vi.fn(), pdf: vi.fn() } }));

function search(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/Mã đơn, mã cổng thanh toán/), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
}

describe('AdminPaymentsPage (tìm-kiếm-trước)', () => {
  it('lúc đầu không liệt kê giao dịch nào, chỉ có hướng dẫn tra cứu', () => {
    renderWithIntl(<AdminPaymentsPage />);
    expect(screen.getByText('Nhập thông tin để tra cứu giao dịch')).toBeInTheDocument();
    expect(screen.queryByText('hv@x.vn')).toBeNull();
  });

  it('chỉ hiện kết quả sau khi bấm Tìm, với nhãn trạng thái dịch được', () => {
    renderWithIntl(<AdminPaymentsPage />);
    search('hv@x.vn');
    expect(screen.getByText('hv@x.vn')).toBeInTheDocument();
    expect(screen.getByText('Thành công', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText('Nhập thông tin để tra cứu giao dịch')).toBeNull();
  });

  it('mở chi tiết thành hộp thoại có tên và nút tải biên lai, Escape đóng', () => {
    renderWithIntl(<AdminPaymentsPage />);
    search('abcdef');
    fireEvent.click(screen.getAllByRole('button', { name: /^Chi tiết/ })[0]!);
    expect(screen.getByRole('dialog', { name: 'Chi tiết giao dịch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tải biên lai' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
