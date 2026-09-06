'use client';

import { useEffect, useState } from 'react';
import {
  buildSubtitleAppearance,
  COLOR_SWATCHES,
  FONT_SIZE_OPTIONS,
  normalizeHex,
  PRESET_TEMPLATES,
  type SubtitleSettings,
  type SubtitleTypeSettings,
} from '@/components/player/subtitleStyle';

/**
 * Bảng cài đặt phụ đề — giao diện tham khảo tiện ích eJOY (06/09/2026), rút gọn cho đúng những
 * gì project này có: 2 loại phụ đề (gốc/đã dịch, KHÔNG có "Machine translation"/"Phonetic" như
 * eJOY vì không phải tính năng của hệ thống).
 *
 * (06/09/2026 — sửa lần 2) Mỗi thuộc tính (màu chữ/màu nền/độ đậm nền/viền chữ) là 1 điều khiển
 * ĐỘC LẬP thay vì các "preset" loại trừ nhau như bản đầu — học viên yêu cầu rõ phải KẾT HỢP được
 * (vd nền đen + chữ vàng + có viền cùng lúc). `PRESET_TEMPLATES` giờ chỉ là nút "áp nhanh" 1
 * PHẦN cấu hình (patch), bấm nhiều mẫu liên tiếp sẽ CHỒNG lên nhau, không thay thế lẫn nhau.
 */

interface SubtitleSettingsModalProps {
  settings: SubtitleSettings;
  onChange: (next: SubtitleSettings) => void;
  showOriginal: boolean;
  onToggleShowOriginal: () => void;
  originalAvailable: boolean;
  showTranslated: boolean;
  onToggleShowTranslated: () => void;
  translatedAvailable: boolean;
  onClose: () => void;
  onEditPosition: () => void;
}

type Tab = 'original' | 'translated';

/** Ô chọn màu: bảng màu nhanh + bảng chọn màu gốc trình duyệt (`<input type="color">`, đúng ý
 * "chọn trên mã màu có sẵn như các app vẽ màu") + ô tự nhập mã hex. */
function ColorPickerRow({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commitDraft = () => {
    const normalized = normalizeHex(draft);
    if (normalized) onChange(normalized);
    else setDraft(value); // Ma khong hop le -> tra ve gia tri hop le gan nhat, khong lam vo style.
  };

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={c}
            className={`h-7 w-7 rounded-full border-2 ${
              (normalizeHex(value) ?? '') === c ? 'border-accent-glow' : 'border-white/30 hover:border-white/60'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={normalizeHex(value) ?? '#000000'}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Chọn màu tuỳ ý"
          className="h-7 w-7 cursor-pointer rounded-full border-2 border-white/30 bg-transparent p-0"
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitDraft();
          }}
          placeholder="#rrggbb"
          className="w-24 rounded-md border border-white/20 bg-transparent px-2 py-1 text-[12px] text-white placeholder:text-white/40 focus:border-accent"
        />
      </div>
    </div>
  );
}

export function SubtitleSettingsModal({
  settings,
  onChange,
  showOriginal,
  onToggleShowOriginal,
  originalAvailable,
  showTranslated,
  onToggleShowTranslated,
  translatedAvailable,
  onClose,
  onEditPosition,
}: SubtitleSettingsModalProps) {
  // Mặc định mở đúng tab "Phụ đề gốc" (06/09/2026 — trước đó lỡ mặc định "Phụ đề đã dịch").
  const [tab, setTab] = useState<Tab>('original');
  const current = settings[tab];
  const isOn = tab === 'original' ? showOriginal : showTranslated;
  const onToggleOn = tab === 'original' ? onToggleShowOriginal : onToggleShowTranslated;
  const available = tab === 'original' ? originalAvailable : translatedAvailable;

  const updateCurrent = (patch: Partial<SubtitleTypeSettings>) => {
    onChange({ ...settings, [tab]: { ...current, ...patch } });
  };

  const previewAppearance = buildSubtitleAppearance(current);

  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-y-auto bg-ink/95 p-5 text-white">
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <h2 className="mb-4 text-center font-display text-lg font-bold">Cài đặt phụ đề</h2>

      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <div className="flex border-b border-white/15">
          <button
            type="button"
            onClick={() => setTab('original')}
            className={`flex-1 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              tab === 'original' ? 'border-accent text-accent-glow' : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Phụ đề gốc
          </button>
          <button
            type="button"
            onClick={() => setTab('translated')}
            className={`flex-1 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              tab === 'translated' ? 'border-accent text-accent-glow' : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Phụ đề đã dịch
          </button>
        </div>

        <label className={`flex cursor-pointer items-center justify-between gap-3 ${!available ? 'cursor-not-allowed opacity-50' : ''}`}>
          <span className="text-sm">
            Bật hiển thị
            {!available && <span className="ml-1.5 text-[12px] text-white/50">(chưa có phụ đề)</span>}
          </span>
          <input type="checkbox" checked={isOn} disabled={!available} onChange={onToggleOn} className="h-4 w-4 rounded accent-accent" />
        </label>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">Cỡ chữ</p>
          <div className="flex gap-2">
            {FONT_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateCurrent({ fontSize: opt.value })}
                className={`flex h-10 flex-1 items-center justify-center rounded-md border ${
                  current.fontSize === opt.value ? 'border-accent bg-accent/20 text-accent-glow' : 'border-white/20 hover:border-white/50'
                }`}
              >
                <span className={opt.textClass}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <ColorPickerRow label="Màu chữ" value={current.textColor} onChange={(hex) => updateCurrent({ textColor: hex })} />
        <ColorPickerRow label="Màu nền" value={current.backgroundColor} onChange={(hex) => updateCurrent({ backgroundColor: hex })} />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Độ đậm nền</p>
            <span className="text-[12px] text-white/60">{current.backgroundOpacity === 0 ? 'Trong suốt' : `${current.backgroundOpacity}%`}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={current.backgroundOpacity}
            onChange={(e) => updateCurrent({ backgroundOpacity: Number(e.target.value) })}
            aria-label="Độ đậm nền"
            className="h-1.5 w-full accent-accent"
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm">Viền chữ (dễ đọc trên nền sáng)</span>
          <input
            type="checkbox"
            checked={current.outline}
            onChange={(e) => updateCurrent({ outline: e.target.checked })}
            className="h-4 w-4 rounded accent-accent"
          />
        </label>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">Mẫu có sẵn (có thể áp nhiều mẫu liên tiếp)</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => updateCurrent(t.patch)}
                className="rounded-md border border-white/20 px-3 py-1.5 text-[13px] hover:border-white/50"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">Xem trước</p>
          <div className="flex h-16 items-center justify-center rounded-md bg-black/40">
            <span className={previewAppearance.className} style={previewAppearance.style}>
              {tab === 'original' ? 'Đây là phụ đề gốc' : 'Đây là phụ đề đã dịch'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditPosition}
          className="mt-1 flex items-center justify-center gap-2 rounded-full border border-white/25 py-2.5 text-sm font-semibold hover:border-white"
        >
          <span aria-hidden>🖱️</span>
          Tuỳ chỉnh vị trí phụ đề trên video
        </button>
      </div>
    </div>
  );
}
