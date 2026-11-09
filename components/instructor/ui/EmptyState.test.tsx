import { render, screen } from '@testing-library/react';
import { Video } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('hiện tiêu đề và mô tả', () => {
    render(<EmptyState icon={Video} title="Chưa có buổi live" body="Tạo buổi live đầu tiên." />);
    expect(screen.getByText('Chưa có buổi live')).toBeInTheDocument();
    expect(screen.getByText('Tạo buổi live đầu tiên.')).toBeInTheDocument();
  });

  it('có hành động thì hiện liên kết dẫn tới đích', () => {
    render(<EmptyState icon={Video} title="T" action={{ href: '/instructor/live/new', label: 'Tạo buổi live' }} />);
    expect(screen.getByRole('link', { name: 'Tạo buổi live' })).toHaveAttribute('href', '/instructor/live/new');
  });

  it('không có hành động thì không có liên kết', () => {
    render(<EmptyState icon={Video} title="T" />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
