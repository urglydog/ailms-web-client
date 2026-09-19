'use client';

import { useParams } from 'next/navigation';
import { ChapterEditorList } from '@/components/instructor/ChapterEditorList';
import { useMyCourseDetail } from '@/hooks/useCourses';

export default function CourseCurriculumPage() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);
  const { data: course } = useMyCourseDetail(courseId);

  if (!course) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="m-0 font-display text-[16px] font-bold text-gray-900">Chương trình giảng dạy</h2>
      <ChapterEditorList courseId={course.id} courseSlug={course.slug} chapters={course.chapters} />
    </div>
  );
}
