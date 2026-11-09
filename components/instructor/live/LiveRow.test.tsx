import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { LiveRow } from './LiveRow';

const base = { id: 5, title: 'Buổi 1: Giới thiệu', courseTitle: 'UI/UX cơ bản' };

describe('LiveRow', () => {
  it('hiện tiêu đề, khóa học và trạng thái Sắp live kèm liên kết xem chi tiết', () => {
    renderWithIntl(<LiveRow session={{ ...base, status: 'SCHEDULED' }} />);
    expect(screen.getByText('Buổi 1: Giới thiệu')).toBeInTheDocument();
    expect(screen.getByText('UI/UX cơ bản')).toBeInTheDocument();
    expect(screen.getByText('Sắp live')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem chi tiết/ })).toHaveAttribute('href', '/instructor/live/5');
  });

  it('đang live thì nổi bật và liên kết là Vào phòng', () => {
    renderWithIntl(<LiveRow session={{ ...base, status: 'LIVE' }} />);
    expect(screen.getByText('Đang live')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Vào phòng/ })).toHaveAttribute('href', '/instructor/live/5');
  });

  it('đã kết thúc', () => {
    renderWithIntl(<LiveRow session={{ ...base, status: 'ENDED' }} />);
    expect(screen.getByText('Đã kết thúc')).toBeInTheDocument();
  });
});
