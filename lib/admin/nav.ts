export type AdminNavId =
  | 'overview' | 'users' | 'moderation' | 'categories' | 'reviews' | 'aianalytics' | 'aiqueue'
  | 'voicemappings' | 'tutorsecurity' | 'transactions' | 'coupons' | 'announcements' | 'settings';

export interface AdminNavItem {
  id: AdminNavId;
  href: string;
}

export interface AdminNavGroup {
  /** `main` không có tiêu đề nhóm; các nhóm khác lấy nhãn từ `admin.nav.groups.<id>`. */
  id: 'main' | 'content' | 'ai' | 'finance' | 'system';
  items: AdminNavItem[];
}

/** Menu Quản trị theo nhóm (không đổi href nào so với bản cũ để không vỡ liên kết). Nhãn lấy từ `admin.nav.<id>`. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { id: 'main', items: [{ id: 'overview', href: '/admin' }, { id: 'users', href: '/admin/users' }] },
  {
    id: 'content',
    items: [
      { id: 'moderation', href: '/admin/moderation' },
      { id: 'categories', href: '/admin/categories' },
      { id: 'reviews', href: '/admin/reviews' },
    ],
  },
  {
    id: 'ai',
    items: [
      { id: 'aianalytics', href: '/admin/ai-analytics' },
      { id: 'aiqueue', href: '/admin/ai-queue' },
      { id: 'voicemappings', href: '/admin/voice-mappings' },
      { id: 'tutorsecurity', href: '/admin/tutor-security' },
    ],
  },
  {
    id: 'finance',
    items: [{ id: 'transactions', href: '/admin/transactions/payments' }, { id: 'coupons', href: '/admin/coupons' }],
  },
  { id: 'system', items: [{ id: 'announcements', href: '/admin/announcements' }, { id: 'settings', href: '/admin/settings' }] },
];

export function adminNavItems(): AdminNavItem[] {
  return ADMIN_NAV_GROUPS.flatMap((g) => g.items);
}

/** `/admin` (Tổng quan) chỉ khớp chính xác; các mục khác khớp chính nó và trang con (`/x/y`), không khớp tiền tố trần. */
export function isAdminNavActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function activeAdminItem(pathname: string): AdminNavItem | null {
  return adminNavItems().find((item) => isAdminNavActive(pathname, item.href)) ?? null;
}
