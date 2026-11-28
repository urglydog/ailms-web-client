'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MaterialManager } from '@/components/materials/MaterialManager';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMyEnrollments } from '@/hooks/useEnrollments';

function MaterialsContent() {
  const t = useTranslations('pages.materials');
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdStr = searchParams.get('courseId');
  const courseId = courseIdStr ? parseInt(courseIdStr, 10) : null;

  // Link từ thông báo (vd nhắc ôn flashcard: `/materials?courseId=N`): học viên đang học khoá đó thì mở thẳng tab "Học liệu" TRONG khoá
  // (trang học bài) thay vì trang quản lý riêng. Giảng viên/người chưa ghi danh vẫn thấy trang quản lý này.
  const { data: enrollments, isLoading: loadingEnrollments } = useMyEnrollments();
  const enrollment = courseId ? enrollments?.find((e) => e.courseId === courseId) : undefined;
  const learnLessonId = enrollment?.resumeLessonId ?? enrollment?.firstLessonId ?? null;
  useEffect(() => {
    if (learnLessonId) router.replace(`/learn/${learnLessonId}?tab=materials`);
  }, [learnLessonId, router]);

  if (!courseId) {
    return (
      <div className="min-h-dvh bg-surface p-8">
        <div className="shell text-center py-20">
          <p className="text-ink-muted mb-4">{t('notFound')}</p>
          <Link href="/courses" className="text-accent hover:underline font-semibold">
            {t('backToCourses')}
          </Link>
        </div>
      </div>
    );
  }

  if (loadingEnrollments || learnLessonId) {
    return <MaterialsFallback />;
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="shell py-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/courses'))}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            {t('back')}
          </button>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">{t('title')}</h1>
          <p className="mt-2 text-ink-muted">{t('subtitle')}</p>
        </div>

        <MaterialManager courseId={courseId} />
      </div>
    </div>
  );
}

function MaterialsFallback() {
  const t = useTranslations('pages.materials');
  return <div className="min-h-dvh bg-surface p-8 text-center text-ink-muted">{t('loading')}</div>;
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<MaterialsFallback />}>
      <MaterialsContent />
    </Suspense>
  );
}