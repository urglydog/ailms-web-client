import { act, fireEvent, screen } from '@testing-library/react';
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

  it('bắt đầu ở bước 1 với nhãn Chọn khóa học', () => {
    renderWithIntl(<HeroDemo />);
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Chọn khóa học');
    expect(screen.getByRole('button', { name: /Đi tới bước 1/ })).toHaveAttribute('aria-current', 'step');
  });

  it('tự chuyển sang bước sau sau 3,8 giây và quay vòng', () => {
    renderWithIntl(<HeroDemo />);
    act(() => void vi.advanceTimersByTime(3800));
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Chọn ngôn ngữ');
    act(() => void vi.advanceTimersByTime(3800));
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Hỏi gia sư AI');
    act(() => void vi.advanceTimersByTime(3800));
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Chọn khóa học');
  });

  it('bấm vạch tiến độ thì nhảy tới bước đó', () => {
    renderWithIntl(<HeroDemo />);
    fireEvent.click(screen.getByRole('button', { name: /Đi tới bước 3/ }));
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Hỏi gia sư AI');
    expect(screen.getByRole('button', { name: /Đi tới bước 3/ })).toHaveAttribute('aria-current', 'step');
  });

  it('ở bước 2 ngôn ngữ đổi liên tục, bắt đầu từ Tiếng Việt', () => {
    renderWithIntl(<HeroDemo />);
    fireEvent.click(screen.getByRole('button', { name: /Đi tới bước 2/ }));
    expect(screen.getByTestId('lang-label')).toHaveTextContent('Tiếng Việt');
    act(() => void vi.advanceTimersByTime(900));
    expect(screen.getByTestId('lang-label')).toHaveTextContent('日本語');
  });

  it('bước 3 hiện câu hỏi và câu trả lời của gia sư', () => {
    renderWithIntl(<HeroDemo />);
    fireEvent.click(screen.getByRole('button', { name: /Đi tới bước 3/ }));
    expect(screen.getByText('Component là gì?')).toBeInTheDocument();
    expect(screen.getByText(/Hãy thử nghĩ về một món đồ lắp ghép/)).toBeInTheDocument();
  });

  it('giảm chuyển động thì không tự chuyển bước', () => {
    stubReducedMotion(true);
    renderWithIntl(<HeroDemo />);
    act(() => void vi.advanceTimersByTime(20000));
    expect(screen.getByTestId('step-badge')).toHaveTextContent('Chọn khóa học');
  });
});
