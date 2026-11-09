import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeCourse } from '@/test/fixtures';
import { renderWithIntl } from '@/test/renderWithIntl';
import { TrendingCourses } from './TrendingCourses';

const useTrending = vi.fn();

vi.mock('@/hooks/useTrendingCourses', () => ({
  useTrendingCourses: (slug: string | null, initial?: unknown) => useTrending(slug, initial),
}));
vi.mock('@/hooks/useEnrollments', () => ({
  useMyEnrollments: () => ({ data: [{ courseId: 2 }] }),
}));
vi.mock('@/components/course/CourseCard', () => ({
  CourseCard: ({ course }: { course: { title: string } }) => <div data-testid="card">{course.title}</div>,
}));

const ALL = [1, 2, 3, 4, 5].map((id) => makeCourse(id));

beforeEach(() => {
  useTrending.mockReset();
  useTrending.mockImplementation(() => ({ data: ALL, isLoading: false }));
});

describe('TrendingCourses', () => {
  it('hiện tiêu đề và không có chip lọc danh mục', () => {
    renderWithIntl(<TrendingCourses initialCourses={ALL} />);
    expect(screen.getByText('Đang thịnh hành')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('luôn lấy khóa thịnh hành của toàn bộ danh mục', () => {
    renderWithIntl(<TrendingCourses initialCourses={ALL} />);
    expect(useTrending).toHaveBeenLastCalledWith(null, expect.anything());
  });

  it('bỏ khóa đã sở hữu và hiện tối đa 4 thẻ', () => {
    renderWithIntl(<TrendingCourses initialCourses={ALL} />);
    const titles = screen.getAllByTestId('card').map((c) => c.textContent);
    expect(titles).toEqual(['Khóa học 1', 'Khóa học 3', 'Khóa học 4', 'Khóa học 5']);
  });

  it('chưa có khóa nào thì báo trống', () => {
    useTrending.mockImplementation(() => ({ data: [], isLoading: false }));
    renderWithIntl(<TrendingCourses initialCourses={[]} />);
    expect(screen.getByText('Chưa có khóa học nào trong danh mục này.')).toBeInTheDocument();
  });

  it('có liên kết Xem tất cả tới /courses', () => {
    renderWithIntl(<TrendingCourses initialCourses={ALL} />);
    expect(screen.getByRole('link', { name: /Xem tất cả/ })).toHaveAttribute('href', '/courses');
  });
});
