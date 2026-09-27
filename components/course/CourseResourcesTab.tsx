'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';
import { Download, FolderOpen } from 'lucide-react';
import { getFileVisual, formatBytes } from '@/lib/resourceFileVisual';

interface Resource {
  id: number;
  title: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  chapterId: number | null;
  lessonId: number | null;
  createdAt: string;
}

export function CourseResourcesTab({ courseId }: { courseId: number }) {
  const { data: resources, isLoading, error } = useQuery<Resource[]>({
    queryKey: ['student', 'course-resources', courseId],
    queryFn: async () => {
      return await api.get<Resource[]>(`/api/v1/student/courses/${courseId}/resources`);
    }
  });

  if (isLoading) return <div className="py-10 text-center"><Spinner className="mx-auto" /></div>;
  if (error) return <div className="py-10 text-center text-red-500">Lỗi khi tải tài nguyên khoá học.</div>;
  if (!resources || resources.length === 0) {
    return (
      <div className="py-12 text-center card bg-surface-hover border-dashed border-2">
        <FolderOpen className="w-10 h-10 mx-auto mb-4 text-ink-faint" strokeWidth={1.5} />
        <h4 className="text-lg font-bold mb-2">Chưa có tài nguyên tĩnh</h4>
        <p className="text-ink-muted">Giảng viên chưa đăng tải tài liệu đính kèm nào (PDF, ZIP,...) cho khóa học này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">Tài nguyên đính kèm</h3>
      {/* Danh sách dọc gọn (không phải lưới thẻ to) — không tràn trang dù có nhiều tài nguyên. */}
      <div className="flex flex-col rounded-card border border-line divide-y divide-line-soft overflow-hidden">
        {resources.map(res => {
          const { Icon, bg, text, label } = getFileVisual(res.fileType);
          return (
            <a
              key={res.id}
              href={res.fileUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-3 px-4 py-3 bg-surface-raised hover:bg-surface-hover transition-colors group"
            >
              <div className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${bg} ${text}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink truncate group-hover:text-accent transition-colors" title={res.title}>
                  {res.title}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {label} · {formatBytes(res.fileSize)}
                </p>
              </div>
              <Download className="w-4 h-4 text-ink-faint group-hover:text-accent transition-colors shrink-0" strokeWidth={1.75} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
