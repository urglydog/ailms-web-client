export type EditTabKey = 'goals' | 'curriculum' | 'materials' | 'resources' | 'proctoring' | 'basics' | 'pricing' | 'promotions';
export type EditTabGroup = 'plan' | 'content' | 'publish';

export interface EditTab {
  key: EditTabKey;
  group: EditTabGroup;
}

/** Các bước của trình chỉnh sửa khóa học theo thứ tự hiển thị (3 nhóm: Lập kế hoạch / Tạo nội dung / Xuất bản, 26/11/2026); nhãn lấy từ `instructor.edit.tabs.<key>`.
 * Mỗi `key` trùng đoạn cuối của đường dẫn `/instructor/courses/{id}/edit/{key}`. */
export const EDIT_TABS: EditTab[] = [
  { key: 'goals', group: 'plan' },
  { key: 'curriculum', group: 'content' },
  { key: 'materials', group: 'content' },
  { key: 'resources', group: 'content' },
  { key: 'proctoring', group: 'content' },
  { key: 'basics', group: 'publish' },
  { key: 'pricing', group: 'publish' },
  { key: 'promotions', group: 'publish' },
];

export function editTabHref(courseId: number, key: EditTabKey): string {
  return `/instructor/courses/${courseId}/edit/${key}`;
}

/** Tab đang mở theo đường dẫn (kể cả trang con), hoặc null khi ở trang gốc `/edit` hay khóa khác. */
export function activeEditTab(pathname: string, courseId: number): EditTabKey | null {
  return (
    EDIT_TABS.find((tab) => {
      const href = editTabHref(courseId, tab.key);
      return pathname === href || pathname.startsWith(`${href}/`);
    })?.key ?? null
  );
}

/** Số điều kiện gửi duyệt của một khóa (tiêu đề, mô tả, ảnh bìa, có chương, có bài học sẵn sàng). */
const SUBMIT_CONDITIONS = 5;

/** Phần trăm hoàn thiện để gửi duyệt: đủ điều kiện là 100, mỗi điều kiện còn thiếu trừ 20, không âm. */
export function editCompletion(course: { canSubmit: boolean; missingConditions: string[] }): number {
  if (course.canSubmit) return 100;
  return Math.max(0, Math.round(((SUBMIT_CONDITIONS - course.missingConditions.length) / SUBMIT_CONDITIONS) * 100));
}

/** Dữ liệu tối thiểu để chấm ✓ từng bước của checklist trình soạn. */
export interface EditStepCourse {
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  isFree: boolean;
  chapters: { lessons: unknown[] }[];
  learningOutcomes?: string[];
}

/** Bước đã xong (✓), chưa xong (false) hoặc là bước tuỳ chọn không chấm (null). */
export function editStepDone(course: EditStepCourse, key: EditTabKey): boolean | null {
  switch (key) {
    case 'goals':
      return (course.learningOutcomes?.length ?? 0) >= 4;
    case 'curriculum':
      return course.chapters.some((c) => c.lessons.length > 0);
    case 'basics':
      return !!course.title?.trim() && !!course.description?.trim() && !!course.thumbnailUrl;
    case 'pricing':
      return course.isFree || course.price > 0;
    default:
      return null;
  }
}
