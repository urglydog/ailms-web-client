import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeCourse } from '@/test/fixtures';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { EnrolledCourse } from '@/types/domain';
import { MyCoursesView } from './MyCoursesView';

const state = vi.hoisted(() => ({
  enrollments: { data: [] as unknown[], isLoading: false, error: null as unknown },
}));

vi.mock('@/hooks/useEnrollments', () => ({ useMyEnrollments: () => state.enrollments }));
vi.mock('@/hooks/useStreak', () => ({ useStreak: () => ({ data: { currentStreak: 5 } }) }));
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ data: { id: 7 } }) }));
vi.mock('@/hooks/useTrendingCourses', () => ({
  useTrendingCourses: () => ({ data: [makeCourse(90, { title: 'Gợi ý A' })], isLoading: false }),
}));
vi.mock('@/components/course/CourseCard', () => ({
  CourseCard: ({ course }: { course: { title: string } }) => <div data-testid="suggestion">{course.title}</div>,
}));

function enrolled(id: number, overrides: Partial<EnrolledCourse> = {}): EnrolledCourse {
  return {
    courseId: id,
    courseTitle: `Khóa ${id}`,
    courseSlug: `khoa-${id}`,
    thumbnailUrl: null,
    categoryName: 'Lập trình',
    isFree: false,
    price: 1,
    alreadyReviewed: false,
    progressPct: 30,
    completedAt: null,
    quizScore: null,
    firstLessonId: id * 10,
    instructorName: 'Trần Thanh Hà',
    myRating: null,
    enrolledAt: '2026-09-01T00:00:00',
    lastAccessedAt: '2026-10-10T00:00:00',
    certificateCode: null,
    ...overrides,
  };
}

function setCourses(list: EnrolledCourse[]) {
  state.enrollments = { data: list, isLoading: false, error: null };
}

beforeEach(() => {
  localStorage.clear();
  setCourses([]);
});

describe('MyCoursesView', () => {
  it('đang tải thì báo Đang tải', () => {
    state.enrollments = { data: [], isLoading: true, error: null };
    renderWithIntl(<MyCoursesView />);
    expect(screen.getByText('Đang tải…')).toBeInTheDocument();
  });

  it('chưa có khóa nào: lời mời bắt đầu và gợi ý đang thịnh hành', () => {
    renderWithIntl(<MyCoursesView />);
    expect(screen.getByText('Bắt đầu khóa học đầu tiên')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khám phá khóa học' })).toHaveAttribute('href', '/courses');
    expect(screen.getByText('Đang thịnh hành')).toBeInTheDocument();
    expect(screen.getByTestId('suggestion')).toHaveTextContent('Gợi ý A');
  });

  it('có khóa đang học: hiện thống kê, khối Tiếp tục học và danh sách', () => {
    setCourses([
      enrolled(1, { progressPct: 60, lastAccessedAt: '2026-10-10T00:00:00' }),
      enrolled(2, { progressPct: 25, lastAccessedAt: '2026-10-16T00:00:00' }),
      enrolled(3, { progressPct: 100, completedAt: '2026-10-01T00:00:00', certificateCode: 'LL-1' }),
    ]);
    renderWithIntl(<MyCoursesView />);
    expect(screen.getByText('5 ngày')).toBeInTheDocument();
    expect(screen.getByText('TIẾP TỤC HỌC')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Khóa 2' })).toBeInTheDocument();
    expect(screen.getByText('3 khóa học')).toBeInTheDocument();
    expect(screen.queryByText('Gợi ý cho bạn tiếp theo')).toBeNull();
  });

  it('lọc theo trạng thái Hoàn thành', () => {
    setCourses([enrolled(1), enrolled(2, { progressPct: 100, certificateCode: 'LL-2' })]);
    renderWithIntl(<MyCoursesView />);
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành (1)' }));
    const items = screen.getByTestId('course-items');
    expect(within(items).getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(within(items).getByRole('heading', { name: 'Khóa 2' })).toBeInTheDocument();
  });

  it('tìm không ra thì báo không tìm thấy', () => {
    setCourses([enrolled(1)]);
    renderWithIntl(<MyCoursesView />);
    const input = screen.getByPlaceholderText('Tìm theo tên khóa học…');
    fireEvent.change(input, { target: { value: 'khong-co-khoa-nay' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Không tìm thấy khóa học phù hợp')).toBeInTheDocument();
  });

  it('mọi khóa đã xong: khối chúc mừng và gợi ý khóa tiếp theo', () => {
    setCourses([enrolled(1, { progressPct: 100, completedAt: '2026-10-01T00:00:00', certificateCode: 'LL-1' })]);
    renderWithIntl(<MyCoursesView />);
    expect(screen.getByText('CHÚC MỪNG, BẠN ĐÃ HOÀN THÀNH')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chia sẻ lên hồ sơ' })).toHaveAttribute('href', '/u/7?tab=certificates');
    expect(screen.getByText('Gợi ý cho bạn tiếp theo')).toBeInTheDocument();
    expect(screen.getByTestId('suggestion')).toBeInTheDocument();
  });

  it('dưới 4 khóa mặc định dạng danh sách, từ 4 khóa mặc định dạng thẻ', () => {
    setCourses([enrolled(1), enrolled(2)]);
    const first = renderWithIntl(<MyCoursesView />);
    expect(screen.getByTestId('course-items')).toHaveAttribute('data-view', 'list');
    first.unmount();
    setCourses([enrolled(1), enrolled(2), enrolled(3), enrolled(4)]);
    renderWithIntl(<MyCoursesView />);
    expect(screen.getByTestId('course-items')).toHaveAttribute('data-view', 'grid');
  });

  it('đổi dạng xem thì ghi nhớ trên trình duyệt', () => {
    setCourses([enrolled(1), enrolled(2)]);
    const first = renderWithIntl(<MyCoursesView />);
    fireEvent.click(screen.getByRole('button', { name: 'Dạng thẻ' }));
    expect(screen.getByTestId('course-items')).toHaveAttribute('data-view', 'grid');
    expect(localStorage.getItem('my-courses-view')).toBe('grid');
    first.unmount();
    renderWithIntl(<MyCoursesView />);
    expect(screen.getByTestId('course-items')).toHaveAttribute('data-view', 'grid');
  });
});
