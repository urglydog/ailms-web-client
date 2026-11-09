'use client';

import { useEffect, useRef, useState } from 'react';
import type { SubtitleSegment } from '@/types/domain';

/**
 * Bản ghi lời thoại (Transcript) — giao diện tham khảo Udemy (06/09/2026).
 *
 * Thay thế tab "Nội dung khóa học" trong sidebar khi học viên bật nút Transcript ở thanh điều
 * khiển video (xem `PlayerControls.tsx`/`learn/[lessonId]/page.tsx`), KHÔNG phải 1 tab riêng —
 * đúng yêu cầu "bật transcript sẽ hiển thị tab transcript ... thay thế cho tab danh sách bài học".
 *
 * `translatedSubtitles` khớp với từng câu gốc theo TRÙNG KHOẢNG THỜI GIAN (điểm giữa của câu dịch
 * rơi vào khoảng [startSec, endSec) của câu gốc) thay vì khớp theo `seq`/chỉ số mảng — an toàn kể
 * cả khi 2 bản không chia câu giống hệt nhau (không có gì đảm bảo pipeline dịch luôn giữ đúng 1:1
 * số lượng segment).
 *
 * Auto-scroll: bật thì cuộn theo dòng đang đọc (`scrollIntoView`); tắt thì container đứng yên —
 * vệt tô đậm vẫn di chuyển đúng theo dòng đang phát nên khi phát tới các dòng xa vị trí đang cuộn,
 * vệt tô sẽ tự "trôi" ra khỏi vùng nhìn thấy do người xem không kéo theo, đúng mô tả yêu cầu.
 */

interface TranscriptPanelProps {
  originalSubtitles: SubtitleSegment[];
  /** Rỗng nếu ngôn ngữ đang chọn chưa lồng tiếng xong — khi đó chỉ hiện câu gốc. */
  translatedSubtitles: SubtitleSegment[];
  currentSec: number;
  onSeek: (sec: number) => void;
}

function formatTimestamp(sec: number): string {
  const total = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Câu dịch có điểm giữa rơi vào đúng khoảng thời gian của câu gốc — xem docblock đầu file. */
function findOverlapping(segments: SubtitleSegment[], startSec: number, endSec: number): SubtitleSegment | null {
  const mid = (startSec + endSec) / 2;
  return segments.find((s) => mid >= s.startSec && mid < s.endSec) ?? null;
}

export function TranscriptPanel({ originalSubtitles, translatedSubtitles, currentSec, onSeek }: TranscriptPanelProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const activeRowRef = useRef<HTMLButtonElement>(null);
  const activeSeq = originalSubtitles.find((s) => currentSec >= s.startSec && currentSec < s.endSec)?.seq ?? null;

  useEffect(() => {
    if (autoScroll && activeSeq !== null) {
      activeRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeSeq, autoScroll]);

  return (
    <div className="flex h-full flex-col">
      <label className="flex shrink-0 cursor-pointer items-center gap-2 border-b border-line px-4 py-2.5 text-[12.5px] text-ink-muted">
        <input
          type="checkbox"
          checked={autoScroll}
          onChange={(e) => setAutoScroll(e.target.checked)}
          className="h-3.5 w-3.5 rounded accent-accent"
        />
        Tự động cuộn theo lời thoại
      </label>

      <div className="flex-1 overflow-y-auto p-2">
        {originalSubtitles.length === 0 ? (
          <p className="p-4 text-sm text-ink-muted">Bài học này chưa có bản ghi lời thoại.</p>
        ) : (
          originalSubtitles.map((seg) => {
            const translated = translatedSubtitles.length > 0 ? findOverlapping(translatedSubtitles, seg.startSec, seg.endSec) : null;
            const active = seg.seq === activeSeq;
            return (
              <button
                key={seg.seq}
                ref={active ? activeRowRef : undefined}
                type="button"
                onClick={() => onSeek(seg.startSec)}
                className={`block w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active ? 'bg-accent/15' : 'hover:bg-surface-raised'
                }`}
              >
                <span className="mr-2 align-top font-mono text-[11px] text-ink-faint">{formatTimestamp(seg.startSec)}</span>
                <span className="text-[13.5px] leading-relaxed text-ink">{seg.text}</span>
                {translated && (
                  <span className="mt-0.5 block pl-[42px] text-[12px] italic leading-relaxed text-ink-muted">
                    {translated.text}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
