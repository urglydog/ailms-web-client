import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeCourse } from '@/test/fixtures';
import { renderWithIntl } from '@/test/renderWithIntl';
import { TrendingCourses } from './TrendingCourses';

const useTrending = vi.fn();

vi.mock('@/hooks/useTrendingCourses', () => ({
  useTrendingCourses: (slug: string | null, initial?: unknown) => useTrending(slug, initial),
}));
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [{ id: 1, name: 'Lập trình', slug: 'lap-trinh' }] }),
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
  useTrending.mockImplementation((slug: string | null) =>
    slug === 'lap-trinh'
      ? { data: [makeCourse(9, { title: 'Chỉ lập trình' })], isLoading: false }
      : { data: ALL, isLoading: false },
  );
});

describe('TrendingCourses', () => {
  it('hiện tiêu đề, chip Tất cả đang chọn và chip danh mục', () => {
    renderWithIntl(<TrendingCourses initialCourses={ALL} />);
    expect(screen.getByText('Đang thịnh hành')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Lập trình' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('bỏ khóa đã sở hữu và hiện tối đa 4 thẻ', () => {
    renderWithIntl(<TrendingCourses initialCourses={ALL} />);
    const titles = screen.getAllByTestId('card').map((c) => c.textContent);
    expect(titles).toEqual(['Khóa học 1', 'Khóa học 3', 'Khóa học 4', 'Khóa học 5']);
  });

  it('bấm chip danh mục thì truy vấn theo slug và đổi thẻ', () => {
    renderWithIntl(<TrendingCourses initialCourses={ALL} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lập trình' }));
    expect(useTrending).toHaveBeenLastCalledWith('lap-trinh', expect.anything());
    expect(screen.getAllByTestId('card').map((c) => c.textContent)).toEqual(['Chỉ lập trình']);
    expect(screen.getByRole('button', { name: 'Lập trình' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('danh mục rỗng thì báo chưa có khóa học', () => {
    useTrending.mockImplementation(() => ({ data: [], isLoading: false }));
    renderWithIntl(<TrendingCourses initialCourses={[]} />);
    expect(screen.getByText('Chưa có khóa học nào trong danh mục này.')).toBeInTheDocument();
  });

  it('có liên kết Xem tất cả tới /courses', () => {
    renderWithIntl(<TrendingCourses initialCourses={ALL} />);
    expect(screen.getByRole('link', { name: /Xem tất cả/ })).toHaveAttribute('href', '/courses');
  });
});
