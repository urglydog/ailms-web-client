'use client';

import { useParams } from 'next/navigation';
import { CourseResourcesManager } from '@/components/instructor/CourseResourcesManager';

export default function CourseResourcesPage() {
  const params = useParams<{ id: string }>();
  return <CourseResourcesManager courseId={Number(params.id)} />;
}
