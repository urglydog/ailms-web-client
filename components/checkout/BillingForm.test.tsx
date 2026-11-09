import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { BillingForm } from './BillingForm';

describe('BillingForm', () => {
  it('hai ô có nhãn liên kết đúng và gọi onChange khi gõ', () => {
    const onName = vi.fn();
    const onPhone = vi.fn();
    renderWithIntl(<BillingForm name="" phone="" onNameChange={onName} onPhoneChange={onPhone} />);
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'An' } });
    fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0900' } });
    expect(onName).toHaveBeenCalledWith('An');
    expect(onPhone).toHaveBeenCalledWith('0900');
    expect(screen.getByText(/chỉ dùng để liên hệ hỗ trợ/)).toBeInTheDocument();
  });
});
