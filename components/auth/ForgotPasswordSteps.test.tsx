import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ForgotEmailStep } from './ForgotEmailStep';
import { ForgotResetStep } from './ForgotResetStep';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('ForgotEmailStep', () => {
  it('gửi email tới API quên mật khẩu rồi báo thành công', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const onSuccess = vi.fn();
    renderWithIntl(<ForgotEmailStep initialEmail="a@b.vn" onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gửi OTP' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('a@b.vn'));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/forgot-password'), expect.objectContaining({ method: 'POST' }));
  });

  it('API lỗi thì hiện thông báo lỗi và không chuyển bước', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ message: 'Email không tồn tại' }) });
    const onSuccess = vi.fn();
    renderWithIntl(<ForgotEmailStep initialEmail="a@b.vn" onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gửi OTP' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email không tồn tại');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe('ForgotResetStep', () => {
  function fill(otp: string, pw: string, confirm: string) {
    fireEvent.change(screen.getByLabelText('Mã OTP'), { target: { value: otp } });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: pw } });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: confirm } });
  }

  it('mật khẩu yếu thì báo lỗi, không gọi API', () => {
    renderWithIntl(<ForgotResetStep email="a@b.vn" onSuccess={vi.fn()} />);
    fill('123456', 'abcdefgh', 'abcdefgh');
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu chưa đủ mạnh');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('xác nhận không khớp thì báo lỗi', () => {
    renderWithIntl(<ForgotResetStep email="a@b.vn" onSuccess={vi.fn()} />);
    fill('123456', 'Abc12345!', 'Abc12345?');
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu xác nhận không khớp.');
  });

  it('hợp lệ thì gửi email, OTP và mật khẩu mới', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ accessToken: 'x', refreshToken: 'y' }) });
    renderWithIntl(<ForgotResetStep email="a@b.vn" onSuccess={vi.fn()} />);
    fill('123456', 'Abc12345!', 'Abc12345!');
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(url).toContain('/api/v1/auth/reset-password');
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.vn', otp: '123456', newPassword: 'Abc12345!' });
  });
});
