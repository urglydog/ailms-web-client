'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi, InstructorMaterial, MaterialDetailRes } from '@/lib/api/materials';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MermaidViewer } from '@/components/materials/MermaidViewer';

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

  // Nếu Giảng viên bấm Xem Chi Tiết -> Hiển thị Workspace Mở Rộng Đầy Đủ Không Gian (Không phải Popup nhỏ)
  if (inspectGenerationId) {
    const activeMat = materials?.find(m => m.id === inspectGenerationId);
    return (
      <MaterialWorkspaceViewer 
        generationId={inspectGenerationId} 
        material={activeMat}
        onBack={() => setInspectGenerationId(null)} 
        onConfigureQuiz={() => {
          if (activeMat && activeMat.materialType === 'QUIZ') {
            setSelectedQuiz(activeMat);
          }
        }}
        onToggleOfficial={() => {
          if (!activeMat || !activeMat.materialId) return;
          if (activeMat.materialType === 'MINDMAP') {
            toggleMindmapMutation.mutate({ id: activeMat.materialId, isOfficial: !activeMat.isOfficial });
          } else if (activeMat.materialType === 'FLASHCARD') {
            toggleFlashcardMutation.mutate({ id: activeMat.materialId, isOfficial: !activeMat.isOfficial });
          } else if (activeMat.materialType === 'QUIZ') {
            setQuizOfficialMutation.mutate(activeMat.materialId);
          }
        }}
      />
    );
  }

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
                {/* Mở Workspace Xem / Chỉnh sửa */}
                <button
                  onClick={() => setInspectGenerationId(mat.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm"
                >
                  🖥️ Quản Lý Nội Dung Workspace
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
                    ⚙️ Cấu hình Quiz
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

/** Workspace Xem & Chỉnh Sửa Học Liệu Trực Quan Mở Rộng Đầy Đủ Không Gian */
function MaterialWorkspaceViewer({ 
  generationId, 
  material,
  onBack,
  onConfigureQuiz,
  onToggleOfficial
}: { 
  generationId: number; 
  material?: InstructorMaterial;
  onBack: () => void; 
  onConfigureQuiz: () => void;
  onToggleOfficial: () => void;
}) {
  const { data: detail, isLoading } = useQuery<MaterialDetailRes>({
    queryKey: ['material-detail', generationId],
    queryFn: () => materialsApi.getDetail(generationId),
    enabled: !!generationId,
  });

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'VIEW' | 'RAW_CODE'>('VIEW');
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [editingQuestion, setEditingQuestion] = useState<{
    id: number;
    content: string;
    displayOrder: number;
    options: { id: number; content: string; isCorrect: boolean }[];
  } | null>(null);

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => materialsApi.deleteQuizQuestion(id),
    onSuccess: () => {
      toast.success('Đã xóa câu hỏi');
      queryClient.invalidateQueries({ queryKey: ['material-detail', generationId] });
    }
  });

  const toggleCard = (id: number) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-200 min-h-[750px]">
      {/* Top Workspace Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all"
          >
            ← Quay lại danh sách
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{detail?.title || material?.title || 'Học liệu AI'}</h2>
              {material?.isOfficial && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ★ Official
                </span>
              )}
              {material?.isProctored && (
                <span className="bg-red-100 text-red-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">
                  🔴 AI Anti-Cheat
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Loại: <strong className="text-indigo-600">{detail?.materialType || material?.materialType}</strong> • 
              Ngôn ngữ: <strong className="text-gray-700">{detail?.language || material?.language || 'Tiếng Việt'}</strong> • 
              Phiên bản: #{detail?.versionNo || material?.versionNo || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {material?.materialType === 'QUIZ' && (
            <button
              onClick={onConfigureQuiz}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              ⚙️ Cấu hình Quiz & Thi Cử
            </button>
          )}

          <button
            onClick={onToggleOfficial}
            className={`inline-flex items-center rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
              material?.isOfficial 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {material?.isOfficial ? '★ Đang là Official' : '☆ Phát hành làm Official'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-500 animate-pulse font-medium">Đang tải toàn bộ dữ liệu học liệu vào Workspace...</div>
      ) : detail ? (
        <div className="flex flex-col gap-6">

          {/* Render Quiz Workspace */}
          {detail.materialType === 'QUIZ' && detail.quizQuestions && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <div>
                  <h3 className="font-bold text-sm text-indigo-950">Bộ Câu Hỏi Bài Thi Quiz Trắc Nghiệm AI</h3>
                  <p className="text-xs text-indigo-700 mt-0.5">Dưới đây là {detail.quizQuestions.length} câu hỏi được tổng hợp tự động từ bài giảng.</p>
                </div>
                <span className="bg-indigo-600 text-white font-extrabold text-xs px-3 py-1 rounded-full">
                  {detail.quizQuestions.length} Câu hỏi
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {detail.quizQuestions.map((q, idx) => (
                  <div key={q.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-3 shadow-sm hover:border-blue-300 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-base text-gray-900">
                        <span className="text-blue-600 mr-2">Câu {idx + 1}:</span> {q.content}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditingQuestion(q)} className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 border border-gray-200">Sửa</button>
                        <button onClick={() => { if(confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) deleteQuestionMutation.mutate(q.id); }} className="text-xs font-semibold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200">Xóa</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                      {q.options.map((opt) => (
                        <div 
                          key={opt.id} 
                          className={`p-3.5 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
                            opt.isCorrect 
                              ? 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-bold shadow-sm' 
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          <span>{opt.content}</span>
                          {opt.isCorrect && (
                            <span className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-md font-extrabold flex items-center gap-1">
                              Đáp án đúng ✓
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Mindmap Workspace */}
          {detail.materialType === 'MINDMAP' && detail.mermaidCode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <button
                  onClick={() => setActiveTab('VIEW')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'VIEW' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🧠 Trực Quan Sơ Đồ Node
                </button>
                <button
                  onClick={() => setActiveTab('RAW_CODE')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'RAW_CODE' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  💻 Mã Cấu Trúc Mermaid Code
                </button>
              </div>

              {activeTab === 'VIEW' ? (
                <MermaidViewer chart={detail.mermaidCode} />
              ) : (
                <pre className="p-5 rounded-2xl bg-slate-900 text-cyan-300 font-mono text-xs overflow-x-auto min-h-[400px] border border-slate-800">
                  {detail.mermaidCode}
                </pre>
              )}
            </div>
          )}

          {/* Render Flashcards Workspace */}
          {detail.materialType === 'FLASHCARD' && detail.flashcards && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-purple-950">Bộ Thẻ Học Flashcards 2 Mặt Trực Quan</h3>
                  <p className="text-xs text-purple-700 mt-0.5">Bấm vào bất kỳ thẻ nào bên dưới để xem lật mặt sau.</p>
                </div>
                <span className="bg-purple-600 text-white font-extrabold text-xs px-3 py-1 rounded-full">
                  {detail.flashcards.length} Thẻ ôn tập
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {detail.flashcards.map((card, idx) => {
                  const isFlipped = flippedCards[card.id];
                  return (
                    <div 
                      key={card.id} 
                      onClick={() => toggleCard(card.id)}
                      className={`cursor-pointer min-h-[160px] p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md ${
                        isFlipped 
                          ? 'bg-gradient-to-br from-indigo-900 to-purple-950 text-white border-purple-800' 
                          : 'bg-purple-50/60 text-purple-950 border-purple-200 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-extrabold opacity-80 mb-2">
                        <span>Thẻ #{idx + 1}</span>
                        <span className="underline">{isFlipped ? '🔄 Mặt Sau (Khái niệm)' : '🔄 Mặt Trước (Thuật ngữ)'}</span>
                      </div>
                      
                      <div className="text-base font-bold my-auto leading-relaxed">
                        {isFlipped ? card.backText : card.frontText}
                      </div>

                      <div className="text-[11px] opacity-70 mt-3 text-right">
                        {isFlipped ? 'Nhấn để lật lại mặt trước' : 'Nhấn để xem giải nghĩa khái niệm'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      ) : null}

      {editingQuestion && (
        <QuizQuestionEditorModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSuccess={() => {
            setEditingQuestion(null);
            queryClient.invalidateQueries({ queryKey: ['material-detail', generationId] });
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
  isSaving
}: { 
  quiz: InstructorMaterial; 
  onClose: () => void; 
  onSave: (data: Record<string, unknown>) => void; 
  isSaving: boolean;
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

/** Modal Sinh AI Official Mới Cho Giảng Viên */
function GenerateAiOfficialModal({ courseId, initialType, onClose, onSuccess }: { courseId: number; initialType?: 'QUIZ' | 'FLASHCARD' | 'MINDMAP' | null; onClose: () => void; onSuccess: () => void }) {
  const [materialType, setMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP'>(initialType || 'QUIZ');
  const [scopeType, setScopeType] = useState<'WHOLE_COURSE' | 'CHAPTER' | 'CUSTOM_LESSONS'>('WHOLE_COURSE');
  const [scopeRefId, setScopeRefId] = useState<number | undefined>(undefined);
  const [difficultyLevel, setDifficultyLevel] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [quantityLevel, setQuantityLevel] = useState<'FEWER' | 'STANDARD' | 'MORE'>('STANDARD');
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

  const modalTitles = {
    MINDMAP: '🧠 Sinh Sơ Đồ Tư Duy (Mindmap) AI',
    FLASHCARD: '🃏 Sinh Bộ Thẻ Ôn Tập (Flashcard) AI',
    QUIZ: '📝 Sinh Bài Thi Trắc Nghiệm (Quiz) AI',
  };

  const modalDescriptions = {
    MINDMAP: 'AI sẽ tự động tổng hợp kiến thức từ video bài giảng thành sơ đồ node tư duy trực quan.',
    FLASHCARD: 'AI sẽ trích xuất các thuật ngữ & khái niệm quan trọng thành bộ thẻ học 2 mặt.',
    QUIZ: 'AI sẽ tạo bộ câu hỏi trắc nghiệm kèm phương án lựa chọn và đáp án giải thích.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl my-8">
        <div className="border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">{modalTitles[materialType]}</h3>
          <p className="text-xs text-gray-500 mt-1">{modalDescriptions[materialType]}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Loại học liệu
            <select 
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as 'QUIZ' | 'FLASHCARD' | 'MINDMAP')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            >
              <option value="MINDMAP">🧠 Sơ đồ Mindmap bài học</option>
              <option value="FLASHCARD">🃏 Bộ Flashcard ôn tập</option>
              <option value="QUIZ">📝 Quiz Bài thi trắc nghiệm</option>
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

          {/* Các tùy chọn đặc thù theo từng loại học liệu */}
          {materialType === 'QUIZ' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                Độ khó câu hỏi
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
                Số lượng câu hỏi
                <select 
                  value={quantityLevel}
                  onChange={(e) => setQuantityLevel(e.target.value as 'FEWER' | 'STANDARD' | 'MORE')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="FEWER">Ít (~10 câu)</option>
                  <option value="STANDARD">Vừa (~20 câu)</option>
                  <option value="MORE">Nhiều (~30 câu)</option>
                </select>
              </label>
            </div>
          )}

          {materialType === 'FLASHCARD' && (
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Số lượng thẻ Flashcard
              <select 
                value={quantityLevel}
                onChange={(e) => setQuantityLevel(e.target.value as 'FEWER' | 'STANDARD' | 'MORE')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="FEWER">Ít (~10 thẻ)</option>
                <option value="STANDARD">Vừa (~20 thẻ)</option>
                <option value="MORE">Nhiều (~30 thẻ)</option>
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Ngôn ngữ lồng tiếng & Bài giảng
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none font-medium bg-white"
            >
              {languages && languages.length > 0 ? (
                languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.startsWith('vi') ? '🇻🇳 Tiếng Việt (Việt Nam) ✓ (Đã lồng tiếng)' :
                     lang.startsWith('en') ? '🇺🇸 Tiếng Anh (Hoa Kỳ) ✓ (Đã lồng tiếng)' :
                     lang.startsWith('ja') ? '🇯🇵 Tiếng Nhật (Nhật Bản) ✓ (Đã lồng tiếng)' :
                     lang.startsWith('zh') ? '🇨🇳 Tiếng Trung (Trung Quốc) ✓ (Đã lồng tiếng)' :
                     lang + ' ✓ (Đã lồng tiếng)'}
                  </option>
                ))
              ) : (
                <>
                  <option value="vi">🇻🇳 Tiếng Việt (Việt Nam) ✓ (Ngôn ngữ gốc)</option>
                  <option value="en">🇺🇸 Tiếng Anh (Hoa Kỳ)</option>
                </>
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

interface QuizQuestionEditorProps {
  question: {
    id: number;
    content: string;
    displayOrder: number;
    options: { id: number; content: string; isCorrect: boolean }[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

function QuizQuestionEditorModal({ question, onClose, onSuccess }: QuizQuestionEditorProps) {
  const [content, setContent] = useState(question.content);
  const [options, setOptions] = useState<{ id: number; content: string; isCorrect: boolean }[]>(
    JSON.parse(JSON.stringify(question.options))
  );

  const updateMutation = useMutation({
    mutationFn: () => materialsApi.updateQuizQuestion(question.id, { content, options }),
    onSuccess: () => {
      toast.success('Đã lưu thay đổi câu hỏi');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể lưu câu hỏi');
    }
  });

  const handleToggleCorrect = (idx: number) => {
    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Chỉnh sửa Nội Dung Câu Hỏi</h3>
        
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung câu hỏi</label>
        <textarea 
          value={content} 
          onChange={e => setContent(e.target.value)} 
          className="w-full border border-gray-300 p-3 rounded-xl mb-5 focus:border-indigo-500 focus:outline-none" 
          rows={3}
        />
        
        <label className="block text-sm font-semibold text-gray-700 mb-2">Các đáp án (Chọn 1 đáp án đúng)</label>
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <div key={idx} className={`flex gap-3 items-center p-3 rounded-xl border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200'}`}>
              <input 
                type="radio" 
                checked={opt.isCorrect} 
                onChange={() => handleToggleCorrect(idx)} 
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <input 
                type="text" 
                value={opt.content} 
                onChange={e => {
                  setOptions(options.map((o, i) => i === idx ? { ...o, content: e.target.value } : o));
                }} 
                className={`flex-1 p-2 bg-transparent border-b ${opt.isCorrect ? 'border-emerald-200 focus:border-emerald-500' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none text-sm font-medium`} 
              />
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 font-semibold text-gray-700 rounded-lg hover:bg-gray-200">Hủy</button>
          <button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
