import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { NotificationItem } from '@/lib/notifications/groups';
import { NotificationMenu } from './NotificationMenu';

function n(id: number, overrides: Partial<NotificationItem> = {}): NotificationItem {
  return { id, title: `Tin ${id}`, content: `Nội dung ${id}`, linkUrl: null, isRead: false, createdAt: '2026-10-01T00:00:00', ...overrides };
}

function setup(list: NotificationItem[], overrides: Partial<React.ComponentProps<typeof NotificationMenu>> = {}) {
  const props = {
    notifications: list,
    unreadCount: list.filter((x) => !x.isRead).length,
    onMarkRead: vi.fn(),
    onMarkAllRead: vi.fn(),
    onOpenLink: vi.fn(),
    ...overrides,
  };
  renderWithIntl(<NotificationMenu {...props} />);
  return props;
}

describe('NotificationMenu', () => {
  it('tab Tin chính hiện tin thường, tab Hệ thống hiện tin hệ thống', () => {
    setup([n(1), n(2, { type: 'SYSTEM_ANNOUNCEMENT' })]);
    expect(screen.getByText('Tin 1')).toBeInTheDocument();
    expect(screen.queryByText('Tin 2')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: /Hệ thống/ }));
    expect(screen.getByText('Tin 2')).toBeInTheDocument();
    expect(screen.queryByText('Tin 1')).toBeNull();
  });

  it('tab Chưa đọc chỉ hiện tin chưa đọc và có nhãn đúng nghĩa', () => {
    setup([n(1, { isRead: true }), n(2)]);
    fireEvent.click(screen.getByRole('tab', { name: /Chưa đọc/ }));
    expect(screen.getByText('Tin 2')).toBeInTheDocument();
    expect(screen.queryByText('Tin 1')).toBeNull();
  });

  it('không có thông báo thì báo trống', () => {
    setup([]);
    expect(screen.getByText('Không có thông báo nào')).toBeInTheDocument();
  });

  it('bấm tin chưa đọc thì đánh dấu đã đọc, có liên kết thì mở liên kết', () => {
    const p = setup([n(1, { linkUrl: '/courses/x' })]);
    fireEvent.click(screen.getByRole('button', { name: /Tin 1/ }));
    expect(p.onMarkRead).toHaveBeenCalledWith(1);
    expect(p.onOpenLink).toHaveBeenCalledWith('/courses/x');
  });

  it('tin đã đọc không đánh dấu lại, tin không liên kết không điều hướng', () => {
    const p = setup([n(1, { isRead: true })]);
    fireEvent.click(screen.getByRole('button', { name: /Tin 1/ }));
    expect(p.onMarkRead).not.toHaveBeenCalled();
    expect(p.onOpenLink).not.toHaveBeenCalled();
  });

  it('nút Đánh dấu đã đọc chỉ hiện khi còn tin chưa đọc', () => {
    const first = setup([n(1)]);
    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' }));
    expect(first.onMarkAllRead).toHaveBeenCalled();
  });

  it('hết tin chưa đọc thì ẩn nút Đánh dấu đã đọc', () => {
    setup([n(1, { isRead: true })]);
    expect(screen.queryByRole('button', { name: 'Đánh dấu đã đọc' })).toBeNull();
  });
});
