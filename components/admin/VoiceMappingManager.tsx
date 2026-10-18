'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import {
  useCreateVoiceMapping,
  useDeleteVoiceMapping,
  useUpdateVoiceMapping,
  useVoiceMappings,
} from '@/hooks/useVoiceMappings';
import { ApiError } from '@/lib/api/client';
import type { VoiceMapping } from '@/types/domain';

/**
 * UC47 — Admin cấu hình giọng đọc theo ngôn ngữ.
 *
 * BR-DUB-07: đây là nguồn DUY NHẤT quyết định ngôn ngữ lồng tiếng khả dụng cho học viên
 * (UC18) — tắt `isActive` là ẩn luôn ngôn ngữ đó khỏi bộ chọn ở trang học.
 */
export function VoiceMappingManager() {
  const t = useTranslations('admin.voices');
  const [pendingDelete, setPendingDelete] = useState<VoiceMapping | null>(null);
  const { data: voices, isLoading } = useVoiceMappings();
  const createVoice = useCreateVoiceMapping();
  const updateVoice = useUpdateVoiceMapping();
  const deleteVoice = useDeleteVoiceMapping();

  const [language, setLanguage] = useState('');
  const [voiceName, setVoiceName] = useState('');
  const [gender, setGender] = useState('FEMALE');
  const [isDefault, setIsDefault] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(30);
  const q = query.trim().toLowerCase();
  const matched = (voices ?? []).filter((v) => !q || v.language.toLowerCase().includes(q) || v.voiceName.toLowerCase().includes(q));
  const visible = matched.slice(0, limit);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!language.trim() || !voiceName.trim()) return;
    setErrorMessage(null);
    createVoice.mutate(
      { language: language.trim(), voiceName: voiceName.trim(), gender, isDefault },
      {
        onSuccess: () => {
          setLanguage('');
          setVoiceName('');
          setIsDefault(false);
        },
        onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : t('error')),
      },
    );
  };

  const handleDelete = (voice: VoiceMapping) => {
    setErrorMessage(null);
    deleteVoice.mutate(voice.id, {
      onError: (err) =>
        setErrorMessage(err instanceof ApiError ? err.message : t('deleteError')),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2.5">
        <input
          aria-label={t('langLabel')}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder={t('langPh')}
          className="w-40 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <input
          aria-label={t('voiceLabel')}
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
          placeholder={t('voicePh')}
          className="w-64 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <select
          aria-label={t('genderLabel')}
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="FEMALE">{t('gender.FEMALE')}</option>
          <option value="MALE">{t('gender.MALE')}</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-ink-muted">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          {t('isDefault')}
        </label>
        <button
          type="submit"
          disabled={createVoice.isPending}
          className="rounded-full bg-accent px-5 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          + {t('add')}
        </button>
      </form>

      <label className="block w-full sm:w-80">
        <span className="sr-only">{t('searchLabel')}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(30);
          }}
          placeholder={t('searchPh')}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      {errorMessage && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-[13px] text-danger">{errorMessage}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="px-6 py-4">{t('cols.language')}</th>
              <th className="px-6 py-4">{t('cols.voice')}</th>
              <th className="px-6 py-4">{t('cols.gender')}</th>
              <th className="px-6 py-4 text-center">{t('cols.default')}</th>
              <th className="px-6 py-4 text-center">{t('cols.active')}</th>
              <th className="px-6 py-4 text-right">{t('cols.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-ink-muted">
                  {t('loading')}
                </td>
              </tr>
            )}
            {!isLoading && voices && voices.length > 0 && matched.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-ink-muted">
                  {t('noMatch')}
                </td>
              </tr>
            )}
            {!isLoading && voices?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-ink-muted">
                  {t('empty')}
                </td>
              </tr>
            )}
            {visible.map((voice) => (
              <tr key={voice.id} className="hover:bg-surface">
                <td className="px-6 py-3 font-semibold text-ink">{voice.language}</td>
                <td className="px-6 py-3 text-ink-muted">{voice.voiceName}</td>
                <td className="px-6 py-3 text-ink-muted">
                  <select
                    aria-label={`${t('genderLabel')}: ${voice.voiceName}`}
                    value={voice.gender}
                    onChange={(e) =>
                      updateVoice.mutate({
                        id: voice.id,
                        input: { gender: e.target.value, isDefault: voice.isDefault, isActive: voice.isActive },
                      })
                    }
                    className="rounded-md border border-transparent bg-transparent px-2 py-1 focus:border-accent focus:bg-white focus:outline-none"
                  >
                    <option value="FEMALE">{t('gender.FEMALE')}</option>
                    <option value="MALE">{t('gender.MALE')}</option>
                  </select>
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${t('cols.default')}: ${voice.voiceName}`}
                    checked={voice.isDefault}
                    onChange={(e) =>
                      updateVoice.mutate({
                        id: voice.id,
                        input: { gender: voice.gender, isDefault: e.target.checked, isActive: voice.isActive },
                      })
                    }
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${t('cols.active')}: ${voice.voiceName}`}
                    checked={voice.isActive}
                    onChange={(e) =>
                      updateVoice.mutate({
                        id: voice.id,
                        input: { gender: voice.gender, isDefault: voice.isDefault, isActive: e.target.checked },
                      })
                    }
                  />
                </td>
                <td className="px-6 py-3 text-right">
                  <button type="button" onClick={() => setPendingDelete(voice)} aria-label={`${t('delete')}: ${voice.voiceName}`} className="text-xs font-bold text-danger hover:opacity-80">
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {matched.length > visible.length && (
        <div className="flex items-center justify-between gap-3 px-1 text-sm text-ink-muted">
          <span>{t('showing', { shown: visible.length, total: matched.length })}</span>
          <button type="button" onClick={() => setLimit((n) => n + 30)} className="rounded-lg bg-tint px-3 py-1.5 font-semibold text-accent-dark hover:bg-line">
            {t('showMore')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('confirmDelete.title')}
        body={pendingDelete ? t('confirmDelete.body', { voice: pendingDelete.voiceName, language: pendingDelete.language }) : ''}
        confirmLabel={t('delete')}
        cancelLabel={t('confirmDelete.cancel')}
        onConfirm={() => {
          if (pendingDelete) handleDelete(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
