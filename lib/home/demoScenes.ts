export const SCENE_COUNT = 3;
/** Mỗi cảnh chạy 3,8 giây (spec mục 4). */
export const SCENE_DURATION_MS = 3800;
/** Ở cảnh "Chọn ngôn ngữ", điểm chọn nhảy sang giọng kế tiếp mỗi 0,9 giây. */
export const LANG_CYCLE_MS = 900;

export interface DemoLanguage {
  code: string;
  /** Tên viết bằng chính ngôn ngữ đó nên không dịch. */
  name: string;
  /** Câu phụ đề mẫu của bài demo. */
  subtitle: string;
  original?: boolean;
}

export const DEMO_LANGUAGES: ReadonlyArray<DemoLanguage> = [
  { code: 'en', name: 'English', subtitle: 'Today we will start with the basic concepts', original: true },
  { code: 'vi', name: 'Tiếng Việt', subtitle: 'Hôm nay chúng ta sẽ bắt đầu với khái niệm cơ bản' },
  { code: 'ja', name: '日本語', subtitle: '今日は基本的な概念から始めましょう' },
  { code: 'zh', name: '中文', subtitle: '今天我们从基本概念开始' },
  { code: 'es', name: 'Español', subtitle: 'Hoy empezaremos con los conceptos básicos' },
];

export function nextScene(i: number): number {
  return (i + 1) % SCENE_COUNT;
}

/** Xoay trong các giọng lồng tiếng (chỉ số 1 đến 4), bỏ qua bản gốc ở chỉ số 0. */
export function nextDubLanguage(i: number): number {
  return i >= DEMO_LANGUAGES.length - 1 ? 1 : i + 1;
}
