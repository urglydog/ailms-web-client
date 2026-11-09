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
  it('hiện tiêu đề, mô tả ngắn và liên kết Xem tất cả', () => {
    renderWithIntl(
      <CourseShelf title="Mới ra mắt" subtitle="Khóa vừa lên kệ" href="/courses?sort=newest" courses={COURSES} />,
    );
    expect(screen.getByRole('heading', { name: 'Mới ra mắt' })).toBeInTheDocument();
    expect(screen.getByText('Khóa vừa lên kệ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem tất cả/ })).toHaveAttribute('href', '/courses?sort=newest');
  });

  it('bỏ khóa đã sở hữu và hiện tối đa 4 thẻ', () => {
    renderWithIntl(<CourseShelf title="T" href="/courses" courses={COURSES} />);
    expect(screen.getAllByTestId('card').map((c) => c.textContent)).toEqual([
      'Khóa học 1',
      'Khóa học 3',
      'Khóa học 4',
      'Khóa học 5',
    ]);
  });

  it('không có khóa nào để hiện thì không vẽ gì', () => {
    const { container } = renderWithIntl(<CourseShelf title="T" href="/courses" courses={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
