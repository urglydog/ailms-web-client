import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import { CourseFilterBar } from './CourseFilterBar';

const CATS = [
  { id: 1, name: 'Lập trình Web', slug: 'lap-trinh-web' },
  { id: 2, name: 'Khoa học dữ liệu', slug: 'khoa-hoc-du-lieu' },
];

describe('CourseFilterBar', () => {
  it('hiện 5 nhóm lọc dạng nút, bấm mở danh sách lựa chọn', () => {
    renderWithIntl(<CourseFilterBar filters={EMPTY_FILTERS} onChange={vi.fn()} categories={CATS} />);
    for (const name of ['Danh mục', 'Đánh giá', 'Thời lượng video', 'Học phí', 'Trình độ']) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toHaveAttribute('aria-expanded', 'false');
    }
    fireEvent.click(screen.getByRole('button', { name: /Danh mục/ }));
    expect(screen.getByRole('listbox', { name: 'Danh mục' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Lập trình Web/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('chọn một lựa chọn thì gọi onChange và đóng danh sách', () => {
    const onChange = vi.fn();
    renderWithIntl(<CourseFilterBar filters={EMPTY_FILTERS} onChange={onChange} categories={CATS} />);
    fireEvent.click(screen.getByRole('button', { name: /Học phí/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Miễn phí' }));
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, priceType: 'free' });
    expect(screen.getByRole('button', { name: /Học phí/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('nhóm đang lọc thì nút ghi giá trị đã chọn; chọn lại thì bỏ lọc', () => {
    const onChange = vi.fn();
    const filters = { ...EMPTY_FILTERS, category: 'lap-trinh-web' };
    renderWithIntl(<CourseFilterBar filters={filters} onChange={onChange} categories={CATS} />);
    const trigger = screen.getByRole('button', { name: /Danh mục.*Lập trình Web/ });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Lập trình Web' }));
    expect(onChange).toHaveBeenCalledWith({ ...filters, category: null });
  });

  it('Esc đóng danh sách', () => {
    renderWithIntl(<CourseFilterBar filters={EMPTY_FILTERS} onChange={vi.fn()} categories={CATS} />);
    const trigger = screen.getByRole('button', { name: /Trình độ/ });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
