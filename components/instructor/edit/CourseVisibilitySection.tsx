'use client';

import { useEffect, useState } from 'react';
import { useAddCourseInvite, useCourseInvites, useRemoveCourseInvite, useUpdateCourseVisibility } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';
import type { CourseEditDetail, CourseVisibility } from '@/types/domain';

const VISIBILITY_OPTIONS: Array<{ value: CourseVisibility; label: string; helper: string }> = [
  { value: 'PUBLIC', label: 'Công khai', helper: 'Hiển thị trong tìm kiếm và danh mục — bất kỳ ai cũng có thể ghi danh.' },
  {
    value: 'PRIVATE_INVITE',
    label: 'Riêng tư (Chỉ dành cho người được mời)',
    helper: 'Ẩn khỏi tìm kiếm — chỉ email bạn mời bên dưới mới xem và ghi danh được.',
  },
  {
    value: 'PRIVATE_PASSWORD',
    label: 'Riêng tư (Được bảo vệ bằng mật khẩu)',
    helper: 'Ẩn khỏi tìm kiếm — ai có link cũng xem được trang khóa học, nhưng cần đúng mật khẩu mới ghi danh được.',
  },
];

/** "Đăng ký (Quyền riêng tư)" kiểu Udemy (19/09/2026, tính năng mới) — trong panel Cài đặt của
 * `EditCourseLayout.tsx`. */
export function CourseVisibilitySection({ courseId, course }: { courseId: number; course: CourseEditDetail }) {
  const [visibility, setVisibility] = useState<CourseVisibility>(course.visibility);
  const [password, setPassword] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    setVisibility(course.visibility);
  }, [course.visibility]);

  const updateVisibility = useUpdateCourseVisibility(courseId);
  const { data: invites, isLoading: invitesLoading } = useCourseInvites(courseId, visibility === 'PRIVATE_INVITE');
  const addInvite = useAddCourseInvite(courseId);
  const removeInvite = useRemoveCourseInvite(courseId);

  const handleSave = () => {
    updateVisibility.mutate(
      { visibility, password: password.trim() || undefined },
      { onSuccess: () => setPassword('') },
    );
  };

  const handleAddInvite = () => {
    if (!inviteEmail.trim()) return;
    addInvite.mutate(inviteEmail.trim(), { onSuccess: () => setInviteEmail('') });
  };

  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 p-6">
      <h3 className="m-0 text-[14px] font-bold text-gray-900">Đăng ký (Quyền riêng tư)</h3>

      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as CourseVisibility)}
        className="rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
      >
        {VISIBILITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <p className="text-[12px] text-gray-500">
        {VISIBILITY_OPTIONS.find((opt) => opt.value === visibility)?.helper}
      </p>

      {visibility === 'PRIVATE_PASSWORD' && (
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={course.hasEnrollPassword ? 'Để trống để giữ nguyên mật khẩu cũ' : 'Nhập mật khẩu đăng ký'}
          className="rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
        />
      )}

      {updateVisibility.error instanceof ApiError && (
        <p className="text-[12px] text-red-600">{updateVisibility.error.message}</p>
      )}
      {updateVisibility.isSuccess && (
        <p className="text-[12px] text-green-600">Đã lưu cài đặt quyền riêng tư.</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={updateVisibility.isPending}
        className="self-start rounded-lg bg-cyan-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {updateVisibility.isPending ? 'Đang lưu...' : 'Lưu'}
      </button>

      {visibility === 'PRIVATE_INVITE' && (
        <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
          <span className="text-[12.5px] font-semibold text-gray-700">Danh sách email được mời</span>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddInvite()}
              placeholder="email@vidu.com"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddInvite}
              disabled={!inviteEmail.trim() || addInvite.isPending}
              className="shrink-0 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Mời
            </button>
          </div>

          {invitesLoading && <p className="text-[12px] text-gray-400">Đang tải...</p>}
          {!invitesLoading && (!invites || invites.length === 0) && (
            <p className="text-[12px] text-gray-400">Chưa mời email nào.</p>
          )}
          <div className="flex flex-col gap-1">
            {invites?.map((email) => (
              <div key={email} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-[12.5px]">
                <span className="truncate text-gray-700">{email}</span>
                <button
                  type="button"
                  onClick={() => removeInvite.mutate(email)}
                  className="shrink-0 text-[11.5px] font-bold text-red-500 hover:text-red-700"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
