import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { MyLearningTabs } from './MyLearningTabs';

describe('MyLearningTabs', () => {
  it('có tiêu đề Khóa học của tôi và hai tab dẫn đúng trang', () => {
    renderWithIntl(<MyLearningTabs active="courses" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Khóa học của tôi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tất cả khóa học' })).toHaveAttribute('href', '/my-courses');
    expect(screen.getByRole('link', { name: 'Yêu thích' })).toHaveAttribute('href', '/wishlist');
  });

  it('đánh dấu tab đang chọn bằng aria-current', () => {
    renderWithIntl(<MyLearningTabs active="wishlist" />);
    expect(screen.getByRole('link', { name: 'Yêu thích' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tất cả khóa học' })).not.toHaveAttribute('aria-current');
  });

  it('không dùng nền tối: chữ tiêu đề là màu ink, không phải trắng', () => {
    renderWithIntl(<MyLearningTabs active="courses" />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveClass('text-ink');
    expect(h1).not.toHaveClass('text-white');
  });
});
