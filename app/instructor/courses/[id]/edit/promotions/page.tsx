'use client';

import { useParams } from 'next/navigation';
import { CoursePromotionsPanel } from '@/components/instructor/edit/CoursePromotionsPanel';

export default function CoursePromotionsPage() {
  const params = useParams<{ id: string }>();
  return <CoursePromotionsPanel courseId={Number(params.id)} />;
}
