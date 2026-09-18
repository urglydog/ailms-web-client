'use client';

import { useQueryClient, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { toast } from 'sonner';
import { CourseOverviewTab } from '@/components/course/CourseOverviewTab';
import { CourseGradebookTab } from '@/components/course/CourseGradebookTab';
import { CourseResourcesTab } from '@/components/course/CourseResourcesTab';
import { ReviewsSection } from '@/components/course/ReviewsSection';
import { MaterialManager } from '@/components/materials/MaterialManager';
import { DualPlayer, type DualPlayerHandle } from '@/components/player/DualPlayer';
import { DubbingActivatePanel } from '@/components/player/DubbingActivatePanel';
import { LanguageDropdown } from '@/components/player/LanguageDropdown';
import { LessonSidebar } from '@/components/player/LessonSidebar';
import { materialsApi } from '@/lib/api/materials';
import { PipelineProgress } from '@/components/player/PipelineProgress';
import { TranscriptPanel } from '@/components/player/TranscriptPanel';
import { TutorEmbedded } from '@/components/tutor/TutorEmbedded';
import { useActivateDubbing, useCancelDubbing } from '@/hooks/useDubbing';
import { useDubbingSocket } from '@/hooks/useDubbingSocket';
import { useEnrolledLessonPlayer } from '@/hooks/useEnrolledLessonPlayer';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLessonPlayer } from '@/hooks/usePublicCourses';
import { useVoiceOptions } from '@/hooks/useVoiceOptions';
import { api, ApiError } from '@/lib/api/client';
import { lessonPlayerApi } from '@/lib/api/lessonPlayer';
import { LiveChatPanel } from '@/components/community/LiveChatPanel';
import { useSetLearnTitle } from '@/components/layout/LearnTitleContext';
import { decodeAccessToken, getAccessToken } from '@/lib/auth/token';
import type { PipelineStep } from '@/types/domain';

type MainTab = 'overview' | 'qna' | 'reviews' | 'materials' | 'gradebook' | 'resources';
type SidebarTab = 'content' | 'tutor';

const MAIN_TABS: Array<{ key: MainTab; label: string }> = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'qna', label: 'Hỏi đáp' },
  { key: 'materials', label: 'Học liệu' },
  { key: 'gradebook', label: 'Bảng điểm' },
  { key: 'resources', label: 'Tài nguyên' },
  { key: 'reviews', label: 'Đánh giá' },
];

/** Thông báo khoá thống nhất cho 3 mục cần sở hữu khoá học (Hỏi đáp/Học liệu/Gia sư AI) — thay
 * cho khối CTA rời trước đây, giờ mỗi mục tự hiện đúng ngay trong tab/khu vực của nó. */
function LockedFeatureNotice({ feature, courseSlug }: { feature: string; courseSlug: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="text-2xl">🔒</div>
      <p className="text-sm text-ink-muted">
        {feature} chỉ dành cho học viên đã sở hữu khóa học.
      </p>
      <Link
        href={`/courses/${courseSlug}`}
        className="mt-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark no-underline"
      >
        Mua khóa học ngay
      </Link>
    </div>
  );
}

/** Nhãn hiển thị cho từng `stage` do AI Worker publish — xem `app/redis_client.py::publish_progress`. */
const STAGE_LABELS: Record<string, string> = {
  ASR: 'Đang bóc tách lời thoại (STT)',
  TRANSLATE: 'Đang dịch nội dung',
  TTS: 'Đang tổng hợp giọng đọc',
  UPLOADING: 'Đang lưu file đoạn này',
};

const PREPARE_STEP: PipelineStep = {
  key: 'prepare',
  label: 'Đang tải & phân tích audio nguồn',
  done: false,
  active: true,
};

const FINALIZE_STEP: PipelineStep = {
  key: 'finalize',
  label: 'Đang ghép & lưu file hoàn chỉnh',
  done: false,
  active: false,
};

/** Dựng lại danh sách bước đầy đủ (2 bước cấp-job bọc quanh N bước/chunk) khi lần đầu biết
 * `totalChunks` thật — trước đó chỉ có `PREPARE_STEP` làm placeholder (xem `PREPARING` bên dưới).
 */
