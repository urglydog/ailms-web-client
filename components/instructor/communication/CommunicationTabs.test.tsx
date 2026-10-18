import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CommunicationTabs } from './CommunicationTabs';

describe('CommunicationTabs', () => {
  it('có 4 liên kết: Hỏi đáp, Tin nhắn, Bài tập, Thông báo', () => {
    renderWithIntl(<CommunicationTabs pathname="/instructor/communication/qa" />);
    expect(screen.getByRole('navigation', { name: 'Các mục giao tiếp' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hỏi đáp' })).toHaveAttribute('href', '/instructor/communication/qa');
    expect(screen.getByRole('link', { name: 'Tin nhắn' })).toHaveAttribute('href', '/instructor/communication/messages');
    expect(screen.getByRole('link', { name: 'Bài tập' })).toHaveAttribute('href', '/instructor/communication/assignments');
    expect(screen.getByRole('link', { name: 'Thông báo' })).toHaveAttribute('href', '/instructor/communication/announcements');
  });

  it('đánh dấu mục đang mở bằng aria-current', () => {
    renderWithIntl(<CommunicationTabs pathname="/instructor/communication/assignments" />);
    expect(screen.getByRole('link', { name: 'Bài tập' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Hỏi đáp' })).not.toHaveAttribute('aria-current');
  });
});
