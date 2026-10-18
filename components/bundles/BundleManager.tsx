'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMyBundles, useCreateBundle, useUpdateBundle } from '@/hooks/useBundles';
import { useMyCourses } from '@/hooks/useCourses';
import type { CourseBundle, CreateBundleReq, UpdateBundleReq } from '@/types/domain';

// ── Helpers ──────────────────────────────────────────────────────

function formatAmount(amount: number, locale: string) {
  return amount.toLocaleString(locale) + '₫';
}

// ── Sidebar Form ─────────────────────────────────────────────────

interface BundleFormProps {
  editing: CourseBundle | null;
  onClose: () => void;
}

function BundleForm({ editing, onClose }: BundleFormProps) {
  const t = useTranslations('bundles');
  const locale = useLocale();
  const fmt = (amount: number) => formatAmount(amount, locale);
  const { data: coursesData } = useMyCourses({ status: 'PUBLISHED' });
  const publishedCourses = coursesData?.content ?? [];

  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [discountPercent, setDiscountPercent] = useState(editing?.discountPercent ?? 10);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [selectedIds, setSelectedIds] = useState<number[]>(editing?.courses.map((c) => c.id) ?? []);

  const isPending = createBundle.isPending || updateBundle.isPending;

  function toggleCourse(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // ── Preview pricing ─────────────────────────────────────────
  const selectedCourses = publishedCourses.filter((c) => selectedIds.includes(c.id));
  const originalSum = selectedCourses.reduce((s, c) => s + (c.price ?? 0), 0);
  const discountAmt = Math.round((originalSum * discountPercent) / 100);
  const finalPrice = originalSum - discountAmt;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length < 2) {
      alert(t('form.minTwo'));
      return;
    }
    if (editing) {
      const req: UpdateBundleReq = { title, description, discountPercent, isActive, courseIds: selectedIds };
      updateBundle.mutate({ id: editing.id, req }, { onSuccess: onClose });
    } else {
      const req: CreateBundleReq = { title, description, discountPercent, courseIds: selectedIds };
      createBundle.mutate(req, { onSuccess: onClose });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-ink">
            {editing ? `✏️ ${t('form.editTitle')}` : `✨ ${t('form.createTitle')}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('form.close')}
            className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-ink-muted hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          {/* Tên gói */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              {t('form.name')} <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.namePh')}
              className="w-full rounded-xl border border-line px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-surface"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">{t('form.desc')}</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descPh')}
              className="w-full rounded-xl border border-line px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-surface resize-none"
            />
          </div>

          {/* Giảm giá % */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              {t('form.discount')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="flex-1 accent-cyan-500"
              />
              <span className="w-16 rounded-lg bg-cyan-100 text-accent-dark font-bold text-sm text-center py-1.5">
                {discountPercent}%
              </span>
            </div>
          </div>

          {/* Chọn khóa học */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              {t('form.pickCourses', { count: selectedIds.length })}
            </label>
            {publishedCourses.length === 0 ? (
              <p className="text-sm text-ink-muted py-3 text-center">
                {t('form.noPublished')}
              </p>
            ) : (
              <div className="rounded-xl border border-line divide-y max-h-48 overflow-y-auto">
                {publishedCourses.map((course) => {
                  const selected = selectedIds.includes(course.id);
                  return (
                    <label
                      key={course.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors ${selected ? 'bg-tint' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCourse(course.id)}
                        className="h-4 w-4 rounded accent-cyan-600 flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-ink truncate">{course.title}</span>
                      {course.price != null && (
                        <span className="text-sm font-semibold text-ink-muted flex-shrink-0">
                          {fmt(course.price)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview giá */}
          {selectedIds.length >= 2 && (
            <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('form.preview')}</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">{t('form.originalSum')}</span>
                <span className="line-through text-slate-400">{fmt(originalSum)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">{t('form.discountLine', { percent: discountPercent })}</span>
                <span className="text-red-400 font-semibold">- {fmt(discountAmt)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2 mt-1">
                <span>{t('form.learnerPays')}</span>
                <span className="text-cyan-400">{fmt(finalPrice)}</span>
              </div>
            </div>
          )}

          {/* Trạng thái (khi sửa) */}
          {editing && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsActive((v) => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-accent' : 'bg-line'}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </div>
              <span className="text-sm font-medium text-ink">
                {isActive ? t('form.active') : t('off')}
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink-muted hover:bg-surface transition-colors"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending || selectedIds.length < 2}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? t('form.saving') : editing ? t('form.update') : t('form.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bundle Card ──────────────────────────────────────────────────

function BundleCard({ bundle, onEdit }: { bundle: CourseBundle; onEdit: () => void }) {
  const t = useTranslations('bundles');
  const locale = useLocale();
  const fmt = (amount: number) => formatAmount(amount, locale);
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden ${!bundle.isActive ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Header gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-accent-dark">
                -{bundle.discountPercent}%
              </span>
              {!bundle.isActive && (
                <span className="inline-flex rounded-full bg-line-soft px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                  {t('off')}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-[15px] font-bold text-ink leading-tight line-clamp-2">
              {bundle.title}
            </h3>
            {bundle.description && (
              <p className="mt-1 text-xs text-ink-muted line-clamp-1">{bundle.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-surface hover:border-cyan-300 hover:text-cyan-600 transition-colors"
          >
            {t('edit')}
          </button>
        </div>

        {/* Courses list */}
        <ul className="space-y-1.5 mb-4">
          {bundle.courses.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              <span className="flex-1 truncate">{c.title}</span>
              <span className="font-semibold text-ink-muted flex-shrink-0">{fmt(c.price)}</span>
            </li>
          ))}
        </ul>

        {/* Price summary */}
        <div className="rounded-xl bg-surface px-4 py-3 flex items-center justify-between border border-line-soft">
          <div className="text-xs text-ink-muted">
            <span className="line-through">{fmt(bundle.originalPrice)}</span>
            <span className="ml-2 text-red-500 font-semibold">-{fmt(bundle.discountAmount)}</span>
          </div>
          <div className="text-base font-bold text-accent-dark">{fmt(bundle.finalPrice)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function BundleManager() {
  const t = useTranslations('bundles');
  const { data, isLoading } = useMyBundles();
  const [editing, setEditing] = useState<CourseBundle | null>(null);
  const [showForm, setShowForm] = useState(false);

  const bundles = data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">🎁 {t('pageTitle')}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t('pageSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-200 hover:from-cyan-700 hover:to-blue-700 transition-all active:scale-95"
        >
          <span className="text-lg leading-none">+</span>
          {t('createNew')}
        </button>
      </div>

      {/* Empty / Loading */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-line-soft animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && bundles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-lg font-bold text-ink">{t('emptyTitle')}</h2>
          <p className="mt-1 text-sm text-ink-muted max-w-sm">
            {t('emptyBody')}
          </p>
          <button
            type="button"
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="mt-5 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-dark transition-colors"
          >
            {t('createFirst')}
          </button>
        </div>
      )}

      {!isLoading && bundles.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onEdit={() => { setEditing(bundle); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 flex gap-3">
        <span className="text-lg leading-tight flex-shrink-0">💡</span>
        <div>
          <p className="font-semibold mb-1">{t('info.title')}</p>
          <ul className="list-disc pl-4 space-y-0.5 text-blue-600">
            <li>{t.rich('info.owned', { b: (c) => <strong>{c}</strong> })}</li>
            <li>{t.rich('info.coupon', { b: (c) => <strong>{c}</strong> })}</li>
            <li>{t.rich('info.price', { b: (c) => <strong>{c}</strong> })}</li>
          </ul>
        </div>
      </div>

      {showForm && (
        <BundleForm
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
