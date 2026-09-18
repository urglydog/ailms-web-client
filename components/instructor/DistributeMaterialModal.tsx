import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { toast } from 'sonner';
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
      setTargetId(material.assignments?.find(a => a.chapterId)?.chapterId || '');
    } else if (material.assignments?.some(a => a.lessonId)) {
      setLevel('LESSON');
      setTargetId(material.assignments?.find(a => a.lessonId)?.lessonId || '');
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
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        <div className="bg-blue-50 p-5 border-b border-blue-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2">
              <span>📎</span> Phân phối Học liệu
            </h3>
            <p className="text-xs text-blue-700 mt-1">
              Học liệu: <strong>{material.title}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 bg-gray-50/30">
          <div className="flex flex-col gap-4">
            {/* Cấp khóa học */}
            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${level === 'COURSE' ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-200'}`}>
              <input 
                type="radio" 
                name="distribute_selection"
                checked={level === 'COURSE'}
                onChange={() => { setLevel('COURSE'); setTargetId(null); }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-gray-800">[Cấp Khóa học] Không đính kèm cụ thể vào bài nào</span>
            </label>

            {/* Cấp chương và bài học */}
            {chapters?.map((chapter, cIdx) => (
              <div key={chapter.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <label className={`flex items-center gap-3 px-4 py-3 border-b border-gray-200 cursor-pointer transition-colors ${level === 'CHAPTER' && targetId === chapter.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-blue-50/50'}`}>
                  <input 
                    type="radio" 
                    name="distribute_selection"
                    checked={level === 'CHAPTER' && targetId === chapter.id}
                    onChange={() => { setLevel('CHAPTER'); setTargetId(chapter.id); }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-gray-800">Chương {cIdx + 1}: {chapter.title} (Gán cho toàn chương)</span>
                </label>
                
                <div className="flex flex-col">
                  {chapter.lessons.map((lesson, lIdx) => (
                    <label key={lesson.id} className="flex items-center gap-3 p-3 border-b last:border-0 border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ml-6">
                      <input 
                        type="radio" 
                        name="distribute_selection"
                        checked={level === 'LESSON' && targetId === lesson.id}
                        onChange={() => selectLesson(lesson.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Bài {lIdx + 1}: {lesson.title}</span>
                    </label>
                  ))}
                  {chapter.lessons.length === 0 && (
                    <div className="p-3 text-xs text-gray-400 italic text-center ml-6">Chưa có bài học nào trong chương này</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => attachMutation.mutate()}
            disabled={attachMutation.isPending}
            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {attachMutation.isPending ? 'Đang lưu...' : 'Lưu Phân Phối'}
          </button>
        </div>
      </div>
    </div>
  );
}
