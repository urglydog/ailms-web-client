/**
 * Mô tả khóa học dùng một tập định dạng rất nhỏ (không phải Markdown đầy đủ, để không kéo thêm thư viện và
 * không có đường chèn HTML): `## Tiêu đề`, dòng bắt đầu bằng `• ` là danh sách, dòng `**Nhãn:** giá trị` là
 * trường thông tin, còn lại là đoạn văn. Văn bản thuần cũ vẫn hiển thị bình thường như các đoạn văn.
 */
export type RichBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'fields'; items: { label: string; value: string }[] };

const FIELD = /^\*\*(.+?):\*\*\s*(.*)$/;

export function parseRichText(source: string | null | undefined): RichBlock[] {
  if (!source || !source.trim()) return [];
  const blocks: RichBlock[] = [];
  for (const chunk of source.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    let i = 0;
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.startsWith('## ')) {
        blocks.push({ type: 'heading', text: line.slice(3).trim() });
        i++;
      } else if (line.startsWith('• ')) {
        const items: string[] = [];
        while (i < lines.length && lines[i]!.startsWith('• ')) items.push(lines[i++]!.slice(2).trim());
        blocks.push({ type: 'list', items });
      } else if (FIELD.test(line)) {
        const items: { label: string; value: string }[] = [];
        while (i < lines.length && FIELD.test(lines[i]!)) {
          const m = FIELD.exec(lines[i++]!)!;
          items.push({ label: m[1]!, value: m[2]! });
        }
        blocks.push({ type: 'fields', items });
      } else {
        const para: string[] = [];
        while (
          i < lines.length &&
          !lines[i]!.startsWith('## ') &&
          !lines[i]!.startsWith('• ') &&
          !FIELD.test(lines[i]!)
        ) {
          para.push(lines[i++]!);
        }
        blocks.push({ type: 'paragraph', text: para.join('\n') });
      }
    }
  }
  return blocks;
}

/** Đoạn văn đầu tiên (không tiêu đề/định dạng), cắt gọn — dùng cho chỗ chỉ có chỗ cho vài dòng. */
export function plainSummary(source: string | null | undefined, max = 220): string {
  const first = parseRichText(source).find((b) => b.type === 'paragraph');
  const text = first && first.type === 'paragraph' ? first.text.replace(/\s+/g, ' ') : '';
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}
