import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { ToolCard } from './ToolCard';
import { TOOLS } from './tools';

describe('ToolCard', () => {
  it('cả thẻ là một liên kết có tên và mô tả', () => {
    renderWithIntl(<ToolCard tool={TOOLS[0]!} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', TOOLS[0]!.href);
    expect(link).toHaveTextContent('Live');
    expect(link).toHaveTextContent('Tạo và quản lý các buổi dạy trực tuyến');
  });
});

describe('TOOLS', () => {
  it('có 3 công cụ: Live, Mã giảm giá, Gói khóa học, mỗi công cụ một đường dẫn riêng', () => {
    expect(TOOLS.map((t) => t.id)).toEqual(['live', 'coupons', 'bundles']);
    expect(new Set(TOOLS.map((t) => t.href)).size).toBe(3);
  });
});
