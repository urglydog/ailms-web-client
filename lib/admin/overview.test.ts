import { describe, expect, it } from 'vitest';
import { formatBytes, formatUptime, usagePercent, usageTone } from './overview';

describe('formatBytes', () => {
  it('đổi đơn vị', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 ** 3)).toBe('5 GB');
  });
});

describe('formatUptime', () => {
  it('ngày, giờ, phút; dưới 1 phút hiện giây', () => {
    expect(formatUptime(90_061_000)).toBe('1d 1h 1m');
    expect(formatUptime(45_000)).toBe('45s');
  });
});

describe('usageTone / usagePercent', () => {
  it('chia mức ok, warn, critical', () => {
    expect(usageTone(50, 100)).toBe('ok');
    expect(usageTone(75, 100)).toBe('warn');
    expect(usageTone(95, 100)).toBe('critical');
    expect(usageTone(1, 0)).toBe('ok');
  });
  it('phần trăm giới hạn 0-100', () => {
    expect(usagePercent(150, 100)).toBe(100);
    expect(usagePercent(1, 3)).toBe(33);
    expect(usagePercent(1, 0)).toBe(0);
  });
});
