import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { CourseResource } from '@/lib/api/courseResourcesApi';
import type { ChapterNav } from '@/types/domain';
import { LessonSidebar } from './LessonSidebar';

const CHAPTERS: ChapterNav[] = [
  {
    chapterId: 1,
    chapterTitle: 'Chương 1',
    displayOrder: 1,
    lessons: [
      { lessonId: 21, lessonTitle: 'Bài 1', displayOrder: 1, durationSec: 267, isPreview: false, isCompleted: true },
      { lessonId: 22, lessonTitle: 'Bài 2', displayOrder: 2, durationSec: 81, isPreview: false, isCompleted: false },
      { lessonId: 23, lessonTitle: 'Bài 3', displayOrder: 3, durationSec: 1466, isPreview: false, isCompleted: false },
    ],
  },
];

function resource(id: number, lessonId: number | ''): CourseResource {
  return { id, title: `Tài liệu ${id}`, fileUrl: 'x', fileSize: 1, fileType: 'pdf', chapterId: '', lessonId, createdAt: '' };
}

describe('LessonSidebar', () => {
  it('liệt kê chương và bài, mỗi bài là liên kết tới trang học của bài đó', () => {
    renderWithIntl(<LessonSidebar chapters={CHAPTERS} currentLessonId={22} />);
    expect(screen.getByText('Chương 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bài 1/ })).toHaveAttribute('href', '/learn/21');
    expect(screen.getByRole('link', { name: /Bài 3/ })).toHaveAttribute('href', '/learn/23');
  });

  it('đánh dấu bài đang học bằng aria-current', () => {
    renderWithIntl(<LessonSidebar chapters={CHAPTERS} currentLessonId={22} />);
    expect(screen.getByRole('link', { name: /Bài 2/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: /Bài 1/ })).not.toHaveAttribute('aria-current');
  });

  it('báo trạng thái từng bài cho trình đọc màn hình: đã hoàn thành, đang học, chưa học', () => {
    renderWithIntl(<LessonSidebar chapters={CHAPTERS} currentLessonId={22} />);
    expect(within(screen.getByRole('link', { name: /Bài 1/ })).getByLabelText('Đã hoàn thành')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Bài 2/ })).getByLabelText('Đang học')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Bài 3/ })).getByLabelText('Chưa học')).toBeInTheDocument();
  });

  it('hiện thời lượng từng bài', () => {
    renderWithIntl(<LessonSidebar chapters={CHAPTERS} currentLessonId={22} />);
    expect(within(screen.getByRole('link', { name: /Bài 2/ })).getByText('1:21')).toBeInTheDocument();
  });

  it('không còn nút Tài nguyên lặp lại ở từng bài', () => {
    renderWithIntl(<LessonSidebar chapters={CHAPTERS} currentLessonId={22} resources={[resource(1, 23)]} />);
    expect(screen.queryByRole('button', { name: /Tài nguyên/ })).toBeNull();
  });

  it('chỉ bài có tài liệu đính kèm mới có biểu tượng kẹp giấy', () => {
    renderWithIntl(<LessonSidebar chapters={CHAPTERS} currentLessonId={22} resources={[resource(1, 23)]} />);
    expect(within(screen.getByRole('link', { name: /Bài 3/ })).getByLabelText('Có tài liệu đính kèm')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Bài 1/ })).queryByLabelText('Có tài liệu đính kèm')).toBeNull();
  });
});
