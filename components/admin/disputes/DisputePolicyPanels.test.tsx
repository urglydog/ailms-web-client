import { describe, expect, it } from 'vitest';
import type { DisputeAdminRes } from '@/types/domain';
import vi from '@/messages/vi.json';
import en from '@/messages/en.json';
import { policyProblem } from './DisputePolicyPanels';

const d = { instructorDecision: null, instructorDeadlineAt: null } as unknown as DisputeAdminRes;

describe('policyProblem', () => {
  it('trả về khóa dịch cho từng điều kiện chính sách', () => {
    expect(policyProblem(d, 'STANDARD', '', '', '')).toBeNull();
    expect(policyProblem(d, 'PLATFORM_COMPENSATES', '', 'x', '')).toBe('needReason');
    expect(policyProblem(d, 'INSTRUCTOR_FAULT', 'COPYRIGHT_VIOLATION', 'ngắn', '')).toBe('noteShort');
    expect(policyProblem(d, 'INSTRUCTOR_FAULT', 'COPYRIGHT_VIOLATION', 'đủ mười ký tự rồi', 'ngắn')).toBe('evidenceShort');
    const waiting = { ...d, instructorDeadlineAt: new Date(Date.now() + 86_400_000).toISOString() } as DisputeAdminRes;
    expect(policyProblem(waiting, 'INSTRUCTOR_FAULT', 'COPYRIGHT_VIOLATION', 'đủ mười ký tự rồi', 'minh chứng đủ dài hai mươi ký tự')).toBe('waitInstructor');
  });

  it('mọi khóa đều có bản dịch', () => {
    for (const k of ['needReason', 'noteShort', 'evidenceShort', 'waitInstructor'] as const) {
      expect(vi.admin.disputes.policy[k]).toBeTruthy();
      expect(en.admin.disputes.policy[k]).toBeTruthy();
    }
  });
});
