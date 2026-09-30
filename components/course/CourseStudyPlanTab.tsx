'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { toast } from 'sonner';
import { Sparkles, Calendar as CalendarIcon, Clock, Download, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

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

export function CourseStudyPlanTab({ courseId }: { courseId: number }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [targetDate, setTargetDate] = useState<string>(() => {
    return format(addDays(new Date(), 7), 'yyyy-MM-dd');
  });
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(5);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['study-plan', courseId],
    queryFn: () => api.get<StudyPlanDto | null>(`/api/v1/student/courses/${courseId}/study-plan`),
  });

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
        // Generate an event for 8:00 AM on the given date
        const dtstart = `${year}${month}${dayStr}T080000Z`;
        const dtend = `${year}${month}${dayStr}T090000Z`; // Default 1 hour slot in calendar
        
        const description = `Mục tiêu: ${day.objective}\\n\\nBài giảng:\\n` + 
          day.lessons.map(l => `- ${l.title} (${l.duration_minutes} phút)`).join('\\n');
        
        icsContent += 'BEGIN:VEVENT\n';
        icsContent += `DTSTART:${dtstart}\n`;
        icsContent += `DTEND:${dtend}\n`;
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

  if (isLoading) {
    return <div className="p-8 text-center text-ink-muted">Đang tải...</div>;
  }

  const hasPlan = planDays.length > 0;

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
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
          >
            {hasPlan ? <Plus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {hasPlan ? 'Tạo lộ trình mới' : 'Tạo lộ trình ngay'}
          </button>
        </div>
      </div>

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
                  {day.lessons.map((lesson, j) => (
                    <div key={j} className="flex items-center justify-between rounded-lg border border-line-soft bg-white p-3 shadow-sm">
                      <span className="font-medium text-ink text-sm">{lesson.title}</span>
                      <span className="text-xs text-ink-muted rounded-full bg-surface-hover px-2 py-1">
                        {lesson.duration_minutes} phút
                      </span>
                    </div>
                  ))}
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
    </div>
  );
}
