'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { toast } from 'sonner';
import type { LessonEditItem } from '@/types/domain';

interface LessonMaterialAttachModalProps {
  courseId: number;
  lesson: LessonEditItem;
  onClose: () => void;
}

export function LessonMaterialAttachModal({ courseId, lesson, onClose }: LessonMaterialAttachModalProps) {
  const queryClient = useQueryClient();

  // Fetch only Official Materials for the current course
  const { data: materials, isLoading } = useQuery({
    queryKey: ['official-materials', courseId],
    queryFn: () => materialsApi.getInstructorMaterials(courseId),
    enabled: !!courseId,
  });

  const attachLessonMutation = useMutation({
    mutationFn: (variables: { id: number; lessonId: number | null }) => 
      materialsApi.attachMaterialToLesson(variables.id, variables.lessonId),
    onSuccess: () => {
      toast.success('Đã cập nhật đính kèm học liệu!');
      queryClient.invalidateQueries({ queryKey: ['official-materials', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi cập nhật đính kèm')
  });

  const officialMaterials = materials?.filter(m => m.isOfficial) || [];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-purple-50 p-5 border-b border-purple-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-purple-950 flex items-center gap-2">
              <span>📎</span> Đính kèm Học liệu vào Bài học
            </h3>
            <p className="text-xs text-purple-700 mt-1">
              Bài học đang chọn: <strong className="text-purple-900">{lesson.title}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white w-8 h-8 rounded-full flex items-center justify-center border border-gray-200">✕</button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-gray-50/30">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500 text-sm">Đang tải danh sách học liệu Official...</div>
          ) : officialMaterials.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">📚</div>
              <p className="text-sm font-bold text-gray-700">Chưa có học liệu Official nào</p>
              <p className="text-xs text-gray-500 mt-1">Hãy vào "Quản lý Học liệu Official" để tạo và phát hành học liệu trước.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chọn học liệu để đính kèm (có thể đính kèm nhiều):</div>
              {officialMaterials.map(mat => {
                const isAttachedToThis = mat.lessonId === lesson.id;
                const isAttachedToOther = mat.lessonId !== null && mat.lessonId !== lesson.id;
                
                return (
                  <div key={mat.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isAttachedToThis ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-gray-200 bg-white hover:border-purple-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase ${mat.materialType === 'MINDMAP' ? 'bg-blue-50 text-blue-700 border border-blue-100' : mat.materialType === 'FLASHCARD' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                        {mat.materialType === 'QUIZ' && mat.quizType === 'LECTURE_QUIZ' ? 'QUICK CHECK' : mat.materialType}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{mat.title || 'Học liệu không tên'}</div>
                        {isAttachedToOther && (
                          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">⚠️ Đang gán cho bài học khác</div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        attachLessonMutation.mutate({
                          id: mat.id,
                          lessonId: isAttachedToThis ? null : lesson.id
                        });
                      }}
                      disabled={attachLessonMutation.isPending}
                      className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isAttachedToThis 
                          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                          : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50'
                      } disabled:opacity-50`}
                    >
                      {isAttachedToThis ? 'Hủy gán' : 'Gán vào bài này'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
          >
            Đóng cửa sổ
          </button>
        </div>
        
      </div>
    </div>
  );
}
