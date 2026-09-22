'use client';

import { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch only Official Materials for the current course
  const { data: materials, isLoading } = useQuery({
    queryKey: ['official-materials', courseId],
    queryFn: () => materialsApi.getInstructorMaterials(courseId),
    enabled: !!courseId,
  });

  const attachLessonMutation = useMutation({
    mutationFn: (variables: { id: number; lessonId: number }) =>
      materialsApi.attachMaterial(variables.id, { lessonId: variables.lessonId, chapterId: null }),
    onSuccess: () => {
      toast.success('Đã cập nhật đính kèm học liệu!');
      queryClient.invalidateQueries({ queryKey: ['official-materials', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi cập nhật đính kèm')
  });

  const unassignMutation = useMutation({
    mutationFn: (assignmentId: number) => materialsApi.deleteAssignment(assignmentId),
    onSuccess: () => {
      toast.success('Đã hủy gán học liệu!');
      queryClient.invalidateQueries({ queryKey: ['official-materials', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi hủy gán học liệu')
  });

  const officialMaterials = materials?.filter(m => m.isOfficial) || [];
  
  const filteredMaterials = officialMaterials.filter(mat => 
    !searchTerm || (mat.title && mat.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const attachedMaterials = filteredMaterials.filter(mat => mat.assignments?.some(a => a.lessonId === lesson.id));
  const otherMaterials = filteredMaterials.filter(mat => (!mat.assignments || !mat.assignments.some(a => a.lessonId === lesson.id)));
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
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
              <p className="text-xs text-gray-500 mt-1">Hãy vào &quot;Quản lý Học liệu Official&quot; để tạo và phát hành học liệu trước.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm học liệu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
                />
              </div>

              {attachedMaterials.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">Đã gán cho bài học này:</div>
                  {attachedMaterials.map(mat => (
                    <div key={mat.id} className="flex items-center justify-between p-4 rounded-xl border border-purple-300 bg-purple-50 shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase ${mat.materialType === 'MINDMAP' ? 'bg-blue-50 text-blue-700 border border-blue-100' : mat.materialType === 'FLASHCARD' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                          {mat.materialType === 'QUIZ' && mat.quizType === 'LECTURE_QUIZ' ? 'QUICK CHECK' : mat.materialType}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{mat.title || 'Học liệu không tên'}</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          const assignmentId = mat.assignments?.find(a => a.lessonId === lesson.id)?.id;
                          if (assignmentId) unassignMutation.mutate(assignmentId);
                        }}
                        disabled={unassignMutation.isPending}
                        className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                      >
                        Hủy gán
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {otherMaterials.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">Học liệu khác:</div>
                  {otherMaterials.map(mat => {
                    const isAttachedToOther = (mat.assignments && mat.assignments.some(a => a.lessonId)) && (!mat.assignments || !mat.assignments.some(a => a.lessonId === lesson.id));
                    
                    return (
                      <div key={mat.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-purple-200 transition-all">
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
                          onClick={() => attachLessonMutation.mutate({ id: mat.id, lessonId: lesson.id })}
                          disabled={attachLessonMutation.isPending}
                          className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-purple-700 border border-purple-300 hover:bg-purple-50 disabled:opacity-50"
                        >
                          Gán vào bài này
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {filteredMaterials.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Không tìm thấy học liệu nào phù hợp với tìm kiếm.
                </div>
              )}
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
