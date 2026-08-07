'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { useMyCourses } from '@/hooks/useCourses';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

interface InstructorDashboardData {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  revenue: number;
}

export default function InstructorOverviewPage() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'instructor'],
    queryFn: () =>
      api.get<InstructorDashboardData>('/api/v1/dashboard/instructor', { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken(),
  });
  const { data: recentPage } = useMyCourses({ size: 5 });

  const totalCourses = data?.totalCourses ?? 0;
  const totalStudents = data?.totalStudents ?? 0;
  const averageRating = data?.averageRating ?? 0;
  const revenue = data?.revenue ?? 0;
  const recentCourses = recentPage?.content ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[23px] font-bold text-gray-900">Tổng quan</h1>
        <Link
          href="/instructor/courses/new"
          className="cursor-pointer rounded-full bg-cyan-600 px-5 py-[11px] text-[13.5px] font-bold text-white no-underline hover:bg-cyan-700"
        >
          + Tạo khóa học mới
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-[18px] shadow-sm">
          <span className="text-xs text-gray-500">Tổng số khóa học</span>
          <span className="font-display text-[26px] font-extrabold text-gray-900">{totalCourses}</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-[18px] shadow-sm">
          <span className="text-xs text-gray-500">Tổng học viên</span>
          <span className="font-display text-[26px] font-extrabold text-gray-900">{totalStudents}</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-[18px] shadow-sm">
          <span className="text-xs text-gray-500">Đánh giá trung bình</span>
          <span className="font-display text-[26px] font-extrabold text-gray-900">{averageRating}</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-[18px] shadow-sm">
          <span className="text-xs text-gray-500">Doanh thu tháng này (thực nhận)</span>
          <span className="font-display text-[22px] font-extrabold text-gray-900">{revenue.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="mb-2.5 font-display text-base font-bold text-gray-900">Khóa học gần đây</span>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-[52px_1.6fr_110px_90px_140px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11.5px] font-bold text-gray-500">
            <span></span>
            <span>Tên khóa học</span>
            <span>Trạng thái</span>
            <span>Giá</span>
            <span></span>
          </div>
          {recentCourses.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">Chưa có khóa học nào.</div>
          )}
          {recentCourses.map((course, idx: number) => (
            <div
              key={course.id}
              className={`grid grid-cols-[52px_1.6fr_110px_90px_140px] items-center gap-3 px-4 py-2.5 ${
                idx < recentCourses.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div
                className="h-7 w-10 shrink-0 rounded-md bg-cover bg-center bg-[repeating-linear-gradient(135deg,#0E7490,#0E7490_8px,#0891B2_8px,#0891B2_16px)]"
                style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : undefined}
              ></div>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-gray-900">
                {course.title}
              </span>
              <CourseStatusBadge status={course.status} />
              <span className="text-[13px] text-gray-500">
                {course.isFree ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')}đ`}
              </span>
              <div className="flex gap-2">
                <Link
                  href={`/instructor/courses/${course.id}/edit`}
                  className="cursor-pointer text-[12px] font-bold text-cyan-600 no-underline hover:text-cyan-700"
                >
                  Sửa
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
