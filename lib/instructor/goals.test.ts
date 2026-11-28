import { describe, expect, it } from 'vitest';
import { GOAL_MAX_LEN, cleanGoalList } from './goals';

describe('cleanGoalList', () => {
  it('trim, bỏ rỗng/trùng, cắt quá 160 ký tự, tối đa 10 mục', () => {
    expect(cleanGoalList(['  a ', '', 'a', 'b'])).toEqual(['a', 'b']);
    expect(cleanGoalList(['x'.repeat(200)])[0]).toHaveLength(GOAL_MAX_LEN);
    expect(cleanGoalList(Array.from({ length: 15 }, (_, i) => String(i)))).toHaveLength(10);
  });
});
