'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MaterialManager } from '@/components/materials/MaterialManager';
import Link from 'next/link';

function MaterialsContent() {
  const searchParams = useSearchParams();
  const courseIdStr = searchParams.get('courseId');
  const courseId = courseIdStr ? parseInt(courseIdStr, 10) : null;

  if (!courseId) {
    return (
      <div className="min-h-dvh bg-surface p-8">
        <div className="shell text-center py-20">
          <p className="text-ink-muted mb-4">Không tìm thấy thông tin khóa học.</p>
          <Link href="/courses" className="text-accent hover:underline font-semibold">
            ← Về danh sách khóa học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="shell py-8">
        <div className="mb-8">
          <Link href="/courses" className="text-sm text-ink-muted hover:text-ink transition-colors">
            ← Quay lại
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Quản lý học liệu AI</h1>
          <p className="mt-2 text-ink-muted">Tạo sơ đồ tư duy, flashcard, và bài tập tự động từ bài giảng.</p>
        </div>

        <MaterialManager courseId={courseId} />
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-surface p-8 text-center text-ink-muted">
          Đang tải dữ liệu học liệu...
        </div>
      }
    >
      <MaterialsContent />
    </Suspense>
  );
}