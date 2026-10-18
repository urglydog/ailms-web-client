import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { PayosButton } from './PayosButton';

describe('PayosButton', () => {
  it('bấm thì gọi onPay', () => {
    const onPay = vi.fn();
    renderWithIntl(<PayosButton paying={false} disabled={false} onPay={onPay} />);
    fireEvent.click(screen.getByRole('button', { name: /Chuyển khoản QR \(PayOS\)/ }));
    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it('đang xử lý thì khóa nút và báo bận cho trình đọc màn hình', () => {
    renderWithIntl(<PayosButton paying disabled onPay={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /Chuyển khoản QR/ });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });
});
