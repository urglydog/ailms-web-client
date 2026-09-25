'use client';

import { useParams } from 'next/navigation';
import { CourseProctoringManager } from '@/components/instructor/CourseProctoringManager';

export default function CourseProctoringPage() {
  const params = useParams<{ id: string }>();
  return <CourseProctoringManager courseId={Number(params.id)} />;
}
