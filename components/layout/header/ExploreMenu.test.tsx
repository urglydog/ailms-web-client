import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ExploreMenu } from './ExploreMenu';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

const CATEGORIES = [
  { id: 1, name: 'Lập trình', slug: 'lap-trinh' },
  { id: 2, name: 'Ngoại ngữ', slug: 'ngoai-ngu' },
];

describe('ExploreMenu', () => {
  it('đóng lúc đầu, bấm nút Khám phá thì mở và liệt kê danh mục', () => {
    renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow={false} />);
    expect(screen.queryByRole('link', { name: 'Lập trình' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Khám phá/ }));
    expect(screen.getByRole('link', { name: 'Lập trình' })).toHaveAttribute('href', '/courses?category=lap-trinh');
    expect(screen.getByRole('link', { name: 'Ngoại ngữ' })).toHaveAttribute('href', '/courses?category=ngoai-ngu');
    expect(screen.getByRole('link', { name: 'Tất cả khóa học' })).toHaveAttribute('href', '/courses');
  });

  it('có liên kết Live, Cộng đồng, Về chúng tôi', () => {
    renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Khám phá/ }));
    expect(screen.getByRole('link', { name: /Live/ })).toHaveAttribute('href', '/live');
    expect(screen.getByRole('link', { name: 'Cộng đồng' })).toHaveAttribute('href', '/community');
    expect(screen.getByRole('link', { name: 'Về chúng tôi' })).toHaveAttribute('href', '/about');
  });

  it('chỉ hiện nhãn Đang diễn ra khi có buổi live', () => {
    const { unmount } = renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Khám phá/ }));
    expect(screen.queryByText('Đang diễn ra')).toBeNull();
    unmount();
    renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow />);
    fireEvent.click(screen.getByRole('button', { name: /Khám phá/ }));
    expect(screen.getByText('Đang diễn ra')).toBeInTheDocument();
  });

  it('rê chuột vào thì mở, rời chuột thì đóng', () => {
    renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow={false} />);
    const trigger = screen.getByRole('button', { name: /Khám phá/ });
    const wrapper = trigger.parentElement as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseLeave(wrapper);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('rê chuột rồi bấm thì ghim menu mở, rời chuột không đóng', () => {
    renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow={false} />);
    const trigger = screen.getByRole('button', { name: /Khám phá/ });
    const wrapper = trigger.parentElement as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseLeave(wrapper);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('bấm lần nữa vào nút đang ghim thì đóng', () => {
    renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow={false} />);
    const trigger = screen.getByRole('button', { name: /Khám phá/ });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('bấm ra ngoài thì đóng', () => {
    renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow={false} />);
    const trigger = screen.getByRole('button', { name: /Khám phá/ });
    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('đóng khi nhấn Escape', () => {
    renderWithIntl(<ExploreMenu categories={CATEGORIES} liveNow={false} />);
    const trigger = screen.getByRole('button', { name: /Khám phá/ });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
