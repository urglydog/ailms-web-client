import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { DubLanguage } from '@/types/domain';
import { DubbingBar } from './DubbingBar';

function lang(code: string, label: string, available: boolean): DubLanguage {
  return { code, label, flag: '', available, subtitles: [] };
}

const LANGS = [
  lang('en', 'English', true),
  lang('vi', 'Tiếng Việt', true),
  lang('ja', '日本語', false),
  lang('zh', '中文', false),
];

function setup(overrides: Partial<React.ComponentProps<typeof DubbingBar>> = {}) {
  const props = {
    languages: LANGS,
    activeCode: null as string | null,
    sourceLanguage: 'en' as string | null,
    processing: null as { code: string; percent: number } | null,
    onSelect: vi.fn(),
    onUseOriginal: vi.fn(),
    ...overrides,
  };
  renderWithIntl(<DubbingBar {...props} />);
  return props;
}

const trigger = () => screen.getByRole('button', { name: /Giọng lồng tiếng AI/ });
const openMenu = () => fireEvent.click(trigger());

describe('DubbingBar', () => {
  it('chưa chọn giọng thì hiện Âm thanh gốc và công tắc Nghe bản gốc đang bật', () => {
    setup({ activeCode: null });
    expect(trigger()).toHaveTextContent('Âm thanh gốc');
    expect(screen.getByRole('switch', { name: 'Nghe bản gốc' })).toHaveAttribute('aria-checked', 'true');
  });

  it('đã chọn giọng thì hiện tên ngôn ngữ và công tắc tắt', () => {
    setup({ activeCode: 'vi' });
    expect(trigger()).toHaveTextContent('Tiếng Việt');
    expect(screen.getByRole('switch', { name: 'Nghe bản gốc' })).toHaveAttribute('aria-checked', 'false');
  });

  it('menu đóng lúc đầu, bấm nút thì mở và báo trạng thái từng ngôn ngữ', () => {
    setup({ activeCode: 'vi' });
    expect(screen.queryByRole('listbox')).toBeNull();
    openMenu();
    const list = screen.getByRole('listbox', { name: 'Danh sách ngôn ngữ' });
    expect(within(list).getByRole('option', { name: /Tiếng Việt/ })).toHaveTextContent('Sẵn sàng');
    expect(within(list).getByRole('option', { name: /日本語/ })).toHaveTextContent('Tạo giọng');
    expect(within(list).getByRole('option', { name: /English/ })).toHaveTextContent('gốc');
  });

  it('ngôn ngữ đang tạo hiện phần trăm', () => {
    setup({ activeCode: 'ja', processing: { code: 'ja', percent: 63 } });
    openMenu();
    expect(screen.getByRole('option', { name: /日本語/ })).toHaveTextContent('Đang tạo 63%');
    expect(screen.getByRole('option', { name: /中文/ })).toHaveTextContent('Tạo giọng');
  });

  it('chọn một ngôn ngữ thì gọi onSelect và đóng menu', () => {
    const p = setup({ activeCode: null });
    openMenu();
    fireEvent.click(screen.getByRole('option', { name: /日本語/ }));
    expect(p.onSelect).toHaveBeenCalledWith('ja');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('ngôn ngữ gốc của bài bị vô hiệu, không chọn được', () => {
    const p = setup();
    openMenu();
    const source = screen.getByRole('option', { name: /English/ });
    expect(source).toBeDisabled();
    fireEvent.click(source);
    expect(p.onSelect).not.toHaveBeenCalled();
  });

  it('tìm ngôn ngữ không phân biệt dấu', () => {
    setup();
    openMenu();
    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm ngôn ngữ' }), { target: { value: 'viet' } });
    expect(screen.getByRole('option', { name: /Tiếng Việt/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /日本語/ })).toBeNull();
  });

  it('không có kết quả thì báo không tìm thấy', () => {
    setup();
    openMenu();
    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm ngôn ngữ' }), { target: { value: 'khong-co' } });
    expect(screen.getByText('Không tìm thấy ngôn ngữ nào')).toBeInTheDocument();
  });

  it('nhấn Escape thì đóng menu', () => {
    setup();
    openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('đang nghe giọng lồng tiếng, bật Nghe bản gốc thì gọi onUseOriginal', () => {
    const p = setup({ activeCode: 'vi' });
    fireEvent.click(screen.getByRole('switch', { name: 'Nghe bản gốc' }));
    expect(p.onUseOriginal).toHaveBeenCalledTimes(1);
  });

  it('đang nghe bản gốc, tắt công tắc thì chọn giọng đã sẵn sàng đầu tiên', () => {
    const p = setup({ activeCode: null });
    fireEvent.click(screen.getByRole('switch', { name: 'Nghe bản gốc' }));
    expect(p.onSelect).toHaveBeenCalledWith('vi');
  });

  it('chưa có giọng nào sẵn sàng thì tắt công tắc sẽ mở menu để chọn', () => {
    const p = setup({ activeCode: null, languages: [lang('en', 'English', true), lang('ja', '日本語', false)] });
    fireEvent.click(screen.getByRole('switch', { name: 'Nghe bản gốc' }));
    expect(p.onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
