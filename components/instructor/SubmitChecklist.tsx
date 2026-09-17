interface SubmitChecklistProps {
  missingConditions: string[];
  canSubmit: boolean;
}

/** Checklist điều kiện gửi duyệt — phản chiếu đúng BR-COURSE-01 (tiêu đề, mô tả, ảnh bìa, ≥1 chương, ≥3 bài sẵn sàng). */
export function SubmitChecklist({ missingConditions, canSubmit }: SubmitChecklistProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="font-display text-[13.5px] font-bold text-gray-900">Điều kiện gửi duyệt</span>
      {canSubmit ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-[12.5px] font-semibold text-green-700">
          <span>✓</span>
          <span>Đã đủ điều kiện gửi duyệt</span>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {missingConditions.map((condition) => (
            <li key={condition} className="flex items-center gap-2 text-[12.5px] text-red-700">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px]">✗</span>
              <span>{condition}</span>
            </li>
          ))}
          <li className="flex items-center gap-2 text-[12.5px] text-green-700">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px]">✓</span>
            <span>Khuyến nghị: Thêm Bài tập (Quiz/Flashcard/Mindmap) (Không bắt buộc)</span>
          </li>
        </ul>
      )}
    </div>
  );
}
