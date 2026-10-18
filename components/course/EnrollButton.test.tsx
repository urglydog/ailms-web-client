import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { EnrollButton } from './EnrollButton';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/api/enrollments', () => ({
  enrollmentsApi: { listMine: () => Promise.resolve([]), enrollFree: vi.fn() },
}));
vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({ data: [] }),
  useAddToCart: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({ data: [] }),
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

const base = { courseId: 1, courseSlug: 'khoa-1', enrolled: false, firstLessonId: 5, requiresPassword: false };

beforeEach(() => vi.clearAllMocks());

describe('EnrollButton', () => {
  it('khóa miễn phí: nút Đăng ký, không có nút Ghi danh', () => {
    renderWithIntl(<EnrollButton {...base} isFree />);
    expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeInTheDocument();
    expect(screen.queryByText(/Ghi danh/)).toBeNull();
  });

  it('khóa có phí: nút Mua khóa học và Thêm vào giỏ hàng', () => {
    renderWithIntl(<EnrollButton {...base} isFree={false} />);
    expect(screen.getByRole('button', { name: 'Mua khóa học' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' })).toBeInTheDocument();
    expect(screen.queryByText(/Ghi danh/)).toBeNull();
  });

  it('đã sở hữu: nút Học ngay', () => {
    renderWithIntl(<EnrollButton {...base} isFree={false} enrolled />);
    expect(screen.getByRole('button', { name: 'Học ngay' })).toBeInTheDocument();
  });
});
