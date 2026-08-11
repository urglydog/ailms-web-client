'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { useModerationQueue } from '@/hooks/useCourses';
import { useEffect, useState } from 'react';

interface AdminDashboardData {
  totalUsers: number;
  totalCourses: number;
  pendingCourses: number;
  totalRevenue: number;
}

interface SystemMetrics {
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  uptime: number;
}

export default function AdminOverviewPage() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.get<AdminDashboardData>('/api/v1/dashboard/admin', { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken(),
  });
  
  const { data: systemMetrics, refetch: refetchSystem } = useQuery({
    queryKey: ['dashboard', 'system'],
    queryFn: () => api.get<SystemMetrics>('/api/v1/dashboard/admin/system', { token: getAccessToken() ?? undefined }),
    enabled: !!getAccessToken(),
    refetchInterval: 10000, // Tự động làm mới mỗi 10 giây
  });

  const { data: pendingPage } = useModerationQueue({ status: 'PENDING', size: 3 });

  const totalCourses = data?.totalCourses ?? 0;
  const pendingCoursesCount = data?.pendingCourses ?? 0;
  const totalUsers = data?.totalUsers ?? 0;
  const totalRevenue = data?.totalRevenue ?? 0;
  const pendingCourses = pendingPage?.content ?? [];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

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

      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* System Metrics */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display text-[15px] font-bold text-gray-900">Trạng thái máy chủ (Real-time)</span>
            <button 
              onClick={() => refetchSystem()} 
              className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              Làm mới
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            {systemMetrics ? (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-600">
                    <span>RAM JVM Usage</span>
                    <span className="font-medium text-gray-900">
                      {formatBytes(systemMetrics.ram.used)} / {formatBytes(systemMetrics.ram.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div 
                      className={`h-full rounded-full ${
                        (systemMetrics.ram.used / systemMetrics.ram.total) > 0.8 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (systemMetrics.ram.used / systemMetrics.ram.total) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-600">
                    <span>Server Disk Space (Root)</span>
                    <span className="font-medium text-gray-900">
                      {formatBytes(systemMetrics.disk.used)} / {formatBytes(systemMetrics.disk.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div 
                      className={`h-full rounded-full ${
                        (systemMetrics.disk.used / systemMetrics.disk.total) > 0.9 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, (systemMetrics.disk.used / systemMetrics.disk.total) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">Uptime (Thời gian chạy)</span>
                  <span className="text-sm font-semibold text-gray-900">{formatUptime(systemMetrics.uptime)}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-sm text-gray-500">Đang tải thông số...</div>
            )}
          </div>
        </div>

        {/* Khóa học chờ duyệt */}
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
      </div>
    </>
  );
}
