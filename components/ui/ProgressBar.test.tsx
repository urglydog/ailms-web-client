import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar, clampPct } from './ProgressBar';

describe('clampPct', () => {
  it('kẹp về 0 đến 100 và xử lý NaN', () => {
    expect(clampPct(140)).toBe(100);
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(Number.NaN)).toBe(0);
    expect(clampPct(42.4)).toBe(42.4);
  });
});

describe('ProgressBar', () => {
  it('có vai trò progressbar với giá trị và nhãn truy cập', () => {
    render(<ProgressBar value={60} label="Tiến độ Unity cơ bản" />);
    const bar = screen.getByRole('progressbar', { name: 'Tiến độ Unity cơ bản' });
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('kẹp giá trị vượt 100', () => {
    render(<ProgressBar value={140} label="x" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('tone onAccent dùng nền trắng mờ và phần đầy màu trắng để đọc được trên nền accent', () => {
    const { container } = render(<ProgressBar value={50} label="x" tone="onAccent" />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-white/30');
    expect(container.querySelector('.bg-white')).not.toBeNull();
  });

  it('tone success dùng màu success', () => {
    const { container } = render(<ProgressBar value={100} label="x" tone="success" />);
    expect(container.querySelector('.bg-success')).not.toBeNull();
  });
});
