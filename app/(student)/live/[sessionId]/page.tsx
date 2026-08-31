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
import { useLiveSessionView } from '@/hooks/useLiveView';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

const TRANSLATED_TRACK_PREFIX = 'translated-';
/** Trùng `_SUBTITLE_TOPIC` phía `ai-worker/app/live/translation_agent.py` — đổi 1 bên thì phải đổi bên kia. */
const SUBTITLE_TOPIC = 'lms.live-subtitle';
/** Không thấy phụ đề mới trong ngần này giây thì tự xoá — tránh treo mãi 1 câu cũ khi giảng viên
 * ngừng nói hẳn (vd hết giờ live, chuyển chủ đề im lặng suy nghĩ...). */
const SUBTITLE_STALE_MS = 12000;

interface SubtitlePayload {
  targetLanguage: string;
  original: string;
  translated: string;
}

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
        <LiveKitRoom serverUrl={session.serverUrl} token={session.viewerToken} connect audio video={false}>
          <LiveRoomContent sessionId={sessionId} sourceLanguage={session.sourceLanguage} isAuthenticated={isAuthenticated} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </div>
  );
}

/**
 * Gộp state ngôn ngữ đang chọn (`useLiveLanguageSelection`) vào 1 chỗ DUY NHẤT rồi chia cho cả
 * khung video (phụ đề cần biết đang dịch ngôn ngữ nào) lẫn bộ chọn ngôn ngữ — gọi hook này 2 lần
 * ở 2 component riêng sẽ tạo 2 state độc lập, kích hoạt/rời phòng 2 lần chồng nhau.
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
  const { selectedLanguage, selectLanguage, clearSelection, isPending, error } = useLiveLanguageSelection(sessionId);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOriginalSub, setShowOriginalSub] = useState(false);
  const [showTranslatedSub, setShowTranslatedSub] = useState(false);
  const { originalText, translatedText } = useLiveSubtitles(selectedLanguage);

  const micTracks = useTracks([Track.Source.Microphone]);
  useEffect(() => {
    for (const ref of micTracks) {
      if (!(ref.publication instanceof RemoteTrackPublication)) continue;
      const isTranslatedTrack = ref.publication.trackName.startsWith(TRANSLATED_TRACK_PREFIX);
      const shouldSubscribe = selectedLanguage
        ? ref.publication.trackName === `${TRANSLATED_TRACK_PREFIX}${selectedLanguage}`
        : !isTranslatedTrack;
      if (ref.publication.isSubscribed !== shouldSubscribe) {
        ref.publication.setSubscribed(shouldSubscribe);
      }
    }
  }, [micTracks, selectedLanguage]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <LiveVideoStage
          showOriginalSub={showOriginalSub}
          showTranslatedSub={showTranslatedSub}
          originalText={originalText}
          translatedText={translatedText}
        />

        <div className="card flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-ink">Lồng tiếng:</span>
            <LiveLanguagePicker
              isAuthenticated={isAuthenticated}
              sourceLanguage={sourceLanguage}
              activeTracks={activeTracks ?? []}
              selectedLanguage={selectedLanguage}
              onSelect={selectLanguage}
              onClearSelection={clearSelection}
              onRequireLogin={() => setShowLoginModal(true)}
              isPending={isPending}
            />
          </div>

          <div className="flex items-center gap-3 border-l border-line-soft pl-4">
            <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-muted">
              <input
                type="checkbox"
                checked={showOriginalSub}
                onChange={(e) => setShowOriginalSub(e.target.checked)}
              />
              Phụ đề gốc
            </label>
            <label
              className={`flex items-center gap-1.5 text-[12.5px] ${
                selectedLanguage ? 'cursor-pointer text-ink-muted' : 'cursor-not-allowed text-ink-faint'
              }`}
              title={selectedLanguage ? undefined : 'Chọn ngôn ngữ lồng tiếng trước đã'}
            >
              <input
                type="checkbox"
                checked={showTranslatedSub}
                disabled={!selectedLanguage}
                onChange={(e) => setShowTranslatedSub(e.target.checked)}
              />
              Phụ đề dịch
            </label>
          </div>
        </div>

        {error instanceof ApiError && <p className="text-[12.5px] text-red-600">{error.message}</p>}
      </div>
      <LiveChatPanel isAuthenticated={isAuthenticated} />

      <RequireLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        actionLabel="chọn ngôn ngữ lồng tiếng"
      />
    </div>
  );
}

/**
 * UC52 mở rộng — nhận phụ đề gốc/dịch qua Data Message (BR-LIVE-12: không lưu, chỉ phát cho ai
 * đang xem lúc đó). Nhiều track (nhiều ngôn ngữ đang có người nghe) có thể cùng phát — chỉ nhận
 * `translated` của ĐÚNG `targetLanguage` đang chọn, còn `original` thì ngôn ngữ nào cũng như nhau
 * (cùng 1 giọng nguồn) nên nhận từ track nào tới trước cũng được.
 */
function useLiveSubtitles(selectedLanguage: string | null) {
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useDataChannel(SUBTITLE_TOPIC, (msg) => {
    let payload: SubtitlePayload;
    try {
      payload = JSON.parse(new TextDecoder().decode(msg.payload)) as SubtitlePayload;
    } catch {
      return; // payload hỏng — bỏ qua, không phải lỗi nghiêm trọng
    }
    if (payload.original) setOriginalText(payload.original);
    if (selectedLanguage && payload.targetLanguage === selectedLanguage && payload.translated) {
      setTranslatedText(payload.translated);
    }
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setOriginalText('');
      setTranslatedText('');
    }, SUBTITLE_STALE_MS);
  });

  // Đổi ngôn ngữ dịch — phụ đề dịch cũ không còn khớp ngôn ngữ mới, xoá ngay thay vì hiện sai.
  useEffect(() => {
    setTranslatedText('');
  }, [selectedLanguage]);

  return { originalText, translatedText };
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
