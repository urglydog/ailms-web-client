import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { SystemHealth } from './SystemHealth';

const metrics = { ram: { used: 900, total: 1000 }, disk: { used: 100, total: 1000 }, uptime: 90_061_000 };

describe('SystemHealth', () => {
  it('chưa có số liệu thì báo đang tải', () => {
    renderWithIntl(<SystemHealth metrics={undefined} onRefresh={vi.fn()} />);
    expect(screen.getByText('Đang tải thông số...')).toBeInTheDocument();
  });

  it('hiện RAM, ổ đĩa kèm thanh tiến độ có giá trị và uptime', () => {
    renderWithIntl(<SystemHealth metrics={metrics} onRefresh={vi.fn()} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars.map((b) => b.getAttribute('aria-valuenow'))).toEqual(['90', '10']);
    expect(screen.getByText('1d 1h 1m')).toBeInTheDocument();
    expect(bars[0]).toHaveAttribute('data-tone', 'critical');
    expect(bars[1]).toHaveAttribute('data-tone', 'ok');
  });

  it('nút Làm mới gọi onRefresh', () => {
    const onRefresh = vi.fn();
    renderWithIntl(<SystemHealth metrics={metrics} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
    expect(onRefresh).toHaveBeenCalled();
  });
});
