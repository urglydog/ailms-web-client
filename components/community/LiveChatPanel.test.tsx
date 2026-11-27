import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '@/hooks/useCommunitySocket';
import { applyBestAnswer } from '@/hooks/useCommunitySocket';

const setBestAnswer = vi.fn().mockResolvedValue(undefined);
let messages: ChatMessage[] = [];

vi.mock('@/hooks/useCommunitySocket', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useCommunitySocket')>();
  return { ...actual, useCommunitySocket: () => ({ messages, sendMessage: vi.fn(), setBestAnswer }) };
});

import { LiveChatPanel } from './LiveChatPanel';

function msg(id: string, senderId: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id, senderId, senderName: `U${senderId}`, senderAvatarUrl: null, content: `nội dung ${id}`,
    timestamp: '2026-11-27T00:00:00Z', isInstructor: false, ...extra,
  };
}

describe('applyBestAnswer', () => {
  it('chỉ đổi câu hỏi gốc tương ứng, chuỗi rỗng = bỏ đánh dấu', () => {
    const list = [msg('q1', '2', { bestAnswerId: 'a1' }), msg('q2', '3')];
    expect(applyBestAnswer(list, 'q2', 'a9')[1]?.bestAnswerId).toBe('a9');
    expect(applyBestAnswer(list, 'q1', '')[0]?.bestAnswerId).toBeNull();
    expect(applyBestAnswer(list, 'q1', '')[1]).toBe(list[1]);
  });
});

describe('LiveChatPanel — câu trả lời hay nhất', () => {
  beforeEach(() => setBestAnswer.mockClear());

  it('hiện huy hiệu cho câu hay nhất và ghim nó lên đầu danh sách trả lời', () => {
    messages = [
      msg('q1', '2', { bestAnswerId: 'a2' }),
      msg('a1', '3', { parentId: 'q1', timestamp: '2026-11-27T01:00:00Z' }),
      msg('a2', '4', { parentId: 'q1', timestamp: '2026-11-27T02:00:00Z' }),
    ];
    render(<LiveChatPanel lessonId={1} userName="Khách" currentUserId="9" />);
    expect(screen.getByText(/Câu trả lời hay nhất/)).toBeInTheDocument();
    const contents = screen.getAllByText(/nội dung a/).map((n) => n.textContent);
    expect(contents).toEqual(['nội dung a2', 'nội dung a1']);
    // Người xem không phải người hỏi/giảng viên -> không có nút đánh dấu.
    expect(screen.queryByRole('button', { name: /Đánh dấu là câu trả lời hay nhất/ })).toBeNull();
  });

  it('người hỏi đánh dấu / bỏ đánh dấu được', () => {
    messages = [msg('q1', '2', { bestAnswerId: null }), msg('a1', '3', { parentId: 'q1' })];
    const { rerender } = render(<LiveChatPanel lessonId={1} userName="U2" currentUserId="2" />);
    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu là câu trả lời hay nhất' }));
    expect(setBestAnswer).toHaveBeenCalledWith('q1', 'a1');

    messages = [msg('q1', '2', { bestAnswerId: 'a1' }), msg('a1', '3', { parentId: 'q1' })];
    rerender(<LiveChatPanel lessonId={1} userName="U2" currentUserId="2" />);
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ đánh dấu hay nhất' }));
    expect(setBestAnswer).toHaveBeenLastCalledWith('q1', null);
  });

  it('giảng viên khoá (đã từng trả lời với nhãn Giảng viên) cũng đánh dấu được', () => {
    messages = [msg('q1', '2'), msg('a1', '3', { parentId: 'q1' }), msg('a2', '1', { parentId: 'q1', isInstructor: true })];
    render(<LiveChatPanel lessonId={1} userName="GV" currentUserId="1" />);
    expect(screen.getAllByRole('button', { name: 'Đánh dấu là câu trả lời hay nhất' })).toHaveLength(2);
  });
});
