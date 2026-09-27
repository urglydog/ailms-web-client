'use client';

import { useState } from 'react';
import { useTutorSecurityFlags } from '@/hooks/useTutorSecurity';

const PAGE_SIZE = 20;

/** BR-TUTOR-SEC-06 (doc/feat/injection/DacTa_ChongPromptInjection_TutorAgent.md) — CHỈ để Admin
 * xem lại các tin nhắn học viên gửi vào Socratic Tutor Agent bị pre-check heuristic gắn cờ. Đây
 * là log THEO DÕI, không có hành động khóa/chặn tài khoản nào gắn với trang này ở v1 — pattern
 * nghi vấn được cấu hình trong DB (`tutor_security_patterns`), không sửa được từ trang này. */
export function TutorSecurityFlagsManager() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useTutorSecurityFlags({ page, size: PAGE_SIZE });
  const flags = data?.content ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Học viên</th>
              <th className="px-6 py-4">Khóa học</th>
              <th className="px-6 py-4">Pattern khớp</th>
              <th className="px-6 py-4">Nội dung tin nhắn</th>
              <th className="px-6 py-4">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-gray-500">Đang tải...</td>
              </tr>
            )}
            {!isLoading && flags.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                  Chưa có tin nhắn nào bị gắn cờ nghi vấn.
                </td>
              </tr>
            )}
            {flags.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50 align-top">
                <td className="px-6 py-3">
                  <div className="font-semibold text-gray-900">{f.studentName}</div>
                  <div className="text-xs text-gray-500">{f.studentEmail}</div>
                </td>
                <td className="px-6 py-3 text-gray-600">{f.courseTitle}</td>
                <td className="px-6 py-3">
                  <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    {f.matchedPattern}
                  </span>
                </td>
                <td className="px-6 py-3 max-w-md text-gray-600" title={f.messageSnapshot}>
                  <span className="line-clamp-2">{f.messageSnapshot}</span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-gray-400">
                  {new Date(f.createdAt).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-gray-500">
            Trang {data.number + 1} / {data.totalPages} — {data.totalElements} bản ghi
          </span>
          <div className="flex gap-2">
            <button
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
              className="rounded bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
              className="rounded bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
