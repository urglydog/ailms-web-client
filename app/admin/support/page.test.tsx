import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { SupportTicketAdminRes } from '@/types/domain';
import AdminSupportPage from './page';

const ticket: SupportTicketAdminRes = {
  id: 7,
  code: 'SUP-261105-ACC-00007',
  email: 'a@mail.com',
  userId: 3,
  senderName: 'Nguyễn Văn A',
  category: 'ACCOUNT',
  subject: 'Tài khoản & đăng nhập › Không nhận được mã OTP',
  message: 'Không nhận được OTP để đặt lại mật khẩu',
  status: 'OPEN',
  adminReply: null,
  adminContent: null,
  resolvedByEmail: null,
  resolvedAt: null,
  createdAt: '2026-11-05T14:36:39',
  attachments: [],
};

const { listAdmin, update } = vi.hoisted(() => ({ listAdmin: vi.fn(), update: vi.fn() }));

vi.mock('@/lib/api/support', () => ({ supportApi: { listAdmin, update } }));
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ data: { fullName: 'Admin A' } }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

async function openTicket() {
  renderWithIntl(<AdminSupportPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Xem' }));
}

describe('AdminSupportPage — trình soạn email phản hồi', () => {
  beforeEach(() => {
    listAdmin.mockReset().mockResolvedValue([ticket]);
    update.mockReset().mockResolvedValue(ticket);
  });

  it('hiện mã ticket kiểu mới trong danh sách', async () => {
    renderWithIntl(<AdminSupportPage />);
    expect(await screen.findByText('SUP-261105-ACC-00007')).toBeInTheDocument();
  });

  it('chọn mẫu điền sẵn các mục; xem trước thay placeholder và hiện tiêu đề mục tùy chỉnh', async () => {
    await openTicket();
    fireEvent.change(screen.getByLabelText('Mẫu phản hồi'), { target: { value: 'resetPassword' } });

    // lời chào mặc định có {name} được thay bằng tên người gửi
    expect(screen.getAllByText('Kính gửi Nguyễn Văn A,').length).toBeGreaterThan(0);
    const titleInput = screen.getByLabelText('Tiêu đề mục 2') as HTMLInputElement;
    expect(titleInput.value).toBe('Các bước thực hiện');

    // đổi tiêu đề mục → bản xem trước đổi theo (không còn cứng chữ "Các bước hướng dẫn")
    fireEvent.change(titleInput, { target: { value: 'Bạn cần làm gì tiếp theo' } });
    expect(screen.getByText('Bạn cần làm gì tiếp theo')).toBeInTheDocument();
  });

  it('lưu gửi đúng nội dung đã tùy chỉnh và trạng thái của mẫu', async () => {
    await openTicket();
    fireEvent.change(screen.getByLabelText('Mẫu phản hồi'), { target: { value: 'googleAccount' } });
    fireEvent.change(screen.getByLabelText('Tiêu đề mục 1'), { target: { value: 'Kết quả của yêu cầu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu & gửi phản hồi' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const [id, body] = update.mock.calls[0]!;
    expect(id).toBe(7);
    expect(body.status).toBe('RESOLVED');
    expect(body.content.sections[0]).toMatchObject({ title: 'Kết quả của yêu cầu', type: 'TEXT' });
    expect(body.content.sections[1]).toMatchObject({ type: 'LIST', text: null });
    expect(body.content.sections[1].items).toHaveLength(3);
    expect(body.content.signatureName).toBe('Admin A');
    expect(body.content.includeOriginal).toBe(true);
  });

  it('không soạn mục nào thì chỉ đổi trạng thái, không gửi nội dung email', async () => {
    await openTicket();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu & gửi phản hồi' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]![1].content).toBeUndefined();
  });
});
