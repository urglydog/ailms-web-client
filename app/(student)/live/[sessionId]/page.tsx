'use client';

import { LiveKitRoom, RoomAudioRenderer, useDataChannel, useTracks, VideoTrack } from '@livekit/components-react';
import { RemoteTrackPublication, Track } from 'livekit-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LiveChatPanel } from '@/components/live/LiveChatPanel';
import { LiveLanguagePicker } from '@/components/live/LiveLanguagePicker';
import { RequireLoginModal } from '@/components/live/RequireLoginModal';
import { useLiveLanguageSelection, useLiveLanguageTracks } from '@/hooks/useLiveLanguageTrack';
import { useLiveOriginalSubtitle } from '@/hooks/useLiveOriginalSubtitle';
import { useLiveSessionView } from '@/hooks/useLiveView';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

const TRANSLATED_TRACK_PREFIX = 'translated-';
/** Trùng `_SUBTITLE_TOPIC` phía `ai-worker/app/live/{translation,transcription}_agent.py` — đổi 1
 * bên thì phải đổi cả 3. */
const SUBTITLE_TOPIC = 'lms.live-subtitle';
/** Không thấy phụ đề mới trong ngần này giây thì tự xoá — tránh treo mãi 1 câu cũ khi giảng viên
 * ngừng nói hẳn (vd hết giờ live, chuyển chủ đề im lặng suy nghĩ...). */
const SUBTITLE_STALE_MS = 12000;

/** F11.5 mở rộng — 2 dạng payload trên CÙNG 1 kênh, phân biệt bằng `kind`:
 * - `original`: "chạy chữ" theo `recognizing`, độc lập hoàn toàn với lồng tiếng. `sourceTrackId`
 *   (F11.7) phân biệt NGUỒN: `null` = luồng độc lập từ Transcription Agent (1 luồng/phiên, không
 *   theo ngôn ngữ — provider Azure LUÔN dùng luồng này); có giá trị = phát RA TỪ chính phiên dịch
 *   của track đó (chỉ provider Gemini, `GeminiTranslationProvider` — đồng bộ tuyệt đối với bản
 *   dịch CÙNG track vì cùng 1 phiên nhận diện).
 * - `translation`: từ Translation Agent (1 luồng/ngôn ngữ đang active) — cũng "chạy chữ" theo
 *   `recognizing` để chạy gần đồng bộ với phụ đề gốc, không đợi tới lúc audio dịch xong mới hiện. */
type SubtitlePayload =
  | { kind: 'original'; text: string; sourceTrackId: number | null }
  | { kind: 'translation'; targetLanguage: string; text: string };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** UC51 — xem buổi Live (Guest/Student/Instructor/Admin), phân quyền BR-LIVE-01 hoàn toàn ở BE
 * (`/api/v1/live-sessions/{id}/view`) — trang này chỉ hiển thị đúng theo những gì API trả về,
 * không tự đoán quyền ở FE. */
