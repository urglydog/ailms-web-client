/** Tab dưới video của trang học bài (spec mục 7): 6 tab, "Tài nguyên" đã gộp vào "Học liệu". */
export const MAIN_TAB_KEYS = ['overview', 'study-plan', 'qna', 'materials', 'gradebook', 'reviews'] as const;

export type MainTab = (typeof MAIN_TAB_KEYS)[number];

/** Đọc `?tab=` từ URL: tab hợp lệ giữ nguyên, liên kết cũ `resources` chuyển sang `materials`, còn lại về `overview`. */
export function resolveMainTab(param: string | null): MainTab {
  if (param === 'resources') return 'materials';
  return (MAIN_TAB_KEYS as readonly string[]).includes(param ?? '') ? (param as MainTab) : 'overview';
}
