'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { materialsApi } from '@/lib/api/materials';
import { History, Eye, RotateCcw, X } from 'lucide-react';
import { MaterialBadge } from '@/components/materials/ui/MaterialBadge';

interface VersionHistoryModalProps {
  courseId: number;
  materialId: number;
  onClose: () => void;
  onInspect: (id: number, readOnly?: boolean) => void;
}

export function VersionHistoryModal({ courseId, materialId, onClose, onInspect }: VersionHistoryModalProps) {
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ['material-versions', materialId],
    queryFn: () => materialsApi.getVersionHistory(materialId),
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: number) => materialsApi.restoreVersion(versionId),
    onSuccess: (res) => {
      toast.success('Đã khôi phục nội dung phiên bản cũ thành phiên bản mới nhất');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      queryClient.invalidateQueries({ queryKey: ['material-versions', materialId] });
      onClose();
      if (res.id) onInspect(res.id);
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể khôi phục phiên bản'),
  });

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-raised rounded-card max-w-lg w-full p-5 shadow-card-hover border border-line max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <History className="w-4 h-4 text-ink-muted" /> Lịch sử phiên bản
          </h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col gap-2">
          {isLoading && <div className="text-sm text-ink-muted text-center py-6">Đang tải...</div>}
          {!isLoading && (versions?.length ?? 0) === 0 && (
            <div className="text-sm text-ink-muted text-center py-6">Chưa có lịch sử phiên bản nào.</div>
          )}
          {versions?.map(v => (
            <div
              key={v.id}
              className={`flex items-center justify-between px-3 py-2.5 rounded-card border transition-colors ${
                v.isActive ? 'border-success/30 bg-success/5' : 'border-line bg-surface-raised'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">V{v.displayVersionNo}</span>
                  {v.isActive && <MaterialBadge tone="success">Đang dùng</MaterialBadge>}
                </div>
                <p className="text-xs text-ink-muted truncate">{v.title || 'Học liệu không tên'}</p>
                <p className="text-[10px] text-ink-faint">
                  {new Date(v.createdAt).toLocaleString('vi-VN')}{v.createdBy ? ` · ${v.createdBy}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => { onClose(); onInspect(v.id, true); }}
                  title="Xem phiên bản này (chỉ đọc)"
                  className="p-1.5 rounded-card hover:bg-accent/10 text-accent transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!v.isActive && (
                  <button
                    onClick={() => restoreMutation.mutate(v.id)}
                    disabled={restoreMutation.isPending}
                    title="Khôi phục nội dung này thành phiên bản mới nhất"
                    className="p-1.5 rounded-card hover:bg-star/10 text-star transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
