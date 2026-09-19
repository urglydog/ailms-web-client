'use client';

import { useParams } from 'next/navigation';
import { CourseBasicsForm } from '@/components/instructor/edit/CourseBasicsForm';

export default function CourseBasicsPage() {
  const params = useParams<{ id: string }>();
  return <CourseBasicsForm courseId={Number(params.id)} />;
}
