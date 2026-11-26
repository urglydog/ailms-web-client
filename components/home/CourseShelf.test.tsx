import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { makeCourse } from '@/test/fixtures';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CourseShelf } from './CourseShelf';

vi.mock('@/hooks/useEnrollments', () => ({
  useMyEnrollments: () => ({ data: [{ courseId: 2 }] }),
}));
vi.mock('@/components/course/CourseCard', () => ({
  CourseCard: ({ course }: { course: { title: string } }) => <div data-testid="card">{course.title}</div>,
}));

const COURSES = [1, 2, 3, 4, 5, 6].map((id) => makeCourse(id));

describe('CourseShelf', () => {
  it('kệ ngắn (không cần cuộn) hiện tiêu đề, mô tả ngắn và liên kết Xem tất cả', () => {
    renderWithIntl(
      <CourseShelf title="Mới ra mắt" subtitle="Khóa vừa lên kệ" href="/courses?sort=newest" courses={COURSES.slice(0, 3)} />,
    );
    expect(screen.getByRole('heading', { name: 'Mới ra mắt' })).toBeInTheDocument();
    expect(screen.getByText('Khóa vừa lên kệ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem tất cả/ })).toHaveAttribute('href', '/courses?sort=newest');
  });

  it('kệ có mũi tên cuộn thì không hiện thêm Xem tất cả', () => {
    renderWithIntl(<CourseShelf title="T" href="/courses" courses={COURSES} />);
    expect(screen.queryByRole('link', { name: /Xem tất cả/ })).not.toBeInTheDocument();
  });

  it('bỏ khóa đã sở hữu, giữ thứ tự', () => {
    renderWithIntl(<CourseShelf title="T" href="/courses" courses={COURSES} />);
    expect(screen.getAllByTestId('card').map((c) => c.textContent)).toEqual([
      'Khóa học 1',
      'Khóa học 3',
      'Khóa học 4',
      'Khóa học 5',
      'Khóa học 6',
    ]);
  });

  it('kệ nhiều hơn 4 thẻ có mũi tên trái/phải', () => {
    renderWithIntl(<CourseShelf title="T" href="/courses" courses={COURSES} />);
    expect(screen.getByRole('button', { name: 'Trước' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp' })).toBeInTheDocument();
  });

  it('tối đa 12 thẻ', () => {
    const many = Array.from({ length: 20 }, (_, i) => makeCourse(100 + i));
    renderWithIntl(<CourseShelf title="T" href="/courses" courses={many} />);
    expect(screen.getAllByTestId('card')).toHaveLength(12);
  });

  it('không có khóa nào để hiện thì không vẽ gì', () => {
    const { container } = renderWithIntl(<CourseShelf title="T" href="/courses" courses={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
