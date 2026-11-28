import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { AiJobQueueManager } from './AiJobQueueManager';

const retry = vi.fn();
const state: { isError: boolean } = { isError: false };
const job = {
  id: 7, courseTitle: 'Tiếng Anh', lessonTitle: 'Bài 1', targetLanguage: 'vi', status: 'FAILED', superseded: false, retryable: true,
  doneChunks: 1, totalChunks: 4, progressPercent: 25, retryCount: 1, createdAt: '2026-11-20T10:00:00Z', finishedAt: null, errorMessage: 'timeout',
  requestedByName: 'GV', requestedByEmail: 'gv@lms.local',
};
vi.mock('@/hooks/useAiJobs', () => ({
  useAiJobs: () => (state.isError
    ? { data: undefined, isLoading: false, isError: true, refetch: vi.fn() }
    : { data: { content: [job], totalPages: 1, totalElements: 1 }, isLoading: false, isError: false, refetch: vi.fn() }),
  useRetryAiJob: () => ({ mutate: retry, isPending: false }),
}));

describe('AiJobQueueManager', () => {
  it('hỏi xác nhận trước khi thử lại job', () => {
    state.isError = false;
    renderWithIntl(<AiJobQueueManager />);
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại: Bài 1' }));
    expect(screen.getByRole('alertdialog', { name: 'Thử lại lồng tiếng?' })).toBeInTheDocument();
    expect(retry).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Thử lại' }).at(-1)!);
    expect(retry).toHaveBeenCalledWith(7, expect.anything());
  });

  it('báo lỗi tải thay vì danh sách trống', () => {
    state.isError = true;
    renderWithIntl(<AiJobQueueManager />);
    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được dữ liệu');
  });
});
