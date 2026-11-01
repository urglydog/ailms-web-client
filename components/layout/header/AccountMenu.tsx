'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Award,
  BookOpen,
  Heart,
  Languages,
  LogOut,
  MessageSquareWarning,
  Presentation,
  Receipt,
  Settings,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/types/domain';
import { buildAccountMenu } from './navModel';
import type { AccountIcon } from './navModel';

const ICONS: Record<AccountIcon, LucideIcon> = {
  books: BookOpen,
  heart: Heart,
  certificate: Award,
  profile: UserCircle,
  receipt: Receipt,
  dispute: MessageSquareWarning,
  settings: Settings,
  admin: ShieldCheck,
  instructor: Presentation,
};

interface AccountMenuProps {
  user: { id: number | null; fullName: string; email: string; avatarUrl: string | null; role: Role | undefined };
  /** Tên ngôn ngữ giao diện hiện tại, viết bằng chính ngôn ngữ đó. */
  languageName: string;
  /** Gọi khi chọn một liên kết, để Header đóng menu. */
  onNavigate: () => void;
  onOpenLanguage: () => void;
  onLogout: () => void;
}

const ROW =
  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] text-ink no-underline hover:bg-tint hover:text-accent-dark';

/** Bảng menu avatar chia nhóm (spec mục 5). Không tự giữ trạng thái mở/đóng. */
export function AccountMenu({ user, languageName, onNavigate, onOpenLanguage, onLogout }: AccountMenuProps) {
  const t = useTranslations('header');
  const groups = buildAccountMenu({ id: user.id, role: user.role });
  const initial = user.fullName ? user.fullName.charAt(0) : 'U';

  return (
    <div className="flex w-64 flex-col rounded-panel border border-line bg-surface-raised p-2 shadow-card-hover">
      <div className="mb-1 flex items-center gap-3 border-b border-line-soft px-3 pb-3 pt-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-display text-base font-bold uppercase text-white">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.fullName} width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{user.fullName || t('account.guestName')}</p>
          <p className="truncate text-xs text-ink-muted">{user.email}</p>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="border-b border-line-soft py-1">
          {group.items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                className={`${ROW} ${item.emphasis ? 'bg-tint font-semibold text-accent-dark' : ''}`}
              >
                <Icon size={16} aria-hidden className="shrink-0 text-ink-muted" />
                {t(item.labelKey as Parameters<typeof t>[0])}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="border-b border-line-soft py-1">
        <button type="button" onClick={onOpenLanguage} className={ROW}>
          <Languages size={16} aria-hidden className="shrink-0 text-ink-muted" />
          <span>{t('account.language')}</span>
          <span className="ml-auto text-ink-muted">{languageName}</span>
        </button>
      </div>

      <div className="py-1">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-danger hover:bg-tint"
        >
          <LogOut size={16} aria-hidden className="shrink-0" />
          {t('account.logout')}
        </button>
      </div>
    </div>
  );
}
