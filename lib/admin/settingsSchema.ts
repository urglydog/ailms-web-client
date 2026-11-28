/**
 * Lược đồ hiển thị trang Cấu hình hệ thống (20/11/2026): chia nhóm theo chức năng, nhãn tiếng Việt rõ nghĩa và kiểu điều khiển phù hợp
 * (công tắc cho giá trị bật/tắt, ô số có đơn vị, danh sách email, danh sách ngày...). KHÔNG hiển thị tên biến kỹ thuật ra giao diện.
 * Khóa không có trong lược đồ này (vd cấu hình nội bộ, hoặc giá trị do bên thứ ba quy định như phí PayOS) không hiện và không sửa được ở đây.
 */
import { tr } from '@/lib/i18n/translate';

export type SettingKind = 'switch' | 'number' | 'percent' | 'price' | 'text' | 'emails' | 'days' | 'dates';

export interface SettingItem {
  key: string;
  label: string;
  help?: string;
  kind: SettingKind;
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  /** Độ dài tối đa của ô văn bản. */
  maxLength?: number;
}

export interface SettingGroup {
  id: string;
  title: string;
  description: string;
  items: SettingItem[];
}

const ROOT = 'admin.settings.schema';

interface ItemOpts {
  help?: boolean;
  unit?: string;
  unitKey?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  placeholder?: string;
  placeholderKey?: boolean;
}

/** Nhãn/mô tả/đơn vị/placeholder là getter: dịch tại thời điểm đọc theo ngôn ngữ giao diện hiện tại (xem `lib/i18n/translate.ts`). */
function item(key: string, kind: SettingKind, o: ItemOpts = {}): SettingItem {
  const out: SettingItem = { key, kind, min: o.min, max: o.max, maxLength: o.maxLength } as SettingItem;
  Object.defineProperty(out, 'label', { enumerable: true, get: () => tr(`${ROOT}.items.${key}.label`) });
  if (o.help) Object.defineProperty(out, 'help', { enumerable: true, get: () => tr(`${ROOT}.items.${key}.help`) });
  if (o.unitKey) Object.defineProperty(out, 'unit', { enumerable: true, get: () => tr(`${ROOT}.units.${o.unitKey}`) });
  else if (o.unit) out.unit = o.unit;
  if (o.placeholderKey) Object.defineProperty(out, 'placeholder', { enumerable: true, get: () => tr(`${ROOT}.items.${key}.placeholder`) });
  else if (o.placeholder) out.placeholder = o.placeholder;
  return out;
}

function group(id: string, items: SettingItem[]): SettingGroup {
  const out = { id, items } as SettingGroup;
  Object.defineProperty(out, 'title', { enumerable: true, get: () => tr(`${ROOT}.groups.${id}.title`) });
  Object.defineProperty(out, 'description', { enumerable: true, get: () => tr(`${ROOT}.groups.${id}.description`) });
  return out;
}

export const SETTING_GROUPS: SettingGroup[] = [
  group('ai', [
    item('QUOTA_DUB_STUDENT', 'number', { help: true, unitKey: 'turnsPerDay', min: 0, max: 1000 }),
    item('QUOTA_DUB_INSTRUCTOR', 'number', { help: true, unitKey: 'turnsPerDay', min: 0, max: 1000 }),
    item('QUOTA_MATERIALS', 'number', { help: true, unitKey: 'timesPerDay', min: 0, max: 1000 }),
    item('QUOTA_TUTOR', 'number', { help: true, unitKey: 'msgsPerDay', min: 0, max: 10000 }),
    item('QUOTA_GUEST_SEARCH', 'number', { help: true, unitKey: 'turnsPerHour', min: 0, max: 1000 }),
  ]),
  group('aicost', [
    item('AI_PRICE_INPUT_USD_PER_M', 'price', { help: true, unitKey: 'usdPerMTok', min: 0, max: 1000 }),
    item('AI_PRICE_OUTPUT_USD_PER_M', 'price', { help: true, unitKey: 'usdPerMTok', min: 0, max: 1000 }),
    item('AI_PRICE_EMBED_USD_PER_M', 'price', { unitKey: 'usdPerMTok', min: 0, max: 1000 }),
    item('AI_PRICE_AUDIO_USD_PER_HOUR', 'price', { help: true, unitKey: 'usdPerAudioHour', min: 0, max: 1000 }),
    item('USD_VND_RATE', 'number', { help: true, unit: 'đ / USD', min: 1000, max: 100000 }),
  ]),
  group('revenue', [
    item('REVENUE_ORGANIC_INSTRUCTOR_PCT', 'percent', { help: true, unit: '%', min: 0, max: 100 }),
    item('REVENUE_REFERRAL_INSTRUCTOR_PCT', 'percent', { help: true, unit: '%', min: 0, max: 100 }),
  ]),
  group('refund', [
    item('REFUND_WINDOW_DAYS', 'number', { help: true, unitKey: 'days', min: 0, max: 90 }),
    item('REFUND_MAX_PROGRESS_PCT', 'number', { help: true, unit: '%', min: 0, max: 100 }),
    item('REFUND_HOLIDAYS', 'dates', { help: true }),
    item('DISPUTE_INSTRUCTOR_RESPONSE_HOURS', 'number', { unitKey: 'hours', min: 1, max: 720 }),
    item('DISPUTE_APPEAL_DAYS', 'number', { unitKey: 'days', min: 1, max: 90 }),
    item('REFUND_FLAG_RATE_PCT', 'number', { help: true, unit: '%', min: 1, max: 100 }),
    item('REFUND_FLAG_MIN_COUNT', 'number', { help: true, unitKey: 'turns', min: 1, max: 1000 }),
  ]),
  group('payout', [
    item('PAYOUT_MIN_AMOUNT', 'number', { unit: 'đ', min: 0, max: 100000000 }),
    item('PAYOUT_DAYS_OF_MONTH', 'days', { help: true }),
    item('PAYOUT_HOLD_EXTRA_DAYS', 'number', { help: true, unitKey: 'days', min: 0, max: 60 }),
    item('PAYOS_PAYOUT_ENABLED', 'switch', { help: true }),
    item('PAYOS_PAYOUT_MAX_AMOUNT', 'number', { help: true, unit: 'đ', min: 0, max: 100000000 }),
    item('PAYOS_RETRY_COOLDOWN_MINUTES', 'number', { help: true, unitKey: 'minutes', min: 0, max: 1440 }),
    item('PAYOS_MAX_ATTEMPTS', 'number', { help: true, unitKey: 'times', min: 1, max: 20 }),
  ]),
  group('debt', [
    item('DEBT_RESTRICT_DAYS', 'number', { help: true, unitKey: 'days', min: 1, max: 3650 }),
    item('DEBT_SUSPEND_DAYS', 'number', { help: true, unitKey: 'days', min: 1, max: 3650 }),
    item('DEBT_MIN_REPAY', 'number', { help: true, unit: 'đ', min: 1000, max: 100000000 }),
  ]),
  group('reports', [
    item('REPORT_DAILY_ENABLED', 'switch'),
    item('REPORT_WEEKLY_ENABLED', 'switch', { help: true }),
    item('REPORT_MONTHLY_ENABLED', 'switch', { help: true }),
    item('REPORT_RECIPIENTS', 'emails', { help: true, placeholder: 'ketoan@congty.vn, admin@congty.vn' }),
    item('STATEMENT_EMAIL_INSTRUCTORS', 'switch', { help: true }),
    item('PUBLIC_INVOICE_LINK_ENABLED', 'switch', { help: true }),
    item('INVOICE_ISSUER_NAME', 'text', { maxLength: 100, placeholder: 'LinguaLearn' }),
    item('INVOICE_ISSUER_NOTE', 'text', { maxLength: 200, placeholderKey: true }),
  ]),
];

