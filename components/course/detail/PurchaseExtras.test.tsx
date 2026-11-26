import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { PromoCountdown, ShareGiftButtons, remaining } from './PurchaseExtras';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('PurchaseExtras', () => {
  it('remaining: null khi đã hết hạn hoặc còn quá 30 ngày', () => {
    const now = Date.parse('2026-11-26T00:00:00Z');
    expect(remaining('2026-11-25T00:00:00Z', now)).toBeNull();
    expect(remaining('2027-02-01T00:00:00Z', now)).toBeNull();
    expect(remaining('2026-11-27T02:03:04Z', now)).toEqual({ d: 1, h: 2, m: 3, s: 4 });
  });

  it('đếm ngược khi ưu đãi sắp kết thúc', () => {
    const ends = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    renderWithIntl(<PromoCountdown endsAt={ends} />);
    expect(screen.getByText(/Ưu đãi kết thúc sau/)).toBeInTheDocument();
  });

  it('chia sẻ chép link khi không có chia sẻ gốc; Tặng là "Sắp ra mắt"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderWithIntl(<ShareGiftButtons title="Java" slug="java" />);
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/courses/java')));
    expect(screen.getByRole('button', { name: /Tặng khóa học/ })).toHaveAttribute('aria-disabled', 'true');
  });
});
