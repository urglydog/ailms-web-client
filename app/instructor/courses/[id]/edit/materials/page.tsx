'use client';

import { useParams } from 'next/navigation';
import { CourseMaterialsManager } from '@/components/instructor/CourseMaterialsManager';

export default function CourseMaterialsPage() {
  const params = useParams<{ id: string }>();
  return <CourseMaterialsManager courseId={Number(params.id)} />;
}
