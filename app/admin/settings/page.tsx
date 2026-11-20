'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { api, ApiError } from '@/lib/api/client';
import { SettingControl } from '@/components/admin/settings/SettingControl';
import { SETTING_GROUPS, validateSetting } from '@/lib/admin/settingsSchema';
import { getAccessToken } from '@/lib/auth/token';

interface ConfigRes {
  key: string;
  value: string;
  description: string | null;
}


/**
 * Cấu hình hệ thống (20/11/2026): menu nhóm chức năng bên trái, giá trị của nhóm đang chọn bên phải. Công tắc cho giá trị bật/tắt, ô số có đơn vị,
 * danh sách email; không hiện tên biến kỹ thuật. Thanh Lưu dán cố định ở đáy màn hình khi có thay đổi. Giá trị lưu thật qua DB (xem SystemConfigController).
 */
export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings');
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const token = mounted ? (getAccessToken() ?? '') : '';
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [groupId, setGroupId] = useState<string>(SETTING_GROUPS[0]!.id);

  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['settings', 'system-config'],
    queryFn: () => api.get<ConfigRes[]>('/api/v1/admin/system-config', { token }),
    enabled: !!token,
  });

  const saved = useMemo(() => Object.fromEntries((configs ?? []).map((c) => [c.key, c.value])), [configs]);
  const valueOf = (key: string) => draft[key] ?? saved[key] ?? '';
  const allItems = useMemo(() => SETTING_GROUPS.flatMap((g) => g.items), []);
  const dirtyKeys = Object.keys(draft).filter((k) => draft[k] !== saved[k]);
  const errors = Object.fromEntries(
    dirtyKeys.map((k) => [k, validateSetting(allItems.find((i) => i.key === k)!, draft[k] ?? '')] as const).filter(([, e]) => e !== null),
  ) as Record<string, string>;
  const hasErrors = Object.keys(errors).length > 0;
  const dirtyInGroup = (g: (typeof SETTING_GROUPS)[number]) => g.items.some((i) => dirtyKeys.includes(i.key));

  const save = useMutation({
    mutationFn: (values: Record<string, string>) => api.put<ConfigRes[]>('/api/v1/admin/system-config', { values }, { token }),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'system-config'], data);
      setDraft({});
      toast.success(t('quotas.saved'));
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t('quotas.saveError')),
  });

  // Cảnh báo khi rời trang lúc còn thay đổi chưa lưu.
  useEffect(() => {
    if (dirtyKeys.length === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtyKeys.length]);

  const setValue = (key: string, v: string) => setDraft((d) => ({ ...d, [key]: v }));
  const group = SETTING_GROUPS.find((g) => g.id === groupId);

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[250px_1fr]">
        <nav aria-label="Nhóm cấu hình" className="flex gap-1.5 overflow-x-auto rounded-xl border border-line bg-surface-raised p-2 shadow-sm lg:flex-col lg:overflow-visible">
          {SETTING_GROUPS.map((g) => ({ id: g.id, title: g.title, dirty: dirtyInGroup(g) })).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupId(g.id)}
              aria-current={groupId === g.id ? 'page' : undefined}
              className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                groupId === g.id ? 'bg-tint text-accent-dark' : 'text-ink hover:bg-surface'
              }`}
            >
              {g.title}
              {g.dirty && <span aria-label="Có thay đổi chưa lưu" className="h-2 w-2 shrink-0 rounded-full bg-warning" />}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          {group ? (
            <>
              <section className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm">
                <div className="border-b border-line-soft px-5 py-4">
                  <h2 className="m-0 font-display text-base font-bold text-ink">{group.title}</h2>
                  <p className="m-0 mt-1 text-sm text-ink-muted">{group.description}</p>
                </div>
                {configsLoading && <div className="px-5 py-4 text-sm text-ink-muted">{t('quotas.loading')}</div>}
                {group.items
                  .filter((item) => item.key in saved)
                  .map((item) => (
                    <div key={item.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4 last:border-0">
                      <div className="flex min-w-0 max-w-xl flex-col gap-0.5">
                        <span className="text-[13.5px] font-semibold text-ink">{item.label}</span>
                        {item.help && <span className="text-xs text-ink-muted">{item.help}</span>}
                        {errors[item.key] && <span role="alert" className="text-xs font-semibold text-danger">{errors[item.key]}</span>}
                      </div>
                      <SettingControl item={item} value={valueOf(item.key)} onChange={(v) => setValue(item.key, v)} invalid={!!errors[item.key]} />
                    </div>
                  ))}
              </section>
            </>
          ) : null}
        </div>
      </div>

      {dirtyKeys.length > 0 && (
        <div role="region" aria-label="Lưu thay đổi" className="sticky bottom-4 z-20 mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-raised px-5 py-3 shadow-card-hover">
          <span className="text-sm font-semibold text-ink">
            Có {dirtyKeys.length} thay đổi chưa lưu{hasErrors ? ' — vui lòng sửa các giá trị chưa hợp lệ' : ''}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDraft({})} className="rounded-lg border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-ink hover:bg-tint">
              {t('quotas.cancel')}
            </button>
            <button
              type="button"
              disabled={save.isPending || hasErrors}
              onClick={() => save.mutate(Object.fromEntries(dirtyKeys.map((k) => [k, (draft[k] ?? '').trim()])))}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {save.isPending ? t('quotas.saving') : t('quotas.save')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
