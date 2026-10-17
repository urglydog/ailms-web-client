import type { Role } from '@/types/domain';

/** So khớp mục nav đang active: trùng chính xác HOẶC là trang con (`/courses/x` làm sáng `/courses`).
 * Không dùng `startsWith(href)` trần vì `/liveness` sẽ khớp nhầm `/live`. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type AccountIcon =
  | 'books'
  | 'heart'
  | 'certificate'
  | 'profile'
  | 'receipt'
  | 'settings'
  | 'admin'
  | 'instructor';

export interface AccountMenuItem {
  id: string;
  href: string;
  /** Khóa trong namespace `header` của next-intl, vd `account.wishlist`. */
  labelKey: string;
  icon: AccountIcon;
  emphasis?: boolean;
}

export interface AccountMenuGroup {
  id: string;
  items: AccountMenuItem[];
}

/** Menu avatar chia nhóm (spec mục 5). "Ngôn ngữ" và "Đăng xuất" không nằm ở đây vì là hành động,
 * không phải liên kết — do `AccountMenu` tự vẽ. */
export function buildAccountMenu(user: { id: number | null; role: Role | undefined }): AccountMenuGroup[] {
  const groups: AccountMenuGroup[] = [];

  if (user.role === 'ADMIN') {
    groups.push({
      id: 'admin',
      items: [{ id: 'admin', href: '/admin', labelKey: 'account.adminPanel', icon: 'admin', emphasis: true }],
    });
  }

  const learn: AccountMenuItem[] = [
    { id: 'myCourses', href: '/my-courses', labelKey: 'nav.myCourses', icon: 'books' },
    { id: 'wishlist', href: '/wishlist', labelKey: 'account.wishlist', icon: 'heart' },
  ];
  if (user.id !== null) {
    learn.push({
      id: 'certificates',
      href: `/u/${user.id}?tab=certificates`,
      labelKey: 'account.certificates',
      icon: 'certificate',
    });
  }
  groups.push({ id: 'learn', items: learn });

  const account: AccountMenuItem[] = [];
  if (user.id !== null) {
    account.push({ id: 'publicProfile', href: `/u/${user.id}`, labelKey: 'account.publicProfile', icon: 'profile' });
  }
  account.push(
    { id: 'payments', href: '/payments', labelKey: 'account.paymentHistory', icon: 'receipt' },
    { id: 'profile', href: '/profile', labelKey: 'account.profile', icon: 'settings' },
  );
  groups.push({ id: 'account', items: account });

  if (user.role === 'INSTRUCTOR') {
    groups.push({
      id: 'role',
      items: [{ id: 'instructorChannel', href: '/instructor/courses', labelKey: 'account.instructorChannel', icon: 'instructor' }],
    });
  } else if (user.role === 'STUDENT') {
    groups.push({
      id: 'role',
      items: [{ id: 'becomeInstructor', href: '/teaching', labelKey: 'account.becomeInstructor', icon: 'instructor' }],
    });
  }

  return groups;
}