export default function LiveViewPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = Number(params.sessionId);
  const { data: session, isLoading, error } = useLiveSessionView(sessionId);

  if (isLoading) {
    return (
      <div className="shell py-10">
        <p className="text-sm text-ink-muted">Đang tải…</p>
      </div>
    );
  }

  if (error) {
    const isForbidden = error instanceof ApiError && error.isForbidden;
    return (
      <div className="shell py-10">
        <div className="card mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="text-3xl" aria-hidden>
            🔒
          </span>
          <h1 className="font-display text-lg font-bold text-ink">Không xem được buổi live này</h1>
          <p className="text-sm text-ink-muted">
            {isForbidden
              ? getAccessToken()
                ? 'Buổi live này chỉ dành cho học viên đã ghi danh khóa học.'
                : 'Buổi live này chỉ dành cho học viên đã ghi danh khóa học — đăng nhập rồi thử lại nếu bạn đã ghi danh.'
              : error instanceof ApiError
                ? error.message
                : 'Có lỗi xảy ra, thử lại sau.'}
          </p>
          {!getAccessToken() && isForbidden && (
            <Link
              href="/login"
              className="mt-1 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-dark"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!session) return null;
  const isAuthenticated = !!getAccessToken();

  return (
    <div className="shell flex flex-col gap-4 py-10">
      <div>
        <h1 className="m-0 font-display text-2xl font-bold text-ink">{session.title}</h1>
        <p className="text-sm text-ink-muted">{session.courseTitle}</p>
      </div>

      {session.status === 'SCHEDULED' && (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <span className="text-3xl" aria-hidden>
            🗓️
          </span>
          <p className="font-display text-lg font-semibold text-ink">Buổi live sắp bắt đầu</p>
          <p className="text-sm text-ink-muted">
            {session.scheduledAt
              ? `Dự kiến lúc ${formatDateTime(session.scheduledAt)}`
              : 'Giảng viên chưa bắt đầu — quay lại sau nhé.'}
          </p>
        </div>
      )}

      {session.status === 'ENDED' && (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <span className="text-3xl" aria-hidden>
            🏁
          </span>
          <p className="font-display text-lg font-semibold text-ink">Buổi live đã kết thúc</p>
        </div>
      )}

      {session.status === 'LIVE' && session.viewerToken && session.serverUrl && (
        // Người xem CHỈ subscribe, không publish gì (token canPublish=false trừ chat data) — bỏ
        // prop `audio`: có nó thì LiveKitRoom tự bật+publish MIC của người xem sau khi connect, bị
        // BE từ chối ngay ("insufficient permissions to publish", thấy thật trong console lúc test
        // 01/09/2026) vì token viewer không có quyền publish audio/video.
        <LiveKitRoom serverUrl={session.serverUrl} token={session.viewerToken} connect video={false}>
          <LiveRoomContent sessionId={sessionId} sourceLanguage={session.sourceLanguage} isAuthenticated={isAuthenticated} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </div>
  );
}

/**
 * F11.5 mở rộng — 3 việc TÁCH RỜI, không còn gộp chung như trước:
 *  1. `audioSelection` — đang NGHE gì (âm thanh gốc hoặc lồng tiếng ngôn ngữ X). Điều khiển việc
 *     subscribe/unsubscribe track audio thật qua LiveKit.
 *  2. `originalSubtitle` — có xem "Phụ đề gốc" hay không. Độc lập hoàn toàn với lồng tiếng: bật
 *     được dù chưa ai kích hoạt ngôn ngữ nào (luồng Transcription Agent riêng phía AI Worker).
 *  3. `subtitleSelection` — đang XEM PHỤ ĐỀ DỊCH ngôn ngữ nào (có thể KHÁC ngôn ngữ đang nghe, vd
 *     nghe tiếng gốc nhưng xem phụ đề tiếng Nhật).
 * Cả 3 dùng nguyên `LiveLanguageTrack` (activate/deactivate) ở tầng BE — trừ (2) dùng API riêng
 * (`/original-subtitle`, không có khái niệm "ngôn ngữ"). (1) và (3) chọn CÙNG 1 ngôn ngữ thì gọi
 * activate() 2 lần độc lập (đơn giản hoá có chủ đích — đếm người nghe hơi lệch 1 chút, không ảnh
 * hưởng đúng/sai, chỉ ảnh hưởng số hiển thị badge).
 */
function LiveRoomContent({
  sessionId,
  sourceLanguage,
  isAuthenticated,
}: {
  sessionId: number;
  sourceLanguage: string;
  isAuthenticated: boolean;
}) {
  const { data: activeTracks } = useLiveLanguageTracks(sessionId);
  const audioSelection = useLiveLanguageSelection(sessionId);
  const subtitleSelection = useLiveLanguageSelection(sessionId);
  const originalSubtitle = useLiveOriginalSubtitle(sessionId);
  const [loginModalAction, setLoginModalAction] = useState<string | null>(null);
  // F11.7 — track đang XEM PHỤ ĐỀ DỊCH (nếu có) để useLiveSubtitles biết ưu tiên "gốc đồng bộ"
  // đúng track đó (chỉ có khi provider=Gemini) thay vì luôn nhận luồng gốc độc lập chung.
  const subtitleTrackId = activeTracks?.find((t) => t.targetLanguage === subtitleSelection.selectedLanguage)?.id ?? null;
  const { originalText, translatedText } = useLiveSubtitles(subtitleSelection.selectedLanguage, subtitleTrackId);

  const micTracks = useTracks([Track.Source.Microphone]);
  useEffect(() => {
    for (const ref of micTracks) {
      if (!(ref.publication instanceof RemoteTrackPublication)) continue;
      const isTranslatedTrack = ref.publication.trackName.startsWith(TRANSLATED_TRACK_PREFIX);
      const shouldSubscribe = audioSelection.selectedLanguage
        ? ref.publication.trackName === `${TRANSLATED_TRACK_PREFIX}${audioSelection.selectedLanguage}`
        : !isTranslatedTrack;
      if (ref.publication.isSubscribed !== shouldSubscribe) {
        ref.publication.setSubscribed(shouldSubscribe);
      }
    }
  }, [micTracks, audioSelection.selectedLanguage]);

  const handleToggleOriginalSubtitle = (checked: boolean) => {
    if (!isAuthenticated) {
      setLoginModalAction('xem phụ đề gốc');
      return;
    }
    originalSubtitle.toggle(checked);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <LiveVideoStage
          showOriginalSub={originalSubtitle.enabled}
          showTranslatedSub={!!subtitleSelection.selectedLanguage}
          originalText={originalText}
          translatedText={translatedText}
        />

        <div className="card flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 shrink-0 text-[13px] font-medium text-ink">Nghe:</span>
            <LiveLanguagePicker
              isAuthenticated={isAuthenticated}
              sourceLanguage={sourceLanguage}
              activeTracks={activeTracks ?? []}
              selectedLanguage={audioSelection.selectedLanguage}
              onSelect={audioSelection.selectLanguage}
              onClearSelection={audioSelection.clearSelection}
              onRequireLogin={() => setLoginModalAction('nghe lồng tiếng')}
              isPending={audioSelection.isPending}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-3">
            <span className="w-24 shrink-0 text-[13px] font-medium text-ink">Phụ đề dịch:</span>
            <LiveLanguagePicker
              isAuthenticated={isAuthenticated}
              sourceLanguage={sourceLanguage}
              activeTracks={activeTracks ?? []}
              selectedLanguage={subtitleSelection.selectedLanguage}
              onSelect={subtitleSelection.selectLanguage}
              onClearSelection={subtitleSelection.clearSelection}
              onRequireLogin={() => setLoginModalAction('xem phụ đề dịch')}
              isPending={subtitleSelection.isPending}
              noneLabel="Không hiện phụ đề dịch"
              showDelayHint={false}
            />
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-1.5 border-t border-line-soft pt-3 text-[12.5px] text-ink-muted">
            <input
              type="checkbox"
              checked={originalSubtitle.enabled}
              disabled={originalSubtitle.isPending}
              onChange={(e) => handleToggleOriginalSubtitle(e.target.checked)}
            />
            Phụ đề gốc
          </label>
        </div>

        {audioSelection.error instanceof ApiError && (
          <p className="text-[12.5px] text-red-600">{audioSelection.error.message}</p>
        )}
        {subtitleSelection.error instanceof ApiError && (
          <p className="text-[12.5px] text-red-600">{subtitleSelection.error.message}</p>
        )}
      </div>
      <LiveChatPanel isAuthenticated={isAuthenticated} />

      <RequireLoginModal
        open={loginModalAction !== null}
        onClose={() => setLoginModalAction(null)}
        actionLabel={loginModalAction ?? ''}
      />
    </div>
  );
}

/**
 * UC52 mở rộng — nhận phụ đề gốc/dịch qua Data Message (BR-LIVE-12: không lưu, chỉ phát cho ai
 * đang xem lúc đó). `kind: "translation"` chỉ nhận đúng `targetLanguage` đang chọn xem phụ đề, dù
 * có nhiều track khác đang chạy song song cho các ngôn ngữ khác.
 *
 * F11.7 — `kind: "original"` giờ có 2 NGUỒN, phân biệt bằng `sourceTrackId`:
 *  - `sourceTrackId: null` — luồng ĐỘC LẬP từ Transcription Agent (1 luồng/phiên, không theo ngôn
 *    ngữ). Provider Azure LUÔN dùng luồng này (không có luồng nào khác).
 *  - `sourceTrackId: <id>` — phát RA TỪ chính phiên dịch của track đó (chỉ provider Gemini) —
 *    đồng bộ tuyệt đối với `kind: "translation"` CÙNG track vì cùng 1 phiên nhận diện.
 * Ưu tiên đúng track đang xem phụ đề dịch NẾU luồng đó thực sự có dữ liệu (Gemini); không có
 * (Azure, hoặc chưa xem phụ đề dịch nào) thì rơi về luồng độc lập — không cần biết provider nào
 * đang chạy, chỉ phản ứng theo dữ liệu thực tế đang chảy vào.
 */
function useLiveSubtitles(subtitleLanguage: string | null, subtitleTrackId: number | null) {
  const [independentText, setIndependentText] = useState('');
  const [syncedText, setSyncedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const independentClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translatedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useDataChannel(SUBTITLE_TOPIC, (msg) => {
    let payload: SubtitlePayload;
    try {
      payload = JSON.parse(new TextDecoder().decode(msg.payload)) as SubtitlePayload;
    } catch {
      return; // payload hỏng — bỏ qua, không phải lỗi nghiêm trọng
    }
    if (payload.kind === 'original') {
      if (payload.sourceTrackId === null) {
        setIndependentText(payload.text);
        if (independentClearTimerRef.current) clearTimeout(independentClearTimerRef.current);
        independentClearTimerRef.current = setTimeout(() => setIndependentText(''), SUBTITLE_STALE_MS);
      } else if (payload.sourceTrackId === subtitleTrackId) {
        setSyncedText(payload.text);
        if (syncedClearTimerRef.current) clearTimeout(syncedClearTimerRef.current);
        syncedClearTimerRef.current = setTimeout(() => setSyncedText(''), SUBTITLE_STALE_MS);
      }
      // sourceTrackId thuộc 1 track khác (đang chạy song song, không phải track đang xem) — bỏ qua.
    } else if (payload.kind === 'translation' && subtitleLanguage && payload.targetLanguage === subtitleLanguage) {
      setTranslatedText(payload.text);
      if (translatedClearTimerRef.current) clearTimeout(translatedClearTimerRef.current);
      translatedClearTimerRef.current = setTimeout(() => setTranslatedText(''), SUBTITLE_STALE_MS);
    }
  });

  // Đổi track/ngôn ngữ phụ đề dịch — bản "gốc đồng bộ" cũ (nếu có) không còn khớp track mới, xoá
  // ngay để không lỡ hiện phụ đề gốc của 1 track khác trong lúc chờ dữ liệu mới.
  useEffect(() => {
    setSyncedText('');
    setTranslatedText('');
  }, [subtitleTrackId, subtitleLanguage]);

  return {
    originalText: subtitleTrackId !== null && syncedText ? syncedText : independentText,
    translatedText,
  };
}

/** Chỉ subscribe — người xem không publish gì (token `canPublish=false`, xem `LiveViewService`). */
function LiveVideoStage({
  showOriginalSub,
  showTranslatedSub,
  originalText,
  translatedText,
}: {
  showOriginalSub: boolean;
  showTranslatedSub: boolean;
  originalText: string;
  translatedText: string;
}) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const mainTrack = screenTrack ?? cameraTrack;

  const showTranslatedLine = showTranslatedSub && translatedText;
  const showOriginalLine = showOriginalSub && originalText;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900">
      {mainTrack ? (
        <VideoTrack
          trackRef={mainTrack}
          className={`h-full w-full ${mainTrack.source === Track.Source.ScreenShare ? 'object-contain' : 'object-cover'}`}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">
          Giảng viên chưa bật camera hoặc chia sẻ màn hình
        </div>
      )}
      {screenTrack && cameraTrack && (
        <div className="absolute bottom-3 right-3 h-24 w-40 overflow-hidden rounded-lg border-2 border-white/80 shadow-lg">
          <VideoTrack trackRef={cameraTrack} className="h-full w-full object-cover" />
        </div>
      )}
      <p className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white">
        Âm thanh/hình ảnh có thể trễ vài giây so với thực tế
      </p>

      {(showTranslatedLine || showOriginalLine) && (
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 px-6 text-center">
          {showTranslatedLine && (
            <span className="max-w-full rounded-md bg-black/75 px-3 py-1.5 text-[15px] font-semibold leading-snug text-white">
              {translatedText}
            </span>
          )}
          {showOriginalLine && (
            <span className="max-w-full rounded-md bg-black/50 px-2.5 py-1 text-[12.5px] leading-snug text-gray-200">
              {originalText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