function buildChunkSteps(totalChunks: number): PipelineStep[] {
  return [
    { ...PREPARE_STEP, done: true, active: false },
    ...Array.from({ length: totalChunks }, (_, i) => ({
      key: `chunk-${i}`,
      label: `Đoạn ${i + 1}/${totalChunks} — đang chờ xử lý`,
      done: false,
      active: false,
    })),
    { ...FINALIZE_STEP },
  ];
}

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

function LearnPageContent() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const lessonId = Number(params.lessonId);
  const hasToken = !!getAccessToken();
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id;

  const enrolled = useEnrolledLessonPlayer(lessonId);
  const preview = useLessonPlayer(lessonId, { enabled: !hasToken });
  const lesson = hasToken ? enrolled.data : preview.data;
  const isLoading = hasToken ? enrolled.isLoading : preview.isLoading;
  const error = hasToken ? enrolled.error : preview.error;
  // Đang chuyển sang bài khác nhưng vẫn còn hiển thị dữ liệu bài CŨ (placeholder) — dùng để hiện
  // 1 chỉ báo nhỏ trên khung video, không che mất cả trang như `isLoading`.
  const isSwitchingLesson = (hasToken ? enrolled.isFetching : preview.isFetching) && !isLoading;
  useSetLearnTitle(lesson?.courseTitle);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dualPlayerRef = useRef<DualPlayerHandle>(null);
  const queryClient = useQueryClient();
  const sessionIdRef = useRef<string | null>(null);
  const [streamConflict, setStreamConflict] = useState(false);

  useEffect(() => {
    // Chỉ tạo sessionId duy nhất cho mỗi phiên mount trang (hoặc mỗi bài học mới)
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID();
    }
  }, [lessonId]);

  const { data: officialMaterials } = useQuery({
    queryKey: ['official-materials', lesson?.courseId],
    queryFn: () => materialsApi.getInstructorMaterials(lesson!.courseId),
    enabled: !!lesson?.courseId,
    staleTime: 0, // Cập nhật ngay khi tab mount (Test 2.1)
  });
  const currentLessonMaterialCount = officialMaterials?.filter(m => m.assignments?.some(a => a.lessonId === lessonId)).length || 0;

  // Dọn dẹp Draft rác của các Quiz đã bị xóa mềm (Graceful In-flight cleanup)
  useEffect(() => {
    if (lesson?.courseId && userId) {
      api.get<{quizzes: {quizId: number, isDeleted: boolean}[]}>(`/api/v1/student/courses/${lesson.courseId}/gradebook`, { token: getAccessToken() ?? undefined }).then(gradebook => {
        const deletedQuizIds = new Set(gradebook.quizzes.filter(q => q.isDeleted).map(q => q.quizId.toString()));
        const keysToRemove: string[] = [];
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith(`exam_draft_${userId}_`) || key.startsWith(`quiz_draft_${userId}_`))) {
              const qId = key.split('_').pop();
              if (qId && deletedQuizIds.has(qId)) {
                keysToRemove.push(key);
              }
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch {}
      }).catch(() => {});
    }
  }, [lesson?.courseId, userId]);

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
  // UC20 mở rộng — giọng đọc đang chọn cho `activeLang` (null = chưa có ngôn ngữ nào chọn,
  // hoặc ngôn ngữ đó chỉ có 1 giọng nên không cần chọn). Reset mỗi khi đổi ngôn ngữ.
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const { data: voiceOptions } = useVoiceOptions();
  const [mode, setMode] = useState<PlayerMode>('watching');
  const [steps, setSteps] = useState<PipelineStep[]>([PREPARE_STEP]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  // Giao diện tham khảo Udemy (06/09/2026) — tab dưới video (Tổng quan/Hỏi đáp/Đánh giá/Học liệu)
  // và tab trong sidebar (Nội dung khóa học/AI Gia sư), thay cho panel Gia sư AI trượt nổi + nút
  // "Mở Quản lý Học liệu AI" điều hướng sang trang riêng trước đây.
  const tabParam = searchParams.get('tab') as MainTab | null;
  const mainTab: MainTab = tabParam && MAIN_TABS.some(t => t.key === tabParam) ? tabParam : 'overview';

  const setMainTab = (tab: MainTab) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('tab', tab);
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  };

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('content');
  // Ẩn/hiện phụ đề gốc & phụ đề đã dịch — mặc định TẮT, học viên chủ động tích chọn.
  const [showOriginalSub, setShowOriginalSub] = useState(false);
  const [showTranslatedSub, setShowTranslatedSub] = useState(false);
  // Giao diện tham khảo Udemy (06/09/2026) — nút Transcript trên thanh điều khiển video BẬT thì
  // tab "content" của sidebar hiện bản ghi lời thoại THAY CHO danh sách bài học (không phải 1 tab
  // riêng) — xem `TranscriptPanel.tsx`. `playerCurrentSec` chỉ được `DualPlayer` đẩy lên khi
  // `showTranscript` đang bật (tránh re-render trang liên tục lúc panel ẩn, mặc định).
  const [showTranscript, setShowTranscript] = useState(false);
  const [playerCurrentSec, setPlayerCurrentSec] = useState(0);

  // Chuyển bài học (`lessonId` đổi) giờ KHÔNG unmount lại component này nữa (nhờ
  // `placeholderData: keepPreviousData` ở 2 hook trên — xem đó để biết lý do), nên các state
  // RIÊNG CỦA TỪNG BÀI phải tự reset thủ công ở đây, nếu không sẽ bị "rò" từ bài cũ sang bài mới
  // (vd đang xem tiếng Nhật ở bài A thì bài B tự nhảy vào `mode="processing"` do lẫn state cũ).
  // Không reset `sidebarTab`/`autoNextEnabled` — đây là tuỳ chọn của học viên cho cả khoá học,
  // không phải theo từng bài, nên phải giữ nguyên khi chuyển bài (giống Udemy).
  useEffect(() => {
    setMode('watching');
    setActiveLang(null);
    setSelectedVoiceName(null);
    setSteps([PREPARE_STEP]);
    setQuotaExceeded(false);
    setActivateError(null);
    setJobError(null);
    setShowTranscript(false);
    setShowOriginalSub(false);
    setShowTranslatedSub(false);
    setPlayerCurrentSec(0);
    setStreamConflict(false);
  }, [lessonId]);

  // Tự động chuyển sang bài tiếp theo khi phát hết bài hiện tại — nhớ lựa chọn của học viên giữa
  // các bài (localStorage), mặc định BẬT giống hành vi gốc của Udemy (nguồn tham khảo giao diện).
  const [autoNextEnabled, setAutoNextEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('lms:autoNextLesson') !== 'false';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('lms:autoNextLesson', String(autoNextEnabled));
    } catch {
      // Trình duyệt chặn localStorage (vd chế độ ẩn danh khắt khe) — bỏ qua, không phải chức năng cốt lõi.
    }
  }, [autoNextEnabled]);
  const activateDubbing = useActivateDubbing();
  const cancelDubbing = useCancelDubbing();

  // UC30 — mốc thời gian trong câu trả lời Gia sư AI (BR-TUTOR-02). `DualPlayer` che giấu 2 cơ
  // chế tua khác hẳn nhau (thẻ <video> cho UPLOAD, IFrame Player API cho YOUTUBE) sau 1
  // `seekTo()` chung qua `DualPlayerHandle` — trang này không cần biết đang phát nguồn nào.
  //
  // UC30 mở rộng (13/09/2026) — Gia sư AI giờ tìm kiếm xuyên suốt mọi bài trong khóa (không chỉ
  // bài đang mở), nên mốc thời gian trích dẫn có thể thuộc 1 bài KHÁC hẳn — `contextLessonId`
  // khác `lessonId` hiện tại thì điều hướng sang đúng bài đó, kèm `?seek=<giây>` trong URL để
  // trang mới TỰ tua tới đúng chỗ sau khi tải xong (xem effect `?seek=` bên dưới) — không còn bắt
  // học viên tự kéo tay tới mốc đã hiện sẵn trong câu trả lời như trước.
  const handleSeekToTimestamp = useCallback((sec: number, contextLessonId?: number | null) => {
    if (contextLessonId != null && contextLessonId !== lessonId) {
      router.push(`/learn/${contextLessonId}?seek=${Math.round(sec)}`);
      return;
    }
    dualPlayerRef.current?.seekTo(sec);
  }, [lessonId, router]);

  // UC30 mở rộng (13/09/2026) — xử lý `?seek=<giây>` do `handleSeekToTimestamp` ở TRANG NGUỒN gắn
  // vào URL lúc điều hướng sang bài này. `DualPlayer` có thể chưa sẵn sàng ngay lúc mount (video
  // chưa load xong metadata, hoặc IFrame YouTube chưa init) và `seekTo()` không báo lỗi khi gọi
  // lúc chưa sẵn sàng — không có tín hiệu "thất bại" rõ ràng để chờ đúng 1 lần, nên thử lại vài
  // lần trong ~2 giây thay vì gọi đúng 1 lần cho chắc.
  useEffect(() => {
    const seekParam = searchParams.get('seek');
    const sec = seekParam ? Number(seekParam) : NaN;
    if (isLoading || !lesson || !Number.isFinite(sec)) return;

    let attempts = 0;
    const intervalId = setInterval(() => {
      attempts += 1;
      dualPlayerRef.current?.seekTo(sec);
      if (attempts >= 5) clearInterval(intervalId);
    }, 400);

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('seek');
    router.replace(`${pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`, { scroll: false });

    return () => clearInterval(intervalId);
    // Chỉ cần chạy lại khi ĐỔI BÀI hoặc lúc tải bài xong, không phải mỗi lần
    // `searchParams`/`lesson`/`pathname`/`router` đổi tham chiếu (vd do `keepPreviousData` khi
    // chuyển bài — sẽ tua lặp lại không cần thiết).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, isLoading]);

  // UC20 — chỉ mở kết nối STOMP khi thật sự đang chờ pipeline chạy.
  const { lastEvent } = useDubbingSocket(mode === 'processing' ? lessonId : null);

  useEffect(() => {
    if (!lastEvent) return;

    if ('stage' in lastEvent) {
      // Sự kiện CHI TIẾT trong lúc 1 chunk đang xử lý dở — chỉ đổi NHÃN bước đang active,
      // không đụng tới done/failed (những cờ đó chỉ sự kiện cấp-chunk COMPLETED/FAILED mới
      // được quyết định, xem nhánh 'chunkIndex' bên dưới).
      const { stage, chunkIndex, totalChunks } = lastEvent;

      if (stage === 'PREPARING') {
        setSteps([PREPARE_STEP]);
        return;
      }

      if (stage === 'FINALIZING') {
        setSteps((prev) =>
          prev.map((step) =>
            step.key === 'finalize' ? { ...step, active: true } : { ...step, done: true, active: false },
          ),
        );
        return;
      }

      // ASR/TRANSLATE/TTS/UPLOADING — luôn kèm chunkIndex/totalChunks thật từ ai-worker.
      setSteps((prev) => {
        const size = totalChunks ?? 0;
        const chunkCount = prev.filter((s) => s.key.startsWith('chunk-')).length;
        const base = chunkCount === size ? prev : buildChunkSteps(size);
        return base.map((step) => {
          if (step.key === `chunk-${chunkIndex}`) {
            return {
              ...step,
              label: `Đoạn ${(chunkIndex ?? 0) + 1}/${size} — ${STAGE_LABELS[stage] ?? stage}`,
              active: true,
            };
          }
          if (step.key === 'prepare') {
            return { ...step, done: true, active: false };
          }
          return step;
        });
      });
      return;
    }

    if ('chunkIndex' in lastEvent) {
      // Sự kiện CẤP-CHUNK — chunk vừa xong hẳn (thành công/thất bại), khác các sự kiện
      // "stage" ở trên (chunk đang xử lý dở).
      setSteps((prev) => {
        const size = lastEvent.totalChunks;
        const chunkCount = prev.filter((s) => s.key.startsWith('chunk-')).length;
        const base = chunkCount === size ? prev : buildChunkSteps(size);
        return base.map((step) => {
          if (step.key === `chunk-${lastEvent.chunkIndex}`) {
            return {
              ...step,
              label: `Đoạn ${lastEvent.chunkIndex + 1}/${size}`,
              done: lastEvent.status === 'COMPLETED',
              failed: lastEvent.status === 'FAILED',
              active: false,
            };
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
      return;
    }

    // Sự kiện CẤP-JOB — đây mới là lúc chắc chắn xong (đã concat + upload B2), không phải
    // chunk cuối "COMPLETED" (BR-CHUNK-05: còn phải ghép final.mp3 sau đó).
    if (lastEvent.status === 'COMPLETED') {
      void refetchLesson();
      setMode('watching');
    } else if (lastEvent.status === 'CANCELLED') {
      // UC20 — do CHÍNH học viên này (hoặc ai đó đang theo dõi cùng job) chủ động huỷ,
      // không phải lỗi — không hiện `jobError` (khối màu đỏ) cho trường hợp này.
      toast.info('Đã huỷ lồng tiếng theo yêu cầu.');
      setMode('watching');
    } else {
      setJobError(
        lastEvent.status === 'SKIPPED'
          ? 'Bài học này không có lời thoại để lồng tiếng.'
          : 'Lồng tiếng thất bại, vui lòng thử lại sau.',
      );
    }
  }, [lastEvent, refetchLesson]);

  const handleCancelDubbing = () => {
    if (!activeLang) return;
    cancelDubbing.mutate(
      { lessonId, targetLanguage: activeLang },
      {
        // Không cần tự setMode('watching') ở đây — sự kiện WS "CANCELLED" job-level (publish
        // NGAY từ be/ khi huỷ, xem DubbingRequestService.cancelDubbing) sẽ tự làm việc đó qua
        // nhánh xử lý lastEvent ở trên, tránh 2 nơi cùng quyết định 1 việc.
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Không huỷ được lồng tiếng, vui lòng thử lại.');
        },
      },
    );
  };

  // UC21 — ghi nhận tiến độ theo thời gian phát THẬT của thẻ <video> (play/pause/seeking ở cấp
  // hook, không quan tâm `mode`) — video giờ mount cố định và có thể đang phát audio gốc ngay cả
  // lúc `mode` khác 'watching' (đang chọn ngôn ngữ/đang chờ lồng tiếng), đó vẫn là thời gian xem
  // thật theo BR-PROGRESS-01 nên không có lý do loại trừ theo `mode` nữa. Chỉ cần đã đăng nhập và
  // biết chắc nguồn là UPLOAD (YouTube chưa có <video> để gắn `videoRef`, để dành việc sau).
  useLessonProgress(videoRef, lessonId, {
    initialPositionSec: lesson?.lastPositionSec ?? 0,
    enabled: hasToken && lesson?.videoSource === 'UPLOAD',
  });

  // Gửi heartbeat kiểm tra conflict (Task 10)
  useEffect(() => {
    if (!hasToken || !lessonId || streamConflict) return;
    
    // Gửi lần đầu khi vào bài
    const sendPing = async (force: boolean) => {
      if (!sessionIdRef.current) return;
      try {
        await lessonPlayerApi.sendHeartbeat(lessonId, sessionIdRef.current, navigator.userAgent, force);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setStreamConflict(true);
          dualPlayerRef.current?.pause();
        }
      }
    };

    void sendPing(true);

    const intervalId = setInterval(() => {
      void sendPing(false);
    }, 20000);

    return () => clearInterval(intervalId);
  }, [hasToken, lessonId, streamConflict]);

  const handleResumeStream = async () => {
    if (!sessionIdRef.current) return;
    try {
      await lessonPlayerApi.sendHeartbeat(lessonId, sessionIdRef.current, navigator.userAgent, true);
      setStreamConflict(false);
      dualPlayerRef.current?.play();
    } catch {
      toast.error('Không thể giành lại quyền phát.');
    }
  };

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
  const voicesForActiveLang = voiceOptions?.filter((v) => v.language === activeLang) ?? [];

  // Giao diện tham khảo Udemy (06/09/2026) — tự động chuyển bài. Không có field `nextLessonId`
  // riêng từ BE, tự làm phẳng `chapters[].lessons[]` (đã sắp theo `displayOrder`) rồi tìm bài NGAY
  // SAU bài hiện tại; bài cuối cùng của khoá học thì không có bài tiếp theo, giữ nguyên.
  const flatLessons = lesson.chapters.flatMap((c) => c.lessons);
  const currentLessonIndex = flatLessons.findIndex((l) => l.lessonId === lesson.lessonId);
  const nextLessonId =
    currentLessonIndex >= 0 && currentLessonIndex < flatLessons.length - 1
      ? (flatLessons[currentLessonIndex + 1]?.lessonId ?? null)
      : null;
  // UC30 mở rộng (13/09/2026) — tên bài để hiện kèm trong nút mốc thời gian khi Gia sư AI trích
  // dẫn 1 bài KHÁC bài đang mở (xem `MarkdownRenderer`/`TutorEmbedded`).
  const lessonTitleById = Object.fromEntries(flatLessons.map((l) => [l.lessonId, l.lessonTitle]));

  const handleVideoEnded = () => {
    if (autoNextEnabled && nextLessonId) {
      toast.info('Đang chuyển sang bài học tiếp theo…');
      router.push(`/learn/${nextLessonId}`);
    }
  };

  const handleToggleTranscript = () => {
    setShowTranscript((prev) => {
      const next = !prev;
      // Đang ở tab AI Gia sư mà bật Transcript lên -> chuyển ngay về tab content để thấy liền,
      // khỏi phải tự bấm thêm 1 lần (giống Udemy tự mở lại panel Transcript khi bấm nút này).
      if (next) setSidebarTab('content');
      return next;
    });
  };

  const handleSelectLanguage = (code: string) => {
    setActiveLang(code);
    const lang = lesson.languages.find((l) => l.code === code);
    // Ngôn ngữ chưa có AudioTrack → mở panel kích hoạt (UC18)
    setMode(lang?.available ? 'watching' : 'need-activation');
    // UC20 mở rộng — mặc định chọn sẵn giọng isDefault của ngôn ngữ MỚI (nếu có), học viên
    // đổi lại được trong `VoicePicker`; không tự ý giữ giọng của ngôn ngữ cũ.
    const defaultVoice = voiceOptions?.find((v) => v.language === code && v.isDefault);
    setSelectedVoiceName(defaultVoice?.voiceName ?? null);
  };

  const handleActivate = () => {
    if (!activeLang) return;
    setQuotaExceeded(false);
    setActivateError(null);
    setJobError(null);

    activateDubbing.mutate(
      { lessonId, targetLanguage: activeLang, voiceName: selectedVoiceName },
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
          setSteps([PREPARE_STEP]);
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
      {/* Trang học bài dùng khung riêng RỘNG HƠN `.shell` (max-w-shell = 1280px, dùng chung toàn
          site — không đụng vào, tránh ảnh hưởng mọi trang khác) — Udemy để trang xem bài học
          tràn gần hết chiều ngang trình duyệt thay vì bó trong khung nội dung thường, video vì
          vậy hiển thị to hơn hẳn thay vì còn dư 2 khoảng trống 2 bên. */}
      <div className="mx-auto w-full max-w-[1800px] px-4 py-8 md:px-8">
        {/* Giao diện tham khảo Udemy — tên khóa học đã chuyển lên thanh header dùng chung
            (`app/(learn)/layout.tsx`), sidebar "Nội dung khóa học" bên dưới đã tự nêu rõ đang ở
            bài nào (đánh dấu active) nên không cần lặp lại tên bài học ở đây nữa.
            Video lớn nhất, sidebar phải hẹp có tab, tab dưới video
            thay cho các khối CTA/card rời trước đây. */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ── Cột phát bài giảng ── */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* Video luôn hiển thị và phát được, bất kể mode — xem docblock đầu file.
                Bọc thêm 1 lớp `relative` để hiện chỉ báo nhỏ "Đang chuyển bài học" đè lên góc
                video trong lúc bài mới đang tải nền (`isSwitchingLesson`) — video/sidebar/tab
                vẫn giữ nguyên bài CŨ trên màn hình, không biến mất như trước. */}
            <div className="relative">
              <DualPlayer
                ref={dualPlayerRef}
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
                onToggleShowOriginalSub={() => setShowOriginalSub((v) => !v)}
                onToggleShowTranslatedSub={() => setShowTranslatedSub((v) => !v)}
                onEnded={handleVideoEnded}
                onTimeUpdate={setPlayerCurrentSec}
                showTranscript={showTranscript}
                onToggleTranscript={handleToggleTranscript}
                autoNextEnabled={autoNextEnabled}
                onToggleAutoNext={() => setAutoNextEnabled((v) => !v)}
              />
              {isSwitchingLesson && (
                <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 text-[12px] font-medium text-white">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                  Đang chuyển bài học...
                </div>
              )}
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
                  voices={voicesForActiveLang}
                  selectedVoice={selectedVoiceName}
                  onSelectVoice={setSelectedVoiceName}
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
                  onCancel={handleCancelDubbing}
                  isCancelling={cancelDubbing.isPending}
                />
                {jobError && (
                  <p className="mt-3 border-t border-line-soft pt-3 text-sm text-red-600">{jobError}</p>
                )}
              </div>
            )}

            <h1 className="font-display text-xl font-bold text-ink">{lesson.lessonTitle}</h1>

            {/* Tổng quan / Hỏi đáp / Đánh giá / Học liệu — thay cho panel Gia sư AI trượt nổi +
                nút "Mở Quản lý Học liệu AI" điều hướng trang riêng trước đây. */}
            <div className="card overflow-hidden p-0">
              <div className="flex overflow-x-auto border-b border-line">
                {MAIN_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMainTab(tab.key)}
                    className={`shrink-0 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                      mainTab === tab.key
                        ? 'border-accent text-accent'
                        : 'border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                    {tab.key === 'materials' && currentLessonMaterialCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {currentLessonMaterialCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {mainTab === 'overview' && <CourseOverviewTab courseSlug={lesson.courseSlug} />}

                {mainTab === 'qna' && (
                  lesson.enrolled ? (
                    <LiveChatPanel
                      lessonId={lesson.lessonId}
                      userName={hasToken ? (decodeAccessToken()?.sub ?? 'Học viên') : 'Học viên'}
                    />
                  ) : (
                    <LockedFeatureNotice feature="Hỏi đáp bài học" courseSlug={lesson.courseSlug} />
                  )
                )}

                {mainTab === 'reviews' && <ReviewsSection courseId={lesson.courseId} />}
                {mainTab === 'gradebook' && <CourseGradebookTab courseId={lesson.courseId} />}
                {mainTab === 'resources' && <CourseResourcesTab courseId={lesson.courseId} />}
                {mainTab === 'materials' && (
                  lesson.enrolled ? (
                    <MaterialManager courseId={lesson.courseId} lessonId={lesson.lessonId} />
                  ) : (
                    <LockedFeatureNotice feature="Học liệu" courseSlug={lesson.courseSlug} />
                  )
                )}
              </div>
            </div>
          </div>

          {/* ── Cột sidebar: Nội dung khóa học / AI Gia sư ── */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="card flex h-[calc(100vh-140px)] min-h-[520px] flex-col overflow-hidden p-0">
              <div className="flex shrink-0 border-b border-line">
                <button
                  type="button"
                  onClick={() => setSidebarTab('content')}
                  className={`flex-1 border-b-2 px-3 py-3 text-[13px] font-semibold transition-colors ${
                    sidebarTab === 'content'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {showTranscript ? 'Bản ghi lời thoại' : 'Nội dung khóa học'}
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('tutor')}
                  className={`flex-1 border-b-2 px-3 py-3 text-[13px] font-semibold transition-colors ${
                    sidebarTab === 'tutor'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  AI Gia sư
                </button>
              </div>

              {sidebarTab === 'content' ? (
                showTranscript ? (
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <TranscriptPanel
                      originalSubtitles={lesson.originalSubtitles}
                      translatedSubtitles={lesson.languages.find((l) => l.code === activeLang)?.subtitles ?? []}
                      currentSec={playerCurrentSec}
                      onSeek={handleSeekToTimestamp}
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4">
                    {lesson.chapters.length > 0 ? (
                      <LessonSidebar chapters={lesson.chapters} currentLessonId={lesson.lessonId} officialMaterials={officialMaterials || []} />
                    ) : (
                      <p className="text-sm text-ink-muted">
                        Đăng nhập để xem toàn bộ chương trình học và theo dõi tiến độ của khoá này.
                      </p>
                    )}
                  </div>
                )
              ) : lesson.enrolled ? (
                <TutorEmbedded
                  courseId={lesson.courseId}
                  lessonId={lesson.lessonId}
                  onSeek={handleSeekToTimestamp}
                  lessonTitleById={lessonTitleById}
                />
              ) : (
                <div className="flex-1">
                  <LockedFeatureNotice feature="Gia sư AI" courseSlug={lesson.courseSlug} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {streamConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-card bg-white p-6 shadow-card text-center animate-in zoom-in-95">
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="mb-2 font-display text-lg font-bold text-ink">Đã phát hiện thiết bị khác</h2>
            <p className="mb-6 text-sm text-ink-muted">
              Video đã tạm dừng vì tài khoản của bạn đang phát video trên một thiết bị khác.
            </p>
            <button
              onClick={handleResumeStream}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-dark transition-colors"
            >
              Tiếp tục phát tại đây
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-sm text-ink-muted">Đang tải giao diện...</div>}>
      <LearnPageContent />
    </Suspense>
  );
}
