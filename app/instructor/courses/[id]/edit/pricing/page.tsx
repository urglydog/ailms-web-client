'use client';

import { useParams } from 'next/navigation';
import { CoursePricingForm } from '@/components/instructor/edit/CoursePricingForm';

export default function CoursePricingPage() {
  const params = useParams<{ id: string }>();
  return <CoursePricingForm courseId={Number(params.id)} />;
}
