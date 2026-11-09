import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

/**
 * UC30 mở rộng (13/09/2026) — Gia sư AI giờ tìm kiếm xuyên suốt mọi bài trong khóa, nên 1 câu
 * trả lời có thể trích dẫn TỪ NHIỀU bài khác nhau cùng lúc. Định dạng mới `[lessonId|MM:SS]`
 * (nhóm 1 = lessonId) mang theo đúng bài học của mốc đó; định dạng cũ `[MM:SS]` (không có
 * lessonId, nhóm 1 rỗng) vẫn được hỗ trợ — luồng giải thích câu hỏi trắc nghiệm
 * (`answer_single_lesson` ở ai-worker) không đổi, luôn ngầm hiểu là bài đang mở.
 */
const TIMESTAMP_RE = /\[(?:(\d+)\|)?(\d{1,3}):([0-5]?\d)\]/g;

/** Nhãn nút bấm hiện thêm "· Tên bài" khi mốc thời gian thuộc 1 bài KHÁC bài đang mở, để học
 * viên biết TRƯỚC khi bấm là sẽ nhảy sang bài nào, không chỉ thấy mỗi giờ:phút:giây. */
function injectTimestampLinks(
  content: string, currentLessonId?: number, lessonTitleById?: Record<number, string>,
): string {
  return content.replace(TIMESTAMP_RE, (_match, lessonIdStr: string | undefined, m: string, s: string) => {
    const sec = Number(m) * 60 + Number(s);
    const lessonId = lessonIdStr ? Number(lessonIdStr) : undefined;
    const target = lessonId !== undefined ? `${sec}@${lessonId}` : `${sec}`;
    const timeLabel = `${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
    const isOtherLesson = lessonId !== undefined && currentLessonId !== undefined && lessonId !== currentLessonId;
    const lessonLabel = isOtherLesson ? lessonTitleById?.[lessonId] ?? `bài #${lessonId}` : null;
    const linkText = lessonLabel ? `▶ ${timeLabel} · ${lessonLabel}` : `▶ ${timeLabel}`;
    return `[${linkText}](tutor-seek:${target})`;
  });
}

/**
 * BUG THẬT (05/09/2026): `react-markdown` mặc định LỌC BỎ mọi href không thuộc giao thức
 * an toàn của nó (`http(s)`/`mailto`/`ircs`/`xmpp` — xem `defaultUrlTransform` trong
 * `node_modules/react-markdown/lib/index.js`), thay bằng chuỗi rỗng `""`. Link nội bộ
 * `tutor-seek:<giây>` mình tự tạo ở `injectTimestampLinks` bị strip mất TRƯỚC KHI tới
 * component `a` bên dưới — `href` nhận được luôn là `""`, không bao giờ khớp
 * `startsWith('tutor-seek:')`, nên rơi vào nhánh `<a href="" target="_blank">` mặc định:
 * bấm vào mở tab mới trỏ về CHÍNH trang đang xem (href rỗng), video không hề được tua.
 * Fix: thêm `tutor-seek:` vào danh sách được phép, mọi URL khác vẫn qua đúng
 * `defaultUrlTransform` như cũ (không tắt hẳn sanitize — Gemini generation content vẫn
 * cần được lọc URL an toàn bình thường, ví dụ link nguồn từ Google Search Grounding).
 */
function urlTransform(url: string): string {
  return url.startsWith('tutor-seek:') ? url : defaultUrlTransform(url);
}

export function MarkdownRenderer({
  content, onSeek, currentLessonId, lessonTitleById,
}: {
  content: string;
  /** `lessonId` là `null` khi mốc thời gian không kèm bài học riêng (định dạng cũ `[MM:SS]`,
   * luôn hiểu là bài đang mở) — xem `TIMESTAMP_RE`. */
  onSeek?: (sec: number, lessonId: number | null) => void;
  /** Bài đang mở + tên các bài trong khóa — chỉ dùng để HIỂN THỊ tên bài ngay trong nút bấm khi
   * mốc trích dẫn thuộc bài khác (xem `injectTimestampLinks`), không ảnh hưởng logic tua/điều
   * hướng (`onSeek` vẫn tự đủ thông tin qua `lessonId`). */
  currentLessonId?: number;
  lessonTitleById?: Record<number, string>;
}) {
  const processedContent = onSeek ? injectTimestampLinks(content, currentLessonId, lessonTitleById) : content;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const components: Components = {
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('tutor-seek:')) {
        const [secPart, lessonIdPart] = href.slice('tutor-seek:'.length).split('@');
        const sec = Number(secPart);
        const lessonId = lessonIdPart ? Number(lessonIdPart) : null;
        return (
          <button
            type="button"
            onClick={() => onSeek?.(sec, lessonId)}
            className="mx-0.5 inline rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent hover:bg-accent/20"
            {...props}
          >
            {children}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline" {...props}>
          {children}
        </a>
      );
    },
    p: ({ children, ...props }: any) => <p className="mb-1.5 last:mb-0" {...props}>{children}</p>,
    ul: ({ children, ...props }: any) => <ul className="mb-1.5 list-disc pl-5 last:mb-0" {...props}>{children}</ul>,
    ol: ({ children, ...props }: any) => <ol className="mb-1.5 list-decimal pl-5 last:mb-0" {...props}>{children}</ol>,
    li: ({ children, ...props }: any) => <li className="mb-0.5" {...props}>{children}</li>,
    h3: ({ children, ...props }: any) => <h3 className="mb-1 mt-2 text-[14px] font-bold first:mt-0" {...props}>{children}</h3>,
    strong: ({ children, ...props }: any) => <strong className="font-semibold" {...props}>{children}</strong>,
    code: ({ children, ...props }: any) => <code className="rounded bg-ink/[0.06] px-1 py-0.5 font-mono text-[13px]" {...props}>{children}</code>,
    table: ({ children, ...props }: any) => (
      <div className="mb-1.5 overflow-x-auto last:mb-0">
        <table className="w-full border-collapse text-[13px]" {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }: any) => <th className="border border-line bg-surface px-2 py-1 text-left font-semibold" {...props}>{children}</th>,
    td: ({ children, ...props }: any) => <td className="border border-line px-2 py-1" {...props}>{children}</td>,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={urlTransform}>
      {processedContent}
    </ReactMarkdown>
  );
}
