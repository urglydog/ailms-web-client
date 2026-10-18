import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { VoiceMappingManager } from './VoiceMappingManager';

const voices = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1, language: i < 40 ? 'en-US' : 'vi-VN', voiceName: `voice-${i + 1}`, gender: 'FEMALE', isDefault: false, isActive: true,
}));

vi.mock('@/hooks/useVoiceMappings', () => {
  const mutation = { mutate: vi.fn(), isPending: false };
  return {
    useVoiceMappings: () => ({ data: voices, isLoading: false }),
    useCreateVoiceMapping: () => mutation,
    useUpdateVoiceMapping: () => mutation,
    useDeleteVoiceMapping: () => mutation,
  };
});

describe('VoiceMappingManager', () => {
  it('chỉ hiện 30 giọng đầu, bấm Hiển thị thêm để xem tiếp', () => {
    renderWithIntl(<VoiceMappingManager />);
    expect(screen.getAllByRole('row')).toHaveLength(31); // 1 hàng tiêu đề + 30
    expect(screen.getByText('Đang hiện 30 / 45 giọng đọc')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hiển thị thêm' }));
    expect(screen.getAllByRole('row')).toHaveLength(46);
  });

  it('tìm theo ngôn ngữ thu hẹp danh sách; không khớp thì báo trống', () => {
    renderWithIntl(<VoiceMappingManager />);
    const search = screen.getByRole('searchbox', { name: 'Tìm giọng đọc' });
    fireEvent.change(search, { target: { value: 'vi-vn' } });
    expect(screen.getAllByRole('row')).toHaveLength(6);
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText('Không có giọng đọc phù hợp.')).toBeInTheDocument();
  });

  it('xóa phải qua hộp xác nhận', () => {
    renderWithIntl(<VoiceMappingManager />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Xóa:/ })[0]!);
    expect(screen.getByRole('alertdialog', { name: 'Xóa giọng đọc này?' })).toBeInTheDocument();
  });
});
