'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';
import { FileText, Presentation, FileArchive, File as FileIcon, Download, FolderOpen } from 'lucide-react';

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

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/** Icon + màu theo đúng 8 MIME type backend cho phép (InstructorResourceController.
 * ALLOWED_MIME_TYPES) — để phân biệt loại file ngay từ cái nhìn đầu tiên thay vì icon xám
 * đồng nhất. */
function getFileVisual(fileType: string): { Icon: typeof FileText; bg: string; text: string; label: string } {
  if (fileType.includes('pdf')) return { Icon: FileText, bg: 'bg-danger/10', text: 'text-danger', label: 'PDF' };
  if (fileType.includes('word') || fileType.includes('document')) return { Icon: FileText, bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Word' };
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return { Icon: Presentation, bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'PowerPoint' };
  if (fileType.includes('zip') || fileType.includes('rar')) return { Icon: FileArchive, bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'Nén' };
  return { Icon: FileIcon, bg: 'bg-surface-hover', text: 'text-ink-muted', label: fileType.split('/')[1] || fileType };
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
