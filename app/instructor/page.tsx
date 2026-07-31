'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InstructorCourse {
  id: number;
  title: string;
  status: string;
  studentsCount?: number;
}

interface InstructorDashboardData {
  totalCourses: number;
  totalStudents: number;
  totalRevenue?: number;
  recentCourses?: InstructorCourse[];
}

export default function InstructorOverviewPage() {
  const [data, setData] = useState<InstructorDashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/dashboard/instructor`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Error fetching instructor dashboard', e);
      }
    };
    fetchDashboard();
  }, []);

  const totalCourses = data?.totalCourses ?? 8;
  const totalStudents = data?.totalStudents ?? 12450;
  const averageRating = data?.averageRating ?? 4.8;
  const revenue = data?.revenue ?? 15400000;
  const recentCourses = data?.recentCourses ?? [
    { id: 1, title: 'React Masterclass', status: 'PUBLISHED', students: 1250 },
    { id: 2, title: 'Advanced CSS Layouts', status: 'PENDING', students: 0 },
    { id: 3, title: 'JavaScript for Beginners', status: 'DRAFT', students: 0 },
  ];

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
            <span>Học viên</span>
            <span></span>
          </div>
          {recentCourses.map((course, idx: number) => {
            const statusBg =
              course.status === 'PUBLISHED'
                ? 'bg-green-50 text-green-600'
                : course.status === 'PENDING'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-gray-100 text-gray-500';

            return (
              <div
                key={course.id}
                className={`grid grid-cols-[52px_1.6fr_110px_90px_140px] items-center gap-3 px-4 py-2.5 ${
                  idx < recentCourses.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="h-7 w-10 shrink-0 rounded-md bg-[repeating-linear-gradient(135deg,#0E7490,#0E7490_8px,#0891B2_8px,#0891B2_16px)]"></div>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-gray-900">
                  {course.title}
                </span>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[10.5px] font-bold ${statusBg}`}>
                  {course.status}
                </span>
                <span className="text-[13px] text-gray-500">{course.students}</span>
                <div className="flex gap-2">
                  <span className="cursor-pointer text-[12px] font-bold text-gray-500 hover:text-gray-700">Xem</span>
                  <span className="cursor-pointer text-[12px] font-bold text-cyan-600 hover:text-cyan-700">Sửa</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
