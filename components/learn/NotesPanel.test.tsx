import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { NotesPanel } from './NotesPanel';

const createMutate = vi.fn();
vi.mock('@/hooks/useLessonNotes', () => ({
  useLessonNotes: () => ({
    data: [
      { id: 1, lessonId: 7, lessonTitle: 'Bài 7', courseId: 1, timestampSec: 75, content: 'Ý chính', createdAt: '', updatedAt: null },
    ],
    isLoading: false,
    isError: false,
  }),
  useCreateNote: () => ({ mutate: createMutate, isPending: false }),
  useUpdateNote: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteNote: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('NotesPanel', () => {
  it('tạo ghi chú gắn đúng mốc đang phát', () => {
    renderWithIntl(<NotesPanel lessonId={7} currentSec={125.6} onSeek={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Tạo ghi chú tại 2:05/ }));
    fireEvent.change(screen.getByLabelText('Ghi chú mới tại 2:05'), { target: { value: '  nhớ ôn  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }));
    expect(createMutate).toHaveBeenCalledWith({ timestampSec: 125, content: 'nhớ ôn' }, expect.anything());
  });

  it('bấm mốc thời gian thì tua tới đúng bài và giây', () => {
    const onSeek = vi.fn();
    renderWithIntl(<NotesPanel lessonId={7} currentSec={0} onSeek={onSeek} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tua video tới 1:15' }));
    expect(onSeek).toHaveBeenCalledWith(75, 7);
  });
});
