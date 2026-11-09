import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { PerformanceTabs } from './PerformanceTabs';

describe('PerformanceTabs', () => {
  it('có 6 liên kết tới các trang con của Hiệu suất', () => {
    renderWithIntl(<PerformanceTabs pathname="/instructor/revenue" />);
    expect(screen.getByRole('navigation', { name: 'Các mục hiệu suất' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tổng quan' })).toHaveAttribute('href', '/instructor/revenue');
    expect(screen.getByRole('link', { name: 'Doanh thu' })).toHaveAttribute('href', '/instructor/revenue/list');
    expect(screen.getByRole('link', { name: 'Sinh viên' })).toHaveAttribute('href', '/instructor/revenue/students');
    expect(screen.getByRole('link', { name: 'Đánh giá' })).toHaveAttribute('href', '/instructor/revenue/reviews');
    expect(screen.getByRole('link', { name: 'Câu hỏi khó' })).toHaveAttribute('href', '/instructor/revenue/hard-questions');
    expect(screen.getByRole('link', { name: 'Giữ chân' })).toHaveAttribute('href', '/instructor/revenue/retention');
  });

  it('Tổng quan chỉ sáng ở đúng trang gốc, không sáng ở trang con', () => {
    renderWithIntl(<PerformanceTabs pathname="/instructor/revenue/list" />);
    expect(screen.getByRole('link', { name: 'Doanh thu' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tổng quan' })).not.toHaveAttribute('aria-current');
  });

  it('trang gốc làm sáng Tổng quan', () => {
    renderWithIntl(<PerformanceTabs pathname="/instructor/revenue" />);
    expect(screen.getByRole('link', { name: 'Tổng quan' })).toHaveAttribute('aria-current', 'page');
  });
});
