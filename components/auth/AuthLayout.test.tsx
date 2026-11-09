import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { AuthLayout } from './AuthLayout';

describe('AuthLayout', () => {
  it('có tiêu đề h1, nội dung và chân trang', () => {
    renderWithIntl(
      <AuthLayout title="Đăng nhập" footer={<span>Chưa có tài khoản?</span>}>
        <p>biểu mẫu</p>
      </AuthLayout>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByText('biểu mẫu')).toBeInTheDocument();
    expect(screen.getByText('Chưa có tài khoản?')).toBeInTheDocument();
  });

  it('bảng thương hiệu nêu điểm nổi bật AI lồng tiếng', () => {
    renderWithIntl(
      <AuthLayout title="T" footer={null}>
        x
      </AuthLayout>,
    );
    expect(screen.getByText('Học mọi khóa học bằng ngôn ngữ của bạn')).toBeInTheDocument();
    expect(screen.getByText('Giọng lồng tiếng AI theo ngôn ngữ bạn chọn')).toBeInTheDocument();
  });
});
