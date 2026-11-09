import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { LoginForm } from './LoginForm';

const login = vi.fn();
const toastError = vi.fn();
let search = '';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(search) }));
vi.mock('sonner', () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() } }));
vi.mock('@/hooks/useAuthMutations', () => ({
  useLogin: () => ({ mutate: login, isPending: false, error: null }),
}));
vi.mock('./GoogleSignInButton', () => ({ GoogleSignInButton: () => <div data-testid="google" /> }));

beforeEach(() => {
  login.mockReset();
  toastError.mockReset();
  search = '';
});

describe('LoginForm', () => {
  it('gửi email và mật khẩu khi bấm Đăng nhập', () => {
    renderWithIntl(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.vn' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Abc12345!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(login).toHaveBeenCalledWith({ email: 'a@b.vn', password: 'Abc12345!' }, expect.anything());
  });

  it('vừa đăng ký xong thì hiện thông báo thành công', () => {
    search = 'registered=true';
    renderWithIntl(<LoginForm />);
    expect(screen.getByText('Tài khoản đã được tạo thành công! Mời bạn đăng nhập.')).toBeInTheDocument();
  });

  it('Quên mật khẩu mà chưa nhập email thì báo lỗi, không chuyển trang', () => {
    renderWithIntl(<LoginForm />);
    fireEvent.click(screen.getByRole('link', { name: 'Quên mật khẩu?' }));
    expect(toastError).toHaveBeenCalledWith('Vui lòng nhập email để đổi mật khẩu');
  });

  it('đã có email thì liên kết Quên mật khẩu mang theo email', () => {
    renderWithIntl(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.vn' } });
    expect(screen.getByRole('link', { name: 'Quên mật khẩu?' })).toHaveAttribute('href', '/forgot-password?email=a%40b.vn');
  });

  it('có nút Google và dòng phân cách đăng nhập bằng email', () => {
    renderWithIntl(<LoginForm />);
    expect(screen.getByTestId('google')).toBeInTheDocument();
    expect(screen.getByText('hoặc đăng nhập với email')).toBeInTheDocument();
  });
});
