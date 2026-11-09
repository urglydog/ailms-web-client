import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { HomeHero } from './HomeHero';

describe('HomeHero', () => {
  it('tiêu đề có cụm tô vàng liền mạch trong đúng một thẻ mark', () => {
    const { container } = renderWithIntl(<HomeHero />);
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent('ngôn ngữ của bạn');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mọi khóa học bằng ngôn ngữ của bạn');
  });

  it('nút chính dẫn tới /courses và giữ chữ trắng khi hover', () => {
    renderWithIntl(<HomeHero />);
    const cta = screen.getByRole('link', { name: 'Khám phá khóa học' });
    expect(cta).toHaveAttribute('href', '/courses');
    expect(cta).toHaveClass('hover:text-white');
  });

  it('có liên kết demo trỏ tới khung video và khung video có id demo', () => {
    const { container } = renderWithIntl(<HomeHero />);
    expect(screen.getByRole('link', { name: /Xem demo/ })).toHaveAttribute('href', '#demo');
    expect(container.querySelector('#demo')).not.toBeNull();
  });

  it('có mô tả và thẻ nhỏ Mới · AI lồng tiếng', () => {
    renderWithIntl(<HomeHero />);
    expect(screen.getByText('Mới · AI lồng tiếng')).toBeInTheDocument();
    expect(screen.getByText(/Hiểu ngay, không cần phụ đề/)).toBeInTheDocument();
  });
});
