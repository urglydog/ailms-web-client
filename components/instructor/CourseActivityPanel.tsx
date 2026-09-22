'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api/courses';
import { History, X } from 'lucide-react';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

/**
 * Panel "Hoạt động gần đây" — trượt đè (overlay) từ mép phải, không chiếm chỗ
 * cố định trong layout (tránh bóp cột Workspace). Tham khảo widget "Recent
 * Activity" của GakuNin RDM.
 */
export function CourseActivityPanel({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['course-activities', courseId],
    queryFn: () => coursesApi.getActivities(courseId, 50),
    enabled: !!courseId,
    refetchInterval: 30000,
  });

  // Hiệu ứng trượt vào khi mở panel (mount) — thuần hiển thị, không ảnh hưởng dữ liệu/logic.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px] transition-opacity duration-200 ${entered ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-4 top-4 bottom-4 z-50 w-80 bg-surface-raised border border-line rounded-card shadow-card-hover overflow-hidden flex flex-col transition-all duration-200 ${
          entered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
        }`}
      >
        <div className="p-3 border-b border-line bg-surface flex items-center gap-2">
          <History className="w-4 h-4 text-ink-muted flex-shrink-0" />
          <h3 className="font-display font-semibold text-sm text-ink flex-1">Hoạt động gần đây</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-card text-ink-muted hover:bg-surface-hover hover:text-ink transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-line-soft">
          {isLoading && <div className="text-xs text-ink-faint text-center py-6">Đang tải...</div>}
          {!isLoading && (activities?.length ?? 0) === 0 && (
            <div className="text-xs text-ink-faint text-center py-6 px-4">Chưa có hoạt động nào được ghi lại.</div>
          )}
          {activities?.map(a => (
            <div key={a.id} className="px-3 py-2.5 hover:bg-surface-hover transition-colors">
              <p className="text-xs text-ink-muted leading-snug">
                <span className="font-semibold text-ink">{a.actorName || 'Hệ thống'}</span> {a.description.charAt(0).toLowerCase() + a.description.slice(1)}
              </p>
              <p className="text-[10px] text-ink-faint mt-0.5">{timeAgo(a.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
