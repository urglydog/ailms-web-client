import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ProfileBanner } from './ProfileBanner';

const base = {
  fullName: 'Nguyen Van A',
  avatarUrl: null,
  role: 'STUDENT' as const,
  memberSince: '2026-09-01T00:00:00',
  certificateCount: 2,
  courseCount: 6 as number | null,
};

function setup(overrides: Partial<React.ComponentProps<typeof ProfileBanner>> = {}) {
  const props = { ...base, isOwnProfile: false, streak: null as number | null, onShare: vi.fn(), ...overrides };
  renderWithIntl(<ProfileBanner {...props} />);
  return props;
}

describe('ProfileBanner', () => {
  it('hiện tên, vai trò và ngày tham gia', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Nguyen Van A' })).toBeInTheDocument();
    expect(screen.getByText('Học viên')).toBeInTheDocument();
    expect(screen.getByText(/Thành viên từ/)).toBeInTheDocument();
  });

  it('giảng viên hiện nhãn Giảng viên', () => {
    setup({ role: 'INSTRUCTOR' });
    expect(screen.getByText('Giảng viên')).toBeInTheDocument();
  });

  it('hiện số chứng chỉ và số khóa học', () => {
    setup();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Chứng chỉ')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Khóa học')).toBeInTheDocument();
  });

  it('ẩn số khóa học khi chủ hồ sơ đã ẩn mục đó', () => {
    setup({ courseCount: null });
    expect(screen.queryByText('Khóa học')).toBeNull();
  });

  it('streak chỉ hiện với chính chủ', () => {
    const first = renderWithIntl(<ProfileBanner {...base} isOwnProfile={false} streak={5} onShare={vi.fn()} />);
    expect(screen.queryByText('Ngày streak')).toBeNull();
    first.unmount();
    renderWithIntl(<ProfileBanner {...base} isOwnProfile streak={5} onShare={vi.fn()} />);
    expect(screen.getByText('Ngày streak')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('nút Chia sẻ hồ sơ gọi onShare', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ hồ sơ' }));
    expect(p.onShare).toHaveBeenCalledTimes(1);
  });

  it('chỉ chính chủ có liên kết Cài đặt tài khoản', () => {
    const first = renderWithIntl(<ProfileBanner {...base} isOwnProfile={false} streak={null} onShare={vi.fn()} />);
    expect(screen.queryByRole('link', { name: 'Cài đặt tài khoản' })).toBeNull();
    first.unmount();
    renderWithIntl(<ProfileBanner {...base} isOwnProfile streak={null} onShare={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Cài đặt tài khoản' })).toHaveAttribute('href', '/profile');
  });
});
