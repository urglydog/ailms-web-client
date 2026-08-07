'use client';

import { useState } from 'react';

const MIN_REASON_LENGTH = 20;

interface RejectReasonModalProps {
  courseTitle: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

/** BR-COURSE-04: lý do từ chối phải ≥20 ký tự — bộ đếm đổi màu xanh/đỏ theo thời gian thực. */
export function RejectReasonModal({ courseTitle, onConfirm, onClose, isSubmitting }: RejectReasonModalProps) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= MIN_REASON_LENGTH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="m-0 font-display text-[16px] font-bold text-gray-900">Từ chối khóa học</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          Khóa học <span className="font-semibold text-gray-700">&quot;{courseTitle}&quot;</span> sẽ chuyển sang
          trạng thái Bị từ chối. Giảng viên sẽ thấy lý do này để chỉnh sửa và gửi duyệt lại.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Nêu rõ lý do từ chối (tối thiểu 20 ký tự)..."
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
        />
        <div className={`mt-1 text-right text-[12px] font-semibold ${isValid ? 'text-green-600' : 'text-red-500'}`}>
          {reason.trim().length}/{MIN_REASON_LENGTH} ký tự
        </div>

        <div className="mt-3 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-4 py-2 text-[13px] font-bold text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-full bg-red-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}
