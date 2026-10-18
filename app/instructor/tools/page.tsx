'use client';

import { useTranslations } from 'next-intl';
import { ToolCard } from '@/components/instructor/tools/ToolCard';
import { TOOLS } from '@/components/instructor/tools/tools';

/** "Công cụ" — trang trung tâm dạng thẻ gom các công cụ phụ trợ của giảng viên (Live, Mã giảm giá, Gói khóa học). Các mục
 * này trước đây nằm rời ở thanh bên; gom lại giúp thanh bên gọn và dễ tìm công cụ hơn. */
export default function InstructorToolsPage() {
  const t = useTranslations('instructor.tools');
  return (
    <>
      <div>
        <h1 className="m-0 font-display text-[22px] font-bold text-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </>
  );
}
