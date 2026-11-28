'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus, X } from 'lucide-react';
import { formatList, parseList, type SettingItem } from '@/lib/admin/settingsSchema';

interface Props {
  item: SettingItem;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}

const base = 'rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent';

/** Công tắc bật/tắt cho giá trị 1/0. */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line-dot'}`}
    >
      {/* eslint-disable-next-line no-restricted-syntax -- núm công tắc luôn trắng */}
      <span aria-hidden className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

/** Số nguyên không âm: chỉ nhận chữ số (gõ chữ, dấu âm, dấu chấm bị loại ngay), có nút − / + trong giới hạn min–max. */
function IntegerInput({ item, value, onChange, invalid }: Props) {
  const t = useTranslations('admin.settings.ui');
  const n = value === '' ? NaN : Number(value);
  const min = item.min ?? 0;
  const max = item.max ?? 999_999_999;
  const step = (delta: number) => {
    const current = Number.isNaN(n) ? min : n;
    onChange(String(Math.min(max, Math.max(min, current + delta))));
  };
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label={t('decrease')} onClick={() => step(-1)} disabled={!Number.isNaN(n) && n <= min} className="rounded-lg border border-line p-2 text-ink hover:bg-tint disabled:opacity-40">
        <Minus size={14} aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={item.label}
        aria-invalid={invalid}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
        className={`${base} w-28 text-center ${invalid ? 'border-danger' : 'border-line'}`}
      />
      <button type="button" aria-label={t('increase')} onClick={() => step(1)} disabled={!Number.isNaN(n) && n >= max} className="rounded-lg border border-line p-2 text-ink hover:bg-tint disabled:opacity-40">
        <Plus size={14} aria-hidden />
      </button>
      {item.unit && <span className="text-xs text-ink-muted">{item.unit}</span>}
    </div>
  );
}

/** Phần trăm: thanh trượt + ô nhập (tối đa 2 chữ số sau dấu chấm). */
function PercentInput({ item, value, onChange, invalid }: Props) {
  const t = useTranslations('admin.settings.ui');
  const n = Number(value);
  const slider = Number.isFinite(n) ? Math.min(item.max ?? 100, Math.max(item.min ?? 0, n)) : 0;
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={item.min ?? 0}
        max={item.max ?? 100}
        step={1}
        value={slider}
        aria-label={t('slider', { label: item.label })}
        onChange={(e) => onChange(e.target.value)}
        className="w-36 accent-accent"
      />
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={item.label}
        aria-invalid={invalid}
        value={value}
        onChange={(e) => {
          // Giữ lại chữ số và đúng một dấu chấm; tối đa 3 chữ số phần nguyên và 2 chữ số phần lẻ.
          const cleaned = e.target.value.replace(/[^\d.]/g, '');
          const [intPart = '', ...rest] = cleaned.split('.');
          onChange(rest.length ? `${intPart.slice(0, 3)}.${rest.join('').slice(0, 2)}` : intPart.slice(0, 3));
        }}
        className={`${base} w-20 text-right ${invalid ? 'border-danger' : 'border-line'}`}
      />
      <span className="text-xs text-ink-muted">%</span>
    </div>
  );
}

/** Đơn giá thập phân (tối đa 4 chữ số sau dấu chấm): chỉ nhận chữ số và một dấu chấm. */
function PriceInput({ item, value, onChange, invalid }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={item.label}
        aria-invalid={invalid}
        value={value}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d.]/g, '');
          const [intPart = '', ...rest] = cleaned.split('.');
          onChange(rest.length ? `${intPart.slice(0, 4)}.${rest.join('').slice(0, 4)}` : intPart.slice(0, 4));
        }}
        className={`${base} w-28 text-right ${invalid ? 'border-danger' : 'border-line'}`}
      />
      {item.unit && <span className="text-xs text-ink-muted">{item.unit}</span>}
    </div>
  );
}

