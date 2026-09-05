import Link from 'next/link';
import type { LiveFeedItem } from '@/types/domain';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Tên hiển thị từ mã BCP-47 — dùng API chuẩn của trình duyệt thay vì tự liệt kê bảng tên (BR-DUB-07
 * cấm hardcode danh sách ngôn ngữ) — cùng cách `LiveLanguagePicker.tsx` đang làm. */
function languageDisplayName(code: string): string {
  try {
    return new Intl.DisplayNames(['vi'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * F11.9 mở rộng (05/09/2026) — đổi từ thẻ hàng ngang sang thẻ ảnh thumbnail dạng lưới, theo mẫu
 * các nền tảng live phổ biến (Nimo TV, Twitch...) mà bạn tham khảo: ảnh tỉ lệ 4:3 (hơi vuông hơn
 * 16:9 mặc định của video) làm trọng tâm, badge trạng thái đè góc trên-trái, tiêu đề + thông tin
 * phụ nằm DƯỚI ảnh (không đè chữ lên ảnh — tránh phải lo độ tương phản chữ/ảnh). Toàn bộ thẻ luôn
 * là 1 link duy nhất tới `/live/{id}` kể cả khi SCHEDULED — trang xem đã tự xử lý đúng trạng thái
 * "sắp diễn ra" (hiện giờ dự kiến, không có gì để xem), khớp đúng UX "bấm vào đâu trên thẻ cũng
 * được" của các nền tảng tham khảo, không cần tách 2 nhánh clickable/không-clickable.
 *
 * Vẫn đúng NGUYÊN 5 mục dữ liệu đã chốt lúc thiết kế F11.9 (trạng thái, tiêu đề, khóa học, giảng
 * viên, ngôn ngữ gốc) — ảnh thumbnail là THAY ĐỔI CÁCH TRÌNH BÀY, không phải thêm dữ liệu mới
 * ngoài chính bản thân ảnh.
 */
export function LiveFeedCard({ item }: { item: LiveFeedItem }) {
  const isLive = item.status === 'LIVE';

  return (
    <Link href={`/live/${item.id}`} className="group flex flex-col gap-2 no-underline">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-line-soft">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/15 to-accent/5 text-3xl">
            🎬
          </div>
        )}

        <div className="absolute left-2 top-2">
          {isLive ? (
            <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white shadow">
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden /> LIVE
            </span>
          ) : (
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
              🗓️ {item.scheduledAt ? formatDateTime(item.scheduledAt) : 'Sắp diễn ra'}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className="m-0 truncate text-[13.5px] font-semibold leading-snug text-ink group-hover:text-accent">
          {item.title}
        </p>
        <p className="m-0 truncate text-[12px] text-ink-muted">{item.instructorName}</p>
        <p className="m-0 truncate text-[11.5px] text-ink-faint">
          {item.courseTitle} · 🌐 {languageDisplayName(item.sourceLanguage)}
        </p>
      </div>
    </Link>
  );
}
