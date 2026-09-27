'use client';

import { useState, type FormEvent } from 'react';
import { useCreateSystemAnnouncement, useSystemAnnouncements } from '@/hooks/useSystemAnnouncements';
import { ApiError } from '@/lib/api/client';
import type { AnnouncementAudience, AnnouncementSeverity, CreateSystemAnnouncementReq } from '@/types/domain';

const SEVERITY_OPTIONS: Array<{ value: AnnouncementSeverity; label: string }> = [
  { value: 'HIGH', label: 'Cao — hiện thành banner đầu trang (vd: Bảo trì hệ thống)' },
  { value: 'MEDIUM', label: 'Trung bình — chỉ vào chuông thông báo' },
  { value: 'LOW', label: 'Thấp — chỉ vào chuông thông báo' },
];

const AUDIENCE_OPTIONS: Array<{ value: AnnouncementAudience; label: string }> = [
  { value: 'ALL', label: 'Toàn bộ hệ thống' },
  { value: 'INSTRUCTOR', label: 'Chỉ Giảng viên' },
  { value: 'STUDENT', label: 'Chỉ Học viên' },
  { value: 'SPECIFIC_USER', label: 'Một cá nhân cụ thể (theo ID)' },
];

const DISPATCH_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Đang chờ xử lý',
  PROCESSING: 'Đang gửi...',
  DONE: 'Đã gửi xong',
  FAILED: 'Lỗi',
};

const SEVERITY_BADGE_CLASS: Record<AnnouncementSeverity, string> = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
};

/** Thông báo hệ thống từ Admin (26/09/2026, tính năng mới) — phát tán qua job nền Redis
 * (`SystemAnnouncementService` phía backend), form này chỉ tạo bản ghi + đẩy job rồi trả về
 * ngay, KHÔNG chờ gửi xong cho toàn bộ người nhận — xem cột "Trạng thái" ở bảng lịch sử. */
export function SystemAnnouncementManager() {
  const { data: announcements, isLoading } = useSystemAnnouncements();
  const createAnnouncement = useCreateSystemAnnouncement();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<AnnouncementSeverity>('MEDIUM');
  const [audience, setAudience] = useState<AnnouncementAudience>('ALL');
  const [targetUserId, setTargetUserId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setErrorMessage(null);

    const req: CreateSystemAnnouncementReq = {
      title: title.trim(),
      content: content.trim(),
      severity,
      audience,
      targetUserId: audience === 'SPECIFIC_USER' && targetUserId ? Number(targetUserId) : null,
      expiresAt: severity === 'HIGH' && expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    createAnnouncement.mutate(req, {
      onSuccess: () => {
        setTitle('');
        setContent('');
        setTargetUserId('');
        setExpiresAt('');
      },
      onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : 'Có lỗi xảy ra, thử lại sau.'),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tiêu đề">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Vd: Bảo trì hệ thống"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
            />
          </Field>
          <Field label="Mức độ">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AnnouncementSeverity)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Nội dung">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phạm vi người nhận">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          {audience === 'SPECIFIC_USER' && (
            <Field label="ID người dùng (xem ở trang Quản lý người dùng)">
              <input
                type="number"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
                min={1}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              />
            </Field>
          )}

          {severity === 'HIGH' && (
            <Field label="Tự ẩn banner sau (để trống = hiển thị đến khi có thông báo Cao mới hơn)">
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              />
            </Field>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-700">{errorMessage}</div>
        )}

        <button
          type="submit"
          disabled={createAnnouncement.isPending}
          className="self-start rounded-full bg-cyan-600 px-6 py-2.5 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {createAnnouncement.isPending ? 'Đang gửi...' : 'Gửi thông báo'}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Tiêu đề</th>
              <th className="px-6 py-4">Mức độ</th>
              <th className="px-6 py-4">Phạm vi</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Đã gửi</th>
              <th className="px-6 py-4">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-gray-500">Đang tải...</td>
              </tr>
            )}
            {!isLoading && announcements?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-gray-500">Chưa gửi thông báo nào.</td>
              </tr>
            )}
            {announcements?.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-900">{a.title}</td>
                <td className="px-6 py-3">
                  <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${SEVERITY_BADGE_CLASS[a.severity]}`}>
                    {a.severity}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {a.audience === 'SPECIFIC_USER' ? `User #${a.targetUserId}` : AUDIENCE_OPTIONS.find((o) => o.value === a.audience)?.label}
                </td>
                <td className="px-6 py-3 text-gray-600">{DISPATCH_STATUS_LABEL[a.dispatchStatus] ?? a.dispatchStatus}</td>
                <td className="px-6 py-3 text-gray-600">{a.sentCount}{a.totalRecipients != null ? ` / ${a.totalRecipients}` : ''}</td>
                <td className="px-6 py-3 text-gray-400">{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-gray-600">{label}</span>
      {children}
    </label>
  );
}
