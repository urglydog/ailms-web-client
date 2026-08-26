'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMaterialDetail } from '@/hooks/useMaterials';
import { MermaidViewer } from '@/components/materials/MermaidViewer';
import { QuizViewer } from '@/components/materials/QuizViewer';
import { FlashcardViewer } from '@/components/materials/FlashcardViewer';
import { ApiError } from '@/lib/api/client';

export default function MaterialDetailPage() {
  const router = useRouter();
  const params = useParams();

  // Trích xuất id an toàn, tránh lỗi NaN khi params chưa sẵn sàng
  const rawId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const id = rawId ? Number(rawId) : 0;

  // Chỉ fetch dữ liệu khi id hợp lệ (id > 0)
  const { data: material, isLoading, error } = useMaterialDetail(id);

  if (!id || isLoading) {
    return (
      <div className="min-h-dvh bg-surface p-8 text-center text-ink-muted">
        Đang tải chi tiết học liệu...
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="min-h-dvh bg-surface p-8">
        <div className="shell text-center py-20">
          <p className="text-sm text-ink-muted mb-4">
            {error instanceof ApiError ? error.message : 'Không tìm thấy học liệu này hoặc bạn không có quyền xem.'}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-semibold text-accent hover:underline"
            >
              ← Quay lại
            </button>
            <Link href="/courses" className="text-sm font-semibold text-ink-muted hover:text-ink hover:underline">
              Về danh sách khóa học
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="shell py-8">
        <div className="mb-6 flex justify-between items-end border-b border-line pb-4">
          <div>
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Quay lại
              </button>
              <span className="text-line">|</span>
              <Link href="/courses" className="text-sm text-ink-muted hover:text-accent transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Trang chủ
              </Link>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">
              {material.materialType === 'MINDMAP' ? 'Sơ đồ tư duy' : material.materialType} - Phiên bản {material.versionNo}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Trạng thái: <span className="font-semibold text-green-600">{material.status}</span>
              <span className="mx-2">•</span>
              Ngày tạo: {new Date(material.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-surface-hover border border-line rounded-full text-xs font-semibold text-ink-muted uppercase">
              {material.language}
            </span>
          </div>
        </div>

        {material.materialType === 'MINDMAP' && material.mermaidCode ? (
          <div className="card p-6">
            <h2 className="text-lg font-bold font-display mb-4">Sơ đồ</h2>
            <MermaidViewer chart={material.mermaidCode} />

            <div className="mt-8 pt-6 border-t border-line">
              <h3 className="text-sm font-bold text-ink mb-2">Mã nguồn (Mermaid)</h3>
              <pre className="p-4 bg-gray-50 border border-line-soft rounded-lg text-xs overflow-auto font-mono text-ink-muted">
                {material.mermaidCode}
              </pre>
            </div>
          </div>
        ) : material.materialType === 'QUIZ' ? (
          <div className="py-4">
            {material.quizQuestions && material.quizQuestions.length > 0 ? (
              <QuizViewer questions={material.quizQuestions} />
            ) : (
              <div className="card p-6 text-center text-ink-muted">
                {material.status === 'COMPLETED' ? 'Bài trắc nghiệm này không có câu hỏi nào.' : 'Bài trắc nghiệm đang được AI xử lý, vui lòng quay lại sau...'}
              </div>
            )}
          </div>
        ) : material.materialType === 'FLASHCARD' ? (
          <div className="py-4">
            {material.flashcards && material.flashcards.length > 0 ? (
              <FlashcardViewer flashcards={material.flashcards} />
            ) : (
              <div className="card p-6 text-center text-ink-muted">
                {material.status === 'COMPLETED' ? 'Bộ flashcard này không có thẻ nào.' : 'Bộ flashcard đang được AI xử lý, vui lòng quay lại sau...'}
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6 text-center text-ink-muted">
            <p>Loại học liệu này chưa hỗ trợ hiển thị hoặc bị lỗi khi sinh.</p>
          </div>
        )}
      </div>
    </div>
  );
}