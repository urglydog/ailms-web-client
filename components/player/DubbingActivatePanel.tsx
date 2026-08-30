'use client';

import { Button } from '@/components/ui/Button';
import { VoicePicker } from '@/components/player/VoicePicker';
import type { VoiceOption } from '@/types/domain';

/**
 * "Chưa có lồng tiếng" — UC18 (yêu cầu lồng tiếng AI).
 *
 * Hiện khi học viên chọn một ngôn ngữ chưa có `AudioTrack`. Đây là điểm bắt đầu của
 * toàn bộ pipeline lồng tiếng. Hiển thị trong 1 khối gọn bên dưới video (video vẫn đang
 * phát audio gốc song song) — không còn thay thế cả khung video như trước.
 *
 * UC20 mở rộng — nếu ngôn ngữ có nhiều hơn 1 giọng đọc active, hiện thêm `VoicePicker` để
 * học viên chọn TRƯỚC khi bấm kích hoạt (giọng chỉ chọn được lúc này — người kích hoạt ĐẦU
 * TIÊN cho 1 cặp bài học+ngôn ngữ quyết định giọng dùng chung cho mọi học viên sau, xem
 * `DubbingRequestService.resolveRequestedVoice`). Ẩn hẳn nếu chỉ có 1 giọng (không có gì để chọn).
 *
 * Nút "Để dành sau" là lối thoát quan trọng: BR-DUB-06 quy định khi học viên vượt hạn
 * ngạch 15 job/ngày thì **vẫn phải cho xem video với audio gốc**, chứ không được chặn
 * hoàn toàn — nay video đã sẵn đang phát nên nút chỉ cần đóng dòng thông báo lại.
 */

interface DubbingActivatePanelProps {
  languageLabel: string;
  onActivate: () => void;
  onWatchOriginal: () => void;
  /** true khi đã hết hạn ngạch trong ngày (BR-DUB-06) */
  quotaExceeded?: boolean;
  isSubmitting?: boolean;
  /** UC20 mở rộng — các giọng active của ĐÚNG ngôn ngữ đang chọn (đã lọc sẵn từ ngoài). */
  voices?: VoiceOption[];
  selectedVoice?: string | null;
  onSelectVoice?: (voiceName: string) => void;
}

export function DubbingActivatePanel({
  languageLabel,
  onActivate,
  onWatchOriginal,
  quotaExceeded = false,
  isSubmitting = false,
  voices = [],
  selectedVoice = null,
  onSelectVoice,
}: DubbingActivatePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">
          {quotaExceeded ? (
            <>
              Bạn đã đạt giới hạn yêu cầu lồng tiếng hôm nay. Vui lòng quay lại vào ngày mai hoặc chọn
              ngôn ngữ đã có sẵn.
            </>
          ) : (
            <>
              Ngôn ngữ <strong className="text-ink">{languageLabel}</strong> chưa có bản lồng tiếng AI.
            </>
          )}
        </p>

        <div className="flex shrink-0 items-center gap-4">
          {!quotaExceeded && (
            <Button variant="ai" size="sm" onClick={onActivate} disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi…' : '⚡ Kích hoạt lồng tiếng AI'}
            </Button>
          )}
          <button
            type="button"
            onClick={onWatchOriginal}
            className="text-sm font-medium text-ink-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Để dành sau
          </button>
        </div>
      </div>

      {!quotaExceeded && voices.length > 1 && onSelectVoice && (
        <VoicePicker voices={voices} selected={selectedVoice} onSelect={onSelectVoice} />
      )}
    </div>
  );
}
