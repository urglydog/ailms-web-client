/** Mục tiêu khoá học (26/11/2026) — khớp giới hạn BE `CourseDto.GoalsUpdateReq`. */
export const GOAL_MAX_ITEMS = 10;
export const GOAL_MAX_LEN = 160;
/** Khuyến nghị (không bắt buộc) số mục "Học viên sẽ học được gì". */
export const GOAL_MIN_OUTCOMES = 4;

/** Trim, bỏ mục rỗng/trùng, giữ thứ tự, tối đa {@link GOAL_MAX_ITEMS}. */
export function cleanGoalList(items: string[]): string[] {
  const out: string[] = [];
  for (const raw of items) {
    const v = raw.trim().slice(0, GOAL_MAX_LEN);
    if (v && !out.includes(v)) out.push(v);
    if (out.length >= GOAL_MAX_ITEMS) break;
  }
  return out;
}
