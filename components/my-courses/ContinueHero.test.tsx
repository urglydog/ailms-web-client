import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { EnrolledCourse } from '@/types/domain';
import { ContinueHero } from './ContinueHero';

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

describe('ContinueHero', () => {
  it('khóa đang học: nút Học tiếp dẫn vào bài đang học dở và có liên kết chi tiết khóa', () => {
    renderWithIntl(<ContinueHero course={makeEnrolled()} profileHref={null} />);
    expect(screen.getByText('TIẾP TỤC HỌC')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Unity cơ bản' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Học tiếp' })).toHaveAttribute('href', '/learn/12');
    expect(screen.getByRole('link', { name: 'Chi tiết khóa học' })).toHaveAttribute('href', '/courses/unity-co-ban');
    expect(screen.getByText(/Hoàn thành 60%/)).toBeInTheDocument();
  });

  it('khóa đã xong: hiện khối chúc mừng với Xem chứng chỉ và Chia sẻ lên hồ sơ', () => {
    renderWithIntl(
      <ContinueHero
        course={makeEnrolled({ progressPct: 100, certificateCode: 'LL-2026-ABC' })}
        profileHref="/u/7?tab=certificates"
      />,
    );
    expect(screen.getByText('CHÚC MỪNG, BẠN ĐÃ HOÀN THÀNH')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem chứng chỉ' })).toHaveAttribute('href', '/certificates/LL-2026-ABC');
    expect(screen.getByRole('link', { name: 'Chia sẻ lên hồ sơ' })).toHaveAttribute('href', '/u/7?tab=certificates');
    expect(screen.queryByRole('link', { name: 'Học tiếp' })).toBeNull();
  });

  it('khóa đã xong nhưng chưa có chứng chỉ thì không hiện nút chứng chỉ', () => {
    renderWithIntl(<ContinueHero course={makeEnrolled({ progressPct: 100 })} profileHref={null} />);
    expect(screen.queryByRole('link', { name: 'Xem chứng chỉ' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Chia sẻ lên hồ sơ' })).toBeNull();
  });
});
