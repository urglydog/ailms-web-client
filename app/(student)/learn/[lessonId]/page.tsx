'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DualPlayer } from '@/components/player/DualPlayer';
import { DubbingActivatePanel } from '@/components/player/DubbingActivatePanel';
import { LanguageDropdown } from '@/components/player/LanguageDropdown';
import { LessonSidebar } from '@/components/player/LessonSidebar';
import { PipelineProgress } from '@/components/player/PipelineProgress';
import { TutorPanel } from '@/components/tutor/TutorPanel';
import { useActivateDubbing } from '@/hooks/useDubbing';
import { useDubbingSocket } from '@/hooks/useDubbingSocket';
import { useEnrolledLessonPlayer } from '@/hooks/useEnrolledLessonPlayer';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useLessonPlayer } from '@/hooks/usePublicCourses';
import { ApiError } from '@/lib/api/client';
import { LiveChatPanel } from '@/components/community/LiveChatPanel';
import { decodeAccessToken, getAccessToken } from '@/lib/auth/token';
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
 *
 * `<DualPlayer>` được mount CỐ ĐỊNH, không phụ thuộc `mode` — học viên luôn xem/nghe được (audio
 * gốc khi chưa chọn/chưa có bản lồng tiếng) kể cả lúc đang chọn ngôn ngữ hay đang chờ lồng tiếng
 * xử lý xong, vì có thể họ muốn xem tiếp trong lúc chờ thay vì nhìn màn hình chờ. `mode` giờ chỉ
 * quyết định 1 card trạng thái nhỏ hiển thị DƯỚI dropdown ngôn ngữ (không đè lên video).
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
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  // Ẩn/hiện phụ đề gốc & phụ đề đã dịch — mặc định TẮT, học viên chủ động tích chọn.
  const [showOriginalSub, setShowOriginalSub] = useState(false);
  const [showTranslatedSub, setShowTranslatedSub] = useState(false);
  const activateDubbing = useActivateDubbing();

  // UC30 — mốc thời gian trong câu trả lời Gia sư AI (BR-TUTOR-02). Nguồn YOUTUBE chưa
  // gắn `useYouTubeDualPlayerSync` vào trang này (để dành việc sau, xem docblock đầu
  // file) nên chỉ tua được cho nguồn UPLOAD ở F8.1 này.
  const handleSeekToTimestamp = useCallback(
    (sec: number) => {
      if (lesson?.videoSource === 'UPLOAD' && videoRef.current) {
        videoRef.current.currentTime = sec;
      } else {
        toast.info('Chưa hỗ trợ tua video YouTube theo mốc thời gian.');
      }
    },
    [lesson?.videoSource],
  );

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
      if (lastEvent.status === 'COMPLETED') {
        // BR-CHUNK-03 — mỗi chunk xong là một cơ hội để phát ngay (không chỉ chunk đầu):
        // refetch để `languages[].track.chunks` có file audio mới nhất, video đang mở sẵn
        // (mount cố định) sẽ tự động phát được ngay khi mốc thời gian chạm tới chunk đó.
        void refetchLesson();
      }
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

  // UC21 — ghi nhận tiến độ theo thời gian phát THẬT của thẻ <video> (play/pause/seeking ở cấp
  // hook, không quan tâm `mode`) — video giờ mount cố định và có thể đang phát audio gốc ngay cả
  // lúc `mode` khác 'watching' (đang chọn ngôn ngữ/đang chờ lồng tiếng), đó vẫn là thời gian xem
  // thật theo BR-PROGRESS-01 nên không có lý do loại trừ theo `mode` nữa. Chỉ cần đã đăng nhập và
  // biết chắc nguồn là UPLOAD (YouTube chưa có <video> để gắn `videoRef`, để dành việc sau).
  useLessonProgress(videoRef, lessonId, {
    initialPositionSec: lesson?.lastPositionSec ?? 0,
    enabled: hasToken && lesson?.videoSource === 'UPLOAD',
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

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* ── Cột phát bài giảng ── */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* Video luôn hiển thị và phát được, bất kể mode — xem docblock đầu file */}
            <DualPlayer
              videoSource={lesson.videoSource}
              videoUrl={lesson.videoUrl}
              youtubeId={lesson.youtubeId}
              track={lesson.languages.find((l) => l.code === activeLang)?.track ?? null}
              videoRef={videoRef}
              audioRef={audioRef}
              originalSubtitles={lesson.originalSubtitles}
              translatedSubtitles={lesson.languages.find((l) => l.code === activeLang)?.subtitles ?? []}
              showOriginalSub={showOriginalSub}
              showTranslatedSub={showTranslatedSub}
            />

            {/* Ẩn/hiện phụ đề — phụ đề dịch luôn khớp ngôn ngữ đang chọn ở dropdown bên dưới,
                không có dropdown ngôn ngữ riêng cho phụ đề. */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
              <label
                className={`flex items-center gap-1.5 ${lesson.originalSubtitles.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={showOriginalSub}
                  disabled={lesson.originalSubtitles.length === 0}
                  onChange={(e) => setShowOriginalSub(e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-accent"
                />
                Phụ đề gốc
                {lesson.originalSubtitles.length === 0 && ' (bài học chưa có phụ đề gốc)'}
              </label>
              {(() => {
                const translatedSubtitles = lesson.languages.find((l) => l.code === activeLang)?.subtitles ?? [];
                const disabled = translatedSubtitles.length === 0;
                return (
                  <label className={`flex items-center gap-1.5 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={showTranslatedSub}
                      disabled={disabled}
                      onChange={(e) => setShowTranslatedSub(e.target.checked)}
                      className="h-4 w-4 rounded border-line accent-accent"
                    />
                    Phụ đề đã dịch
                    {disabled && ' (ngôn ngữ đang chọn chưa lồng tiếng xong)'}
                  </label>
                );
              })()}
            </div>

            {lesson.languages.length > 0 && (
              <LanguageDropdown
                languages={lesson.languages}
                activeCode={activeLang}
                sourceLanguage={lesson.sourceLanguage}
                onSelect={handleSelectLanguage}
              />
            )}

            {mode === 'need-activation' && (
              <div className="card p-4">
                <DubbingActivatePanel
                  languageLabel={activeLangLabel}
                  onActivate={handleActivate}
                  onWatchOriginal={() => setMode('watching')}
                  quotaExceeded={quotaExceeded}
                  isSubmitting={activateDubbing.isPending}
                />
                {activateError && (
                  <p className="mt-3 border-t border-line-soft pt-3 text-sm text-red-600">{activateError}</p>
                )}
              </div>
            )}

            {mode === 'processing' && (
              <div className="card p-4">
                <PipelineProgress
                  steps={steps}
                  percent={percent}
                  onWatchOriginal={() => setMode('watching')}
                />
                {jobError && (
                  <p className="mt-3 border-t border-line-soft pt-3 text-sm text-red-600">{jobError}</p>
                )}
              </div>
            )}

            <h1 className="font-display text-xl font-bold text-ink">{lesson.lessonTitle}</h1>

            {/* Tab: Giai đoạn 7 sẽ nối Ghi chú, Học liệu AI — Socratic Tutor đã nối (F8.1) */}
            <div className="card p-5">
              {/* Khoá theo `enrolled` (đã sở hữu khoá học), KHÔNG theo `isPreview` — một bài học
                  thử vẫn xem được đầy đủ bởi học viên đã sở hữu khoá (BR-ENROLL-02/03). */}
              {!lesson.enrolled ? (
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
                <div className="flex flex-col items-start gap-3">
                  <Link
                    href={`/materials?courseId=${lesson.courseId}`}
                    className="rounded-full bg-surface-hover border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-line-soft transition-colors w-full text-center no-underline"
                  >
                    🧠 Mở Quản lý Học liệu AI
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsTutorOpen(true)}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark w-full"
                  >
                    💬 Hỏi Gia sư AI Socratic
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Cột danh sách bài học ── */}
          <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-6">
            <div className="card p-5">
              <h2 className="mb-3 font-display text-sm font-bold text-ink">Trong khoá học này</h2>
              {lesson.chapters.length > 0 ? (
                <LessonSidebar chapters={lesson.chapters} currentLessonId={lesson.lessonId} />
              ) : (
                <p className="text-sm text-ink-muted">
                  Đăng nhập để xem toàn bộ chương trình học và theo dõi tiến độ của khoá này.
                </p>
              )}
            </div>

            {/* Live Q&A Panel */}
            {lesson.enrolled && (
              <LiveChatPanel 
                lessonId={lesson.lessonId} 
                userName={hasToken ? (decodeAccessToken()?.sub ?? 'Học viên') : 'Học viên'} 
              />
            )}
          </aside>
        </div>
      </div>

      {lesson.enrolled && (
        <TutorPanel
          isOpen={isTutorOpen}
          onClose={() => setIsTutorOpen(false)}
          lessonId={lesson.lessonId}
          onSeek={handleSeekToTimestamp}
        />
      )}
    </div>
  );
}
