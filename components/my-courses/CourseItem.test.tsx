import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { EnrolledCourse } from '@/types/domain';
import { CourseRow } from './CourseRow';
import { CourseTile } from './CourseTile';

function makeEnrolled(overrides: Partial<EnrolledCourse> = {}): EnrolledCourse {
  return {
    courseId: 1,
    courseTitle: 'Unity cơ bản',
    courseSlug: 'unity-co-ban',
    thumbnailUrl: null,
    categoryName: 'Lập trình',
    isFree: false,
    price: 100000,
    alreadyReviewed: false,
    progressPct: 60,
    completedAt: null,
    quizScore: null,
    firstLessonId: 10,
    instructorName: 'Trần Thanh Hà',
    myRating: null,
    enrolledAt: '2026-09-01T00:00:00',
    lastAccessedAt: '2026-10-10T00:00:00',
    certificateCode: null,
    resumeLessonId: 12,
    ...overrides,
  };
}

describe.each([
  ['CourseRow', CourseRow],
  ['CourseTile', CourseTile],
])('%s', (_name, Item) => {
  it('khóa đang học: tên khóa dẫn vào bài đang học dở, có chữ Học tiếp, không có nút chứng chỉ', () => {
    renderWithIntl(<Item course={makeEnrolled()} />);
    expect(screen.getByRole('link', { name: 'Unity cơ bản' })).toHaveAttribute('href', '/learn/12');
    expect(screen.getByText('Học tiếp')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Xem chứng chỉ/ })).toBeNull();
  });

  it('lùi về bài đầu khi backend chưa trả bài đang học dở', () => {
    renderWithIntl(<Item course={makeEnrolled({ resumeLessonId: undefined })} />);
    expect(screen.getByRole('link', { name: 'Unity cơ bản' })).toHaveAttribute('href', '/learn/10');
  });

  it('khóa đã hoàn thành có chứng chỉ: hai liên kết khác nhau, không có nút Xem lại', () => {
    renderWithIntl(<Item course={makeEnrolled({ progressPct: 100, certificateCode: 'LL-2026-ABC' })} />);
    expect(screen.getByRole('link', { name: 'Unity cơ bản' })).toHaveAttribute('href', '/learn/12');
    const cert = screen.getByRole('link', { name: /Xem chứng chỉ/ });
    expect(cert).toHaveAttribute('href', '/certificates/LL-2026-ABC');
    expect(cert).toHaveClass('cert-link');
    expect(screen.queryByText('Xem lại')).toBeNull();
    expect(screen.queryByText('Học tiếp')).toBeNull();
  });

  it('khóa hoàn thành nhưng chưa có mã chứng chỉ thì không hiện nút chứng chỉ', () => {
    renderWithIntl(<Item course={makeEnrolled({ progressPct: 100, certificateCode: null })} />);
    expect(screen.queryByRole('link', { name: /Xem chứng chỉ/ })).toBeNull();
  });

  it('thanh tiến độ báo đúng phần trăm', () => {
    renderWithIntl(<Item course={makeEnrolled({ progressPct: 60 })} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  });

  it('hiện giảng viên', () => {
    renderWithIntl(<Item course={makeEnrolled()} />);
    expect(screen.getByText(/Trần Thanh Hà/)).toBeInTheDocument();
  });
});
