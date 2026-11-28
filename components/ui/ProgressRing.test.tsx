import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('báo giá trị đã làm tròn và kẹp trong 0..100', () => {
    render(<ProgressRing value={142.4} label="Tiến độ" />);
    expect(screen.getByRole('progressbar', { name: 'Tiến độ' })).toHaveAttribute('aria-valuenow', '100');
  });

  it('hiện số % ở giữa vòng', () => {
    render(<ProgressRing value={37.6} label="Tiến độ" />);
    expect(screen.getByText('38')).toBeInTheDocument();
  });
});
