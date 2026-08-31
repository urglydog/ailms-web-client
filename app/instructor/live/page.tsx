'use client';

import Link from 'next/link';
import { useMyLiveSessions } from '@/hooks/useLiveSessions';
import { ApiError } from '@/lib/api/client';
import type { LiveSessionStatus } from '@/types/domain';

const STATUS_LABEL: Record<LiveSessionStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Sắp live', className: 'bg-amber-100 text-amber-700' },
  LIVE: { label: '● Đang live', className: 'bg-red-100 text-red-700' },
  ENDED: { label: 'Đã kết thúc', className: 'bg-gray-100 text-gray-500' },
};

export default function InstructorLivePage() {
  const { data: sessions, isLoading, error } = useMyLiveSessions();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Live Classroom</h1>
        <Link
          href="/instructor/live/new"
          className="cursor-pointer rounded-full bg-cyan-600 px-5 py-[11px] text-[13.5px] font-bold text-white no-underline hover:bg-cyan-700"
        >
          + Tạo buổi live mới
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof ApiError ? error.message : 'Không tải được danh sách buổi live.'}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.8fr_1fr_120px_150px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
          <span>Tiêu đề</span>
          <span>Khóa học</span>
          <span>Trạng thái</span>
          <span></span>
        </div>

        {isLoading && <div className="p-10 text-center text-sm text-gray-500">Đang tải...</div>}

        {!isLoading && (sessions?.length ?? 0) === 0 && (
          <div className="p-10 text-center text-sm text-gray-500">
            Chưa có buổi live nào — bấm &quot;Tạo buổi live mới&quot; để bắt đầu.
          </div>
        )}

        {sessions?.map((session, idx) => {
          const statusInfo = STATUS_LABEL[session.status];
          return (
            <div
              key={session.id}
              className={`grid grid-cols-[1.8fr_1fr_120px_150px] items-center gap-3 px-4 py-2.5 ${
                idx < sessions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-gray-900">
                {session.title}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-gray-500">
                {session.courseTitle}
              </span>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${statusInfo.className}`}
              >
                {statusInfo.label}
              </span>
              <div className="flex justify-end">
                <Link
                  href={`/instructor/live/${session.id}`}
                  className="cursor-pointer text-[12px] font-bold text-cyan-600 no-underline hover:text-cyan-700"
                >
                  {session.status === 'LIVE' ? 'Vào phòng →' : 'Xem chi tiết →'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
