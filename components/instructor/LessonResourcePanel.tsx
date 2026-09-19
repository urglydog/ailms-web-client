'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import { useAddLessonDocumentLink, useDeleteLessonDocument, useLessonDocuments } from '@/hooks/useCourses';
import { useStartLessonDocumentUpload } from '@/hooks/useUploadTray';
import { useUploadTrayStore } from '@/lib/stores/uploadTrayStore';
import { formatFileSize } from '@/lib/format';

const MAX_DOCUMENTS = 5;

/**
 * "+ Tài nguyên" (15/09/2026, mở rộng — giao diện tham khảo Udemy "Chương trình giảng dạy") —
 * mở ra NGAY DƯỚI hàng bài giảng (không phải modal riêng như "Quản lý video"), theo đúng kiểu
 * accordion của Udemy khi bấm mũi tên sổ xuống cạnh "+ Nội dung".
 *
 * 2 cách thêm tài nguyên, ĐÚNG như yêu cầu (khác Udemy có 4 tab: thư viện/dán link/nguồn ngoài/mã
 * nguồn) — dự án này chỉ cần "thêm tệp từ máy" (tái dùng `LessonDocument` UC35 có sẵn) và "dán
 * link" (mở rộng mới — xem `LessonDocumentService.addLink`, lưu URL với `fileType="LINK"`).
 */
export function LessonResourcePanel({ lessonId }: { lessonId: number }) {
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const { data: documents, isLoading } = useLessonDocuments(lessonId);
  const startDocumentUpload = useStartLessonDocumentUpload();
  const addLink = useAddLessonDocumentLink(lessonId);
  const deleteDocument = useDeleteLessonDocument(lessonId);
  const docTask = useUploadTrayStore((s) =>
    s.tasks.find((t) => t.targetType === 'lesson-document' && t.targetId === lessonId),
  );

  const docs = documents ?? [];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    startDocumentUpload(lessonId, file, `Tài liệu: ${file.name}`);
  };

  const handleLinkSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    addLink.mutate(
      { title: linkTitle.trim(), url: linkUrl.trim() },
      { onSuccess: () => { setLinkTitle(''); setLinkUrl(''); } },
    );
  };

  return (
    <div
      draggable={false}
      onDragStart={(e) => e.stopPropagation()}
      className="mt-2 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-[12.5px] font-bold text-gray-800">Tài nguyên</h4>
        <span className="text-[11px] text-gray-400">{docs.length}/{MAX_DOCUMENTS}</span>
      </div>
      {/* Text giải thích nhỏ — cùng tinh thần chú thích của Udemy dưới mỗi mục thêm nội dung. */}
      <p className="text-[11.5px] leading-relaxed text-gray-400">
        Tệp hoặc liên kết tham khảo hỗ trợ học viên trong bài giảng này. Đảm bảo tệp dễ đọc, tối đa 50MB.
      </p>

      {isLoading && <p className="text-[12px] text-gray-400">Đang tải...</p>}

      <div className="flex flex-col gap-1.5">
        {docs.map((doc) => (
          <div
            key={doc.id}
            draggable={false}
            className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5 text-[12.5px]"
          >
            {doc.fileType === 'LINK' ? (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                draggable={false}
                className="min-w-0 flex-1 truncate text-cyan-700 hover:underline"
              >
                🔗 {doc.fileName}
              </a>
            ) : (
              <span className="min-w-0 flex-1 truncate text-gray-700">📄 {doc.fileName}</span>
            )}
            {doc.fileType !== 'LINK' && <span className="shrink-0 text-gray-400">{formatFileSize(doc.fileSize)}</span>}
            <button
              type="button"
              draggable={false}
              onClick={() => deleteDocument.mutate(doc.id)}
              className="shrink-0 text-[11.5px] font-bold text-red-500 hover:text-red-700"
            >
              Xóa
            </button>
          </div>
        ))}
        {docs.length === 0 && !isLoading && (
          <p className="text-[12px] text-gray-400">Chưa có tài nguyên nào.</p>
        )}
      </div>

      {docs.length < MAX_DOCUMENTS ? (
        <div className="flex flex-col gap-2" draggable={false}>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-[12px] font-semibold">
            <button
              type="button"
              draggable={false}
              onClick={() => setMode('file')}
              className={`flex-1 rounded-md py-1.5 ${mode === 'file' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500'}`}
            >
              Thêm tệp từ máy
            </button>
            <button
              type="button"
              draggable={false}
              onClick={() => setMode('link')}
              className={`flex-1 rounded-md py-1.5 ${mode === 'link' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500'}`}
            >
              Dán link
            </button>
          </div>

          {mode === 'file' ? (
            <div className="flex flex-col gap-2" draggable={false}>
              <input
                type="file"
                accept=".pdf,.docx,.pptx,.zip,.txt"
                onChange={handleFileChange}
                disabled={docTask?.status === 'uploading'}
                draggable={false}
                className="text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-[11.5px] file:font-semibold"
              />
              {docTask?.status === 'uploading' && (
                <UploadProgressBar percent={docTask.percent} label="Đang tải tài liệu lên..." />
              )}
              {docTask?.status === 'error' && <p className="text-[11.5px] text-red-600">{docTask.errorMessage}</p>}
            </div>
          ) : (
            <form onSubmit={handleLinkSubmit} className="flex flex-col gap-2" draggable={false}>
              <input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Tên hiển thị"
                draggable={false}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                draggable={false}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                draggable={false}
                disabled={addLink.isPending}
                className="self-start rounded-lg bg-cyan-600 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addLink.isPending ? 'Đang thêm...' : 'Thêm liên kết'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <p className="text-[11.5px] text-amber-600">Đã đạt tối đa {MAX_DOCUMENTS} tài nguyên — xóa bớt để thêm mới.</p>
      )}
    </div>
  );
}
