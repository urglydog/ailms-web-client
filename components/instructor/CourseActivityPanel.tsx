'use client';

import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api/courses';
import { History } from 'lucide-react';

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
 * Panel "Hoạt động gần đây" — hiển thị tĩnh, gói gọn trong 1 cột cố định của trang
 * (không phải popup/modal), tham khảo widget "Recent Activity" của GakuNin RDM.
 */
export function CourseActivityPanel({ courseId }: { courseId: number }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['course-activities', courseId],
    queryFn: () => coursesApi.getActivities(courseId, 50),
    enabled: !!courseId,
    refetchInterval: 30000,
  });

  return (
    <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
      <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <History className="w-4 h-4 text-gray-500" />
        <h3 className="font-bold text-sm text-gray-700">Hoạt động gần đây</h3>
      </div>
      <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
        {isLoading && <div className="text-xs text-gray-400 text-center py-6">Đang tải...</div>}
        {!isLoading && (activities?.length ?? 0) === 0 && (
          <div className="text-xs text-gray-400 text-center py-6 px-4">Chưa có hoạt động nào được ghi lại.</div>
        )}
        {activities?.map(a => (
          <div key={a.id} className="px-3 py-2.5 hover:bg-gray-50 transition-colors">
            <p className="text-xs text-gray-700 leading-snug">
              <span className="font-bold text-gray-900">{a.actorName || 'Hệ thống'}</span> {a.description.charAt(0).toLowerCase() + a.description.slice(1)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(a.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
