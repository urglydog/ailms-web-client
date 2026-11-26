'use client';

import { useParams } from 'next/navigation';
import { CourseGoalsForm } from '@/components/instructor/edit/CourseGoalsForm';

/** "Học viên mục tiêu" — bước Lập kế hoạch của trình soạn khoá học (26/11/2026). */
export default function CourseGoalsPage() {
  const params = useParams<{ id: string }>();
  return <CourseGoalsForm courseId={Number(params.id)} />;
}
