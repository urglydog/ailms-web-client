'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi, InstructorMaterial } from '@/lib/api/materials';
import { toast } from 'sonner';
import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

interface CourseMaterialsManagerProps {
  courseId: number;
}

export function CourseMaterialsManager({ courseId }: CourseMaterialsManagerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedQuiz, setSelectedQuiz] = useState<InstructorMaterial | null>(null);

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
    mutationFn: (variables: { id: number; data: Record<string, unknown> }) =>
      materialsApi.updateQuizSettings(variables.id, variables.data),
    onSuccess: () => {
      toast.success('Đã cập nhật cấu hình Quiz');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      setSelectedQuiz(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi cập nhật Quiz');
    }
  });

  if (isLoading) return <div className="p-4 text-center text-sm text-gray-500">Đang tải danh sách học liệu...</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Gradebook Header Bar */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white shadow-md">
        <div>
          <h3 className="font-bold text-sm">Quản lý Bảng điểm & Học liệu Khóa học</h3>
          <p className="text-xs text-blue-200">Theo dõi kết quả thi cử của sinh viên và phát hành học liệu Official.</p>
        </div>
        <button
          onClick={() => router.push(`/instructor/courses/${courseId}/gradebook`)}
          className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-900 shadow hover:bg-blue-50 transition-all flex items-center gap-1.5"
        >
          <span>📊</span> Xem Bảng Điểm Lớp Học
        </button>
      </div>

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
                        toggleMindmapMutation.mutate({ id: mat.materialId as number, isOfficial: !mat.isOfficial });
                      } else if (mat.materialType === 'FLASHCARD') {
                        toggleFlashcardMutation.mutate({ id: mat.materialId as number, isOfficial: !mat.isOfficial });
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
          onSave={(data) => updateQuizSettingsMutation.mutate({ id: selectedQuiz.materialId as number, data })}
          isSaving={updateQuizSettingsMutation.isPending}
        />
      )}
    </div>
  );
}

function QuizSettingsModal({ quiz, onClose, onSave, isSaving }: { quiz: InstructorMaterial; onClose: () => void; onSave: (data: Record<string, unknown>) => void; isSaving: boolean }) {
  const [randomPickCount, setRandomPickCount] = useState<string>(quiz.randomPickCount ? String(quiz.randomPickCount) : '');
  const [maxAttempts, setMaxAttempts] = useState<string>(quiz.maxAttempts ? String(quiz.maxAttempts) : '');
  const [durationMinutes, setDurationMinutes] = useState<string>(quiz.durationMinutes ? String(quiz.durationMinutes) : '');
  const [allowReview, setAllowReview] = useState<boolean>(quiz.allowReview ?? true);
  const [isProctored, setIsProctored] = useState<boolean>(quiz.isProctored ?? false);
  const [maxViolations, setMaxViolations] = useState<string>(quiz.maxViolations ? String(quiz.maxViolations) : '3');
  const [startTime, setStartTime] = useState<string>(quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState<string>(quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '');

  const handleSave = () => {
    // Chống nhập số âm
    const pick = randomPickCount ? Math.max(1, parseInt(randomPickCount)) : null;
    const dur = durationMinutes ? Math.max(1, parseInt(durationMinutes)) : null;
    const att = maxAttempts ? Math.max(1, parseInt(maxAttempts)) : null;
    const viol = maxViolations ? Math.max(1, parseInt(maxViolations)) : 3;

    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      toast.error('Thời gian đóng bài phải diễn ra sau thời gian mở bài!');
      return;
    }

    onSave({
      randomPickCount: pick,
      durationMinutes: dur,
      maxAttempts: att,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: endTime ? new Date(endTime).toISOString() : null,
      allowReview,
      isProctored,
      maxViolations: viol
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl my-8">
        <h3 className="mb-4 text-lg font-bold text-gray-900 border-b pb-3">Cấu hình Bài Thi Quiz: {quiz.title}</h3>
        
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* AI Anti-Cheat Proctoring Box */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                <span>🔴</span> Giám Sát Thi Cử AI (Anti-Cheat Proctoring)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isProctored}
                  onChange={(e) => setIsProctored(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              Khi bật tính năng này, Học viên bắt buộc phải cấp quyền Camera. AI sẽ liên tục quét khuôn mặt, phát hiện chuyển tab hoặc rời mắt và tự động đóng bài khi vi phạm.
            </p>

            {isProctored && (
              <label className="flex flex-col gap-1 text-xs font-semibold text-red-900 pt-1 border-t border-red-200">
                Số lần vi phạm tối đa trước khi tự động thu bài
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  value={maxViolations}
                  onChange={(e) => setMaxViolations(e.target.value)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm bg-white focus:border-red-500 focus:outline-none"
                />
              </label>
            )}
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Số câu hỏi bốc ngẫu nhiên (để trống nếu lấy tất cả)
            <input 
              type="number" 
              min="1"
              value={randomPickCount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRandomPickCount(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Thời gian làm bài (Phút)
            <input 
              type="number" 
              min="1"
              value={durationMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationMinutes(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Số lần làm bài tối đa
            <input 
              type="number" 
              min="1"
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

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button 
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50 shadow"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </div>
    </div>
  );
}

