'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { DualPlayer } from '@/components/player/DualPlayer';
import { DubbingActivatePanel } from '@/components/player/DubbingActivatePanel';
import { LanguageSwitcher } from '@/components/player/LanguageSwitcher';
import { PipelineProgress } from '@/components/player/PipelineProgress';
import { useLessonPlayer } from '@/hooks/usePublicCourses';
import { ApiError } from '@/lib/api/client';
import { MOCK_PIPELINE_STEPS } from '@/lib/mock/courses';
import type { PipelineStep } from '@/types/domain';

/**
 * Trang học bài — dịch từ nhánh `isPlayer` của design.
 *
 * Gộp 4 use case vào một màn:
 *  - UC11 Học thử Preview (video thật, không cần sở hữu khóa học — xem `useLessonPlayer`)
 *  - UC16 Dual Player (video muted + audio lồng tiếng)
 *  - UC17 chọn ngôn ngữ đã có bản lồng tiếng
 *  - UC18 kích hoạt lồng tiếng khi ngôn ngữ chưa có → panel `DubbingActivatePanel`
 *  - UC20 theo dõi tiến độ realtime → panel `PipelineProgress`
 *
 * Chưa có bảng `voice_mappings`/`AudioTrack` thật (Giai đoạn 5) nên `languages` luôn rỗng —
 * `LanguageSwitcher` không hiện gì, `mode` luôn ở `watching`. UC18/UC20 (state `need-activation`/
 * `processing`) giữ nguyên UI đã dựng từ Giai đoạn 0 nhưng chưa có đường vào thật cho tới khi
 * Giai đoạn 5 nối `languages` thật.
 */

type PlayerMode = 'watching' | 'need-activation' | 'processing';

export default function LearnPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);

  const { data: lesson, isLoading, error } = useLessonPlayer(lessonId);

  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [mode, setMode] = useState<PlayerMode>('watching');
  const [steps, setSteps] = useState<PipelineStep[]>(MOCK_PIPELINE_STEPS);

  if (isLoading) {
    return <div className="p-16 text-center text-sm text-ink-muted">Đang tải bài học...</div>;
  }

  if (error || !lesson) {
    return (
      <div className="shell flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-ink-muted">
          {error instanceof ApiError
            ? error.message
            : 'Không tìm thấy bài học, hoặc bài học này cần sở hữu khóa học mới xem được.'}
        </p>
        <Link href="/courses" className="text-sm font-semibold text-accent hover:underline">
          ← Về kho khoá học
        </Link>
      </div>
    );
  }

  const activeLangLabel =
    lesson.languages.find((l) => l.code === activeLang)?.label ?? 'ngôn ngữ đã chọn';

  const handleSelectLanguage = (code: string) => {
    setActiveLang(code);
    const lang = lesson.languages.find((l) => l.code === code);
    // Ngôn ngữ chưa có AudioTrack → mở panel kích hoạt (UC18)
    setMode(lang?.available ? 'watching' : 'need-activation');
  };

  const handleActivate = () => {
    // Giai đoạn 5: POST /api/v1/lessons/{id}/dubbing → trả jobId → subscribe WebSocket.
    // Nếu bị dedupe (BR-DUB-05), backend trả jobId của job đang chạy chứ không tạo mới.
    setMode('processing');
    setSteps(MOCK_PIPELINE_STEPS);
  };

  const doneCount = steps.filter((s) => s.done).length;
  const percent = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <div className="min-h-dvh bg-surface">
      <div className="shell py-8">
        {/* Breadcrumb */}
        <nav aria-label="Đường dẫn" className="mb-4 text-[13px] text-ink-faint">
          <Link href={`/courses/${lesson.courseSlug}`} className="font-semibold no-underline">
            {lesson.courseTitle}
          </Link>
          <span> / </span>
          <span className="text-ink-muted">{lesson.lessonTitle}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── Cột phát bài giảng ── */}
          <div className="flex min-w-0 flex-col gap-4">
            {lesson.languages.length > 0 && (
              <LanguageSwitcher
                languages={lesson.languages}
                activeCode={activeLang}
                sourceLanguage={lesson.sourceLanguage}
                onSelect={handleSelectLanguage}
              />
            )}

            {/* Khung phát: một trong ba trạng thái */}
            {mode === 'watching' && (
              <DualPlayer
                videoSource={lesson.videoSource}
                videoUrl={lesson.videoUrl}
                youtubeId={lesson.youtubeId}
                track={lesson.activeTrack}
              />
            )}

            {mode === 'need-activation' && (
              <div className="overflow-hidden rounded-card bg-ink">
                <DubbingActivatePanel
                  languageLabel={activeLangLabel}
                  onActivate={handleActivate}
                  onWatchOriginal={() => setMode('watching')}
                />
              </div>
            )}

            {mode === 'processing' && (
              <div className="overflow-hidden rounded-card bg-ink">
                <PipelineProgress
                  steps={steps}
                  percent={percent}
                  onWatchOriginal={() => setMode('watching')}
                />
              </div>
            )}

            <h1 className="font-display text-xl font-bold text-ink">{lesson.lessonTitle}</h1>

            {/* Tab: Giai đoạn 7–8 sẽ nối Ghi chú, Học liệu, Socratic Tutor */}
            <div className="card p-5">
              <p className="text-sm text-ink-muted">
                Khu vực Ghi chú · Học liệu AI · Socratic Tutor sẽ được nối ở Giai đoạn 7 và 8.
              </p>
            </div>
          </div>

          {/* ── Cột danh sách bài học ── */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="card p-5">
              <h2 className="mb-3 font-display text-sm font-bold text-ink">Trong khoá học này</h2>
              <p className="text-sm text-ink-muted">
                Danh sách chương/bài và tiến độ học tập sẽ nối ở Giai đoạn 6 (UC21, UC22).
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
