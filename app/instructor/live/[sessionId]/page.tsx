'use client';

import { LiveKitRoom, useLocalParticipant, useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LiveChatPanel } from '@/components/live/LiveChatPanel';
import { useEndLiveSession, useLiveSession, useStartLiveSession } from '@/hooks/useLiveSessions';
import { ApiError } from '@/lib/api/client';
import type { LiveSessionStartRes } from '@/types/domain';

/**
 * UC50 — phòng điều khiển của giảng viên: bắt đầu/kết thúc, bật/tắt camera-mic-chia sẻ màn hình
 * độc lập (BR-LIVE-03). `LiveKitRoom` chỉ render SAU khi có token thật (từ `/start`) — component
 * con dùng `useLocalParticipant`/`useTracks` nên BẮT BUỘC nằm trong `RoomContext` do
 * `LiveKitRoom` cung cấp, không tách ra ngoài được.
 */
export default function LiveControlRoomPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = Number(params.sessionId);
  const { data: session, isLoading } = useLiveSession(sessionId);
  const startLive = useStartLiveSession();
  const endLive = useEndLiveSession();
  const [liveKit, setLiveKit] = useState<LiveSessionStartRes | null>(null);

  // Phiên ĐÃ live (tải lại trang, hoặc vào lại sau khi rớt mạng trong 60s ân hạn BR-LIVE-09)
  // -> tự lấy token mới, không bắt bấm nút lại.
  useEffect(() => {
    if (session?.status === 'LIVE' && !liveKit && !startLive.isPending) {
      startLive.mutate(sessionId, { onSuccess: setLiveKit });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi trạng thái phiên đổi
  }, [session?.status]);

  if (isLoading || !session) {
    return <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>;
  }

  if (session.status === 'ENDED') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="m-0 font-display text-lg font-bold text-gray-900">{session.title}</h1>
        <p className="text-sm text-gray-500">Buổi live này đã kết thúc.</p>
      </div>
    );
  }

  if (!liveKit) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="m-0 font-display text-lg font-bold text-gray-900">{session.title}</h1>
        <p className="text-[13px] text-gray-500">
          Khóa học: {session.courseTitle} · Ngôn ngữ nói: {session.sourceLanguage}
        </p>
        {startLive.error instanceof ApiError && (
          <p className="text-[12.5px] text-red-600">{startLive.error.message}</p>
        )}
        <button
          onClick={() => startLive.mutate(sessionId, { onSuccess: setLiveKit })}
          disabled={startLive.isPending}
          className="rounded-full bg-red-600 px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {startLive.isPending ? 'Đang kết nối...' : '● Bắt đầu Live'}
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={liveKit.serverUrl}
      token={liveKit.accessToken}
      connect
      audio={false}
      video={false}
      onDisconnected={() => setLiveKit(null)}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ControlRoomBody
          title={session.title}
          onEnd={() => endLive.mutate(sessionId)}
          isEnding={endLive.isPending}
        />
        {/* Giảng viên luôn đã đăng nhập ở trang này — không cần RequireLoginModal. */}
        <LiveChatPanel isAuthenticated />
      </div>
    </LiveKitRoom>
  );
}

function ControlRoomBody({
  title,
  onEnd,
  isEnding,
}: {
  title: string;
  onEnd: () => void;
  isEnding: boolean;
}) {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const [shareSystemAudio, setShareSystemAudio] = useState(false);

  const localTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]).filter(
    (t) => t.participant.isLocal,
  );
  const cameraTrack = localTracks.find((t) => t.source === Track.Source.Camera);
  const screenTrack = localTracks.find((t) => t.source === Track.Source.ScreenShare);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="m-0 font-display text-[18px] font-bold text-gray-900">{title}</h1>
        <button
          onClick={onEnd}
          disabled={isEnding}
          className="cursor-pointer rounded-full bg-gray-900 px-5 py-2 text-[12.5px] font-bold text-white hover:bg-black disabled:opacity-50"
        >
          {isEnding ? 'Đang kết thúc...' : 'Kết thúc Live'}
        </button>
      </div>

      {/* Chia sẻ màn hình làm nền, camera nổi Picture-in-Picture góc dưới (BR-LIVE-03) */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900">
        {screenTrack ? (
          <VideoTrack trackRef={screenTrack} className="h-full w-full object-contain" />
        ) : cameraTrack ? (
          <VideoTrack trackRef={cameraTrack} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Camera và chia sẻ màn hình đang tắt
          </div>
        )}
        {screenTrack && cameraTrack && (
          <div className="absolute bottom-3 right-3 h-24 w-40 overflow-hidden rounded-lg border-2 border-white/80 shadow-lg">
            <VideoTrack trackRef={cameraTrack} className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <ToggleButton
          active={isCameraEnabled}
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          label="Camera"
        />
        <ToggleButton
          active={isMicrophoneEnabled}
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          label="Micro"
        />
        <ToggleButton
          active={isScreenShareEnabled}
          onClick={() =>
            localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: shareSystemAudio })
          }
          label="Chia sẻ màn hình"
        />
        <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-gray-600">
          <input
            type="checkbox"
            checked={shareSystemAudio}
            onChange={(e) => setShareSystemAudio(e.target.checked)}
          />
          Chia sẻ âm thanh hệ thống
        </label>
      </div>
      <p className="text-[11.5px] text-gray-400">
        Chia sẻ âm thanh hệ thống phụ thuộc trình duyệt — hoạt động ổn định nhất trên Chrome khi bạn
        tick đúng ô trong hộp thoại chia sẻ màn hình lúc trình duyệt hỏi.
      </p>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
        active ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {active ? '● ' : ''}
      {label}
    </button>
  );
}
