/**
 * Tab dưới video của trang học bài (UDEMY_LAYOUT_ANALYSIS mục 5): Tổng quan | Lộ trình AI | Hỏi đáp |
 * Học liệu | Transcript | Bảng điểm | Đánh giá. "Tài nguyên" đã gộp vào "Học liệu".
 */
export const MAIN_TAB_KEYS = ['overview', 'study-plan', 'qna', 'materials', 'transcript', 'gradebook', 'reviews'] as const;

export type MainTab = (typeof MAIN_TAB_KEYS)[number];

/**
 * Trên màn hẹp sidebar "Bài giảng | AI Gia sư" không còn cột riêng — trở thành 2 tab đầu tiên dưới video.
 */
export const MOBILE_ONLY_TAB_KEYS = ['lessons', 'tutor'] as const;

export type MobileOnlyTab = (typeof MOBILE_ONLY_TAB_KEYS)[number];

export type LearnTab = MainTab | MobileOnlyTab;

/** Đọc `?tab=` từ URL: tab hợp lệ giữ nguyên, liên kết cũ `resources` chuyển sang `materials`, còn lại về `overview`. */
export function resolveMainTab(param: string | null): MainTab {
  if (param === 'resources') return 'materials';
  return (MAIN_TAB_KEYS as readonly string[]).includes(param ?? '') ? (param as MainTab) : 'overview';
}

/**
 * Như {@link resolveMainTab} nhưng cho phép thêm tab chỉ có trên mobile. Ở desktop các tab đó nằm
 * ở sidebar nên quay về `overview`; ở mobile khi URL không có tab thì mở "Bài giảng" trước.
 */
export function resolveLearnTab(param: string | null, isDesktop: boolean): LearnTab {
  if ((MOBILE_ONLY_TAB_KEYS as readonly string[]).includes(param ?? '')) {
    return isDesktop ? 'overview' : (param as MobileOnlyTab);
  }
  if (!param && !isDesktop) return 'lessons';
  return resolveMainTab(param);
}
