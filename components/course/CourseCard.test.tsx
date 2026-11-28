import { screen } from '@testing-library/react';
import { renderWithIntl as render } from '@/test/renderWithIntl';
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
  it('luôn hiện nhãn AI lồng tiếng vì mọi khóa đều hỗ trợ lồng tiếng', () => {
    render(<CourseCard course={makeCourse(1, { langs: [LANG] })} />);
    expect(screen.getByText('AI lồng tiếng')).toBeInTheDocument();
  });

  it('vẫn hiện nhãn khi API chưa trả danh sách giọng (langs rỗng)', () => {
    render(<CourseCard course={makeCourse(2, { langs: [] })} />);
    const label = screen.getByText('AI lồng tiếng');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveAttribute('title');
  });

  it('nhãn liệt kê các giọng trong tooltip khi có danh sách', () => {
    render(<CourseCard course={makeCourse(6, { langs: [LANG] })} />);
    expect(screen.getByText('AI lồng tiếng')).toHaveAttribute('title', 'Tiếng Việt');
  });

  it('không còn hàng cờ ngôn ngữ', () => {
    render(<CourseCard course={makeCourse(3, { langs: [LANG] })} />);
    expect(screen.queryByText('🇻🇳')).toBeNull();
  });

  it('không có thanh Xem trước khi hover', () => {
    render(<CourseCard course={makeCourse(4)} />);
    expect(screen.queryByText('Xem trước')).toBeNull();
  });

  it('khóa miễn phí hiện nhãn Miễn phí', () => {
    render(<CourseCard course={makeCourse(5, { isFree: true, finalPrice: 0, price: 0 })} />);
    expect(screen.getAllByText('Miễn phí').length).toBeGreaterThan(0);
  });
});

describe('CourseCard — thứ tự thông tin', () => {
  it('tên → giảng viên → nhãn lồng tiếng → giá gốc gạch ngang', () => {
    const { container } = render(
      <CourseCard course={makeCourse(7, { price: 500000, finalPrice: 400000, discountPercent: 20, isFree: false })} />,
    );
    const text = container.textContent ?? '';
    const iTitle = text.indexOf('Khóa học 7');
    const iInstr = text.indexOf('GV.');
    const iDub = text.indexOf('AI lồng tiếng');
    const iPrice = text.indexOf('400.000đ');
    expect(iTitle).toBeGreaterThan(-1);
    expect(iTitle).toBeLessThan(iInstr);
    expect(iInstr).toBeLessThan(iDub);
    expect(iDub).toBeLessThan(iPrice);
    expect(screen.getByText('Giá gốc', { exact: false }).parentElement).toHaveClass('line-through');
  });

  it('thẻ là containing block (relative) để chữ sr-only bên trong bị cắt theo thẻ, không tràn ra ngoài vùng cuộn', () => {
    render(<CourseCard course={makeCourse(9)} />);
    const root = screen.getByText(makeCourse(9).title).closest('a');
    expect(root).toHaveClass('relative', 'overflow-hidden');
  });
});
