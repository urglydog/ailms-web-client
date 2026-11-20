import { describe, expect, it } from 'vitest';
import { SETTING_GROUPS, formatList, parseList, validateSetting, type SettingItem } from './settingsSchema';

const all = SETTING_GROUPS.flatMap((g) => g.items);
const find = (key: string): SettingItem => {
  const item = all.find((i) => i.key === key);
  if (!item) throw new Error(`Thiếu mục ${key}`);
  return item;
};
const byKind = (kind: SettingItem['kind']) => all.filter((i) => i.kind === kind);

describe('SETTING_GROUPS', () => {
  it('không để lộ khóa do bên thứ ba quy định hoặc nội bộ (phí PayOS, đuôi email loại trừ)', () => {
    const keys = all.map((i) => i.key);
    expect(keys).not.toContain('PAYOS_PAYOUT_FEE');
    expect(keys).not.toContain('INVOICE_EXCLUDED_EMAIL_SUFFIX');
  });

  it('không mục nào có nhãn/mô tả chứa tên biến kỹ thuật hoặc chữ "demo"', () => {
    for (const item of all) {
      expect(`${item.label} ${item.help ?? ''}`).not.toMatch(/[A-Z]{3,}_[A-Z_]+/);
      expect(`${item.label} ${item.help ?? ''}`.toLowerCase()).not.toContain('demo');
    }
  });

  it('mỗi khóa chỉ xuất hiện một lần và không có thông số chỉ để xem', () => {
    const keys = all.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain('GEMINI_MODEL');
  });

  it('giá trị bật/tắt dùng công tắc, ngày trong tháng dùng lưới ngày, ngày lễ dùng bộ chọn ngày, email dùng thẻ', () => {
    for (const key of ['PAYOS_PAYOUT_ENABLED', 'REPORT_WEEKLY_ENABLED', 'STATEMENT_EMAIL_INSTRUCTORS', 'PUBLIC_INVOICE_LINK_ENABLED']) {
      expect(find(key).kind).toBe('switch');
    }
    expect(find('PAYOUT_DAYS_OF_MONTH').kind).toBe('days');
    expect(find('REFUND_HOLIDAYS').kind).toBe('dates');
    expect(find('REPORT_RECIPIENTS').kind).toBe('emails');
    expect(find('REVENUE_ORGANIC_INSTRUCTOR_PCT').kind).toBe('percent');
  });

  it('mọi ô số đều có giới hạn min/max để kiểm tra khoảng', () => {
    for (const item of [...byKind('number'), ...byKind('percent'), ...byKind('price')]) {
      expect(item.min).toBeDefined();
      expect(item.max).toBeDefined();
    }
  });
});

describe('validateSetting — ô số nguyên', () => {
  const BAD = ['', '  ', '-1', '1.5', '1,5', 'abc', '1e3', '+5', '0x10', '99999999999', '5 5', '٣'];

  it.each(byKind('number').map((i) => [i.key]))('%s nhận biên dưới/trên và từ chối mọi kiểu nhập sai', (key) => {
    const item = find(key as string);
    expect(validateSetting(item, String(item.min))).toBeNull();
    expect(validateSetting(item, String(item.max))).toBeNull();
    for (const bad of BAD) expect(validateSetting(item, bad), `"${bad}"`).not.toBeNull();
    expect(validateSetting(item, String((item.max as number) + 1))).not.toBeNull();
    if ((item.min as number) > 0) expect(validateSetting(item, String((item.min as number) - 1))).not.toBeNull();
  });
});

describe('validateSetting — phần trăm', () => {
  it.each(byKind('percent').map((i) => [i.key]))('%s nhận 0, 37, 97.5, 100 và từ chối giá trị sai', (key) => {
    const item = find(key as string);
    for (const ok of ['0', '37', '97.5', '100', '99.99']) expect(validateSetting(item, ok), ok).toBeNull();
    for (const bad of ['', '-1', '101', '100.01', 'abc', '1e2', '37.123', '+5', '1,5', '٣']) expect(validateSetting(item, bad), `"${bad}"`).not.toBeNull();
  });
});

describe('validateSetting — đơn giá thập phân', () => {
  it.each(byKind('price').map((i) => [i.key]))('%s nhận đơn giá hợp lệ và từ chối giá trị sai', (key) => {
    const item = find(key as string);
    for (const ok of ['0', '0.30', '2.5', '1000', '12.3456']) expect(validateSetting(item, ok), ok).toBeNull();
    for (const bad of ['', '  ', '-1', '1000.01', '1001', 'abc', '1e2', '0.12345', '+5', '1,5', '٣']) expect(validateSetting(item, bad), `"${bad}"`).not.toBeNull();
  });
});

describe('validateSetting — công tắc, ngày, email, văn bản', () => {
  it('công tắc chỉ nhận 0 hoặc 1', () => {
    const item = find('PAYOS_PAYOUT_ENABLED');
    expect(validateSetting(item, '0')).toBeNull();
    expect(validateSetting(item, '1')).toBeNull();
    for (const bad of ['', '2', '-1', 'true', 'on', '0.5']) expect(validateSetting(item, bad), bad).not.toBeNull();
  });

  it('ngày chi trả: 1–28, tối đa 4, không trùng, không rỗng', () => {
    const item = find('PAYOUT_DAYS_OF_MONTH');
    for (const ok of ['1', '28', '5,20', '1,10,20,28']) expect(validateSetting(item, ok), ok).toBeNull();
    for (const bad of ['', '0', '29', '-5', '1.5', 'abc', '5,5', '1,2,3,4,5', '5,,20']) expect(validateSetting(item, bad), `"${bad}"`).not.toBeNull();
  });

  it('ngày lễ: ngày thật, không trùng, cho phép để trống', () => {
    const item = find('REFUND_HOLIDAYS');
    for (const ok of ['', '2026-12-25', '2026-12-25,2027-01-01']) expect(validateSetting(item, ok), ok).toBeNull();
    for (const bad of ['2026-13-01', '2026-02-30', '25/12/2026', 'abc', '2026-12-25,2026-12-25', '2026-12-25,,2027-01-01']) {
      expect(validateSetting(item, bad), bad).not.toBeNull();
    }
  });

  it('email nhận báo cáo: cho phép để trống, từ chối email sai hoặc trùng', () => {
    const item = find('REPORT_RECIPIENTS');
    expect(validateSetting(item, '')).toBeNull();
    expect(validateSetting(item, 'a@b.vn,c@d.com')).toBeNull();
    for (const bad of ['abc', 'a@b', 'a@b.vn,abc', 'a@b.vn,A@B.vn', '@b.com']) expect(validateSetting(item, bad), bad).not.toBeNull();
  });

  it('văn bản: tên bên phát hành không trống, giới hạn độ dài', () => {
    expect(validateSetting(find('INVOICE_ISSUER_NAME'), ' ')).not.toBeNull();
    expect(validateSetting(find('INVOICE_ISSUER_NAME'), 'x'.repeat(101))).not.toBeNull();
    expect(validateSetting(find('INVOICE_ISSUER_NOTE'), 'x'.repeat(201))).not.toBeNull();
    expect(validateSetting(find('INVOICE_ISSUER_NOTE'), '')).toBeNull();
  });
});

describe('parseList / formatList', () => {
  it('chuyển qua lại giữa chuỗi và mảng, bỏ khoảng trắng, chuỗi rỗng là danh sách rỗng', () => {
    expect(parseList('')).toEqual([]);
    expect(parseList(' 5 , 20 ')).toEqual(['5', '20']);
    expect(formatList(['5', '20'])).toBe('5,20');
  });
});
