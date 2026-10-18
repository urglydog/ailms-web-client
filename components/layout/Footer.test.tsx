import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { Footer } from './Footer';

describe('Footer', () => {
  it('có vùng contentinfo, tên thương hiệu và cột Khám phá, Pháp lý', () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText('LinguaLearn')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khóa học' })).toHaveAttribute('href', '/courses');
    expect(screen.getByRole('link', { name: 'Điều khoản dịch vụ' })).toHaveAttribute('href', '/legal/terms');
  });

  it('có liên kết điện thoại, email và sơ đồ trang', () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole('link', { name: /0283\.8940 390/ })).toHaveAttribute('href', 'tel:02838940390');
    expect(screen.getByRole('link', { name: /csm@iuh\.edu\.vn/ })).toHaveAttribute('href', 'mailto:csm@iuh.edu.vn');
    expect(screen.getByRole('link', { name: 'Sơ đồ trang' })).toHaveAttribute('href', '/legal/sitemap');
  });

  it('mỗi cột liên kết có tiêu đề riêng để trình đọc màn hình điều hướng', () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole('heading', { name: 'Khám phá' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pháp lý & Chính sách' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Liên hệ' })).toBeInTheDocument();
  });
});
