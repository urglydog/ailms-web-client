'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { useMyCourses } from '@/hooks/useCourses';
import { useCreateLiveSession } from '@/hooks/useLiveSessions';
import { useVoiceOptions } from '@/hooks/useVoiceOptions';
import { ApiError } from '@/lib/api/client';
import type { LiveVisibility } from '@/types/domain';

/** Tên hiển thị từ mã BCP-47 — khớp cách `LiveLanguagePicker` (F11.3) đang hiển thị, không tự
 * liệt kê bảng tên cho 148 ngôn ngữ (BR-DUB-07). */
function languageDisplayName(code: string): string {
  try {
    return new Intl.DisplayNames(['vi'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * UC50 — tạo/lên lịch phiên Live. `sourceLanguage` BẮT BUỘC hiện rõ trong form (BR-LIVE-04:
 * "Giảng viên CHỌN ngôn ngữ mình sẽ nói") — để trống thì BE tự lấy theo `preferredLanguage` của
 * giảng viên, KHÔNG phải ẩn hẳn field đi. Trước đó ẩn field này gây đúng 1 lần nhầm lẫn thật khi
 * test F11.3: mặc định ra `vi-VN` trong lúc giảng viên tưởng đang test bằng ngôn ngữ khác, chọn
 * ngôn ngữ dịch trùng ngôn ngữ nguồn mà không biết, nghe ra y hệt audio gốc.
 */
export default function NewLiveSessionPage() {
  const router = useRouter();
  const { data: coursesPage } = useMyCourses();
  const { data: voiceOptions } = useVoiceOptions();
  const createLiveSession = useCreateLiveSession();

  const [courseId, setCourseId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [visibility, setVisibility] = useState<LiveVisibility>('COURSE_ONLY');
  const [scheduledAt, setScheduledAt] = useState('');

  const courses = coursesPage?.content ?? [];
  const languages = useMemo(() => {
    const codes = new Set((voiceOptions ?? []).map((v) => v.language));
    return Array.from(codes).sort((a, b) => languageDisplayName(a).localeCompare(languageDisplayName(b), 'vi'));
  }, [voiceOptions]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId) return;
    createLiveSession.mutate(
      {
        courseId: Number(courseId),
        title: title.trim(),
        sourceLanguage: sourceLanguage || undefined,
        visibility,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      },
      { onSuccess: (created) => router.replace(`/instructor/live/${created.id}`) },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Tạo buổi Live mới</h1>
      <p className="text-[13px] text-gray-500">
        Đặt lịch trước hoặc để trống giờ bắt đầu để bấm &quot;Bắt đầu Live&quot; bất kỳ lúc nào sau khi tạo.
        Ảnh thumbnail cho trang khám phá Live sẽ thêm được ở bước kế tiếp, ngay sau khi tạo xong.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-600">Tiêu đề buổi live</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-600">Khóa học</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          >
            <option value="">-- Chọn khóa học --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-600">
            Ngôn ngữ bạn sẽ nói <span className="font-normal text-gray-400">(không bắt buộc)</span>
          </span>
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          >
            <option value="">-- Mặc định theo hồ sơ cá nhân --</option>
            {languages.map((code) => (
              <option key={code} value={code}>
                {languageDisplayName(code)}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400">
            Học viên chọn ngôn ngữ lồng tiếng khác ngôn ngữ này để nghe bản dịch trong lúc live.
          </p>
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-[12.5px] font-semibold text-gray-600">Phạm vi hiển thị</legend>
          <label className="flex items-center gap-2 text-[13px] text-gray-700">
            <input
              type="radio"
              checked={visibility === 'COURSE_ONLY'}
              onChange={() => setVisibility('COURSE_ONLY')}
            />
            Chỉ học viên đã ghi danh khóa học này
          </label>
          <label className="flex items-center gap-2 text-[13px] text-gray-700">
            <input
              type="radio"
              checked={visibility === 'PUBLIC'}
              onChange={() => setVisibility('PUBLIC')}
            />
            Công khai — ai cũng xem được, kể cả chưa đăng nhập
          </label>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-600">
            Giờ dự kiến bắt đầu <span className="font-normal text-gray-400">(không bắt buộc)</span>
          </span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </label>

        {createLiveSession.error instanceof ApiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-700">
            {createLiveSession.error.message}
          </div>
        )}

        <button
          type="submit"
          disabled={createLiveSession.isPending}
          className="self-start rounded-full bg-cyan-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {createLiveSession.isPending ? 'Đang tạo...' : 'Tạo buổi live →'}
        </button>
      </form>
    </div>
  );
}
