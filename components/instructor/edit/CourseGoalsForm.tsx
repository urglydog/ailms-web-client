'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useMyCourseDetail, useUpdateCourseGoals } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import { GOAL_MAX_ITEMS, GOAL_MAX_LEN, GOAL_MIN_OUTCOMES, cleanGoalList } from '@/lib/instructor/goals';

type ListKey = 'learningOutcomes' | 'requirements' | 'targetAudience';
const LISTS: ListKey[] = ['learningOutcomes', 'requirements', 'targetAudience'];

function withMinRows(items: string[] | undefined, min: number): string[] {
  const list = [...(items ?? [])];
  while (list.length < min) list.push('');
  return list;
}

/**
 * "Học viên mục tiêu" (UDEMY_LAYOUT_ANALYSIS mục 12) — bước đầu nhóm "Lập kế hoạch" của trình soạn:
 * "Học viên sẽ học được gì" (khuyến nghị ≥ 4 mục, mỗi mục ≤ 160 ký tự), "Yêu cầu", "Khoá học dành cho ai".
 */
export function CourseGoalsForm({ courseId }: { courseId: number }) {
  const t = useTranslations('instructor.edit.goals');
  const { data: course } = useMyCourseDetail(courseId);
  const save = useUpdateCourseGoals(courseId);
  const [lists, setLists] = useState<Record<ListKey, string[]>>({
    learningOutcomes: withMinRows([], GOAL_MIN_OUTCOMES),
    requirements: withMinRows([], 1),
    targetAudience: withMinRows([], 1),
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (course && !initialized.current) {
      setLists({
        learningOutcomes: withMinRows(course.learningOutcomes, GOAL_MIN_OUTCOMES),
        requirements: withMinRows(course.requirements, 1),
        targetAudience: withMinRows(course.targetAudience, 1),
      });
      initialized.current = true;
    }
  }, [course]);

  const setItem = (key: ListKey, index: number, value: string) =>
    setLists((prev) => ({ ...prev, [key]: prev[key].map((v, i) => (i === index ? value : v)) }));
  const addItem = (key: ListKey) => setLists((prev) => ({ ...prev, [key]: [...prev[key], ''] }));
  const removeItem = (key: ListKey, index: number) =>
    setLists((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));

  const filledOutcomes = cleanGoalList(lists.learningOutcomes).length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(
      {
        learningOutcomes: cleanGoalList(lists.learningOutcomes),
        requirements: cleanGoalList(lists.requirements),
        targetAudience: cleanGoalList(lists.targetAudience),
      },
      {
        onSuccess: () => toast.success(t('saved')),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : t('saveFailed')),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface-raised shadow-sm">
      <div className="border-b border-line-soft px-6 py-4">
        <h2 className="m-0 font-display text-[17px] font-bold text-ink">{t('title')}</h2>
        <p className="m-0 mt-1 text-[12.5px] text-ink-muted">{t('intro')}</p>
      </div>
      <div className="flex flex-col gap-8 p-6">
        {LISTS.map((key) => (
          <fieldset key={key} className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-1 text-[14px] font-bold text-ink">{t(`${key}.label`)}</legend>
            <p className="m-0 text-[12.5px] text-ink-muted">
              {t(`${key}.hint`, { min: GOAL_MIN_OUTCOMES, max: GOAL_MAX_LEN })}
            </p>
            {lists[key].map((value, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={value}
                    maxLength={GOAL_MAX_LEN}
                    onChange={(e) => setItem(key, i, e.target.value)}
                    placeholder={t(`${key}.placeholder`)}
                    aria-label={t('itemLabel', { section: t(`${key}.label`), n: i + 1 })}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 pr-14 text-[13.5px] text-ink focus:border-accent focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-faint" aria-hidden>
                    {GOAL_MAX_LEN - value.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(key, i)}
                  aria-label={t('remove', { n: i + 1 })}
                  className="rounded-full p-1.5 text-ink-muted hover:bg-surface hover:text-danger"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            ))}
            {lists[key].length < GOAL_MAX_ITEMS && (
              <button
                type="button"
                onClick={() => addItem(key)}
                className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-accent-dark hover:underline"
              >
                <Plus size={14} aria-hidden />
                {t('add')}
              </button>
            )}
            {key === 'learningOutcomes' && filledOutcomes < GOAL_MIN_OUTCOMES && (
              <p className="m-0 text-[12px] text-warning" role="status">
                {t('recommendMin', { min: GOAL_MIN_OUTCOMES, count: filledOutcomes })}
              </p>
            )}
          </fieldset>
        ))}
        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
