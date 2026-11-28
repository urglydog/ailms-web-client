import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn().mockResolvedValue({ content: [] });
const put = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/api/client', () => ({ api: { get: (...a: unknown[]) => get(...a), put: (...a: unknown[]) => put(...a) }, apiFormData: vi.fn() }));
vi.mock('@/lib/auth/token', () => ({ getAccessToken: () => 'tok' }));

import { qaApi } from './communication';

describe('qaApi (Hỏi đáp giảng viên, 27/11/2026)', () => {
  beforeEach(() => { get.mockClear(); put.mockClear(); });

  it('gửi lọc Chưa đọc / Chưa có câu hay nhất và sắp xếp nhiều trả lời nhất', async () => {
    await qaApi.listQuestions({ unread: true, noBestAnswer: true, sort: 'most_replies', page: 2 });
    const url = String(get.mock.calls[0]?.[0]);
    const qs = new URLSearchParams(url.split('?')[1]);
    expect(qs.get('unread')).toBe('true');
    expect(qs.get('noBestAnswer')).toBe('true');
    expect(qs.get('sort')).toBe('most_replies');
    expect(qs.get('page')).toBe('2');
  });

  it('không gửi cờ lọc khi tắt', async () => {
    await qaApi.listQuestions({});
    const url = String(get.mock.calls[0]?.[0]);
    expect(url).not.toContain('unread');
    expect(url).not.toContain('noBestAnswer');
  });

  it('đặt và bỏ câu trả lời hay nhất', async () => {
    await qaApi.setBestAnswer('q1', 'a1');
    await qaApi.setBestAnswer('q1', null);
    expect(put.mock.calls[0]?.[0]).toBe('/api/v1/instructor/qa/questions/q1/best-answer');
    expect(put.mock.calls[0]?.[1]).toEqual({ answerId: 'a1' });
    expect(put.mock.calls[1]?.[1]).toEqual({ answerId: null });
  });
});
