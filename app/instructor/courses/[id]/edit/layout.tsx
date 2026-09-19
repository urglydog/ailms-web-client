'use client';

import { useParams } from 'next/navigation';
import { EditCourseLayout } from '@/components/instructor/edit/EditCourseLayout';

export default function CourseEditLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);

  return <EditCourseLayout courseId={courseId}>{children}</EditCourseLayout>;
}
