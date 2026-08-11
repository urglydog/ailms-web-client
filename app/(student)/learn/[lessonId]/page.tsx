'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DualPlayer } from '@/components/player/DualPlayer';
import { DubbingActivatePanel } from '@/components/player/DubbingActivatePanel';
import { LanguageSwitcher } from '@/components/player/LanguageSwitcher';
import { PipelineProgress } from '@/components/player/PipelineProgress';
import { useActivateDubbing } from '@/hooks/useDubbing';
import { useDubbingSocket } from '@/hooks/useDubbingSocket';
import { useEnrolledLessonPlayer } from '@/hooks/useEnrolledLessonPlayer';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useLessonPlayer } from '@/hooks/usePublicCourses';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { MOCK_PIPELINE_STEPS } from '@/lib/mock/courses';
import type { PipelineStep } from '@/types/domain';

/**
 * Trang học bài — dịch từ nhánh `isPlayer` của design.
 *
 * Gộp 5 use case vào một màn:
 *  - UC11 Học thử Preview (khách ẩn danh, chỉ bài Preview — `useLessonPlayer`)
 *  - UC16/17 Dual Player + chọn ngôn ngữ cho học viên ĐÃ đăng nhập — `useEnrolledLessonPlayer`
 *  - UC18 kích hoạt lồng tiếng khi ngôn ngữ chưa có → panel `DubbingActivatePanel`
 *  - UC20 theo dõi tiến độ realtime → panel `PipelineProgress`
 *
 * Gọi CẢ HAI hook, mỗi hook tự `enabled` theo có/không JWT (loại trừ nhau — xem 2 dòng
 * `useEnrolledLessonPlayer`/`useLessonPlayer` bên dưới) rồi dùng dữ liệu của hook đang chạy: giữ
 * nguyên luồng khách xem thử dựng từ Giai đoạn 4, không phá khi thêm luồng đã đăng nhập.
 *
 * `videoRef`/`audioRef` được trang này sở hữu (không phải `DualPlayer`) để Giai đoạn 6 phần
 * F6.2 (`useLessonProgress`) dùng chung, đo đúng thời gian phát thật của video đang hiển thị.
 */

type PlayerMode = 'watching' | 'need-activation' | 'processing';

