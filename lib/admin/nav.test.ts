import { describe, expect, it } from 'vitest';
import { ADMIN_NAV_GROUPS, activeAdminItem, adminNavItems, isAdminNavActive } from './nav';

describe('isAdminNavActive', () => {
  it('Tổng quan chỉ sáng ở đúng /admin', () => {
    expect(isAdminNavActive('/admin', '/admin')).toBe(true);
    expect(isAdminNavActive('/admin/users', '/admin')).toBe(false);
  });
  it('trang con làm sáng mục cha, không khớp nhầm tiền tố', () => {
    expect(isAdminNavActive('/admin/moderation/12', '/admin/moderation')).toBe(true);
    expect(isAdminNavActive('/admin/moderation-old', '/admin/moderation')).toBe(false);
  });
});

describe('activeAdminItem', () => {
  it('trả về mục đang mở, hoặc null', () => {
    expect(activeAdminItem('/admin/transactions/payments')?.id).toBe('transactions');
    expect(activeAdminItem('/admin')?.id).toBe('overview');
    expect(activeAdminItem('/admin/unknown')).toBeNull();
  });
});

describe('ADMIN_NAV_GROUPS', () => {
  it('giữ đủ 13 trang admin, không trùng href', () => {
    const hrefs = adminNavItems().map((i) => i.href);
    expect(hrefs).toHaveLength(13);
    expect(new Set(hrefs).size).toBe(13);
  });
  it('nhóm đầu không có tiêu đề (Tổng quan, Người dùng)', () => {
    expect(ADMIN_NAV_GROUPS[0]?.id).toBe('main');
  });
});
