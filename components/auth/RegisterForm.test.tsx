import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { RegisterForm } from './RegisterForm';

const register = vi.fn();
const verify = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/hooks/useAuthMutations', () => ({
  useRegister: () => ({ mutate: register, isPending: false, error: null }),
  useVerifyOtp: () => ({ mutate: verify, isPending: false, error: null }),
}));

function fill(password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'An' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.vn' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: confirm } });
}

beforeEach(() => {
  register.mockReset();
  verify.mockReset();
  push.mockReset();
});

describe('RegisterForm', () => {
  it('mật khẩu yếu thì báo lỗi và không gọi đăng ký', () => {
    renderWithIntl(<RegisterForm />);
    fill('abcdefgh', 'abcdefgh');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(screen.getByText(/Mật khẩu chưa đủ mạnh/)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('xác nhận không khớp thì báo lỗi', () => {
    renderWithIntl(<RegisterForm />);
    fill('Abc12345!', 'Abc12345?');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('hợp lệ thì gọi đăng ký với họ tên, email, mật khẩu', () => {
    renderWithIntl(<RegisterForm />);
    fill('Abc12345!', 'Abc12345!');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(register).toHaveBeenCalledWith({ fullName: 'An', email: 'a@b.vn', password: 'Abc12345!' }, expect.anything());
  });

  it('đăng ký xong chuyển sang bước OTP và xác thực thì về trang đăng nhập', () => {
    register.mockImplementation((_payload, opts) => opts.onSuccess());
    verify.mockImplementation((_payload, opts) => opts.onSuccess());
    renderWithIntl(<RegisterForm />);
    fill('Abc12345!', 'Abc12345!');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(screen.getByText(/Vui lòng kiểm tra email/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Mã OTP'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác thực' }));
    expect(verify).toHaveBeenCalledWith({ email: 'a@b.vn', otp: '123456' }, expect.anything());
    expect(push).toHaveBeenCalledWith('/login?registered=true');
  });
});
