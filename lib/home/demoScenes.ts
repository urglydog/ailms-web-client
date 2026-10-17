export interface DemoLanguage {
  code: string;
  /** Tên viết bằng chính ngôn ngữ đó nên không dịch. */
  name: string;
  /** Câu phụ đề mẫu của bài demo. */
  subtitle: string;
  original?: boolean;
}

/** Thứ tự trong menu chọn giọng của video demo; phần tử đầu là bản gốc. */
export const DEMO_LANGUAGES: ReadonlyArray<DemoLanguage> = [
  { code: 'en', name: 'English', subtitle: "Today we'll start with the basics", original: true },
  { code: 'vi', name: 'Tiếng Việt', subtitle: 'Hôm nay chúng ta bắt đầu với các khái niệm cơ bản' },
  { code: 'ja', name: '日本語', subtitle: '今日は基本的な概念から始めます' },
  { code: 'es', name: 'Español', subtitle: 'Hoy empezaremos con los conceptos básicos' },
  { code: 'zh', name: '中文', subtitle: '今天我们从基本概念开始' },
];

/** Các lần chọn giọng trong kịch bản: [chỉ mục được chọn, chỉ mục đang chọn trước đó]. Kết thúc ở Tiếng Việt. */
export const DEMO_PICKS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [2, 1],
  [3, 2],
  [1, 3],
];

/** Khóa được chọn ở bước 1 (chỉ mục trong danh sách thẻ của demo). */
export const DEMO_PICKED_INDEX = 3;

export const DEMO_START_SECONDS = 42;
export const DEMO_JUMP_SECONDS = 135;
export const DEMO_TOTAL_SECONDS = 510;

/** Phụ đề tiếng Việt hiện sau khi tua tới mốc 02:15. */
export const DEMO_JUMP_SUBTITLE = 'Auto layout giúp khung tự co giãn theo nội dung';
