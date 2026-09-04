'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi, InstructorMaterial, MaterialDetailRes } from '@/lib/api/materials';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CourseMaterialsManagerProps {
  courseId: number;
}

export function CourseMaterialsManager({ courseId }: CourseMaterialsManagerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedQuiz, setSelectedQuiz] = useState<InstructorMaterial | null>(null);
  const [inspectGenerationId, setInspectGenerationId] = useState<number | null>(null);
  const [genMaterialType, setGenMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP' | null>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['instructor-materials', courseId],
    queryFn: () => materialsApi.getInstructorMaterials(courseId),
    enabled: !!courseId,
  });

  const toggleMindmapMutation = useMutation({
    mutationFn: (variables: { id: number; isOfficial: boolean }) =>
      materialsApi.setMindmapOfficial(variables.id, variables.isOfficial),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái Mindmap Official');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
  });

  const toggleFlashcardMutation = useMutation({
    mutationFn: (variables: { id: number; isOfficial: boolean }) =>
      materialsApi.setFlashcardOfficial(variables.id, variables.isOfficial),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái Flashcard Official');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
  });

  const setQuizOfficialMutation = useMutation({
    mutationFn: (id: number) => materialsApi.setQuizOfficial(id),
    onSuccess: () => {
      toast.success('Đã phát hành bài Quiz thành Official');
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

  if (isLoading) return <div className="p-6 text-center text-sm text-gray-500 animate-pulse">Đang tải danh sách học liệu Giảng viên...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-5 text-white shadow-lg gap-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <span>🎓</span> Kho Học Liệu Official & Bài Thi Khóa Học
          </h3>
          <p className="text-xs text-blue-200 mt-1">
            Sinh sơ đồ Mindmap, bộ Flashcard hoặc Bài thi trắc nghiệm Official cho toàn bộ học viên.
          </p>
        </div>
        
        {/* 3 Dedicated Creation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setGenMaterialType('MINDMAP')}
            className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition-all flex items-center gap-1.5"
          >
            <span>🧠</span> + Sinh Mindmap
          </button>
          <button
            onClick={() => setGenMaterialType('FLASHCARD')}
            className="rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-purple-700 transition-all flex items-center gap-1.5"
          >
            <span>🃏</span> + Sinh Flashcard
          </button>
          <button
            onClick={() => setGenMaterialType('QUIZ')}
            className="rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 transition-all flex items-center gap-1.5"
          >
            <span>📝</span> + Sinh Quiz Thi Cử
          </button>
          <button
            onClick={() => router.push(`/instructor/courses/${courseId}/gradebook`)}
            className="rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-blue-950 shadow hover:bg-blue-50 transition-all flex items-center gap-1.5 ml-1"
          >
            <span>📊</span> Bảng Điểm Lớp
          </button>
        </div>
      </div>


      {/* Materials List */}
      <div className="flex flex-col gap-3">
        {materials?.map((mat) => (
          <div key={mat.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                mat.materialType === 'MINDMAP' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                mat.materialType === 'FLASHCARD' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                'bg-orange-50 text-orange-700 ring-orange-600/20'
              }`}>
                {mat.materialType}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{mat.title || 'Học liệu không tên'}</span>
                  {mat.isOfficial && (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                      ★ Official
                    </span>
                  )}
                  {mat.isProctored && (
                    <span className="bg-red-100 text-red-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                      <span>🔴</span> Anti-Cheat
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                  <span>Tạo lúc: {new Date(mat.createdAt).toLocaleDateString('vi-VN')}</span>
                  {mat.materialType === 'QUIZ' && mat.questionCount !== undefined && (
                    <span className="font-semibold text-indigo-600">• Quy mô đề: {mat.questionCount} câu hỏi</span>
                  )}
                </div>
              </div>
            </div>

            {mat.status === 'COMPLETED' && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                {/* Xem chi tiết nội dung */}
                <button
                  onClick={() => setInspectGenerationId(mat.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-all"
                >
                  👁️ Xem Chi Tiết
                </button>

                {/* Đánh dấu Official */}
                <button
                  onClick={() => {
                    if (mat.materialType === 'MINDMAP' && mat.materialId) {
                      toggleMindmapMutation.mutate({ id: mat.materialId, isOfficial: !mat.isOfficial });
                    } else if (mat.materialType === 'FLASHCARD' && mat.materialId) {
                      toggleFlashcardMutation.mutate({ id: mat.materialId, isOfficial: !mat.isOfficial });
                    } else if (mat.materialType === 'QUIZ' && mat.materialId) {
                      setQuizOfficialMutation.mutate(mat.materialId);
                    }
                  }}
                  className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                    mat.isOfficial 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {mat.isOfficial ? '★ Đang là Official' : '☆ Đánh dấu Official'}
                </button>

                {/* Cấu hình Quiz & Thi cử */}
                {mat.materialType === 'QUIZ' && mat.materialId && (
                  <button
                    onClick={() => setSelectedQuiz(mat)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all"
                  >
                    ⚙️ Cấu hình Bài Thi Quiz
                  </button>
                )}

              </div>
            )}
            {mat.status !== 'COMPLETED' && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md font-medium">
                ⏳ Trạng thái: {mat.status}
              </span>
            )}
          </div>
        ))}

        {(!materials || materials.length === 0) && (
          <div className="p-12 text-center text-sm text-gray-500 card bg-white">
            <p className="font-semibold text-gray-700">Chưa có học liệu AI Official nào cho khóa học này.</p>
            <p className="text-xs text-gray-400 mt-1">Bấm các nút sinh học liệu phía trên để tạo bài Quiz hoặc Mindmap/Flashcard cho học viên.</p>
          </div>
        )}

      </div>

      {/* Quiz Settings Modal */}
      {selectedQuiz && (
        <QuizSettingsModal 
          quiz={selectedQuiz} 
          onClose={() => setSelectedQuiz(null)} 
          onSave={(data) => updateQuizSettingsMutation.mutate({ id: selectedQuiz.materialId as number, data })}
          isSaving={updateQuizSettingsMutation.isPending}
          onInspect={() => setInspectGenerationId(selectedQuiz.id)}
        />
      )}

      {/* Inspect Material Content Modal */}
      {inspectGenerationId && (
        <MaterialContentInspectorModal 
          generationId={inspectGenerationId} 
          onClose={() => setInspectGenerationId(null)} 
        />
      )}

      {/* Generate AI Official Modal */}
      {genMaterialType && (
        <GenerateAiOfficialModal 
          courseId={courseId}
          initialType={genMaterialType} 
          onClose={() => setGenMaterialType(null)}
          onSuccess={() => {
            setGenMaterialType(null);
            queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
          }}
        />
      )}

    </div>
  );
}

/** Modal Cấu hình Quiz Thi Cử & Proctoring */
function QuizSettingsModal({ 
  quiz, 
  onClose, 
  onSave, 
  isSaving,
  onInspect
}: { 
  quiz: InstructorMaterial; 
  onClose: () => void; 
  onSave: (data: Record<string, unknown>) => void; 
  isSaving: boolean;
  onInspect: () => void;
}) {
  const [randomPickCount, setRandomPickCount] = useState<string>(quiz.randomPickCount ? String(quiz.randomPickCount) : '');
  const [maxAttempts, setMaxAttempts] = useState<string>(quiz.maxAttempts ? String(quiz.maxAttempts) : '1');
  const [durationMinutes, setDurationMinutes] = useState<string>(quiz.durationMinutes ? String(quiz.durationMinutes) : '15');
  const [allowReview, setAllowReview] = useState<boolean>(quiz.allowReview ?? true);
  const [isProctored, setIsProctored] = useState<boolean>(quiz.isProctored ?? false);
  const [maxViolations, setMaxViolations] = useState<string>(quiz.maxViolations ? String(quiz.maxViolations) : '3');
  const [startTime, setStartTime] = useState<string>(quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState<string>(quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '');

  // Tự động tính toán Thời gian đóng bài = Thời gian mở bài + Thời gian làm bài (Phút)
  useEffect(() => {
    if (startTime && durationMinutes && !isNaN(Number(durationMinutes))) {
      const start = new Date(startTime);
      if (!isNaN(start.getTime())) {
        const calculatedEnd = new Date(start.getTime() + Number(durationMinutes) * 60 * 1000);
        // Format to ISO string YYYY-MM-THH:mm
        const tzOffset = calculatedEnd.getTimezoneOffset() * 60000;
        const localISOTime = new Date(calculatedEnd.getTime() - tzOffset).toISOString().slice(0, 16);
        setEndTime(localISOTime);
      }
    }
  }, [startTime, durationMinutes]);

  const handleSave = () => {
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
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl my-8 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>⚙️ Cấu hình Bài Thi Quiz</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{quiz.title || 'Bài thi Quiz khóa học'}</p>
          </div>
          <button 
            onClick={onInspect}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-200 flex items-center gap-1"
          >
            <span>👁️</span> Xem bộ câu hỏi
          </button>
        </div>
        
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Total questions hint badge */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 font-medium flex items-center justify-between">
            <span>Tổng số câu hỏi hiện có trong bộ đề:</span>
            <span className="font-extrabold text-sm text-blue-700 bg-white px-2.5 py-0.5 rounded-md border border-blue-200">
              {quiz.questionCount ?? 'Không xác định'} câu
            </span>
          </div>

          {/* AI Anti-Cheat Proctoring Box */}
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-red-950 flex items-center gap-1.5">
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
              Bật tính năng để theo dõi chuyển tab, rời màn hình và webcam khuôn mặt học viên qua camera trong suốt giờ thi.
            </p>

            {isProctored && (
              <label className="flex flex-col gap-1 text-xs font-semibold text-red-900 pt-2 border-t border-red-200">
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

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Số câu hỏi bốc ngẫu nhiên (để trống nếu lấy toàn bộ {quiz.questionCount ?? ''} câu)
            <input 
              type="number" 
              min="1"
              max={quiz.questionCount ?? 100}
              value={randomPickCount}
              onChange={(e) => setRandomPickCount(e.target.value)}
              placeholder={`Lấy tất cả ${quiz.questionCount ?? ''} câu`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Thời gian làm bài (Phút)
            <input 
              type="number" 
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Số lần làm bài tối đa cho mỗi sinh viên
            <input 
              type="number" 
              min="1"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Thời gian mở bài
              <input 
                type="datetime-local" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Thời gian đóng bài (tự động tính)
              <input 
                type="datetime-local" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none bg-gray-50"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 pt-1">
            <input 
              type="checkbox" 
              checked={allowReview}
              onChange={(e) => setAllowReview(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            Cho phép xem lại đáp án chi tiết sau khi nộp
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

/** Modal Xem Chi Tiết Nội Dung Học Liệu AI (Quiz Questions / Mindmap / Flashcards) */
function MaterialContentInspectorModal({ generationId, onClose }: { generationId: number; onClose: () => void }) {
  const { data: detail, isLoading } = useQuery<MaterialDetailRes>({
    queryKey: ['material-detail', generationId],
    queryFn: () => materialsApi.getDetail(generationId),
    enabled: !!generationId,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white p-6 shadow-2xl my-8">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>👁️ Chi Tiết Nội Dung:</span>
              <span className="text-cyan-600">{detail?.title || 'Học liệu AI'}</span>
            </h3>
            <p className="text-xs text-gray-500">Loại: {detail?.materialType} • Ngôn ngữ: {detail?.language}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold text-xl px-2">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-500 animate-pulse font-medium">Đang tải nội dung chi tiết...</div>
        ) : detail ? (
          <div className="overflow-y-auto pr-2 space-y-4 flex-1">
            {/* Quiz Questions */}
            {detail.materialType === 'QUIZ' && detail.quizQuestions && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Danh sách {detail.quizQuestions.length} câu hỏi trong đề:
                </div>
                {detail.quizQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                    <div className="font-bold text-sm text-gray-900">
                      Câu {idx + 1}: {q.content}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt) => (
                        <div 
                          key={opt.id} 
                          className={`p-2.5 rounded-lg text-xs font-medium border flex items-center justify-between ${
                            opt.isCorrect 
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold' 
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          <span>{opt.content}</span>
                          {opt.isCorrect && <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">Đáp án đúng ✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Flashcards */}
            {detail.materialType === 'FLASHCARD' && detail.flashcards && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detail.flashcards.map((card, idx) => (
                  <div key={card.id} className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                    <div className="text-xs font-bold text-purple-700 uppercase">Mặt trước #{idx + 1}</div>
                    <div className="text-sm font-semibold text-gray-900">{card.frontText}</div>
                    <div className="border-t border-purple-100 pt-2 mt-2 text-xs font-medium text-purple-900">
                      <span className="font-bold text-purple-700">Mặt sau:</span> {card.backText}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mindmap */}
            {detail.materialType === 'MINDMAP' && detail.mermaidCode && (
              <pre className="p-4 rounded-xl bg-slate-900 text-cyan-300 font-mono text-xs overflow-x-auto">
                {detail.mermaidCode}
              </pre>
            )}
          </div>
        ) : null}

        <div className="mt-6 pt-4 border-t text-right">
          <button onClick={onClose} className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-bold text-white hover:bg-gray-800">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal Sinh AI Official Mới Cho Giảng Viên */
function GenerateAiOfficialModal({ courseId, initialType, onClose, onSuccess }: { courseId: number; initialType?: 'QUIZ' | 'FLASHCARD' | 'MINDMAP' | null; onClose: () => void; onSuccess: () => void }) {
  const [materialType, setMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP'>(initialType || 'QUIZ');
  const [scopeType, setScopeType] = useState<'WHOLE_COURSE' | 'CHAPTER' | 'CUSTOM_LESSONS'>('WHOLE_COURSE');
  const [scopeRefId, setScopeRefId] = useState<number | undefined>(undefined);
  const [difficultyLevel, setDifficultyLevel] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [quantityLevel, setQuantityLevel] = useState<'FEW' | 'MEDIUM' | 'MORE'>('MEDIUM');
  const [language, setLanguage] = useState<string>('vi');

  const { data: languages } = useQuery({
    queryKey: ['available-languages', courseId],
    queryFn: () => materialsApi.getAvailableLanguages(courseId),
  });

  const { data: chapters } = useQuery({
    queryKey: ['course-chapters', courseId],
    queryFn: () => materialsApi.getCourseChapters(courseId),
    enabled: scopeType === 'CHAPTER',
  });

  const generateMutation = useMutation({
    mutationFn: materialsApi.requestGeneration,
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu sinh học liệu AI thành công!');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể sinh học liệu');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      courseId,
      materialType,
      scopeType,
      scopeRefId: scopeType === 'CHAPTER' ? scopeRefId : undefined,
      difficultyLevel,
      quantityLevel,
      language,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl my-8">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">🤖 Sinh AI Official Mới</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Loại học liệu
            <select 
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as 'QUIZ' | 'FLASHCARD' | 'MINDMAP')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            >
              <option value="QUIZ">Quiz Bài thi trắc nghiệm</option>
              <option value="FLASHCARD">Bộ Flashcard ôn tập</option>
              <option value="MINDMAP">Sơ đồ Mindmap bài học</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Phạm vi tạo học liệu
            <select 
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as 'WHOLE_COURSE' | 'CHAPTER')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            >
              <option value="WHOLE_COURSE">Toàn bộ khóa học</option>
              <option value="CHAPTER">Theo chương cụ thể</option>
            </select>
          </label>

          {scopeType === 'CHAPTER' && (
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Chọn chương
              <select 
                value={scopeRefId}
                onChange={(e) => setScopeRefId(Number(e.target.value))}
                required
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="">-- Chọn chương --</option>
                {chapters?.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Độ khó
              <select 
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="EASY">Cơ bản (Easy)</option>
                <option value="MEDIUM">Vừa (Medium)</option>
                <option value="HARD">Nâng cao (Hard)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Mức số lượng
              <select 
                value={quantityLevel}
                onChange={(e) => setQuantityLevel(e.target.value as 'FEW' | 'MEDIUM' | 'MORE')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="FEW">Ít (Vừa đủ)</option>
                <option value="MEDIUM">Vừa phải</option>
                <option value="MORE">Nhiều</option>
              </select>
            </label>
          </div>


          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Ngôn ngữ (từ Kho bài giảng)
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            >
              {languages && languages.length > 0 ? (
                languages.map((lang) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))
              ) : (
                <option value="vi">VI (Tiếng Việt)</option>
              )}
            </select>
          </label>

          <div className="mt-4 flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={generateMutation.isPending}
              className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Đang gửi yêu cầu AI...' : 'Bắt đầu sinh AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
