import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { RankingBanner } from '@/components/ranking/RankingBanner';

const state: { leaderboard: unknown; user: unknown; mine: unknown } = { leaderboard: [], user: null, mine: null };

vi.mock('@/hooks/useRanking', () => ({
  useLeaderboard: () => ({ data: state.leaderboard, isLoading: false }),
  useMyRanking: () => ({ data: state.mine }),
}));
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ data: state.user }) }));

beforeEach(() => {
  state.leaderboard = [
    { rank: 1, userId: 1, fullName: 'An', avatarUrl: null, totalXp: 900 },
    { rank: 2, userId: 2, fullName: 'Bình', avatarUrl: null, totalXp: 700 },
  ];
  state.user = null;
  state.mine = null;
});

describe('RankingBanner', () => {
  it('có tiêu đề, danh sách top và liên kết Xem toàn bộ tới trang cộng đồng', () => {
    renderWithIntl(<RankingBanner />);
    expect(screen.getByRole('link', { name: 'Bảng xếp hạng cộng đồng' })).toHaveAttribute('href', '/community');
    expect(screen.getByText('An')).toBeInTheDocument();
    expect(screen.getByText('900 XP')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem toàn bộ/ })).toHaveAttribute('href', '/community');
  });

  it('chưa có ai thì không vẽ gì', () => {
    state.leaderboard = [];
    const { container } = renderWithIntl(<RankingBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('người dùng ngoài top thì ghim vị trí của mình', () => {
    state.user = { id: 99 };
    state.mine = { ranked: true, rank: 12, totalXp: 120 };
    renderWithIntl(<RankingBanner />);
    expect(screen.getByText('Vị trí của bạn: #12 · 120 XP')).toBeInTheDocument();
  });
});
