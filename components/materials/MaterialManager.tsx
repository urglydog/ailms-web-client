'use client';

import { useState } from 'react';
import { useCourseMaterials, useRequestMaterial } from '@/hooks/useMaterials';
import type { MaterialType, ScopeType } from '@/lib/api/materials';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import Link from 'next/link';

export function MaterialManager({ courseId }: { courseId: number }) {
  const { data: materials, isLoading, refetch } = useCourseMaterials(courseId);
  const requestMutation = useRequestMaterial();

  const [materialType, setMaterialType] = useState<MaterialType>('MINDMAP');
  const [scopeType, setScopeType] = useState<ScopeType>('WHOLE_COURSE');
  const [language, setLanguage] = useState('vi');

  const handleRequest = () => {
    requestMutation.mutate(
      {
        courseId,
        materialType,
        language,
        scopeType,
      },
      {
        onSuccess: () => {
          toast.success('Đã gửi yêu cầu sinh học liệu. AI đang xử lý!');
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            toast.error(err.message);
          } else {
            toast.error('Có lỗi xảy ra khi tạo học liệu');
          }
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold mb-4">Tạo học liệu AI mới</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Loại học liệu</label>
            <select
              className="w-full rounded-md border border-line p-2 text-sm"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as MaterialType)}
            >
              <option value="MINDMAP">Sơ đồ tư duy (Mindmap)</option>
              <option value="QUIZ">Trắc nghiệm (Quiz)</option>
              <option value="FLASHCARD">Flashcard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Phạm vi</label>
            <select
              className="w-full rounded-md border border-line p-2 text-sm"
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as ScopeType)}
            >
              <option value="WHOLE_COURSE">Toàn bộ khóa học</option>
              <option value="CHAPTER">Từng chương</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Ngôn ngữ</label>
            <select
              className="w-full rounded-md border border-line p-2 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">Tiếng Anh</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleRequest}
          disabled={requestMutation.isPending}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {requestMutation.isPending ? 'Đang gửi...' : '✨ Tạo học liệu'}
        </button>
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl font-bold">Lịch sử tạo</h2>
          <button onClick={() => refetch()} className="text-sm text-accent hover:underline">
            Làm mới
          </button>
        </div>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Đang tải...</p>
        ) : materials && materials.length > 0 ? (
          <div className="flex flex-col gap-3">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-line-soft rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-ink">
                    {m.materialType === 'MINDMAP' ? 'Sơ đồ tư duy' : m.materialType} - Phiên bản {m.versionNo}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">
                    Trạng thái:{' '}
                    {m.status === 'COMPLETED' ? (
                      <span className="text-green-600 font-medium">Hoàn thành</span>
                    ) : m.status === 'FAILED' ? (
                      <span className="text-red-600 font-medium">Lỗi</span>
                    ) : (
                      <span className="text-orange-500 font-medium">
                        {new Date().getTime() - new Date(m.createdAt).getTime() > 120000 
                          ? 'Đang quá tải (Vui lòng chờ thêm hoặc tạo lại)' 
                          : 'Đang xử lý (Vui lòng chờ)...'}
                      </span>
                    )}
                    <span className="mx-2">•</span>
                    {new Date(m.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {m.status === 'COMPLETED' && (
                  <Link
                    href={`/materials/${m.id}`}
                    className="rounded-full bg-surface-hover px-4 py-2 text-sm font-semibold text-ink hover:bg-line-soft"
                  >
                    Xem chi tiết
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Chưa có học liệu nào được tạo.</p>
        )}
      </div>
    </div>
  );
}
