'use client';

import { Button } from '@/components/ui/Button';

/**
 * "Chưa có lồng tiếng" — UC18 (yêu cầu lồng tiếng AI).
 *
 * Hiện khi học viên chọn một ngôn ngữ chưa có `AudioTrack`. Đây là điểm bắt đầu của
 * toàn bộ pipeline lồng tiếng. Hiển thị trong 1 dòng gọn bên dưới video (video vẫn đang
 * phát audio gốc song song) — không còn thay thế cả khung video như trước.
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
}

export function DubbingActivatePanel({
  languageLabel,
  onActivate,
  onWatchOriginal,
  quotaExceeded = false,
  isSubmitting = false,
}: DubbingActivatePanelProps) {
  return (
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
  );
}
