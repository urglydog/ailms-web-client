import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ShopEmptyState } from './ShopEmptyState';

describe('ShopEmptyState', () => {
  it('hiện thông điệp và nút dẫn tới danh sách khóa học', () => {
    renderWithIntl(<ShopEmptyState kind="cart" message="Giỏ hàng của bạn đang trống." cta="Khám phá khóa học" href="/courses" />);
    expect(screen.getByText('Giỏ hàng của bạn đang trống.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khám phá khóa học' })).toHaveAttribute('href', '/courses');
  });
});
