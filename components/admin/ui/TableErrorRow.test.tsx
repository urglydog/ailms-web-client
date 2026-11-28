import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { TableErrorRow } from './TableErrorRow';

describe('TableErrorRow', () => {
  it('báo lỗi và bấm Thử lại gọi onRetry', () => {
    const onRetry = vi.fn();
    renderWithIntl(<table><tbody><TableErrorRow colSpan={3} onRetry={onRetry} /></tbody></table>);
    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được dữ liệu');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
