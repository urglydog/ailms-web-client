'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DualPlayer } from '@/components/player/DualPlayer';
import { DubbingActivatePanel } from '@/components/player/DubbingActivatePanel';
import { LanguageSwitcher } from '@/components/player/LanguageSwitcher';
import { PipelineProgress } from '@/components/player/PipelineProgress';
import { getPlayerLesson, MOCK_PIPELINE_STEPS } from '@/lib/mock/courses';
import type { PipelineStep } from '@/types/domain';

/**
 * Trang học bài — dịch từ nhánh `isPlayer` của design.
 *
 * Gộp 4 use case vào một màn:
 *  - UC16 Dual Player (video muted + audio lồng tiếng)
 *  - UC17 chọn ngôn ngữ đã có bản lồng tiếng
 *  - UC18 kích hoạt lồng tiếng khi ngôn ngữ chưa có → panel `DubbingActivatePanel`
 *  - UC20 theo dõi tiến độ realtime → panel `PipelineProgress`
 *
 * Giai đoạn 0 dùng state local để **xem được cả 3 trạng thái** của khung phát.
 * Giai đoạn 5–6 sẽ thay bằng: React Query lấy `AudioTrack`, mutation gọi UC18, và
 * WebSocket nhận tiến độ thay cho `MOCK_PIPELINE_STEPS`.
 */

type PlayerMode = 'watching' | 'need-activation' | 'processing';

export default function LearnPage() {
  const lesson = getPlayerLesson(101);

  const [activeLang, setActiveLang] = useState<string | null>('vi-VN');
  const [mode, setMode] = useState<PlayerMode>('watching');
  const [steps, setSteps] = useState<PipelineStep[]>(MOCK_PIPELINE_STEPS);

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
            <LanguageSwitcher
              languages={lesson.languages}
              activeCode={activeLang}
              sourceLanguage={lesson.sourceLanguage}
              onSelect={handleSelectLanguage}
            />

            {/* Khung phát: một trong ba trạng thái */}
            {mode === 'watching' && (
              <DualPlayer videoUrl={lesson.videoUrl} track={lesson.activeTrack} />
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
