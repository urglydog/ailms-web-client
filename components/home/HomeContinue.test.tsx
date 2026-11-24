import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { HomeContinue } from './HomeContinue';

const user = vi.fn();
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ data: user() }) }));
vi.mock('@/hooks/useEnrollments', () => ({ useMyEnrollments: () => ({ data: [] }) }));
vi.mock('@/hooks/useStreak', () => ({
  useStreak: () => ({ data: { currentStreak: 5, longestStreak: 9, hasStudiedToday: true, learningDays: [], freezesRemaining: 1, justFrozen: false } }),
}));

describe('HomeContinue', () => {
  it('khách chưa đăng nhập thì không vẽ gì', () => {
    user.mockReturnValue(undefined);
    const { container } = renderWithIntl(<HomeContinue />);
    expect(container).toBeEmptyDOMElement();
  });

  it('đã đăng nhập thì hiện Tiếp tục học và chuỗi ngày học', () => {
    user.mockReturnValue({ id: 1 });
    renderWithIntl(<HomeContinue />);
    expect(screen.getByRole('heading', { name: 'Tiếp tục học' })).toBeInTheDocument();
    expect(screen.getByText('Chuỗi 5 ngày')).toBeInTheDocument();
  });
});
