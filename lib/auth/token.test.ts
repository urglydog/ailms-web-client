import { afterEach, describe, expect, it } from 'vitest';
import { canUseLearnerFeatures, getCurrentRole } from './token';

function setToken(roles: string | null) {
  if (roles === null) {
    localStorage.removeItem('accessToken');
    return;
  }
  const payload = btoa(JSON.stringify({ sub: 'a@b.c', id: 1, roles, exp: 9999999999 }));
  localStorage.setItem('accessToken', `h.${payload}.s`);
}

afterEach(() => localStorage.clear());

describe('canUseLearnerFeatures', () => {
  it('chưa đăng nhập: không', () => {
    setToken(null);
    expect(getCurrentRole()).toBeNull();
    expect(canUseLearnerFeatures()).toBe(false);
  });
  it.each([['ROLE_STUDENT'], ['ROLE_INSTRUCTOR']])('%s: có', (roles) => {
    setToken(roles);
    expect(canUseLearnerFeatures()).toBe(true);
  });
  it('ADMIN: không (BE trả 403 cho giỏ hàng/yêu thích/enrollments)', () => {
    setToken('ROLE_ADMIN');
    expect(canUseLearnerFeatures()).toBe(false);
  });
  it('token hỏng: không', () => {
    localStorage.setItem('accessToken', 'rác');
    expect(canUseLearnerFeatures()).toBe(false);
  });
});
