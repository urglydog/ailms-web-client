'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { toast } from 'sonner';
import React, { useState } from 'react';

interface CourseMaterialsManagerProps {
  courseId: number;
}

export function CourseMaterialsManager({ courseId }: CourseMaterialsManagerProps) {
  const queryClient = useQueryClient();
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['instructor-materials', courseId],
    queryFn: () => materialsApi.getInstructorMaterials(courseId),
    enabled: !!courseId,
  });

  const toggleMindmapMutation = useMutation({
    mutationFn: (variables: { id: number; isOfficial: boolean }) =>
      materialsApi.setMindmapOfficial(variables.id, variables.isOfficial),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái Mindmap');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
  });

  const toggleFlashcardMutation = useMutation({
    mutationFn: (variables: { id: number; isOfficial: boolean }) =>
      materialsApi.setFlashcardOfficial(variables.id, variables.isOfficial),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái Flashcard');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
  });

  const updateQuizSettingsMutation = useMutation({
    mutationFn: (variables: { id: number; data: any }) =>
      materialsApi.updateQuizSettings(variables.id, variables.data),
    onSuccess: () => {
      toast.success('Đã cập nhật cấu hình Quiz');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      setSelectedQuiz(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi cập nhật Quiz');
    }
  });

  if (isLoading) return <div className="p-4 text-center text-sm text-gray-500">Đang tải danh sách học liệu...</div>;

  return (
    <div className="flex flex-col gap-4">
      {materials?.map((mat, idx) => (
        <div key={idx} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                mat.materialType === 'MINDMAP' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                mat.materialType === 'FLASHCARD' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                'bg-orange-50 text-orange-700 ring-orange-600/20'
              }`}>
                {mat.materialType}
              </span>
              <span className="text-sm font-semibold text-gray-900">{mat.title || 'Học liệu không tên'}</span>
            </div>
            
            {mat.status === 'COMPLETED' && mat.materialId && (
              <div className="flex items-center gap-2">
                {mat.materialType !== 'QUIZ' && (
                  <button
                    onClick={() => {
                      if (mat.materialType === 'MINDMAP') {
                        toggleMindmapMutation.mutate({ id: mat.materialId, isOfficial: !mat.isOfficial });
                      } else if (mat.materialType === 'FLASHCARD') {
                        toggleFlashcardMutation.mutate({ id: mat.materialId, isOfficial: !mat.isOfficial });
                      }
                    }}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset ${
                      mat.isOfficial 
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-300 hover:bg-emerald-100' 
                        : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {mat.isOfficial ? '★ Đang là Official' : '☆ Đánh dấu Official'}
                  </button>
                )}
                
                {mat.materialType === 'QUIZ' && (
                  <button
                    onClick={() => setSelectedQuiz(mat)}
                    className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cấu hình Quiz
                  </button>
                )}
              </div>
            )}
            {mat.status !== 'COMPLETED' && (
              <span className="text-xs text-gray-500 italic">Trạng thái: {mat.status}</span>
            )}
          </div>
        </div>
      ))}
      {(!materials || materials.length === 0) && (
        <div className="p-8 text-center text-sm text-gray-500">Chưa có học liệu AI nào được sinh cho khóa học này.</div>
      )}

      {selectedQuiz && (
        <QuizSettingsModal 
          quiz={selectedQuiz} 
          onClose={() => setSelectedQuiz(null)} 
          onSave={(data) => updateQuizSettingsMutation.mutate({ id: selectedQuiz.materialId, data })}
          isSaving={updateQuizSettingsMutation.isPending}
        />
      )}
    </div>
  );
}

function QuizSettingsModal({ quiz, onClose, onSave, isSaving }: { quiz: any; onClose: () => void; onSave: (data: any) => void; isSaving: boolean }) {
  const [randomPickCount, setRandomPickCount] = useState<string>(quiz.randomPickCount ? String(quiz.randomPickCount) : '');
  const [maxAttempts, setMaxAttempts] = useState<string>(quiz.maxAttempts ? String(quiz.maxAttempts) : '');
  const [durationMinutes, setDurationMinutes] = useState<string>(quiz.durationMinutes ? String(quiz.durationMinutes) : '');
  const [allowReview, setAllowReview] = useState<boolean>(quiz.allowReview ?? true);
  const [startTime, setStartTime] = useState<string>(quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState<string>(quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Cấu hình Quiz: {quiz.title}</h3>
        
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Số câu hỏi bốc ngẫu nhiên (để trống nếu lấy tất cả)
            <input 
              type="number" 
              value={randomPickCount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRandomPickCount(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Thời gian làm bài (Phút)
            <input 
              type="number" 
              value={durationMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationMinutes(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Số lần làm bài tối đa
            <input 
              type="number" 
              value={maxAttempts}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxAttempts(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Thời gian mở bài (Tùy chọn)
            <input 
              type="datetime-local" 
              value={startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Thời gian đóng bài (Tùy chọn)
            <input 
              type="datetime-local" 
              value={endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input 
              type="checkbox" 
              checked={allowReview}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAllowReview(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            Cho phép xem lại đáp án sau khi nộp
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button 
            onClick={() => onSave({
              randomPickCount: randomPickCount ? parseInt(randomPickCount) : null,
              durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
              maxAttempts: maxAttempts ? parseInt(maxAttempts) : null,
              startTime: startTime ? new Date(startTime).toISOString() : null,
              endTime: endTime ? new Date(endTime).toISOString() : null,
              allowReview
            })}
            disabled={isSaving}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </div>
    </div>
  );
}
