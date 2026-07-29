'use client';

import { Button } from '@/components/ui/Button';

/**
 * Panel "Chưa có lồng tiếng" — UC18 (yêu cầu lồng tiếng AI).
 *
 * Hiện khi học viên chọn một ngôn ngữ chưa có `AudioTrack`. Đây là điểm bắt đầu của
 * toàn bộ pipeline lồng tiếng.
 *
 * Nút "Xem tạm với âm thanh gốc" là lối thoát quan trọng: BR-DUB-06 quy định khi
 * học viên vượt hạn ngạch 15 job/ngày thì **vẫn phải cho xem video với audio gốc**,
 * chứ không được chặn hoàn toàn.
 */

interface DubbingActivatePanelProps {
  languageLabel: string;
  onActivate: () => void;
  onWatchOriginal: () => void;
  /** true khi đã hết hạn ngạch trong ngày (BR-DUB-06) */
  quotaExceeded?: boolean;
  isSubmitting?: boolean;
}

export function DubbingActivatePanel({
  languageLabel,
  onActivate,
  onWatchOriginal,
  quotaExceeded = false,
  isSubmitting = false,
}: DubbingActivatePanelProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="font-display text-lg font-bold text-white">Chưa có lồng tiếng</span>

      <p className="max-w-md text-sm text-white/70">
        {quotaExceeded ? (
          <>
            Bạn đã đạt giới hạn yêu cầu lồng tiếng hôm nay. Vui lòng quay lại vào ngày mai hoặc chọn
            ngôn ngữ đã có sẵn.
          </>
        ) : (
          <>
            Ngôn ngữ <strong className="text-white">{languageLabel}</strong> chưa có bản lồng tiếng AI.
            Kích hoạt để hệ thống tự động xử lý.
          </>
        )}
      </p>

      {!quotaExceeded && (
        <Button variant="ai" size="lg" onClick={onActivate} disabled={isSubmitting} className="mt-1">
          {isSubmitting ? 'Đang gửi yêu cầu…' : '⚡ Kích hoạt lồng tiếng AI'}
        </Button>
      )}

      <button
        type="button"
        onClick={onWatchOriginal}
        className="mt-1 text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
      >
        Xem tạm với âm thanh gốc
      </button>
    </div>
  );
}
