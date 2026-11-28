'use client';

import { Modal } from '@/components/ui/Modal';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { toast } from 'sonner';
import { Sparkles, Calendar as CalendarIcon, Clock, Download, Plus, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { format, addDays, startOfDay, isBefore, differenceInCalendarDays } from 'date-fns';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { getDateFnsLocale } from '@/lib/dateFnsLocale';

interface CourseStudyPlanTabProps {
  courseId: number;
  completedLessonIds?: number[];
  allLessons?: { lessonId: number; durationSec?: number }[];
}

interface StudyLesson {
  lesson_id: number;
  title: string;
  duration_minutes: number;
}

interface StudyDay {
  date: string;
  lessons: StudyLesson[];
  objective: string;
}

interface StudyPlanDto {
  courseId: number;
  targetDate: string;
  hoursPerWeek: number;
  planData: string; // JSON string
}

export function CourseStudyPlanTab({ courseId, completedLessonIds = [], allLessons = [] }: CourseStudyPlanTabProps) {
  const t = useTranslations('learn.studyPlan');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [targetDate, setTargetDate] = useState<string>(() => {
    return format(addDays(new Date(), 7), 'yyyy-MM-dd');
  });
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(5);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTargetDate, setRescheduleTargetDate] = useState('');

  const { data: plan, isLoading } = useQuery({
    queryKey: ['study-plan', courseId],
    queryFn: async () => {
      try {
        const res = await api.get<StudyPlanDto | null>(`/api/v1/student/courses/${courseId}/study-plan`);
        return res;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
  });

  useEffect(() => {
    if (plan) {
      setHoursPerWeek(plan.hoursPerWeek);
      const minDate = format(addDays(new Date(), 2), 'yyyy-MM-dd');
      // If plan target date is too soon, default to +7 days to avoid 400 Bad Request
      if (plan.targetDate < minDate) {
        setTargetDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
      } else {
        setTargetDate(plan.targetDate);
      }
    }
  }, [plan]);

  const generatePlan = useMutation({
    mutationFn: (data: { targetDate: string; hoursPerWeek: number }) =>
      api.post<StudyPlanDto>(`/api/v1/student/courses/${courseId}/study-plan/generate`, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['study-plan', courseId], data);
      setShowModal(false);
      toast.success(t('createdToast'));
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error(t('createError'));
      }
    },
  });

  const deletePlan = useMutation({
    mutationFn: () => api.delete(`/api/v1/student/courses/${courseId}/study-plan`),
    onSuccess: () => {
      queryClient.setQueryData(['study-plan', courseId], null);
      setShowDeleteModal(false);
      toast.success(t('deletedToast'));
    },
    onError: () => {
      toast.error(t('deleteError'));
    },
  });

  const reschedulePlan = useMutation({
    mutationFn: () =>
      api.put<StudyPlanDto>(
        `/api/v1/student/courses/${courseId}/study-plan/reschedule`,
        // ⚠️ Gửi undefined thay vì "" để tránh Jackson DateTimeParseException
        rescheduleTargetDate ? { targetDate: rescheduleTargetDate } : {}
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(['study-plan', courseId], data);
      setShowRescheduleModal(false);
      setRescheduleTargetDate('');
      toast.success(t('updatedToast'));
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(t('genericError'));
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generatePlan.mutate({ targetDate, hoursPerWeek });
  };

  const handleExportIcs = () => {
    if (!plan || !plan.planData) return;
    try {
      const days: StudyDay[] = JSON.parse(plan.planData);
      // RFC 5545 TEXT escaping — thiếu bước này thì tiêu đề bài học/mục tiêu có chứa dấu
      // phẩy/chấm phẩy sẽ phá cấu trúc file .ics (BUG THẬT 03/10/2026).
      const icsEscape = (text: string) =>
        text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
      // Cộng ngày bằng UTC thuần (không qua Date local) để tránh lệch ngày khi trình duyệt
      // ở múi giờ âm UTC — new Date('yyyy-MM-dd') cũ đọc lại bằng getDate() local có thể lùi 1
      // ngày (BUG THẬT 03/10/2026, cùng dạng với các lỗi timezone đã gặp trong dự án).
      const addDaysUtc = (dateStr: string, add: number) => {
        const parts = dateStr.split('-');
        const y = Number(parts[0]);
        const m = Number(parts[1]);
        const d = Number(parts[2]);
        const dt = new Date(Date.UTC(y, m - 1, d));
        dt.setUTCDate(dt.getUTCDate() + add);
        return `${dt.getUTCFullYear()}${String(dt.getUTCMonth() + 1).padStart(2, '0')}${String(dt.getUTCDate()).padStart(2, '0')}`;
      };
      const dtstamp = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

      let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LMS//Study Plan//EN\n';

      days.forEach(day => {
        if (!day.lessons || day.lessons.length === 0) return;
        const dtstart = day.date.replace(/-/g, '');
        const dtend = addDaysUtc(day.date, 1);

        const description = `${t('icsObjective', { objective: icsEscape(day.objective) })}\\n\\n${t('icsLessons')}\\n` +
          day.lessons.map(l => t('icsLessonLine', { title: icsEscape(l.title), minutes: l.duration_minutes })).join('\\n');

        icsContent += 'BEGIN:VEVENT\n';
        // UID ổn định theo courseId+ngày — bắt buộc theo RFC 5545, và giúp app lịch NHẬN RA
        // đây là cùng 1 sự kiện khi export lại sau reschedule (update) thay vì tạo bản trùng
        // (BUG THẬT 03/10/2026: thiếu UID/DTSTAMP khiến mỗi lần export lại là 1 bộ event mới).
        icsContent += `UID:lms-studyplan-${courseId}-${day.date}@lms\n`;
        icsContent += `DTSTAMP:${dtstamp}\n`;
        icsContent += `DTSTART;VALUE=DATE:${dtstart}\n`;
        icsContent += `DTEND;VALUE=DATE:${dtend}\n`;
        icsContent += `SUMMARY:${t('icsSummary', { title: icsEscape(day.lessons[0]?.title ?? t('icsDefaultLesson')) })}\n`;
        icsContent += `DESCRIPTION:${description}\n`;
        icsContent += 'END:VEVENT\n';
      });

      icsContent += 'END:VCALENDAR';

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study-plan-${courseId}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch {
      toast.error(t('exportError'));
    }
  };

  let planDays: StudyDay[] = [];
  if (plan && plan.planData) {
    try {
      planDays = JSON.parse(plan.planData);
    } catch {
      console.error('Invalid JSON planData');
    }
  }

  const hasPlan = planDays.length > 0;
  
  let isBehindSchedule = false;
  if (hasPlan) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    planDays.forEach(day => {
      if (day.date < todayStr) {
        const hasUncompleted = day.lessons.some(l => !completedLessonIds.includes(l.lesson_id));
        if (hasUncompleted) {
          isBehindSchedule = true;
        }
      }
    });
  }

  // === RESCHEDULE PREVIEW STATS ===
  // effectiveTarget thay đổi live khi user chỉnh date trong modal
  const effectiveTarget = rescheduleTargetDate || plan?.targetDate || '';

  // Guard clause: phòng NaN khi effectiveTarget rỗng hoặc invalid
  const isValidTarget = Boolean(effectiveTarget) && !isNaN(Date.parse(effectiveTarget));

  const uncompletedInPlan = planDays
    .flatMap(d => d.lessons)
    .filter(l => !completedLessonIds.includes(l.lesson_id));

  // Deduplicate (1 bài có thể xuất hiện ở nhiều ngày nếu plan cũ bị lỗi)
  const seenIds = new Set<number>();
  const uniqueUncompleted = uncompletedInPlan.filter(l => {
    if (seenIds.has(l.lesson_id)) return false;
    seenIds.add(l.lesson_id);
    return true;
  });

  const totalMinutes = uniqueUncompleted.reduce((s, l) => s + l.duration_minutes, 0);

  // So sánh DATE thuần, không lẫn giờ/phút
  const todayStart = startOfDay(new Date());
  const targetStart = isValidTarget ? startOfDay(new Date(effectiveTarget)) : todayStart;
  const isDeadlinePassed = isValidTarget ? isBefore(targetStart, todayStart) : true;

  const daysRemaining = (!isValidTarget || isDeadlinePassed)
    ? 0
    : Math.max(1, differenceInCalendarDays(targetStart, todayStart) + 1);

  const avgMinPerDay = daysRemaining > 0 ? Math.ceil(totalMinutes / daysRemaining) : Infinity;
  const isOverloaded = avgMinPerDay > 120;

  if (isLoading) {
    return <div className="p-8 text-center text-ink-muted">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">{t('title')}</h2>
          <p className="text-sm text-ink-muted mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasPlan && (
            <button
              onClick={handleExportIcs}
              className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-surface-hover"
            >
              <Download className="h-4 w-4" /> {t('exportIcs')}
            </button>
          )}
          <button
            onClick={() => isBehindSchedule ? setShowRescheduleModal(true) : setShowModal(true)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              isBehindSchedule ? 'bg-warning hover:bg-warning' : 'bg-accent hover:bg-accent-dark'
            }`}
          >
            {hasPlan ? (
              isBehindSchedule ? <Clock className="h-4 w-4" /> : <Plus className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {hasPlan ? (isBehindSchedule ? t('updateProgress') : t('adjust')) : t('createNow')}
          </button>
          
          {hasPlan && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center rounded-lg p-2 text-danger hover:bg-danger/5 hover:text-danger transition-colors"
              title={t('deleteTitle')}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {isBehindSchedule && !showModal && (
        <div className="rounded-lg bg-streak-bg border border-warning/30 p-4 flex gap-3 items-start">
          <div className="mt-0.5">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h4 className="font-semibold text-streak-ink text-sm">{t('behindTitle')}</h4>
            <p className="text-streak-ink text-sm mt-1">
              {t.rich('behindBody', { b: (chunks) => <strong>{chunks}</strong> })}
            </p>
          </div>
        </div>
      )}

      {!hasPlan && !showModal && (
        <div className="rounded-xl border border-dashed border-line-soft bg-surface py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <h3 className="mt-4 font-semibold text-ink">{t('emptyTitle')}</h3>
          <p className="mt-2 max-w-sm mx-auto text-sm text-ink-muted">
            {t('emptyBody')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            {t('startConfig')}
          </button>
        </div>
      )}

      {hasPlan && (
        <div className="space-y-4">
          <div className="flex gap-6 rounded-lg bg-surface-hover p-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-ink-muted" />
              <span className="text-ink-muted">{t('targetLabel')}</span>
              <span className="font-semibold text-ink">{plan?.targetDate ? format(new Date(plan.targetDate), 'dd/MM/yyyy') : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-muted" />
              <span className="text-ink-muted">{t('commitLabel')}</span>
              <span className="font-semibold text-ink">{t('hoursPerWeek', { hours: plan?.hoursPerWeek ?? 0 })}</span>
            </div>
          </div>

          <div className="relative ml-3 border-l-2 border-line pl-6 py-4 space-y-8">
            {planDays.map((day, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-surface-raised" />
                <h4 className="font-semibold text-ink">
                  {format(new Date(day.date), 'EEEE, dd MMMM, yyyy', { locale: getDateFnsLocale(locale) })}
                </h4>
                <p className="text-sm font-medium text-accent mt-1">{day.objective}</p>
                
                <div className="mt-4 grid gap-3">
                  {day.lessons.map((lesson, j) => {
                    const isCompleted = completedLessonIds.includes(lesson.lesson_id);
                    return (
                      <Link 
                        key={j} 
                        href={`/learn/${lesson.lesson_id}`}
                        className={`group flex items-center justify-between rounded-lg border bg-surface-raised p-3 shadow-sm transition hover:border-accent hover:shadow-md ${isCompleted ? 'border-success/30 bg-success-tint/30' : 'border-line-soft'}`}
                      >
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-line ml-1.5 flex-shrink-0 group-hover:bg-accent" />
                          )}
                          <span className={`font-medium text-sm transition-colors group-hover:text-accent ${isCompleted ? 'text-ink line-through opacity-70' : 'text-ink'}`}>
                            {lesson.title}
                          </span>
                        </div>
                        {(() => {
                          const realLesson = allLessons.find(l => l.lessonId === lesson.lesson_id);
                          const hasVideo = realLesson && realLesson.durationSec && realLesson.durationSec > 0;
                          return hasVideo ? (
                            <span className="text-xs text-ink-muted rounded-full bg-surface-hover px-2 py-1">
                              {t('minutes', { minutes: lesson.duration_minutes })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink-faint rounded-full border border-line-soft px-2 py-0.5">
                              {t('noVideo')}
                            </span>
                          );
                        })()}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Cấu hình Lộ trình */}
      {showModal && typeof window !== 'undefined' && <Modal open onClose={() => setShowModal(false)} bare ariaLabel={t('configTitle')} closeOnBackdrop={false} className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-raised shadow-2xl">
            <div className="border-b border-line p-4">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                {t('configTitle')}
              </h3>
            </div>
            <form onSubmit={handleGenerate} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {t('expectedDate')}
                  </label>
                  <input
                    type="date"
                    required
                    min={format(addDays(new Date(), 2), 'yyyy-MM-dd')}
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="mt-1 text-xs text-ink-muted">{t('expectedDateHint')}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {t('weeklyHours')}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={168}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="mt-1 text-xs text-ink-muted">{t('weeklyHoursHint')}</p>
                </div>
              </div>

              {isBehindSchedule && (
                <div className="mt-4 rounded border border-warning/30 bg-streak-bg p-3 text-xs text-streak-ink">
                  <p className="font-semibold mb-1">{t('catchUpTitle')}</p>
                  <p>{t.rich('catchUpBody', { b: (chunks) => <strong>{chunks}</strong> })}</p>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted hover:bg-surface-hover"
                  disabled={generatePlan.isPending}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={generatePlan.isPending}
                  className="flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                >
                  {generatePlan.isPending ? t('analyzing') : t('createPlan')}
                </button>
              </div>
            </form>
          </Modal>}

      {/* Modal Xác nhận Xóa Lộ trình */}
      {showDeleteModal && typeof window !== 'undefined' && <Modal open onClose={() => setShowDeleteModal(false)} bare ariaLabel={t('deleteConfirmTitle')} role="alertdialog" closeOnBackdrop={false} className="w-full max-w-sm overflow-hidden rounded-2xl bg-surface-raised shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{t('deleteConfirmTitle')}</h3>
              <p className="mt-2 text-sm text-ink-muted">
                {t('deleteConfirmBody')}
              </p>
            </div>
            <div className="flex border-t border-line">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 text-sm font-semibold text-ink-muted hover:bg-surface-hover"
                disabled={deletePlan.isPending}
              >
                {t('cancelShort')}
              </button>
              <div className="w-px bg-line" />
              <button
                type="button"
                onClick={() => deletePlan.mutate()}
                className="flex-1 py-3 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-50"
                disabled={deletePlan.isPending}
              >
                {deletePlan.isPending ? t('deleting') : t('deletePlan')}
              </button>
            </div>
          </Modal>}

      {/* Modal Reschedule Preview */}
      {showRescheduleModal && typeof window !== 'undefined' && <Modal open onClose={() => setShowRescheduleModal(false)} bare ariaLabel={t('updateProgress')} closeOnBackdrop={false} className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-raised shadow-2xl">
            <div className="border-b border-line p-4">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                {t('updateProgress')}
              </h3>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); reschedulePlan.mutate(); }} className="p-6">
              <div className="space-y-4 text-sm text-ink mb-6">
                <div className="flex justify-between py-2 border-b border-line-soft">
                  <span className="text-ink-muted">{t('remaining')}</span>
                  <span className="font-medium">{t('remainingValue', { lessons: uniqueUncompleted.length, minutes: totalMinutes })}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-line-soft">
                  <span className="text-ink-muted">{t('dueLabel')}</span>
                  <span className="font-medium">{t('dueValue', { date: isValidTarget ? format(new Date(effectiveTarget), 'dd/MM/yyyy') : '--', days: daysRemaining })}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-line-soft">
                  <span className="text-ink-muted">{t('requiredPace')}</span>
                  <span className={`font-medium flex items-center gap-1 ${isOverloaded ? 'text-danger' : 'text-success'}`}>
                    {t('paceValue', { minutes: avgMinPerDay === Infinity ? '--' : avgMinPerDay })}
                    {isOverloaded ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                </div>
              </div>

              {(isOverloaded || isDeadlinePassed || !isValidTarget) && (
                <div className="mb-6 space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    {t('pickNewDate')} { (isDeadlinePassed || !isValidTarget) && <span className="text-danger">*</span> }
                  </label>
                  <input
                    type="date"
                    required={isDeadlinePassed || !isValidTarget}
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    value={rescheduleTargetDate}
                    onChange={(e) => setRescheduleTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  {isOverloaded && !isDeadlinePassed && isValidTarget && (
                    <p className="text-xs text-warning">{t('tooHeavy')}</p>
                  )}
                  {(isDeadlinePassed || !isValidTarget) && (
                    <p className="text-xs text-danger">{t('deadlinePassed')}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted hover:bg-surface-hover"
                  disabled={reschedulePlan.isPending}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={reschedulePlan.isPending || !isValidTarget || isDeadlinePassed}
                  className="flex items-center justify-center rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-white hover:bg-warning disabled:opacity-50"
                >
                  {reschedulePlan.isPending ? t('updating') : t('confirmUpdate')}
                </button>
              </div>
            </form>
          </Modal>}
    </div>
  );
}
