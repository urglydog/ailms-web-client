import { describe, expect, it } from 'vitest';
import { dailyEarnings, growthTrend } from './instructorInsights';

describe('growthTrend', () => {
  it('kỳ trước bằng 0: có doanh thu thì bắt đầu, không thì chưa có', () => {
    expect(growthTrend(500, 0)).toEqual({ kind: 'start' });
    expect(growthTrend(0, 0)).toEqual({ kind: 'none' });
  });
  it('tăng, giảm, không đổi kèm phần trăm làm tròn', () => {
    expect(growthTrend(150, 100)).toEqual({ kind: 'up', percent: 50 });
    expect(growthTrend(75, 100)).toEqual({ kind: 'down', percent: 25 });
    expect(growthTrend(100, 100)).toEqual({ kind: 'flat' });
  });
});

describe('dailyEarnings', () => {
  const now = new Date('2026-10-10T12:00:00');
  it('gom doanh thu thực nhận theo ngày và điền 0 cho ngày không có, đủ số ngày yêu cầu', () => {
    const series = dailyEarnings(
      [
        { paidAt: '2026-10-10T08:00:00', instructorEarning: 100 },
        { paidAt: '2026-10-10T09:30:00', instructorEarning: 50 },
        { paidAt: '2026-10-08T10:00:00', instructorEarning: 70 },
      ],
      3,
      now,
    );
    expect(series).toEqual([
      { day: '2026-10-08', value: 70 },
      { day: '2026-10-09', value: 0 },
      { day: '2026-10-10', value: 150 },
    ]);
  });
  it('bỏ giao dịch ngoài khoảng', () => {
    const series = dailyEarnings([{ paidAt: '2026-09-01T00:00:00', instructorEarning: 999 }], 3, now);
    expect(series.every((p) => p.value === 0)).toBe(true);
  });
});
