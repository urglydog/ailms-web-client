'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CourseFilterDropdown } from '@/components/instructor/communication/CourseFilterDropdown';
import { useInstructorCourseOptions } from '@/hooks/useDashboard';
import { useCreateAnnouncement, useDeleteAnnouncement, useInstructorAnnouncements } from '@/hooks/useCommunication';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { InstructorCourseOption } from '@/lib/api/dashboard';

/** "Giao tiếp > Thông báo" (19/09/2026, xây mới) — gửi broadcast tới toàn bộ học viên đã ghi
 * danh 1 khóa (fan-out qua hệ thống Notification có sẵn). */
export default function InstructorAnnouncementsPage() {
  const t = useTranslations('instructor.comm');
  const locale = useLocale();
  const [filterCourseId, setFilterCourseId] = useState<number | ''>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: courses } = useInstructorCourseOptions();
  const { data: announcements, isLoading } = useInstructorAnnouncements(filterCourseId || undefined);
  const deleteAnnouncement = useDeleteAnnouncement();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[20px] font-bold text-ink">{t('announcements.title')}</h1>
        <CourseFilterDropdown courses={courses ?? []} value={filterCourseId} onChange={setFilterCourseId} />
      </div>

      <CreateAnnouncementForm courses={courses ?? []} />

      {isLoading && <div className="p-10 text-center text-sm text-ink-muted">{t('loading')}</div>}
      {!isLoading && (!announcements || announcements.length === 0) && (
        <div className="rounded-xl border border-line bg-white p-10 text-center text-sm text-ink-muted shadow-sm">
          {t('announcements.empty')}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {announcements?.map((a) => (
          <div key={a.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <p className="text-[13.5px] font-bold text-ink">{a.title}</p>
                <p className="text-[11.5px] text-ink-muted">{a.courseTitle} · {new Date(a.createdAt).toLocaleString(locale)}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteId(a.id)}
                className="shrink-0 text-[12px] font-semibold text-red-500 hover:text-red-700"
              >
                {t('announcements.delete')}
              </button>
            </div>
            <p className="whitespace-pre-line text-[13px] text-ink">{a.content}</p>
          </div>
        ))}
      </div>

      {deleteId != null && (
        <ConfirmModal
          title={t('announcements.deleteTitle')}
          message={t('announcements.deleteMessage')}
          confirmLabel={t('announcements.deleteConfirm')}
          onCancel={() => setDeleteId(null)}
          onConfirm={() => { deleteAnnouncement.mutate(deleteId); setDeleteId(null); }}
        />
      )}
    </>
  );
}

function CreateAnnouncementForm({ courses }: { courses: InstructorCourseOption[] }) {
  const t = useTranslations('instructor.comm');
  const [courseId, setCourseId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const createAnnouncement = useCreateAnnouncement();

  const handleSubmit = () => {
    if (!courseId || !title.trim() || !content.trim()) return;
    createAnnouncement.mutate(
      { courseId: Number(courseId), title: title.trim(), content: content.trim() },
      { onSuccess: () => { setTitle(''); setContent(''); } },
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
      <p className="font-display text-[14px] font-bold text-ink">{t('announcements.newTitle')}</p>
      <CourseFilterDropdown
        courses={courses}
        value={courseId}
        onChange={setCourseId}
        allLabel={t('announcements.pickCourse')}
        showAllOption={false}
        fullWidth
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('announcements.titlePh')}
        className="rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder={t('announcements.contentPh')}
        className="resize-none rounded-lg border border-line px-3 py-2 text-[13px] focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!courseId || !title.trim() || !content.trim() || createAnnouncement.isPending}
        className="self-end rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('announcements.send')}
      </button>
    </div>
  );
}
