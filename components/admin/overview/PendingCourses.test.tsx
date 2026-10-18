import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { InstructorCourseSummary } from '@/types/domain';
import { PendingCourses } from './PendingCourses';

const course = (over: Partial<InstructorCourseSummary>): InstructorCourseSummary => ({
  id: 1, title: 'Khóa A', slug: 'a', status: 'PENDING', thumbnailUrl: null, categoryName: 'Lập trình', price: 0, isFree: true,
  avgRating: 0, totalLessons: 5, createdAt: '2026-10-01T00:00:00Z', completionPercent: 100, ...over,
});

describe('PendingCourses', () => {
  it('rỗng thì báo không có khóa nào chờ duyệt', () => {
    renderWithIntl(<PendingCourses courses={[]} total={0} />);
    expect(screen.getByText('Không có khóa học nào đang chờ duyệt.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Xem tất cả/ })).toBeNull();
  });

  it('mỗi khóa có liên kết Duyệt tới trang kiểm duyệt, và có liên kết Xem tất cả kèm tổng', () => {
    renderWithIntl(<PendingCourses courses={[course({}), course({ id: 2, title: 'Khóa B' })]} total={7} />);
    expect(screen.getByText('Khóa A')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: /^Duyệt/ });
    expect(links[0]).toHaveAttribute('href', '/admin/moderation/1');
    expect(screen.getByRole('link', { name: 'Xem tất cả (7)' })).toHaveAttribute('href', '/admin/moderation');
  });
});
