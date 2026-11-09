import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { makeCourse } from '@/test/fixtures';
import { renderWithIntl } from '@/test/renderWithIntl';
import { RelatedCourses } from './RelatedCourses';

const useRelated = vi.fn();
vi.mock('@/hooks/useRelatedCourses', () => ({
  useRelatedCourses: (slug: string, id: number) => useRelated(slug, id),
}));
vi.mock('@/components/home/CourseShelf', () => ({
  CourseShelf: ({ title, courses }: { title: string; courses: { title: string }[] }) => (
    <div data-testid="shelf">
      {title}:{courses.map((c) => c.title).join(',')}
    </div>
  ),
}));

describe('RelatedCourses', () => {
  it('lấy khóa cùng danh mục và đưa vào hàng "Khóa học liên quan"', () => {
    useRelated.mockReturnValue({ data: [makeCourse(2), makeCourse(3)] });
    renderWithIntl(<RelatedCourses categorySlug="lap-trinh" courseId={1} />);
    expect(useRelated).toHaveBeenCalledWith('lap-trinh', 1);
    expect(screen.getByTestId('shelf')).toHaveTextContent('Khóa học liên quan:Khóa học 2,Khóa học 3');
  });

  it('chưa tải xong thì không vẽ gì', () => {
    useRelated.mockReturnValue({ data: undefined });
    const { container } = renderWithIntl(<RelatedCourses categorySlug="x" courseId={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
