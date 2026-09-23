import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { toast } from 'sonner';
import { Share2, X } from 'lucide-react';
import type { InstructorMaterial } from '@/lib/api/materials';
import type { Chapter } from '@/types/domain';

interface Props {
  courseId: number;
  material: InstructorMaterial;
  chapters: Chapter[];
  onClose: () => void;
}

export function DistributeMaterialModal({ courseId, material, chapters, onClose }: Props) {
  const queryClient = useQueryClient();
  const [level, setLevel] = useState<'COURSE' | 'CHAPTER' | 'LESSON'>('COURSE');
  const [targetId, setTargetId] = useState<number | null>(null);

  useEffect(() => {
    if (material.assignments?.some(a => a.chapterId)) {
      setLevel('CHAPTER');
      setTargetId(material.assignments?.find(a => a.chapterId)?.chapterId || null);
    } else if (material.assignments?.some(a => a.lessonId)) {
      setLevel('LESSON');
      setTargetId(material.assignments?.find(a => a.lessonId)?.lessonId || null);
    } else {
      setLevel('COURSE');
      setTargetId(null);
    }
  }, [material]);

  const attachMutation = useMutation({
    mutationFn: () => materialsApi.attachMaterial(material.id, {
      chapterId: level === 'CHAPTER' ? targetId : null,
      lessonId: level === 'LESSON' ? targetId : null,
    }),
    onSuccess: () => {
      toast.success('Đã cập nhật phân phối học liệu');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi cập nhật phân phối')
  });

  const selectLesson = (id: number) => {
    setLevel('LESSON');
    setTargetId(id);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface-raised rounded-card max-w-lg w-full shadow-card-hover overflow-hidden border border-line flex flex-col max-h-[85vh]">
        <div className="bg-accent/5 p-5 border-b border-accent/15 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <Share2 className="w-4 h-4 text-accent" strokeWidth={1.75} /> Phân phối Học liệu
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Học liệu: <strong>{material.title}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-surface">
          <div className="flex flex-col gap-4">
            {/* Cấp khóa học */}
            <label className={`flex items-center gap-3 p-4 rounded-card border cursor-pointer transition-all ${level === 'COURSE' ? 'border-accent bg-accent/5 shadow-card' : 'border-line bg-surface-raised hover:border-accent/30'}`}>
              <input
                type="radio"
                name="distribute_selection"
                checked={level === 'COURSE'}
                onChange={() => { setLevel('COURSE'); setTargetId(null); }}
                className="w-4 h-4 text-accent focus:ring-accent"
              />
              <span className="text-sm font-bold text-ink">[Cấp Khóa học] Không đính kèm cụ thể vào bài nào</span>
            </label>

            {/* Cấp chương và bài học */}
            {chapters?.map((chapter, cIdx) => (
              <div key={chapter.id} className="border border-line rounded-card overflow-hidden bg-surface-raised shadow-card">
                <label className={`flex items-center gap-3 px-4 py-3 border-b border-line cursor-pointer transition-colors ${level === 'CHAPTER' && targetId === chapter.id ? 'bg-accent/10' : 'bg-surface hover:bg-accent/5'}`}>
                  <input
                    type="radio"
                    name="distribute_selection"
                    checked={level === 'CHAPTER' && targetId === chapter.id}
                    onChange={() => { setLevel('CHAPTER'); setTargetId(chapter.id); }}
                    className="w-4 h-4 text-accent focus:ring-accent"
                  />
                  <span className="text-sm font-bold text-ink">Chương {cIdx + 1}: {chapter.title} (Gán cho toàn chương)</span>
                </label>

                <div className="flex flex-col">
                  {chapter.lessons.map((lesson, lIdx) => (
                    <label key={lesson.id} className="flex items-center gap-3 p-3 border-b last:border-0 border-line-soft cursor-pointer transition-colors hover:bg-surface-hover ml-6">
                      <input
                        type="radio"
                        name="distribute_selection"
                        checked={level === 'LESSON' && targetId === lesson.id}
                        onChange={() => selectLesson(lesson.id)}
                        className="w-4 h-4 text-accent focus:ring-accent"
                      />
                      <span className="text-sm font-medium text-ink">Bài {lIdx + 1}: {lesson.title}</span>
                    </label>
                  ))}
                  {chapter.lessons.length === 0 && (
                    <div className="p-3 text-xs text-ink-muted italic text-center ml-6">Chưa có bài học nào trong chương này</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-line bg-surface-raised flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-ink bg-surface-raised border border-line hover:bg-surface-hover rounded-card transition-colors shadow-card"
          >
            Hủy
          </button>
          <button
            onClick={() => attachMutation.mutate()}
            disabled={attachMutation.isPending}
            className="px-5 py-2.5 text-sm font-bold text-white bg-accent hover:bg-accent-dark rounded-card transition-colors shadow-card disabled:opacity-50"
          >
            {attachMutation.isPending ? 'Đang lưu...' : 'Lưu Phân Phối'}
          </button>
        </div>
      </div>
    </div>
  );
}
