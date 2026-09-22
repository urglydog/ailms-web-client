'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Package, Image as ImageIcon, File, Trash2, Plus, X } from 'lucide-react';
import { courseResourcesApi } from '@/lib/api/courseResourcesApi';
import { UploadStaticMaterialModal } from './UploadStaticMaterialModal';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return <FileText className="w-4 h-4" strokeWidth={1.75} />;
  if (fileType.includes('zip') || fileType.includes('rar')) return <Package className="w-4 h-4" strokeWidth={1.75} />;
  if (fileType.includes('image')) return <ImageIcon className="w-4 h-4" strokeWidth={1.75} />;
  return <File className="w-4 h-4" strokeWidth={1.75} />;
}

/** Task B1 (UpComming_Plan.md) — hạ tầng tài nguyên tĩnh toàn khoá học đã có sẵn (BE + tab học
 * viên + modal upload), chỉ thiếu nơi mở modal đó phía giảng viên. Panel này là đúng chỗ thiếu:
 * liệt kê tài nguyên đã tải + nút mở lại UploadStaticMaterialModal đã viết sẵn + nút xoá. */
export function StaticResourcesPanel({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['course-resources', courseId],
    queryFn: () => courseResourcesApi.getCourseResources(courseId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => courseResourcesApi.deleteResource(id),
    onSuccess: () => {
      toast.success('Đã xoá tài nguyên tĩnh');
      queryClient.invalidateQueries({ queryKey: ['course-resources', courseId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi khi xoá tài nguyên'),
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-raised rounded-card max-w-lg w-full shadow-card-hover border border-line max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="font-display text-base font-bold text-ink">Tài nguyên tĩnh toàn khoá học</h2>
            <p className="text-xs text-ink-muted mt-0.5">PDF, slide, tài liệu dùng chung cho cả khoá — tách biệt học liệu từng chương.</p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && <div className="text-center text-sm text-ink-muted py-8">Đang tải...</div>}
          {!isLoading && (!resources || resources.length === 0) && (
            <div className="text-center text-sm text-ink-muted py-8">Chưa có tài nguyên tĩnh nào cho khoá học này.</div>
          )}
          <div className="flex flex-col gap-2">
            {resources?.map((res) => (
              <div key={res.id} className="flex items-center gap-3 px-3 py-2.5 rounded-card border border-line bg-surface-hover">
                <div className="text-ink-muted shrink-0">{getFileIcon(res.fileType)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{res.title}</p>
                  <p className="text-[11px] text-ink-faint">{formatBytes(res.fileSize)}</p>
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
            ))}
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-line">
          <button
            onClick={() => setShowUpload(true)}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-card text-sm font-bold border border-accent/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tải Lên Tài Nguyên Mới
          </button>
        </div>
      </div>

      {showUpload && (
        <UploadStaticMaterialModal
          courseId={courseId}
          onClose={() => {
            setShowUpload(false);
            queryClient.invalidateQueries({ queryKey: ['course-resources', courseId] });
          }}
        />
      )}
    </div>
  );
}