/** Ngày trong tháng (1–28): lưới 28 ô, chọn tối đa 4. */
function DaysGrid({ item, value, onChange }: Props) {
  const t = useTranslations('admin.settings.ui');
  const selected = new Set(parseList(value).map(Number));
  const toggle = (d: number) => {
    const next = new Set(selected);
    if (next.has(d)) next.delete(d);
    else if (next.size < 4) next.add(d);
    onChange(formatList([...next].sort((a, b) => a - b).map(String)));
  };
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={item.label}>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => {
          const on = selected.has(d);
          const locked = !on && selected.size >= 4;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              disabled={locked}
              onClick={() => toggle(d)}
              className={`h-8 w-8 rounded-md text-xs font-semibold transition-colors ${on ? 'bg-accent text-white' : 'border border-line bg-surface text-ink hover:bg-tint'} disabled:opacity-40`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <span className="text-xs text-ink-muted">{t('daysPicked', { count: selected.size })}{selected.size > 0 ? `: ${[...selected].sort((a, b) => a - b).join(', ')}` : ''}</span>
    </div>
  );
}

/** Danh sách ngày cụ thể: chọn bằng lịch rồi thêm; xóa từng ngày bằng dấu ×. */
function DatesPicker({ item, value, onChange }: Props) {
  const t = useTranslations('admin.settings.ui');
  const [draft, setDraft] = useState('');
  const dates = parseList(value);
  const add = () => {
    if (!draft || dates.includes(draft) || dates.length >= 60) return;
    onChange(formatList([...dates, draft].sort()));
    setDraft('');
  };
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={item.label}>
      <div className="flex items-center gap-2">
        <input type="date" aria-label={t('pickHoliday')} value={draft} onChange={(e) => setDraft(e.target.value)} className={`${base} border-line`} />
        <button type="button" onClick={add} disabled={!draft || dates.includes(draft)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-accent-dark hover:bg-tint disabled:opacity-40">
          {t('addDate')}
        </button>
      </div>
      {dates.length === 0 ? (
        <span className="text-xs text-ink-muted">{t('noHolidays')}</span>
      ) : (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {dates.map((d) => (
            <li key={d} className="inline-flex items-center gap-1 rounded-full bg-tint px-2.5 py-1 text-xs font-semibold text-accent-dark">
              {new Date(`${d}T00:00:00`).toLocaleDateString('vi-VN')}
              <button type="button" aria-label={t('removeDate', { date: d })} onClick={() => onChange(formatList(dates.filter((x) => x !== d)))} className="rounded-full hover:text-danger">
                <X size={12} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Danh sách email dạng thẻ: nhập rồi nhấn Enter hoặc dấu phẩy để thêm. */
function EmailTags({ item, value, onChange, invalid }: Props) {
  const t = useTranslations('admin.settings.ui');
  const [draft, setDraft] = useState('');
  const emails = parseList(value);
  const commit = () => {
    const e = draft.trim().replace(/,$/, '');
    if (!e) return;
    if (!emails.some((x) => x.toLowerCase() === e.toLowerCase())) onChange(formatList([...emails, e]));
    setDraft('');
  };
  return (
    <div className="flex w-full flex-col gap-2 sm:w-96" role="group" aria-label={item.label}>
      <input
        type="email"
        autoComplete="off"
        aria-label={t('addEmail')}
        aria-invalid={invalid}
        value={draft}
        placeholder={item.placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        className={`${base} ${invalid ? 'border-danger' : 'border-line'}`}
      />
      {emails.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {emails.map((m) => (
            <li key={m} className="inline-flex items-center gap-1 rounded-full bg-tint px-2.5 py-1 text-xs font-semibold text-accent-dark">
              {m}
              <button type="button" aria-label={t('remove', { value: m })} onClick={() => onChange(formatList(emails.filter((x) => x !== m)))} className="rounded-full hover:text-danger">
                <X size={12} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Điều khiển phù hợp với từng kiểu dữ liệu của một cấu hình (xem {@code lib/admin/settingsSchema}). */
export function SettingControl(props: Props) {
  const { item, value, onChange, invalid } = props;
  switch (item.kind) {
    case 'switch':
      return <Switch checked={value === '1'} onChange={(on) => onChange(on ? '1' : '0')} label={item.label} />;
    case 'number':
      return <IntegerInput {...props} />;
    case 'percent':
      return <PercentInput {...props} />;
    case 'price':
      return <PriceInput {...props} />;
    case 'days':
      return <DaysGrid {...props} />;
    case 'dates':
      return <DatesPicker {...props} />;
    case 'emails':
      return <EmailTags {...props} />;
    default:
      return (
        <input
          type="text"
          aria-label={item.label}
          aria-invalid={invalid}
          maxLength={item.maxLength}
          placeholder={item.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} w-full sm:w-80 ${invalid ? 'border-danger' : 'border-line'}`}
        />
      );
  }
}
