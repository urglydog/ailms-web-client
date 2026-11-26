import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { TutorSuggestions } from './TutorSuggestions';

vi.mock('@/hooks/useLessonNotes', () => ({
  useTutorSuggestions: () => ({
    data: [
      { text: 'Khi nào dùng thì hiện tại?', source: 'POPULAR', key: null, params: {} },
      { text: 'Tóm tắt bài X', source: 'TEMPLATE', key: 'summary', params: { lesson: 'Thì hiện tại' } },
      { text: 'x', source: 'TEMPLATE', key: 'relation', params: { lesson: 'A', previous: 'Mở đầu' } },
    ],
  }),
}));

describe('TutorSuggestions', () => {
  it('hiện câu phổ biến nguyên văn, câu mẫu theo ngôn ngữ giao diện; bấm thẻ là gửi', () => {
    const onPick = vi.fn();
    renderWithIntl(<TutorSuggestions lessonId={1} onPick={onPick} />);
    expect(screen.getByText('Khi nào dùng thì hiện tại?')).toBeInTheDocument();
    expect(screen.getByText('Bài này liên quan gì tới Mở đầu?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tóm tắt bài Thì hiện tại' }));
    expect(onPick).toHaveBeenCalledWith('Tóm tắt bài Thì hiện tại');
  });
});
