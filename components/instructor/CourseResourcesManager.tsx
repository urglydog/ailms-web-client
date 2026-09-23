'use client';

import { useRef, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Presentation, FileArchive, File as FileIcon, Trash2, UploadCloud } from 'lucide-react';
import { courseResourcesApi, type CourseResource } from '@/lib/api/courseResourcesApi';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/** Cùng bộ icon-theo-loại-file với `CourseResourcesTab.tsx` (phía học viên) — giữ nhất quán. */
function getFileVisual(fileType: string): { Icon: typeof FileText; bg: string; text: string; label: string } {
  if (fileType.includes('pdf')) return { Icon: FileText, bg: 'bg-danger/10', text: 'text-danger', label: 'PDF' };
  if (fileType.includes('word') || fileType.includes('document')) return { Icon: FileText, bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Word' };
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return { Icon: Presentation, bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'PowerPoint' };
  if (fileType.includes('zip') || fileType.includes('rar')) return { Icon: FileArchive, bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'Nén' };
  return { Icon: FileIcon, bg: 'bg-surface-hover', text: 'text-ink-muted', label: fileType.split('/')[1] || fileType };
}

/**
 * Task (23/09/2026) — thay cho `StaticResourcesPanel`/`UploadStaticMaterialModal` (modal-mở-modal
 * chật hẹp, max-w-lg/max-w-md). Giờ là nội dung chính của 1 trang riêng
 * (`app/instructor/courses/[id]/edit/resources/page.tsx`), có khu kéo-thả upload thật (HTML5 DnD
 * thuần, cùng pattern đã dùng ở `TutorEmbedded.tsx` — không cần thêm thư viện).
 */
export function CourseResourcesManager({ courseId }: { courseId: number }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['course-resources', courseId],
    queryFn: () => courseResourcesApi.getCourseResources(courseId),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => courseResourcesApi.uploadResource(courseId, files),
    onSuccess: (data) => {
      if (data.failures && data.failures.length > 0) {
        toast.warning(`Đã tải lên ${data.successes.length} file. ${data.failures.length} file bị lỗi (sai định dạng).`);
      } else {
        toast.success(`Đã tải lên ${data.successes.length} tài nguyên thành công`);
      }
      queryClient.invalidateQueries({ queryKey: ['course-resources', courseId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi khi tải lên file'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => courseResourcesApi.deleteResource(id),
    onSuccess: () => {
      toast.success('Đã xoá tài nguyên tĩnh');
      queryClient.invalidateQueries({ queryKey: ['course-resources', courseId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi khi xoá tài nguyên'),
  });

  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    uploadMutation.mutate(list);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-ink">Tài nguyên tĩnh toàn khoá học</h2>
        <p className="text-sm text-ink-muted mt-0.5">PDF, slide, tài liệu dùng chung cho cả khoá — tách biệt học liệu từng chương.</p>
      </div>

      {/* Khu kéo-thả upload — HTML5 DnD thuần, cùng pattern đã dùng ở TutorEmbedded.tsx */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-accent bg-accent/5' : 'border-line hover:border-line-dot hover:bg-surface-hover'
        }`}
      >
        <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-accent' : 'text-ink-faint'}`} strokeWidth={1.5} />
        <p className="text-sm font-semibold text-ink">
          {uploadMutation.isPending ? 'Đang tải lên...' : 'Kéo-thả file vào đây, hoặc bấm để chọn file'}
        </p>
        <p className="text-xs text-ink-faint">Hỗ trợ PDF, Word, PowerPoint, ZIP</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          disabled={uploadMutation.isPending}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Danh sách tài nguyên đã tải */}
      <div className="flex flex-col gap-2">
        {isLoading && <div className="text-center text-sm text-ink-muted py-8">Đang tải...</div>}
        {!isLoading && (!resources || resources.length === 0) && (
          <div className="text-center text-sm text-ink-muted py-8">Chưa có tài nguyên tĩnh nào cho khoá học này.</div>
        )}
        {resources?.map((res: CourseResource) => {
          const { Icon, bg, text, label } = getFileVisual(res.fileType);
          return (
            <div key={res.id} className="flex items-center gap-3 px-4 py-3 rounded-card border border-line bg-surface-raised">
              <div className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${bg} ${text}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{res.title}</p>
                <p className="text-[11px] text-ink-muted">{label} · {formatBytes(res.fileSize)}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(res.id)}
                disabled={deleteMutation.isPending}
                className="shrink-0 p-1.5 rounded-card text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                title="Xoá tài nguyên"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
