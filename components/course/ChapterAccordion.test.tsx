import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { Chapter } from '@/types/domain';
import { ChapterAccordion } from './ChapterAccordion';

const lesson = (id: number, isPreview = false) => ({
  id,
  title: `Bài ${id}`,
  durationSec: 120,
  displayOrder: id,
  isPreview,
  status: 'PUBLISHED',
}) as unknown as Chapter['lessons'][number];

const CHAPTERS: Chapter[] = [
  { id: 1, title: 'Chương A', displayOrder: 1, lessons: [lesson(11, true), lesson(12)] },
  { id: 2, title: 'Chương B', displayOrder: 2, lessons: [lesson(21)] },
];

describe('ChapterAccordion', () => {
  it('Mở rộng tất cả mở mọi chương, bấm lại thì thu gọn', () => {
    renderWithIntl(<ChapterAccordion chapters={CHAPTERS} enrolled={false} summary="2 chương" />);
    expect(screen.getByText('2 chương')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chương B/ })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng tất cả' }));
    expect(screen.getByRole('button', { name: /Chương B/ })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn tất cả' }));
    expect(screen.getByRole('button', { name: /Chương A/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('bài học thử có liên kết Xem thử khi chưa sở hữu', () => {
    renderWithIntl(<ChapterAccordion chapters={CHAPTERS} enrolled={false} />);
    expect(screen.getByRole('link', { name: 'Xem thử' })).toHaveAttribute('href', '/learn/11');
  });
});
