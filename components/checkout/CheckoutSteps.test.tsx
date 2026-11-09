import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CheckoutSteps } from './CheckoutSteps';

describe('CheckoutSteps', () => {
  it('hiện hai bước và đánh dấu bước hiện tại', () => {
    renderWithIntl(<CheckoutSteps current="payment" />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual(['Giỏ hàng', '2Thanh toán']); // bước đã qua hiện dấu tích thay cho số
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('có vùng điều hướng có tên', () => {
    renderWithIntl(<CheckoutSteps current="cart" />);
    expect(screen.getByRole('navigation', { name: 'Tiến trình mua hàng' })).toBeInTheDocument();
  });
});
