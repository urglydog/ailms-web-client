import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('hiện nhãn và giá trị', () => {
    renderWithIntl(<MetricCard label="Lượt đăng ký mới" value="12" />);
    expect(screen.getByText('Lượt đăng ký mới')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('nhãn đi liền giá trị để trình đọc màn hình đọc đúng cặp', () => {
    renderWithIntl(<MetricCard label="Điểm" value="4.50" />);
    const group = screen.getByRole('group', { name: 'Điểm' });
    expect(group).toHaveTextContent('4.50');
  });

  it('cảnh báo thì giá trị có màu nhấn (data-tone)', () => {
    renderWithIntl(<MetricCard label="Câu hỏi khó" value="3" tone="warning" />);
    expect(screen.getByText('3')).toHaveAttribute('data-tone', 'warning');
  });
});
