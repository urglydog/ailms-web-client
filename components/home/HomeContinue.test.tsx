import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { EnrolledCourse } from '@/types/domain';
import { HomeContinue } from './HomeContinue';

const user = vi.fn();
const enrollments = vi.fn<() => EnrolledCourse[]>(() => []);
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ data: user() }) }));
vi.mock('@/hooks/useEnrollments', () => ({ useMyEnrollments: () => ({ data: enrollments() }) }));
vi.mock('@/hooks/useStreak', () => ({
  useStreak: () => ({ data: { currentStreak: 5, longestStreak: 9, hasStudiedToday: true, learningDays: [], freezesRemaining: 1, justFrozen: false } }),
}));
vi.mock('./CourseShelf', () => ({ CourseShelf: ({ title }: { title: string }) => <h2>{title}</h2> }));

function course(over: Partial<EnrolledCourse>): EnrolledCourse {
  return {
    courseId: 1, courseTitle: 'Tiếng Nhật N5', courseSlug: 'n5', thumbnailUrl: null, categoryName: 'Tiếng Nhật',
    isFree: true, price: 0, alreadyReviewed: false, progressPct: 30, completedAt: null, quizScore: null,
    firstLessonId: 11, instructorName: 'A', myRating: null, enrolledAt: '2026-11-01T00:00:00',
    lastAccessedAt: '2026-11-20T00:00:00', certificateCode: null, resumeLessonId: 12,
    resumeLessonTitle: 'Bảng chữ Hiragana', resumeLessonDurationSec: 600, ...over,
  };
}

describe('HomeContinue', () => {
  it('khách chưa đăng nhập thì không vẽ gì', () => {
    user.mockReturnValue(undefined);
    const { container } = renderWithIntl(<HomeContinue />);
    expect(container).toBeEmptyDOMElement();
  });

  it('đã đăng nhập thì hiện Tiếp tục học và chuỗi ngày học', () => {
    user.mockReturnValue({ id: 1 });
    renderWithIntl(<HomeContinue />);
    expect(screen.getByRole('heading', { name: 'Tiếp tục học' })).toBeInTheDocument();
    expect(screen.getByText('Chuỗi 5 ngày')).toBeInTheDocument();
  });

  it('hiện hàng thẻ bài đang học dở và kệ "Vì bạn đã xem" cùng danh mục', () => {
    user.mockReturnValue({ id: 1 });
    enrollments.mockReturnValue([course({}), course({ courseId: 2, courseTitle: 'Xong rồi', progressPct: 100 })]);
    renderWithIntl(
      <HomeContinue categoryCourses={[{ slug: 'jp', name: 'Tiếng Nhật', courses: [] }]} />,
    );
    const link = screen.getByRole('link', { name: /Bảng chữ Hiragana/ });
    expect(link).toHaveAttribute('href', '/learn/12');
    expect(screen.getByText('Bài giảng · 10 phút · 30% khoá')).toBeInTheDocument();
    expect(screen.queryByText('Xong rồi')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vì bạn đã xem “Tiếng Nhật N5”' })).toBeInTheDocument();
  });
});
