'use client';

import { useState, type PointerEvent, type RefObject } from 'react';
import { buildSubtitleAppearance, type SubtitlePosition, type SubtitleTypeSettings } from '@/components/player/subtitleStyle';

/**
 * Chế độ kéo-thả vị trí phụ đề trên khung video — video đã bị `DualPlayer` tạm dừng trước khi
 * vào đây (xem `handleEditPosition`). Nền tối phủ toàn bộ khung hình còn 2 khối phụ đề mẫu vẫn
 * sáng rõ nằm trên cùng, tạo cảm giác "chỉ 2 khối phụ đề còn sáng" — học viên yêu cầu đúng hiệu
 * ứng này ("tô tối đi, để sáng chỗ 2 sub"). Không cần cắt-khoét thật (mask) vì video đã dừng
 * hình, phủ tối toàn khung là đủ, đơn giản và chắc chắn hoạt động mọi trình duyệt.
 *
 * BUG THẬT (06/09/2026): ban đầu hiện chữ mẫu cố định "Đây là phụ đề gốc"/"Đây là phụ đề đã
 * dịch" kèm 1 nhãn tên loại phụ đề phía trên — học viên phản ánh không cần nhãn, muốn thấy THẲNG
 * câu phụ đề THẬT của video tại đúng thời điểm đang dừng để dễ hình dung lúc kéo. Đổi sang nhận
 * `text` thật từ `DualPlayer` (câu đang chủ động phát tại thời điểm dừng, hoặc câu đầu tiên của
 * bài nếu đang dừng đúng lúc không có phụ đề nào) — bỏ hẳn nhãn tên loại, chỉ còn viền màu để
 * phân biệt 2 khối lúc kéo.
 */

interface DraggableChipProps {
  text: string;
  appearance: { className: string; style: React.CSSProperties };
  position: SubtitlePosition;
  onChange: (next: SubtitlePosition) => void;
  containerRef: RefObject<HTMLElement | null>;
  accentBorderClass: string;
}

function DraggableChip({ text, appearance, position, onChange, containerRef, accentBorderClass }: DraggableChipProps) {
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const xPercent = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    onChange({ xPercent, yPercent });
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromPointer(e);
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromPointer(e);
  };
  const handlePointerUp = () => setDragging(false);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none active:cursor-grabbing ${
        dragging ? 'z-20' : 'z-10'
      }`}
      style={{ left: `${position.xPercent}%`, top: `${position.yPercent}%` }}
    >
      <span className={`${appearance.className} border-2 ${accentBorderClass}`} style={appearance.style}>
        {text}
      </span>
    </div>
  );
}

interface SubtitlePositionEditorProps {
  containerRef: RefObject<HTMLElement | null>;
  originalSettings: SubtitleTypeSettings;
  translatedSettings: SubtitleTypeSettings;
  /** Câu phụ đề THẬT của video (đang phát tại thời điểm dừng, hoặc câu đầu bài) — hiện thẳng
   * để học viên dễ hình dung, không dùng chữ mẫu cố định. */
  originalText: string;
  translatedText: string;
  onChangeOriginalPosition: (pos: SubtitlePosition) => void;
  onChangeTranslatedPosition: (pos: SubtitlePosition) => void;
  onResetPositions: () => void;
  onDone: () => void;
}

export function SubtitlePositionEditor({
  containerRef,
  originalSettings,
  translatedSettings,
  originalText,
  translatedText,
  onChangeOriginalPosition,
  onChangeTranslatedPosition,
  onResetPositions,
  onDone,
}: SubtitlePositionEditorProps) {
  return (
    <div className="absolute inset-0 z-30 bg-black/70">
      <div className="absolute inset-x-0 top-3 z-30 flex flex-wrap items-center justify-center gap-2 px-3">
        <span className="rounded-full bg-black/70 px-3 py-1.5 text-[12px] text-white/85">Kéo thả phụ đề tới vị trí mong muốn</span>
        <button type="button" onClick={onResetPositions} className="rounded-full border border-white/30 px-3 py-1.5 text-[12px] text-white hover:border-white">
          Đặt lại mặc định
        </button>
        <button type="button" onClick={onDone} className="rounded-full bg-accent px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-accent-dark">
          Xong
        </button>
      </div>

      <DraggableChip
        text={originalText}
        appearance={buildSubtitleAppearance(originalSettings)}
        position={originalSettings.position}
        onChange={onChangeOriginalPosition}
        containerRef={containerRef}
        accentBorderClass="border-sky-400"
      />
      <DraggableChip
        text={translatedText}
        appearance={buildSubtitleAppearance(translatedSettings)}
        position={translatedSettings.position}
        onChange={onChangeTranslatedPosition}
        containerRef={containerRef}
        accentBorderClass="border-amber-400"
      />
    </div>
  );
}
