import { parseRichText } from '@/lib/text/richText';

/** Hiển thị mô tả có định dạng nhẹ (tiêu đề, danh sách, trường đậm) — xem `lib/text/richText.ts`. */
export function RichText({ text, className = '' }: { text: string | null | undefined; className?: string }) {
  const blocks = parseRichText(text);
  if (blocks.length === 0) return null;
  return (
    <div className={`flex flex-col gap-3 text-[14.5px] leading-relaxed text-ink ${className}`}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h3 key={i} className="m-0 mt-2 font-display text-[15px] font-bold text-ink first:mt-0">
                {block.text}
              </h3>
            );
          case 'list':
            return (
              <ul key={i} className="m-0 flex list-none flex-col gap-1.5 p-0">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2">
                    <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case 'fields':
            return (
              <dl key={i} className="m-0 flex flex-col gap-1.5 rounded-panel border border-line-soft bg-surface p-4">
                {block.items.map((f, j) => (
                  <div key={j} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                    <dt className="shrink-0 font-bold text-ink sm:w-36">{f.label}</dt>
                    <dd className="m-0 text-ink-muted">{f.value}</dd>
                  </div>
                ))}
              </dl>
            );
          default:
            return (
              <p key={i} className="m-0 whitespace-pre-line">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
