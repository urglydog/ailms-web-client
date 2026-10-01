'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { toast } from 'sonner';
import { Sparkles, Calendar as CalendarIcon, Clock, Download, Plus, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { format, addDays, startOfDay, isBefore, differenceInCalendarDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

interface CourseStudyPlanTabProps {
  courseId: number;
  completedLessonIds?: number[];
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

export function CourseStudyPlanTab({ courseId, completedLessonIds = [] }: CourseStudyPlanTabProps) {
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
      toast.success('Đã tạo lộ trình học thành công!');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Có lỗi xảy ra khi tạo lộ trình.');
      }
    },
  });

  const deletePlan = useMutation({
    mutationFn: () => api.delete(`/api/v1/student/courses/${courseId}/study-plan`),
    onSuccess: () => {
      queryClient.setQueryData(['study-plan', courseId], null);
      setShowDeleteModal(false);
      toast.success('Đã xóa lộ trình thành công!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi xóa lộ trình.');
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
      toast.success('Đã cập nhật tiến độ thành công!');
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Có lỗi xảy ra.');
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
      let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LMS//Study Plan//EN\n';
      
      days.forEach(day => {
        if (!day.lessons || day.lessons.length === 0) return;
        const [year, month, dayStr] = day.date.split('-');
        const dtstart = `${year}${month}${dayStr}`;
        const nextDay = new Date(day.date);
        nextDay.setDate(nextDay.getDate() + 1);
        const dtend = `${nextDay.getFullYear()}${String(nextDay.getMonth() + 1).padStart(2, '0')}${String(nextDay.getDate()).padStart(2, '0')}`;
        
        const description = `Mục tiêu: ${day.objective}\\n\\nBài giảng:\\n` + 
          day.lessons.map(l => `- ${l.title} (${l.duration_minutes} phút)`).join('\\n');
        
        icsContent += 'BEGIN:VEVENT\n';
        icsContent += `DTSTART;VALUE=DATE:${dtstart}\n`;
        icsContent += `DTEND;VALUE=DATE:${dtend}\n`;
        icsContent += `SUMMARY:Học LMS - ${day.lessons[0]?.title ?? 'Bài học'}...\n`;
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
      toast.error('Lỗi khi xuất file Calendar');
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
    return <div className="p-8 text-center text-ink-muted">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Lộ trình học AI (Cá nhân hóa)</h2>
          <p className="text-sm text-ink-muted mt-1">
            Được phân bổ tự động bởi AI dựa trên tiến độ và mục tiêu của bạn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasPlan && (
            <button
              onClick={handleExportIcs}
              className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-surface-hover"
            >
              <Download className="h-4 w-4" /> Xuất Calendar (.ics)
            </button>
          )}
          <button
            onClick={() => isBehindSchedule ? setShowRescheduleModal(true) : setShowModal(true)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              isBehindSchedule ? 'bg-orange-500 hover:bg-orange-600' : 'bg-accent hover:bg-accent-dark'
            }`}
          >
            {hasPlan ? (
              isBehindSchedule ? <Clock className="h-4 w-4" /> : <Plus className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {hasPlan ? (isBehindSchedule ? 'Cập nhật tiến độ' : 'Điều chỉnh lộ trình') : 'Tạo lộ trình ngay'}
          </button>
          
          {hasPlan && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Xóa lộ trình"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {isBehindSchedule && !showModal && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 flex gap-3 items-start">
          <div className="mt-0.5">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h4 className="font-semibold text-orange-800 text-sm">Bạn đang trễ tiến độ!</h4>
            <p className="text-orange-700 text-sm mt-1">
              Bạn có một số bài học trong quá khứ chưa hoàn thành. Hãy bấm <strong>Cập nhật tiến độ</strong> để hệ thống tự động dời các bài chưa học vào lịch còn lại.
            </p>
          </div>
        </div>
      )}

      {!hasPlan && !showModal && (
        <div className="rounded-xl border border-dashed border-line-soft bg-surface py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <h3 className="mt-4 font-semibold text-ink">Chưa có lộ trình học nào</h3>
          <p className="mt-2 max-w-sm mx-auto text-sm text-ink-muted">
            Hãy thiết lập mục tiêu ngày hoàn thành để AI tạo lịch học chi tiết cho từng ngày, giúp bạn dễ dàng theo dõi tiến độ.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Bắt đầu cấu hình
          </button>
        </div>
      )}

      {hasPlan && (
        <div className="space-y-4">
          <div className="flex gap-6 rounded-lg bg-surface-hover p-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-ink-muted" />
              <span className="text-ink-muted">Mục tiêu hoàn thành:</span>
              <span className="font-semibold text-ink">{plan?.targetDate ? format(new Date(plan.targetDate), 'dd/MM/yyyy') : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-muted" />
              <span className="text-ink-muted">Cam kết học:</span>
              <span className="font-semibold text-ink">{plan?.hoursPerWeek ?? 0} giờ / tuần</span>
            </div>
          </div>

          <div className="relative ml-3 border-l-2 border-line pl-6 py-4 space-y-8">
            {planDays.map((day, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-white" />
                <h4 className="font-semibold text-ink">
                  {format(new Date(day.date), 'EEEE, dd MMMM, yyyy', { locale: vi })}
                </h4>
                <p className="text-sm font-medium text-accent mt-1">{day.objective}</p>
                
                <div className="mt-4 grid gap-3">
                  {day.lessons.map((lesson, j) => {
                    const isCompleted = completedLessonIds.includes(lesson.lesson_id);
                    return (
                      <Link 
                        key={j} 
                        href={`/learn/${lesson.lesson_id}`}
                        className={`group flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm transition-all hover:border-accent hover:shadow-md ${isCompleted ? 'border-green-200 bg-green-50/30' : 'border-line-soft'}`}
                      >
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-line ml-1.5 flex-shrink-0 group-hover:bg-accent" />
                          )}
                          <span className={`font-medium text-sm transition-colors group-hover:text-accent ${isCompleted ? 'text-ink line-through opacity-70' : 'text-ink'}`}>
                            {lesson.title}
                          </span>
                        </div>
                        <span className="text-xs text-ink-muted rounded-full bg-surface-hover px-2 py-1">
                          {lesson.duration_minutes} phút
                        </span>
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
      {showModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-line p-4">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Cấu hình lộ trình học AI
              </h3>
            </div>
            <form onSubmit={handleGenerate} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Ngày hoàn thành dự kiến
                  </label>
                  <input
                    type="date"
                    required
                    min={format(addDays(new Date(), 2), 'yyyy-MM-dd')}
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="mt-1 text-xs text-ink-muted">Lịch học sẽ được chia đều từ hôm nay đến ngày này.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Thời gian học (Giờ / tuần)
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
                  <p className="mt-1 text-xs text-ink-muted">AI sẽ phân bổ sao cho không vượt quá giới hạn này.</p>
                </div>
              </div>

              {isBehindSchedule && (
                <div className="mt-4 rounded border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                  <p className="font-semibold mb-1">Gợi ý bắt kịp tiến độ:</p>
                  <p>Vì khối lượng bài dồn lại nhiều hơn, bạn có thể cần <strong>tăng số giờ học mỗi tuần</strong> hoặc <strong>lùi ngày hoàn thành</strong> để lộ trình khả thi hơn.</p>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted hover:bg-surface-hover"
                  disabled={generatePlan.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={generatePlan.isPending}
                  className="flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
                >
                  {generatePlan.isPending ? 'Đang phân tích...' : 'Tạo lộ trình'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Xác nhận Xóa Lộ trình */}
      {showDeleteModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">Xóa lộ trình hiện tại?</h3>
              <p className="mt-2 text-sm text-ink-muted">
                Bạn có chắc chắn muốn xóa lộ trình này không? Bạn sẽ phải cấu hình lại từ đầu.
              </p>
            </div>
            <div className="flex border-t border-line">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 text-sm font-semibold text-ink-muted hover:bg-surface-hover"
                disabled={deletePlan.isPending}
              >
                Hủy bỏ
              </button>
              <div className="w-px bg-line" />
              <button
                type="button"
                onClick={() => deletePlan.mutate()}
                className="flex-1 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                disabled={deletePlan.isPending}
              >
                {deletePlan.isPending ? 'Đang xóa...' : 'Xóa lộ trình'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Reschedule Preview */}
      {showRescheduleModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-line p-4">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Cập nhật tiến độ
              </h3>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); reschedulePlan.mutate(); }} className="p-6">
              <div className="space-y-4 text-sm text-ink mb-6">
                <div className="flex justify-between py-2 border-b border-line-soft">
                  <span className="text-ink-muted">Còn lại:</span>
                  <span className="font-medium">{uniqueUncompleted.length} bài ({totalMinutes} phút)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-line-soft">
                  <span className="text-ink-muted">Đến hạn:</span>
                  <span className="font-medium">{isValidTarget ? format(new Date(effectiveTarget), 'dd/MM/yyyy') : '--'} ({daysRemaining} ngày)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-line-soft">
                  <span className="text-ink-muted">Tốc độ cần thiết:</span>
                  <span className={`font-medium flex items-center gap-1 ${isOverloaded ? 'text-red-600' : 'text-green-600'}`}>
                    ~{avgMinPerDay === Infinity ? '--' : avgMinPerDay} phút / ngày
                    {isOverloaded ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                </div>
              </div>

              {(isOverloaded || isDeadlinePassed || !isValidTarget) && (
                <div className="mb-6 space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Chọn ngày hoàn thành mới { (isDeadlinePassed || !isValidTarget) && <span className="text-red-500">*</span> }
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
                    <p className="text-xs text-orange-600">Khối lượng bài học quá nặng. Vui lòng dời deadline để giảm tải.</p>
                  )}
                  {(isDeadlinePassed || !isValidTarget) && (
                    <p className="text-xs text-red-600">Deadline đã qua hoặc không hợp lệ. Bạn bắt buộc phải chọn ngày mới.</p>
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
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reschedulePlan.isPending || !isValidTarget || isDeadlinePassed}
                  className="flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {reschedulePlan.isPending ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