const EMAIL = /^[^@\s,]+@[^@\s,]+\.[^@\s,]+$/;
const INTEGER = /^\d{1,9}$/;
const PERCENT = /^\d{1,3}(\.\d{1,2})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Tách chuỗi danh sách (phân cách dấu phẩy) thành các phần tử đã cắt khoảng trắng; chuỗi rỗng cho danh sách rỗng. */
export function parseList(value: string): string[] {
  return value.trim() === '' ? [] : value.split(',').map((s) => s.trim());
}

export function formatList(items: string[]): string {
  return items.join(',');
}

function isRealDate(v: string): boolean {
  if (!ISO_DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

const v_ = (k: string, vals?: Record<string, string | number>) => tr(`${ROOT}.validation.${k}`, vals);

/** Kiểm tra một giá trị theo kiểu điều khiển; trả thông báo lỗi (theo ngôn ngữ giao diện) hoặc null nếu hợp lệ. Cùng quy tắc với BE (FinanceConfigKeys). */
export function validateSetting(item: SettingItem, value: string): string | null {
  const v = value.trim();
  if (item.kind === 'number') {
    if (v === '') return v_('needNumber');
    if (!INTEGER.test(v)) return v_('integerOnly');
    const n = Number(v);
    if (item.min !== undefined && n < item.min) return v_('minValue', { min: item.min.toLocaleString('vi-VN') });
    if (item.max !== undefined && n > item.max) return v_('maxValue', { max: item.max.toLocaleString('vi-VN') });
  }
  if (item.kind === 'percent') {
    if (v === '') return v_('needNumber');
    if (!PERCENT.test(v)) return v_('percentFormat');
    const n = Number(v);
    if (n < (item.min ?? 0) || n > (item.max ?? 100)) return v_('percentRange', { min: item.min ?? 0, max: item.max ?? 100 });
  }
  if (item.kind === 'price') {
    if (v === '') return v_('needNumber');
    if (!/^\d{1,4}(\.\d{1,4})?$/.test(v)) return v_('priceFormat');
    if (Number(v) > (item.max ?? 1000)) return v_('priceMax', { max: item.max ?? 1000 });
  }
  if (item.kind === 'emails' && v !== '') {
    const items = parseList(v);
    const bad = items.find((s) => !EMAIL.test(s));
    if (bad !== undefined) return v_('badEmail', { value: bad });
    if (new Set(items.map((s) => s.toLowerCase())).size !== items.length) return v_('dupEmail');
  }
  if (item.kind === 'days') {
    const items = parseList(v);
    if (items.length === 0) return v_('daysMin');
    if (items.length > 4) return v_('daysMax');
    if (items.some((s) => !INTEGER.test(s) || Number(s) < 1 || Number(s) > 28)) return v_('daysRange');
    if (new Set(items).size !== items.length) return v_('dupDay');
  }
  if (item.kind === 'dates') {
    const items = parseList(v);
    if (items.length > 60) return v_('datesMax');
    const bad = items.find((s) => !isRealDate(s));
    if (bad !== undefined) return v_('badDate', { value: bad });
    if (new Set(items).size !== items.length) return v_('dupDay');
  }
  if (item.kind === 'text') {
    if (item.key === 'INVOICE_ISSUER_NAME' && v === '') return v_('issuerRequired');
    if (item.maxLength !== undefined && value.length > item.maxLength) return v_('maxLength', { max: item.maxLength });
  }
  if (item.kind === 'switch' && v !== '0' && v !== '1') return v_('badSwitch');
  return null;
}
