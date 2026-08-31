'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { VoicePicker } from '@/components/player/VoicePicker';
import { useVoiceOptions } from '@/hooks/useVoiceOptions';
import type { LiveLanguageTrack, VoiceOption } from '@/types/domain';

/** Tên hiển thị từ mã BCP-47 — dùng API chuẩn của trình duyệt thay vì tự tay liệt kê bảng tên
 * cho 148 ngôn ngữ (khớp tinh thần BR-DUB-07: không hardcode danh sách ngôn ngữ). */
function languageDisplayName(code: string): string {
  try {
    return new Intl.DisplayNames(['vi'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

interface LiveLanguagePickerProps {
  isAuthenticated: boolean;
  /** Ngôn ngữ giảng viên đang nói — vô hiệu hoá đúng mục này trong danh sách, chặn từ gốc trường
   * hợp thật đã gặp: chọn trùng ngôn ngữ nguồn khiến Azure "dịch" gần như y nguyên câu gốc, nghe
   * giống hệt audio gốc và dễ tưởng nhầm là lỗi luồng audio. */
  sourceLanguage: string;
  activeTracks: LiveLanguageTrack[];
  selectedLanguage: string | null;
  onSelect: (targetLanguage: string, voiceName?: string) => void;
  onClearSelection: () => void;
  onRequireLogin: () => void;
  isPending: boolean;
}

/**
 * UC52 — chọn ngôn ngữ lồng tiếng live. KHÔNG tái dùng nguyên `LanguageDropdown` (component đó
 * gắn chặt với kiểu `DubLanguage` — `available`/`track`/`subtitles` là khái niệm của lồng tiếng
 * VIDEO theo lô, không khớp ngữ nghĩa "đang có track ACTIVE + bao nhiêu người nghe" của live) —
 * dựng combobox tìm-kiếm-được mới cùng UX, còn `VoicePicker` (thuần, không phụ thuộc ngữ cảnh
 * dubbing) tái dùng nguyên như kế hoạch.
 */
export function LiveLanguagePicker({
  isAuthenticated,
  sourceLanguage,
  activeTracks,
  selectedLanguage,
  onSelect,
  onClearSelection,
  onRequireLogin,
  isPending,
}: LiveLanguagePickerProps) {
  const { data: voiceOptions } = useVoiceOptions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages = useMemo(() => {
    const codes = new Set((voiceOptions ?? []).map((v) => v.language));
    return Array.from(codes).sort((a, b) => languageDisplayName(a).localeCompare(languageDisplayName(b), 'vi'));
  }, [voiceOptions]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredLanguages = normalizedQuery
    ? languages.filter(
        (code) =>
          languageDisplayName(code).toLowerCase().includes(normalizedQuery) ||
          code.toLowerCase().includes(normalizedQuery),
      )
    : languages;

  const trackByLanguage = useMemo(() => {
    const map = new Map<string, LiveLanguageTrack>();
    activeTracks.forEach((t) => map.set(t.targetLanguage, t));
    return map;
  }, [activeTracks]);

  const voicesForPendingLanguage: VoiceOption[] = useMemo(
    () => (pendingLanguage ? (voiceOptions ?? []).filter((v) => v.language === pendingLanguage) : []),
    [voiceOptions, pendingLanguage],
  );

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setPendingLanguage(null);
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const handlePickLanguage = (code: string) => {
    if (code === sourceLanguage) return; // ngôn ngữ giảng viên đang nói — không có gì để dịch
    if (!isAuthenticated) {
      onRequireLogin();
      setOpen(false);
      return;
    }
    const existing = trackByLanguage.get(code);
    if (existing) {
      // Ngôn ngữ này đã có người nghe — chỉ tham gia, không được chọn giọng (BR-LIVE-05).
      onSelect(code);
      setOpen(false);
      return;
    }
    setPendingLanguage(code);
  };

  const handleConfirmVoice = (voiceName: string) => {
    if (!pendingLanguage) return;
    onSelect(pendingLanguage, voiceName);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-full border border-line bg-surface-raised px-4 py-2.5
                   text-sm font-medium text-ink shadow-card transition-colors hover:border-accent disabled:opacity-60"
      >
        {selectedLanguage ? (
          <span>🔊 {languageDisplayName(selectedLanguage)}</span>
        ) : (
          <span className="text-ink-muted">🌐 Âm thanh gốc</span>
        )}
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden className="text-ink-faint">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 min-w-[280px] overflow-hidden rounded-card border border-line bg-surface-raised shadow-card-hover">
          {pendingLanguage ? (
            <div className="flex flex-col gap-3 p-4">
              <button
                type="button"
                onClick={() => setPendingLanguage(null)}
                className="self-start text-[12px] font-semibold text-ink-muted hover:text-ink"
              >
                ← Chọn ngôn ngữ khác
              </button>
              <p className="text-[13px] text-ink">
                Chọn giọng đọc cho <strong>{languageDisplayName(pendingLanguage)}</strong> — bạn là
                người đầu tiên chọn ngôn ngữ này, giọng sẽ dùng chung cho mọi người nghe sau.
              </p>
              <VoicePicker voices={voicesForPendingLanguage} selected={null} onSelect={handleConfirmVoice} />
            </div>
          ) : (
            <>
              <div className="border-b border-line-soft p-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  placeholder="Tìm ngôn ngữ…"
                  className="w-full rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]
                             text-ink outline-none placeholder:text-ink-faint focus:border-accent"
                />
              </div>
              <ul className="max-h-72 overflow-y-auto py-1">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onClearSelection();
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${
                      selectedLanguage === null ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-surface'
                    }`}
                  >
                    🌐 Âm thanh gốc
                  </button>
                </li>
                {filteredLanguages.length === 0 && (
                  <li className="px-4 py-3 text-center text-[13px] text-ink-faint">Không tìm thấy ngôn ngữ nào</li>
                )}
                {filteredLanguages.map((code) => {
                  const track = trackByLanguage.get(code);
                  const isSelected = code === selectedLanguage;
                  const isSource = code === sourceLanguage;
                  return (
                    <li key={code}>
                      <button
                        type="button"
                        disabled={isSource}
                        title={isSource ? 'Giảng viên đang nói ngôn ngữ này — không có gì để dịch' : undefined}
                        onClick={() => handlePickLanguage(code)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${
                          isSource
                            ? 'cursor-not-allowed text-ink-faint opacity-60'
                            : isSelected
                              ? 'bg-accent/10 font-semibold text-accent'
                              : 'text-ink hover:bg-surface'
                        }`}
                      >
                        <span>
                          {languageDisplayName(code)}
                          {isSource && <span className="text-[11px]"> (gốc)</span>}
                        </span>
                        {!isSource && track && (
                          <span className="shrink-0 rounded-full bg-line-soft px-2 py-0.5 text-[11px] text-ink-muted">
                            🔊 {track.activeListenerCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {selectedLanguage && (
        <p className="mt-1.5 text-[11px] text-ink-faint">
          Âm thanh lồng tiếng có thể trễ vài giây so với hình ảnh.
        </p>
      )}
    </div>
  );
}
