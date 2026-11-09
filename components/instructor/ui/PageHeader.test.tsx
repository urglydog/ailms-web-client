import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('có tiêu đề h1 và mô tả', () => {
    render(<PageHeader title="Công cụ" subtitle="Hỗ trợ quản lý khóa học" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Công cụ' })).toBeInTheDocument();
    expect(screen.getByText('Hỗ trợ quản lý khóa học')).toBeInTheDocument();
  });

  it('không có mô tả thì không vẽ dòng mô tả; có action thì đặt bên phải', () => {
    render(<PageHeader title="Live" action={<button type="button">Tạo</button>} />);
    expect(screen.getByRole('button', { name: 'Tạo' })).toBeInTheDocument();
    expect(document.querySelector('p')).toBeNull();
  });
});
