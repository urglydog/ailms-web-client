'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { useModerationQueue } from '@/hooks/useCourses';

interface AdminDashboardData {
  totalUsers: number;
  totalCourses: number;
  pendingCourses: number;
  totalRevenue: number;
}

export default function AdminOverviewPage() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.get<AdminDashboardData>('/api/v1/dashboard/admin', { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken(),
  });
  const { data: pendingPage } = useModerationQueue({ status: 'PENDING', size: 3 });

  const totalCourses = data?.totalCourses ?? 0;
  const pendingCoursesCount = data?.pendingCourses ?? 0;
  const totalUsers = data?.totalUsers ?? 0;
  const totalRevenue = data?.totalRevenue ?? 0;
  const pendingCourses = pendingPage?.content ?? [];

  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Tổng quan hệ thống</h1>
      
      <div className="grid grid-cols-4 gap-3.5">
        <div className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 shadow-sm">
          <span className="text-xs text-gray-500">Khóa học chờ duyệt</span>
          <span className="font-display text-[24px] font-extrabold text-gray-900">{pendingCoursesCount}</span>
        </div>
        <div className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 shadow-sm">
          <span className="text-xs text-gray-500">Tổng người dùng</span>
          <span className="font-display text-[24px] font-extrabold text-gray-900">{totalUsers}</span>
        </div>
        <div className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 shadow-sm">
          <span className="text-xs text-gray-500">Tổng khóa học</span>
          <span className="font-display text-[24px] font-extrabold text-gray-900">{totalCourses}</span>
        </div>
        <div className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 shadow-sm">
          <span className="text-xs text-gray-500">Doanh thu tạm tính</span>
          <span className="font-display text-[24px] font-extrabold text-gray-900">{totalRevenue.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2.5">
        <span className="font-display text-[15px] font-bold text-gray-900">Khóa học chờ duyệt gần đây</span>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {pendingCourses.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">Không có khóa học nào đang chờ duyệt.</div>
          )}
          {pendingCourses.map((course, idx) => (
            <div key={course.id} className={`flex items-center gap-3 px-4 py-3 ${idx < pendingCourses.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div
                className="h-7 w-10 shrink-0 rounded-md bg-cover bg-center bg-[repeating-linear-gradient(135deg,#0E7490,#0E7490_8px,#0891B2_8px,#0891B2_16px)]"
                style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : undefined}
              ></div>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-gray-900">
                {course.title}
              </span>
              <span className="text-[12.5px] text-gray-400">{course.categoryName}</span>
              <Link
                href={`/admin/moderation/${course.id}`}
                className="cursor-pointer whitespace-nowrap text-[12px] font-bold text-cyan-600 no-underline hover:text-cyan-700"
              >
                Xem trước
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
