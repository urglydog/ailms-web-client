export type EditTabKey = 'curriculum' | 'materials' | 'resources' | 'proctoring' | 'basics' | 'pricing' | 'promotions';
export type EditTabGroup = 'content' | 'publish';

export interface EditTab {
  key: EditTabKey;
  group: EditTabGroup;
}

/** Các tab của trình chỉnh sửa khóa học theo thứ tự hiển thị; nhãn lấy từ `instructor.edit.tabs.<key>`.
 * Mỗi `key` trùng đoạn cuối của đường dẫn `/instructor/courses/{id}/edit/{key}`. */
export const EDIT_TABS: EditTab[] = [
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
