import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { HeroDemo } from './HeroDemo';

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('HeroDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubReducedMotion(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('có vùng mô tả cho trình đọc màn hình và nhãn bước 1', () => {
    renderWithIntl(<HeroDemo />);
    expect(screen.getByRole('img', { name: 'Video demo lồng tiếng AI' })).toBeInTheDocument();
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Chọn khóa học');
  });

  it('danh sách khóa học có ảnh, tên và không còn thanh Xem trước', () => {
    renderWithIntl(<HeroDemo />);
    expect(screen.getAllByText('UI/UX Design Basics').length).toBeGreaterThan(0);
    expect(screen.getByText('Nhập môn Trí tuệ nhân tạo')).toBeInTheDocument();
    expect(screen.queryByText('Xem trước')).toBeNull();
  });

  it('kịch bản chạy sang bước 2 rồi bước 3 theo thời gian', async () => {
    renderWithIntl(<HeroDemo />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12000);
    });
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Chọn ngôn ngữ');
  });

  it('giảm chuyển động thì dừng ở cảnh hỏi gia sư đã có câu trả lời và mốc 02:15', async () => {
    stubReducedMotion(true);
    renderWithIntl(<HeroDemo />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Hỏi gia sư AI');
    expect(screen.getAllByText('Auto layout trong Figma dùng để làm gì?').length).toBeGreaterThan(0);
    expect(screen.getByText('02:15')).toBeInTheDocument();
  });

  it('tháo component thì dừng kịch bản, không còn bộ hẹn giờ', () => {
    const { unmount } = renderWithIntl(<HeroDemo />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
