'use client';

import type { VoiceOption } from '@/types/domain';

/**
 * Chọn giọng đọc AI cho 1 ngôn ngữ lồng tiếng — UC20 mở rộng.
 *
 * Component THUẦN, không tự fetch dữ liệu — nhận sẵn `voices` (đã lọc đúng 1 ngôn ngữ, xem
 * `useVoiceOptions()`) để dùng lại được ở bất kỳ đâu cần chọn giọng (không chỉ panel kích hoạt
 * lồng tiếng lúc xem bài học — vd. sau này Admin cấu hình giọng mặc định cũng có thể tái dùng).
 *
 * Nhóm theo giới tính (Nam/Nữ) vì đây là tiêu chí học viên thường chọn theo đầu tiên, đúng như
 * yêu cầu "hiển thị các giọng đọc nam - nữ".
 */

interface VoicePickerProps {
  voices: VoiceOption[];
  /** `voiceName` đang chọn — luôn có giá trị 1 khi `voices` không rỗng (mặc định = giọng isDefault). */
  selected: string | null;
  onSelect: (voiceName: string) => void;
}

/** "vi-VN-HoaiMyNeural" -> "Hoài My" (không dấu vì API không trả sẵn tên có dấu, chỉ tách từ ID). */
function prettyVoiceName(voiceName: string): string {
  const base = voiceName.replace(/^.*-/, '').replace(/Neural$/, '');
  return base.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

export function VoicePicker({ voices, selected, onSelect }: VoicePickerProps) {
  if (voices.length === 0) return null;

  const female = voices.filter((v) => v.gender === 'FEMALE');
  const male = voices.filter((v) => v.gender === 'MALE');

  const renderGroup = (label: string, icon: string, group: VoiceOption[]) => {
    if (group.length === 0) return null;
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          {icon} {label}
        </span>
        <div className="flex flex-wrap gap-2">
          {group.map((voice) => {
            const isSelected = voice.voiceName === selected;
            return (
              <button
                key={voice.voiceName}
                type="button"
                onClick={() => onSelect(voice.voiceName)}
                aria-pressed={isSelected}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  isSelected
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-ink-muted hover:border-accent/50 hover:text-ink'
                }`}
              >
                {prettyVoiceName(voice.voiceName)}
                {voice.isDefault && (
                  <span className="rounded-full bg-line-soft px-1.5 py-0.5 text-[10px] font-normal text-ink-faint">
                    mặc định
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] font-medium text-ink">Chọn giọng đọc</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        {renderGroup('Nữ', '👩', female)}
        {renderGroup('Nam', '👨', male)}
      </div>
    </div>
  );
}
