'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';

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
        <div className="text-4xl mb-4">🗂️</div>
        <h4 className="text-lg font-bold mb-2">Chưa có tài nguyên tĩnh</h4>
        <p className="text-ink-muted">Giảng viên chưa đăng tải tài liệu đính kèm nào (PDF, ZIP,...) cho khóa học này.</p>
      </div>
    );
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <span className="text-xl">📄</span>;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) return <span className="text-xl">📦</span>;
    if (fileType.includes('image')) return <span className="text-xl">🖼️</span>;
    return <span className="text-xl">📁</span>;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">Tài nguyên đính kèm</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(res => (
          <a
            key={res.id}
            href={res.fileUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-start gap-4 p-4 card hover:border-accent hover:shadow-md transition-all group"
          >
            <div className="p-3 rounded-xl bg-surface-hover group-hover:bg-accent/10 transition-colors">
              {getFileIcon(res.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate group-hover:text-accent transition-colors" title={res.title}>
                {res.title}
              </h4>
              <p className="text-xs text-ink-muted mt-1 flex justify-between items-center">
                <span>{formatBytes(res.fileSize)}</span>
                <span className="uppercase">{res.fileType.split('/')[1] || res.fileType}</span>
              </p>
            </div>
            <div className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all shrink-0 mt-2">↗</div>
          </a>
        ))}
      </div>
    </div>
  );
}
