import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { CourseDetail } from '@/types/domain';
import { makeCourse } from '@/test/fixtures';
import { CourseHero } from './CourseHero';

function detail(overrides: Partial<CourseDetail> = {}): CourseDetail {
  return {
    ...makeCourse(1, { title: 'UI/UX cơ bản', avgRating: 4.5, reviewCount: 1200, level: 'INTERMEDIATE' }),
    description: 'Học thiết kế giao diện từ đầu.',
    status: 'PUBLISHED',
    chapters: [],
    enrolled: false,
    updatedAt: '2026-09-15T00:00:00',
    sourceLanguage: 'Tiếng Anh',
    dubbedLanguages: ['Tiếng Việt', '日本語'],
    learnerCount: 3400,
    requiresPassword: false,
    ...overrides,
  } as CourseDetail;
}

describe('CourseHero', () => {
  it('hiện tên khóa, mô tả và đường dẫn về Kho khóa học', () => {
    renderWithIntl(<CourseHero course={detail()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'UI/UX cơ bản' })).toBeInTheDocument();
    expect(screen.getByText('Học thiết kế giao diện từ đầu.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kho khóa học' })).toHaveAttribute('href', '/courses');
  });

  it('hiện điểm đánh giá, số học viên, cấp độ và giảng viên', () => {
    renderWithIntl(<CourseHero course={detail()} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText(/3\.400 học viên/)).toBeInTheDocument();
    expect(screen.getByText('Trung cấp')).toBeInTheDocument();
    expect(screen.getByText('Trần Thanh Hà')).toBeInTheDocument();
  });

  it('liệt kê các ngôn ngữ đã lồng tiếng', () => {
    renderWithIntl(<CourseHero course={detail()} />);
    expect(screen.getByText('Đã lồng tiếng:')).toBeInTheDocument();
    expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    expect(screen.getByText('日本語')).toBeInTheDocument();
  });

  it('chưa lồng tiếng thì không hiện dòng Đã lồng tiếng', () => {
    renderWithIntl(<CourseHero course={detail({ dubbedLanguages: [] })} />);
    expect(screen.queryByText('Đã lồng tiếng:')).toBeNull();
  });
});
