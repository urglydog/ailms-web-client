import type { AudioTrackInfo } from '@/types/domain';

export interface ResolvedAudio {
  /** URL bản lồng tiếng cần phát; `null` = phát tiếng gốc của video. */
  src: string | null;
  /** Mốc bắt đầu (giây, tuyệt đối theo video) của file đang phát — 0 nếu là `finalUrl`. */
  offsetSec: number;
  /** Đã chọn lồng tiếng nhưng đoạn đang xem CHƯA lồng tiếng xong -> đang tạm phát tiếng gốc. */
  pending: boolean;
}

/**
 * Chọn nguồn audio theo trạng thái track (BR-CHUNK-05).
 *
 *  - `finalUrl` đã có → phát file đó, offset = 0.
 *  - Chưa có (`PARTIAL`) → phát chunk CHỨA mốc đang xem; mỗi file chunk đánh mốc t=0 ở đầu chunk
 *    nên offset = `chunk.startSec`.
 *  - Mốc đang xem nằm ở đoạn CHƯA lồng tiếng xong (học viên tua nhanh tới phần sau) → trả
 *    `src: null` để trình phát dùng TIẾNG GỐC của video, kèm `pending: true` để hiện nhãn. Khi chunk
 *    đó xong, trang cha tải lại danh sách chunk và trình phát tự chuyển sang bản lồng tiếng.
 *
 * Sửa 22/11/2026: trước đây rơi về `track.chunks[0]` -> phát file chunk đầu với offset của chunk
 * đầu, vị trí vượt quá độ dài file nên học viên nghe IM LẶNG mà không có thông báo gì.
 */
export function resolveAudio(track: AudioTrackInfo | null, currentSec: number): ResolvedAudio {
  if (!track) {
    return { src: null, offsetSec: 0, pending: false };
  }
  if (track.finalUrl) {
    return { src: track.finalUrl, offsetSec: 0, pending: false };
  }
  const chunk = track.chunks.find((c) => currentSec >= c.startSec && currentSec < c.endSec);
  if (!chunk?.fileUrl) {
    return { src: null, offsetSec: 0, pending: true };
  }
  return { src: chunk.fileUrl, offsetSec: chunk.startSec, pending: false };
}
