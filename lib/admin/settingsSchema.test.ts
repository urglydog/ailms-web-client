import { describe, expect, it } from 'vitest';
import { SETTING_GROUPS, validateSetting, type SettingItem } from './settingsSchema';

const find = (key: string): SettingItem => {
  const item = SETTING_GROUPS.flatMap((g) => g.items).find((i) => i.key === key);
  if (!item) throw new Error(`Thiếu mục ${key}`);
  return item;
};

describe('SETTING_GROUPS', () => {
  it('không để lộ khóa do bên thứ ba quy định hoặc nội bộ (phí PayOS, đuôi email loại trừ)', () => {
    const keys = SETTING_GROUPS.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).not.toContain('PAYOS_PAYOUT_FEE');
    expect(keys).not.toContain('INVOICE_EXCLUDED_EMAIL_SUFFIX');
  });

  it('không mục nào có nhãn/mô tả chứa tên biến kỹ thuật hoặc chữ "demo"', () => {
    for (const item of SETTING_GROUPS.flatMap((g) => g.items)) {
      expect(`${item.label} ${item.help ?? ''}`).not.toMatch(/[A-Z]{3,}_[A-Z_]+/);
      expect(`${item.label} ${item.help ?? ''}`.toLowerCase()).not.toContain('demo');
    }
  });

  it('giá trị bật/tắt dùng công tắc, không dùng ô số', () => {
    for (const key of ['PAYOS_PAYOUT_ENABLED', 'REPORT_WEEKLY_ENABLED', 'STATEMENT_EMAIL_INSTRUCTORS']) {
      expect(find(key).kind).toBe('switch');
    }
  });
});

describe('validateSetting', () => {
  it('kiểm khoảng số', () => {
    expect(validateSetting(find('REFUND_WINDOW_DAYS'), '7')).toBeNull();
    expect(validateSetting(find('REFUND_WINDOW_DAYS'), '120')).toContain('tối đa');
    expect(validateSetting(find('REFUND_WINDOW_DAYS'), '')).toContain('số');
  });

  it('kiểm danh sách email, cho phép để trống', () => {
    expect(validateSetting(find('REPORT_RECIPIENTS'), '')).toBeNull();
    expect(validateSetting(find('REPORT_RECIPIENTS'), 'a@b.vn, c@d.com')).toBeNull();
    expect(validateSetting(find('REPORT_RECIPIENTS'), 'a@b.vn, abc')).toContain('abc');
  });

  it('tên bên phát hành không được trống', () => {
    expect(validateSetting(find('INVOICE_ISSUER_NAME'), ' ')).not.toBeNull();
  });
});
