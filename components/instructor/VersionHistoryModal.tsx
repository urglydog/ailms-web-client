'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { materialsApi } from '@/lib/api/materials';
import { History, Eye, RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { MaterialBadge } from '@/components/materials/ui/MaterialBadge';

interface VersionHistoryModalProps {
  courseId: number;
  materialId: number;
  onClose: () => void;
  onInspect: (id: number, readOnly?: boolean) => void;
}

export function VersionHistoryModal({ courseId, materialId, onClose, onInspect }: VersionHistoryModalProps) {
  const t = useTranslations('instructor.common');
  const tv = useTranslations('instructor.versionHistory');
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ['material-versions', materialId],
    queryFn: () => materialsApi.getVersionHistory(materialId),
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: number) => materialsApi.restoreVersion(versionId),
    onSuccess: (res) => {
      toast.success(tv('restored'));
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      queryClient.invalidateQueries({ queryKey: ['material-versions', materialId] });
      onClose();
      if (res.id) onInspect(res.id);
    },
    onError: (err: Error) => toast.error(err.message || tv('restoreError')),
  });

  return (
    <Modal
      open
      onClose={onClose}
      zClass="z-[100000]"
      closeLabel={t('close')}
      title={
        <span className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-ink-muted" aria-hidden /> {tv('title')}
        </span>
      }
    >
        <div className="flex flex-col gap-2">
          {isLoading && <div className="text-sm text-ink-muted text-center py-6">{tv('loading')}</div>}
          {!isLoading && (versions?.length ?? 0) === 0 && (
            <div className="text-sm text-ink-muted text-center py-6">{tv('empty')}</div>
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
                  {v.isActive && <MaterialBadge tone="success">{tv('active')}</MaterialBadge>}
                </div>
                <p className="text-xs text-ink-muted truncate">{v.title || tv('untitled')}</p>
                <p className="text-[10px] text-ink-faint">
                  {new Date(v.createdAt).toLocaleString('vi-VN')}{v.createdBy ? ` · ${v.createdBy}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => { onClose(); onInspect(v.id, true); }}
                  title={tv('viewTitle')}
                  className="p-1.5 rounded-card hover:bg-accent/10 text-accent transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!v.isActive && (
                  <button
                    onClick={() => restoreMutation.mutate(v.id)}
                    disabled={restoreMutation.isPending}
                    title={tv('restoreTitle')}
                    className="p-1.5 rounded-card hover:bg-star/10 text-star transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
    </Modal>
  );
}
