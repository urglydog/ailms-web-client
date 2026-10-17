import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ProfileTabs } from './ProfileTabs';

describe('ProfileTabs', () => {
  it('Chứng chỉ đứng đầu, kèm số lượng, và là tab đang chọn khi truyền vào', () => {
    renderWithIntl(<ProfileTabs active="certificates" certificateCount={2} onChange={vi.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Chứng chỉ (2)', 'Đã học', 'Yêu thích']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('không hiện số khi chưa có chứng chỉ', () => {
    renderWithIntl(<ProfileTabs active="courses" certificateCount={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('tab')[0]).toHaveTextContent(/^Chứng chỉ$/);
  });

  it('bấm tab thì gọi onChange với khóa tương ứng', () => {
    const onChange = vi.fn();
    renderWithIntl(<ProfileTabs active="certificates" certificateCount={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Yêu thích' }));
    expect(onChange).toHaveBeenCalledWith('wishlist');
  });

  it('có vùng tablist có tên', () => {
    renderWithIntl(<ProfileTabs active="certificates" certificateCount={1} onChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
  it('chỉ tab đang chọn nằm trong thứ tự Tab, mũi tên trái/phải đổi tab', () => {
    const onChange = vi.fn();
    renderWithIntl(<ProfileTabs active="certificates" certificateCount={1} onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('courses');
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('wishlist');
  });
});
