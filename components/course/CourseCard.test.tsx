import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { makeCourse } from '@/test/fixtures';
import type { DubLanguage } from '@/types/domain';
import { CourseCard } from './CourseCard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/hooks/useEnrollments', () => ({ useMyEnrollments: () => ({ data: [] }) }));
vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({ data: [] }),
  useAddToCart: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({ data: [] }),
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

const LANG = { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', available: true } as unknown as DubLanguage;

describe('CourseCard', () => {
  it('hiện nhãn AI lồng tiếng khi khóa có giọng lồng tiếng', () => {
    render(<CourseCard course={makeCourse(1, { langs: [LANG] })} />);
    expect(screen.getByText('AI lồng tiếng')).toBeInTheDocument();
  });

  it('không hiện nhãn khi chưa có giọng nào', () => {
    render(<CourseCard course={makeCourse(2, { langs: [] })} />);
    expect(screen.queryByText('AI lồng tiếng')).toBeNull();
  });

  it('không còn hàng cờ ngôn ngữ', () => {
    render(<CourseCard course={makeCourse(3, { langs: [LANG] })} />);
    expect(screen.queryByText('🇻🇳')).toBeNull();
  });

  it('có thanh Xem trước ẩn khỏi trình đọc màn hình', () => {
    render(<CourseCard course={makeCourse(4)} />);
    expect(screen.getByText('Xem trước')).toHaveAttribute('aria-hidden', 'true');
  });

  it('khóa miễn phí hiện nhãn Miễn phí', () => {
    render(<CourseCard course={makeCourse(5, { isFree: true, finalPrice: 0, price: 0 })} />);
    expect(screen.getAllByText('Miễn phí').length).toBeGreaterThan(0);
  });
});