export default function LearnPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);
  const hasToken = !!getAccessToken();

  const enrolled = useEnrolledLessonPlayer(lessonId);
  const preview = useLessonPlayer(lessonId, { enabled: !hasToken });
  const lesson = hasToken ? enrolled.data : preview.data;
  const isLoading = hasToken ? enrolled.isLoading : preview.isLoading;
  const error = hasToken ? enrolled.error : preview.error;

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();
  // `languages[].track` chỉ mới sau khi gọi lại API — cần refetch mỗi khi có track mới sẵn sàng
  // (BR-DUB-04 trả AVAILABLE ngay, hoặc job vừa COMPLETED), nếu không `available`/`track` trong
  // cache vẫn cũ dù backend đã có audio.
  const refetchLesson = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: hasToken ? ['lessons', lessonId, 'player', 'enrolled'] : ['lessons', lessonId, 'player'],
      }),
    [queryClient, hasToken, lessonId],
  );

  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [mode, setMode] = useState<PlayerMode>('watching');
  const [steps, setSteps] = useState<PipelineStep[]>(MOCK_PIPELINE_STEPS);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const activateDubbing = useActivateDubbing();

  // UC20 — chỉ mở kết nối STOMP khi thật sự đang chờ pipeline chạy.
  const { lastEvent } = useDubbingSocket(mode === 'processing' ? lessonId : null);

  useEffect(() => {
    if (!lastEvent) return;

    if ('chunkIndex' in lastEvent) {
      // Sự kiện CẤP-CHUNK — dựng/lấp đầy danh sách chunk theo totalChunks thật.
      setSteps((prev) => {
        const size = lastEvent.totalChunks;
        const base: PipelineStep[] =
          prev.length === size
            ? prev
            : Array.from({ length: size }, (_, i) => ({
                key: `chunk-${i}`,
                label: `Đoạn ${i + 1}/${size}`,
                done: false,
                active: i === 0,
              }));
        return base.map((step, i) => {
          if (i === lastEvent.chunkIndex) {
            return {
              ...step,
              done: lastEvent.status === 'COMPLETED',
              failed: lastEvent.status === 'FAILED',
              active: false,
            };
          }
          if (i === lastEvent.chunkIndex + 1) {
            return { ...step, active: true };
          }
          return step;
        });
      });
    } else if (lastEvent.status === 'COMPLETED') {
      // Sự kiện CẤP-JOB — đây mới là lúc chắc chắn xong (đã concat + upload B2), không phải
      // chunk cuối "COMPLETED" (BR-CHUNK-05: còn phải ghép final.mp3 sau đó).
      void refetchLesson();
      setMode('watching');
    } else {
      setJobError(
        lastEvent.status === 'SKIPPED'
          ? 'Bài học này không có lời thoại để lồng tiếng.'
          : 'Lồng tiếng thất bại, vui lòng thử lại sau.',
      );
    }
  }, [lastEvent, refetchLesson]);

  // UC21 — chỉ ghi nhận tiến độ khi đã đăng nhập, đang thật sự xem (không phải lúc kích hoạt
  // lồng tiếng), và biết chắc video là nguồn UPLOAD (YouTube chưa có <video> để gắn `videoRef`,
  // theo dõi tiến độ nguồn YouTube để dành việc sau).
  useLessonProgress(videoRef, lessonId, {
    initialPositionSec: lesson?.lastPositionSec ?? 0,
    enabled: hasToken && mode === 'watching' && lesson?.videoSource === 'UPLOAD',
  });

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
    if (!activeLang) return;
    setQuotaExceeded(false);
    setActivateError(null);
    setJobError(null);

    activateDubbing.mutate(
      { lessonId, targetLanguage: activeLang },
      {
        onSuccess: (result) => {
          if (result.status === 'AVAILABLE') {
            // BR-DUB-04: đã có audioUrl sẵn — refetch để `languages[].track` có ngay, phát luôn.
            void refetchLesson();
            setMode('watching');
            return;
          }
          // CREATED hoặc PROCESSING (dedupe BR-DUB-05) — cả 2 trường hợp chỉ cần subscribe
          // đúng `/topic/dubbing/{lessonId}`; học viên thứ 2 chọn cùng ngôn ngữ trong lúc job
          // đang chạy sẽ nhận đúng luồng tiến độ của job đó, không tạo job mới.
          setMode('processing');
          setSteps(MOCK_PIPELINE_STEPS);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.isQuotaExceeded) {
            setQuotaExceeded(true);
            return;
          }
          setActivateError(err instanceof ApiError ? err.message : 'Không kích hoạt được lồng tiếng, vui lòng thử lại.');
        },
      },
    );
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
                track={lesson.languages.find((l) => l.code === activeLang)?.track ?? null}
                videoRef={videoRef}
                audioRef={audioRef}
              />
            )}

            {mode === 'need-activation' && (
              <div className="overflow-hidden rounded-card bg-ink">
                <DubbingActivatePanel
                  languageLabel={activeLangLabel}
                  onActivate={handleActivate}
                  onWatchOriginal={() => setMode('watching')}
                  quotaExceeded={quotaExceeded}
                  isSubmitting={activateDubbing.isPending}
                />
                {activateError && (
                  <p className="px-6 pb-6 text-center text-sm text-red-400">{activateError}</p>
                )}
              </div>
            )}

            {mode === 'processing' && (
              <div className="overflow-hidden rounded-card bg-ink">
                <PipelineProgress
                  steps={steps}
                  percent={percent}
                  onWatchOriginal={() => setMode('watching')}
                />
                {jobError && (
                  <p className="px-6 pb-6 text-center text-sm text-red-400">{jobError}</p>
                )}
              </div>
            )}

            <h1 className="font-display text-xl font-bold text-ink">{lesson.lessonTitle}</h1>

            {/* Tab: Giai đoạn 7–8 sẽ nối Ghi chú, Học liệu, Socratic Tutor */}
            <div className="card p-5">
              {lesson.isPreview ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="mb-2 text-3xl">🔒</div>
                  <h3 className="font-display font-semibold text-ink">Nội dung bị khóa</h3>
                  <p className="mt-1 text-sm text-ink-muted mb-4">
                    Tính năng Ghi chú, Học liệu AI và Socratic Tutor chỉ dành cho học viên đã sở hữu khóa học.
                  </p>
                  <Link
                    href={`/courses/${lesson.courseSlug}`}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark no-underline"
                  >
                    Mua khóa học ngay
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">
                  Khu vực Ghi chú · Học liệu AI · Socratic Tutor sẽ được nối ở Giai đoạn 7 và 8.
                </p>
              )}
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
