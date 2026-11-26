'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Lightbulb, MessageCircleQuestion, RefreshCw, Sparkles, Users } from 'lucide-react';
import { CourseFilterDropdown } from '@/components/instructor/communication/CourseFilterDropdown';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useInstructorCourseOptions } from '@/hooks/useDashboard';
import { useRefreshInsightSummary, useTutorInsights } from '@/hooks/useTutorInsights';
import type { CourseInsight, InsightSummary } from '@/lib/api/tutorInsights';

/**
 * "Giao tiếp > Insight AI" (26/11/2026) — giảng viên xem học viên hỏi Gia sư AI những gì: chủ đề
 * hay hỏi theo bài (chỉ nhóm >= 2 học viên, nhãn là từ khoá chung — không tên, không câu nguyên
 * văn), bài có nhiều câu hỏi bất thường, chủ đề Gia sư trả lời chưa tốt và tóm tắt do AI viết.
 */
export function TutorInsightsView() {
  const t = useTranslations('instructor.insights');
  const { data: courses, isLoading: coursesLoading } = useInstructorCourseOptions();
  const [courseId, setCourseId] = useState<number | ''>('');
  const [lessonId, setLessonId] = useState<number | ''>('');

  useEffect(() => {
    const first = courses?.[0];
    if (courseId === '' && first) setCourseId(first.id);
  }, [courses, courseId]);

  const { data, isLoading, isError } = useTutorInsights(courseId);

  if (!coursesLoading && (courses?.length ?? 0) === 0) {
    return <EmptyCard text={t('noCourses')} />;
  }

  const lessons = data ? (lessonId === '' ? data.lessons : data.lessons.filter((l) => l.lessonId === lessonId)) : [];
  const poor = data ? (lessonId === '' ? data.poorTopics : data.poorTopics.filter((p) => p.lessonId === lessonId)) : [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 font-display text-[20px] font-bold text-ink">{t('title')}</h1>
          <p className="m-0 mt-1 text-[13px] text-ink-muted">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CourseFilterDropdown
            courses={courses ?? []}
            value={courseId}
            showAllOption={false}
            onChange={(v) => { setCourseId(v); setLessonId(''); }}
          />
          {data && data.lessons.length > 1 && (
            <label className="flex items-center gap-1.5 text-[13px] text-ink-muted">
              <span className="sr-only">{t('lessonFilter')}</span>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value === '' ? '' : Number(e.target.value))}
                className="max-w-[220px] rounded-lg border border-line bg-surface-raised px-3 py-2 text-[13px] font-semibold text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <option value="">{t('allLessons')}</option>
                {data.lessons.map((l) => <option key={l.lessonId} value={l.lessonId}>{l.lessonTitle}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>

      {(isLoading || coursesLoading) && (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {isError && <EmptyCard text={t('loadError')} />}

      {data && (
        <>
          <SummaryCard courseId={data.courseId} summary={data.summary} hasData={data.totalQuestions > 0} />
          <Stats data={data} />
          {data.totalQuestions === 0 ? (
            <EmptyCard text={t('noQuestions', { days: data.windowDays })} />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <section aria-labelledby="insight-lessons" className="rounded-xl border border-line bg-surface-raised p-4 shadow-sm sm:p-5">
                <h2 id="insight-lessons" className="m-0 mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
                  <MessageCircleQuestion size={17} aria-hidden className="text-accent-dark" />
                  {t('lessonsTitle')}
                </h2>
                {lessons.length === 0 ? (
                  <p className="m-0 text-[13px] text-ink-muted">{t('noLessonQuestions')}</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
                    {lessons.map((l) => (
                      <li key={l.lessonId} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{l.lessonTitle}</span>
                          {l.unusual && (
                            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-bold text-ink">
                              {t('unusual')}
                            </span>
                          )}
                          <span className="text-[12px] text-ink-muted">
                            {t('lessonCounts', { questions: l.questionCount, learners: l.learnerCount })}
                          </span>
                        </div>
                        {l.topics.length > 0 ? (
                          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={t('topicsAria', { lesson: l.lessonTitle })}>
                            {l.topics.map((tp) => (
                              <li key={tp.label} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink">
                                <span className="font-semibold">{tp.label}</span>
                                <span className="inline-flex items-center gap-0.5 text-ink-muted">
                                  <Users size={12} aria-hidden />
                                  {t('learners', { count: tp.learnerCount })}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="m-0 text-[12px] text-ink-faint">{t('noTopics')}</p>
                        )}
                        {l.poorCount > 0 && (
                          <p className="m-0 flex items-center gap-1 text-[12px] text-ink-muted">
                            <AlertTriangle size={13} aria-hidden className="text-warning" />
                            {t('poorCount', { count: l.poorCount })}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="insight-poor" className="rounded-xl border border-line bg-surface-raised p-4 shadow-sm sm:p-5">
                <h2 id="insight-poor" className="m-0 mb-1 flex items-center gap-2 text-[15px] font-bold text-ink">
                  <AlertTriangle size={17} aria-hidden className="text-warning" />
                  {t('poorTitle')}
                </h2>
                <p className="m-0 mb-3 text-[12px] text-ink-muted">{t('poorHint')}</p>
                {poor.length === 0 ? (
                  <p className="m-0 text-[13px] text-ink-muted">{t('noPoor')}</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {poor.map((p) => (
                      <li key={`${p.lessonId}-${p.reason}-${p.label}`} className="rounded-lg bg-surface p-3">
                        <p className="m-0 text-[13px] font-semibold text-ink">{p.label}</p>
                        <p className="m-0 mt-0.5 text-[12px] text-ink-muted">
                          {p.lessonTitle} · {t(p.reason === 'REPEAT' ? 'reasonRepeat' : 'reasonNotCovered')} · {t('learners', { count: p.learnerCount })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
          <p className="m-0 text-[11.5px] text-ink-faint">{t('privacy')}</p>
        </>
      )}
    </>
  );
}

function Stats({ data }: { data: CourseInsight }) {
  const t = useTranslations('instructor.insights');
  const unusual = data.lessons.filter((l) => l.unusual).length;
  const items = [
    { label: t('statQuestions', { days: data.windowDays }), value: data.totalQuestions },
    { label: t('statLearners'), value: data.learnerCount },
    { label: t('statUnusual'), value: unusual },
  ];
  return (
    <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-line bg-surface-raised p-4 shadow-sm">
          <dt className="text-[12px] text-ink-muted">{it.label}</dt>
          <dd className="m-0 mt-1 font-display text-2xl font-extrabold text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SummaryCard({ courseId, summary, hasData }: { courseId: number; summary: InsightSummary; hasData: boolean }) {
  const t = useTranslations('instructor.insights');
  const locale = useLocale();
  const refresh = useRefreshInsightSummary(courseId);
  const pending = summary.status === 'PENDING' || refresh.isPending;
  return (
    <section aria-labelledby="insight-summary" aria-live="polite" className="rounded-xl border border-accent/30 bg-tint p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="insight-summary" className="m-0 flex items-center gap-2 text-[15px] font-bold text-ink">
          <Sparkles size={17} aria-hidden className="text-accent-dark" />
          {t('summaryTitle')}
        </h2>
        {hasData && (
          <Button size="sm" variant="secondary" onClick={() => refresh.mutate()} disabled={pending} className="inline-flex items-center gap-1.5">
            <RefreshCw size={14} aria-hidden className={pending ? 'animate-spin motion-reduce:animate-none' : ''} />
            {summary.status === 'NONE' ? t('generate') : t('refresh')}
          </Button>
        )}
      </div>
      {pending ? (
        <p className="m-0 mt-2 text-[13px] text-ink-muted">{t('summaryPending')}</p>
      ) : summary.status === 'READY' && summary.text ? (
        <>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-ink">{summary.text}</p>
          {summary.actions.length > 0 && (
            <>
              <h3 className="m-0 mt-3 flex items-center gap-1.5 text-[13px] font-bold text-ink">
                <Lightbulb size={14} aria-hidden className="text-accent-dark" />
                {t('actionsTitle')}
              </h3>
              <ul className="m-0 mt-1.5 flex list-disc flex-col gap-1 pl-5 text-[13px] text-ink">
                {summary.actions.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </>
          )}
          {summary.generatedAt && (
            <p className="m-0 mt-3 text-[11.5px] text-ink-muted">
              {t('generatedAt', { time: new Date(summary.generatedAt).toLocaleString(locale) })}
            </p>
          )}
        </>
      ) : summary.status === 'FAILED' ? (
        <p className="m-0 mt-2 text-[13px] text-danger">{t('summaryFailed')}</p>
      ) : (
        <p className="m-0 mt-2 text-[13px] text-ink-muted">{hasData ? t('summaryNone') : t('summaryNoData')}</p>
      )}
    </section>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-raised p-10 text-center text-sm text-ink-muted shadow-sm">{text}</div>
  );
}
