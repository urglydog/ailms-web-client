'use client';

import { useState, useEffect } from 'react';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/dashboard/admin`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Error fetching admin dashboard', e);
      }
    };
    fetchDashboard();
  }, []);

  const totalCourses = data?.totalCourses ?? 125;
  const pendingCoursesCount = data?.pendingCourses ?? 12;
  const totalUsers = data?.totalUsers ?? 4521;
  const totalRevenue = data?.totalRevenue ?? 145200000;

  const pendingCourses = [
    { id: 1, title: 'Python for Beginners 2026', instructor: 'Dr. Angela Yu' },
    { id: 2, title: 'Advanced Next.js Architecture', instructor: 'Lee Robinson' },
    { id: 3, title: 'Machine Learning A-Z', instructor: 'Kirill Eremenko' },
  ];

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
          {pendingCourses.map((course, idx) => (
            <div key={course.id} className={`flex items-center gap-3 px-4 py-3 ${idx < pendingCourses.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="h-7 w-10 shrink-0 rounded-md bg-[repeating-linear-gradient(135deg,#0E7490,#0E7490_8px,#0891B2_8px,#0891B2_16px)]"></div>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-gray-900">
                {course.title}
              </span>
              <span className="text-[12.5px] text-gray-400">{course.instructor}</span>
              <span className="cursor-pointer whitespace-nowrap text-[12px] font-bold text-cyan-600 hover:text-cyan-700">
                Xem trước
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
