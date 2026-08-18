'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMaterialDetail } from '@/hooks/useMaterials';
import { MermaidViewer } from '@/components/materials/MermaidViewer';
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
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold text-accent hover:underline"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="shell py-8">
        <div className="mb-6 flex justify-between items-end border-b border-line pb-4">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-ink-muted hover:text-ink transition-colors mb-4 block"
            >
              ← Quay lại danh sách
            </button>
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
        ) : material.materialType === 'QUIZ' || material.materialType === 'FLASHCARD' ? (
          <div className="card p-6 text-center text-ink-muted">
            <h2 className="text-lg font-bold font-display mb-2 text-ink">
              Giao diện {material.materialType === 'QUIZ' ? 'Trắc nghiệm' : 'Flashcard'}
            </h2>
            <p>Phần hiển thị kết quả {material.materialType === 'QUIZ' ? 'Trắc nghiệm' : 'Flashcard'} sẽ được thiết kế ở đây sau khi hoàn thiện AI xử lý.</p>
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