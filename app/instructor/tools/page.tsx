'use client';

import { useTranslations } from 'next-intl';
import { ToolCard } from '@/components/instructor/tools/ToolCard';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { TOOLS } from '@/components/instructor/tools/tools';

/** "Công cụ" — trang trung tâm dạng thẻ gom các công cụ phụ trợ của giảng viên (Live, Mã giảm giá, Gói khóa học). Các mục
 * này trước đây nằm rời ở thanh bên; gom lại giúp thanh bên gọn và dễ tìm công cụ hơn. */
export default function InstructorToolsPage() {
  const t = useTranslations('instructor.tools');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </>
  );
}
