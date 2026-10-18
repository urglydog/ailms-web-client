'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useInstructorCourseOptions, useInstructorStudents } from '@/hooks/useDashboard';
import { useStartConversationAsInstructor } from '@/hooks/useCommunication';

/** "Giao tiếp > Tin nhắn" > nút "Soạn tin nhắn" của Giảng viên (19/09/2026) — chọn khóa rồi chọn
 * 1 học viên đã ghi danh khóa đó để bắt đầu hội thoại (tránh nhắn tin cho người lạ chưa từng học). */
export function ComposeMessageButton() {
  const t = useTranslations('instructor.comm.compose');
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>('');

  const { data: courses } = useInstructorCourseOptions();
  const { data: students } = useInstructorStudents(courseId || undefined);
  const startConversation = useStartConversationAsInstructor();

  const handleStart = () => {
    if (!studentId) return;
    startConversation.mutate(
      { studentId: Number(studentId), courseId: courseId || undefined },
      { onSuccess: () => { setOpen(false); setCourseId(''); setStudentId(''); } },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-2.5 py-1 text-[12px] font-bold text-white hover:bg-accent-dark"
      >
        {t('button')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 font-display text-[15px] font-bold text-ink">{t('title')}</h3>

            <label className="mb-1 block text-[12px] font-semibold text-ink-muted">{t('course')}</label>
            <select
              value={courseId}
              onChange={(e) => { setCourseId(e.target.value ? Number(e.target.value) : ''); setStudentId(''); }}
              className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none"
            >
              <option value="">{t('pickCourse')}</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            <label className="mb-1 block text-[12px] font-semibold text-ink-muted">{t('student')}</label>
            <select
              value={studentId}
              disabled={!courseId}
              onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : '')}
              className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none disabled:bg-gray-50"
            >
              <option value="">{courseId ? t('pickStudent') : t('pickCourseFirst')}</option>
              {students?.map((s) => (
                <option key={s.studentId} value={s.studentId}>{s.studentName}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink-muted hover:bg-surface"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleStart}
                disabled={!studentId || startConversation.isPending}
                className="rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('start')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
