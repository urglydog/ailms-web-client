'use client';

import { useParams } from 'next/navigation';
import { CourseBuilderForm } from '@/components/instructor/CourseBuilderForm';

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);

  return <CourseBuilderForm courseId={courseId} />;
}
