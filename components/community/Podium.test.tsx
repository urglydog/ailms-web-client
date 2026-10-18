import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { LeaderboardEntry } from '@/types/domain';
import { Podium } from './Podium';

function e(rank: number, name: string, xp: number): LeaderboardEntry {
  return { rank, userId: rank * 10, fullName: name, avatarUrl: null, totalXp: xp } as LeaderboardEntry;
}

describe('Podium', () => {
  it('hiện top 3 theo thứ tự bục: hạng 2, hạng 1, hạng 3, mỗi người là liên kết tới hồ sơ', () => {
    renderWithIntl(<Podium entries={[e(1, 'An', 900), e(2, 'Bình', 700), e(3, 'Chi', 500)]} currentUserId={null} />);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([expect.stringContaining('Bình'), expect.stringContaining('An'), expect.stringContaining('Chi')]);
    expect(links[1]).toHaveAttribute('href', '/u/10?tab=certificates');
    expect(screen.getByText('900 XP')).toBeInTheDocument();
  });

  it('ít hơn 3 người thì chỉ hiện những người có', () => {
    renderWithIntl(<Podium entries={[e(1, 'An', 900)]} currentUserId={null} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('không có ai thì không vẽ gì', () => {
    const { container } = renderWithIntl(<Podium entries={[]} currentUserId={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('đánh dấu chính mình', () => {
    renderWithIntl(<Podium entries={[e(1, 'An', 900)]} currentUserId={10} />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'true');
  });
});
