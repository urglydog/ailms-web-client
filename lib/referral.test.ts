import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REFERRAL_TTL_MS, captureReferralFromUrl, getReferralCode, getReferralCodesFor } from './referral';

const KEY = 'lms.referralCodes';
const NOW = new Date('2026-11-11T10:00:00Z').getTime();

describe('lib/referral', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ghi lại mã kèm thời điểm và đọc lại được', () => {
    captureReferralFromUrl(10, 'abc123');
    expect(getReferralCode(10)).toBe('abc123');
    expect(JSON.parse(localStorage.getItem(KEY) as string)['10']).toEqual({ code: 'abc123', capturedAt: NOW });
  });

  it('bỏ qua ref rỗng hoặc thiếu', () => {
    captureReferralFromUrl(10, '');
    captureReferralFromUrl(10, null);
    captureReferralFromUrl(10, undefined);
    expect(getReferralCode(10)).toBeUndefined();
  });

  it('link mới nhất thắng (last-click) và làm mới hạn', () => {
    captureReferralFromUrl(10, 'cu');
    vi.spyOn(Date, 'now').mockReturnValue(NOW + 5 * 24 * 60 * 60 * 1000);
    captureReferralFromUrl(10, 'moi');
    expect(getReferralCode(10)).toBe('moi');
  });

  it('hết hạn sau 30 ngày, còn đúng ngày cuối thì vẫn dùng được', () => {
    captureReferralFromUrl(10, 'abc123');
    vi.spyOn(Date, 'now').mockReturnValue(NOW + REFERRAL_TTL_MS);
    expect(getReferralCode(10)).toBe('abc123');
    vi.spyOn(Date, 'now').mockReturnValue(NOW + REFERRAL_TTL_MS + 1);
    expect(getReferralCode(10)).toBeUndefined();
  });

  it('đọc được định dạng cũ (chuỗi thuần) và coi như vừa bấm link lúc đọc', () => {
    localStorage.setItem(KEY, JSON.stringify({ 10: 'macu' }));
    expect(getReferralCode(10)).toBe('macu');
  });

  it('getReferralCodesFor chỉ trả các khóa còn hạn', () => {
    captureReferralFromUrl(10, 'a');
    vi.spyOn(Date, 'now').mockReturnValue(NOW + REFERRAL_TTL_MS + 1000);
    captureReferralFromUrl(20, 'b');
    expect(getReferralCodesFor([10, 20, 30])).toEqual({ 20: 'b' });
  });

  it('dữ liệu hỏng trong localStorage không làm vỡ', () => {
    localStorage.setItem(KEY, '{khong-phai-json');
    expect(getReferralCode(10)).toBeUndefined();
    localStorage.setItem(KEY, JSON.stringify({ 10: { code: 'x' } }));
    expect(getReferralCode(10)).toBeUndefined();
  });
});
