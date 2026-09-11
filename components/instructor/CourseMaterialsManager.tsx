'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi, InstructorMaterial, MaterialDetailRes } from '@/lib/api/materials';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MindmapEditor } from '@/components/materials/MindmapEditor';

interface CourseMaterialsManagerProps {
  courseId: number;
}

export function CourseMaterialsManager({ courseId }: CourseMaterialsManagerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();


  const searchParams = useSearchParams();
  const inspectGenerationId = searchParams.get('inspect') ? Number(searchParams.get('inspect')) : null;
  const setInspectGenerationId = (id: number | null) => {
    if (id) {
      router.push(`?inspect=${id}`);
    } else {
      router.push(`/instructor/materials`);
    }
  };
  const [genMaterialType, setGenMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP' | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'QUIZ' | 'FLASHCARD' | 'MINDMAP'>('ALL');

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


  if (isLoading) return <div className="p-6 text-center text-sm text-gray-500 animate-pulse">Đang tải danh sách học liệu Giảng viên...</div>;

  // Nếu Giảng viên bấm Xem Chi Tiết -> Hiển thị Workspace Mở Rộng Đầy Đủ Không Gian (Không phải Popup nhỏ)
  if (inspectGenerationId) {
    const activeMat = materials?.find(m => m.id === inspectGenerationId);
    return (
      <MaterialWorkspaceViewer
        generationId={inspectGenerationId}
        material={activeMat}
        onBack={() => setInspectGenerationId(null)}
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

  if (genMaterialType) {
    return (
      <GenerateAiOfficialView
        courseId={courseId}
        initialType={genMaterialType}
        onClose={() => setGenMaterialType(null)}
        onSuccess={() => {
          setGenMaterialType(null);
          queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
        }}
      />
    );
  }

  const filteredMaterials = materials?.filter(mat => activeFilterTab === 'ALL' || mat.materialType === activeFilterTab) || [];

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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setGenMaterialType('QUIZ')}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <span>🤖</span> Tạo Học Liệu AI
          </button>
          <button
            onClick={() => router.push(`/instructor/courses/${courseId}/gradebook`)}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-950 shadow hover:bg-blue-50 transition-all flex items-center gap-2 ml-1"
          >
            <span>📊</span> Bảng Điểm Lớp
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mt-2">
        <button onClick={() => setActiveFilterTab('ALL')} className={`px-4 py-2 text-sm font-bold border-b-2 ${activeFilterTab === 'ALL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Tất cả</button>
        <button onClick={() => setActiveFilterTab('QUIZ')} className={`px-4 py-2 text-sm font-bold border-b-2 ${activeFilterTab === 'QUIZ' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Bài Thi Trắc Nghiệm</button>
        <button onClick={() => setActiveFilterTab('FLASHCARD')} className={`px-4 py-2 text-sm font-bold border-b-2 ${activeFilterTab === 'FLASHCARD' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Thẻ Flashcard</button>
        <button onClick={() => setActiveFilterTab('MINDMAP')} className={`px-4 py-2 text-sm font-bold border-b-2 ${activeFilterTab === 'MINDMAP' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Sơ Đồ Tư Duy</button>
      </div>

      {/* Materials List */}
      <div className="flex flex-col gap-3">
        {filteredMaterials.map((mat) => (
          <div key={mat.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${mat.materialType === 'MINDMAP' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
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
                      <span className="font-semibold text-indigo-600">• Quy mô đề: {mat.randomPickCount ? mat.randomPickCount : mat.questionCount} câu hỏi</span>
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
                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${mat.isOfficial
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {mat.isOfficial ? '★ Đang là Official' : '☆ Đánh dấu Official'}
                  </button>


                </div>
              )}
              {mat.status !== 'COMPLETED' && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md font-medium">
                  ⏳ Trạng thái: {mat.status}
                </span>
              )}
            </div>
          </div>
        ))}

        {(!filteredMaterials || filteredMaterials.length === 0) && (
          <div className="p-12 text-center text-sm text-gray-500 card bg-white">
            <p className="font-semibold text-gray-700">Chưa có học liệu AI Official nào cho mục này.</p>
            <p className="text-xs text-gray-400 mt-1">Bấm các nút sinh học liệu phía trên để tạo bài Quiz hoặc Mindmap/Flashcard cho học viên.</p>
          </div>
        )}

      </div>

    </div>
  );
}

/** Workspace Xem & Chỉnh Sửa Học Liệu Trực Quan Mở Rộng Đầy Đủ Không Gian */
function MaterialWorkspaceViewer({
  generationId,
  material,
  onBack,
  onToggleOfficial
}: {
  generationId: number;
  material?: InstructorMaterial;
  onBack: () => void;
  onToggleOfficial: () => void;
}) {
  const { data: detail, isLoading } = useQuery<MaterialDetailRes>({
    queryKey: ['material-detail', generationId],
    queryFn: () => materialsApi.getDetail(generationId),
    enabled: !!generationId,
  });

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'VIEW' | 'RAW_CODE' | 'QUESTIONS' | 'SETTINGS' | 'DRAG_DROP'>('VIEW');

  const updateMermaidMutation = useMutation({
    mutationFn: (variables: { id: number; mermaidCode: string }) => materialsApi.updateMaterial(variables.id, { mermaidCode: variables.mermaidCode }),
    onSuccess: () => {
      toast.success('Đã lưu sơ đồ Mindmap thành công!');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-detail'] });
    },
    onError: () => toast.error('Có lỗi xảy ra khi lưu sơ đồ!'),
  });

  // Cập nhật tab mặc định dựa trên loại học liệu
  useEffect(() => {
    if (detail?.materialType === 'QUIZ') {
      setActiveTab('QUESTIONS');
    } else if (detail?.materialType === 'MINDMAP') {
      setActiveTab('VIEW');
    } else {
      setActiveTab('VIEW');
    }
  }, [detail?.materialType]);

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
          {/* Removed Back to list button */}
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
          {/* Removed old configure quiz button */}

          <button
            onClick={onToggleOfficial}
            className={`inline-flex items-center rounded-xl px-4 py-2 text-xs font-bold transition-all border ${material?.isOfficial
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm'
              }`}
          >
            {material?.isOfficial ? '★ Đang là Official' : '☆ Phát hành làm Official'}
          </button>
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors ml-2"
            title="Đóng Workspace"
          >
            ✕
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
              <div className="flex items-center gap-2 border-b pb-2">
                <button
                  onClick={() => setActiveTab('QUESTIONS')}
                  className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'QUESTIONS' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Ngân Hàng Câu Hỏi ({detail.quizQuestions.length})
                </button>
                <button
                  onClick={() => setActiveTab('SETTINGS')}
                  className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'SETTINGS' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Cấu Hình Bài Thi
                </button>
              </div>

              {activeTab === 'QUESTIONS' && (
                <div className="grid grid-cols-1 gap-4">
                  {detail.quizQuestions.map((q, idx) => (
                    <div key={q.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-3 shadow-sm hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-base text-gray-900">
                          <span className="text-blue-600 mr-2">Câu {idx + 1}:</span> {q.content}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setEditingQuestion(q)} className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 border border-gray-200">Sửa</button>
                          <button onClick={() => { if (confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) deleteQuestionMutation.mutate(q.id); }} className="text-xs font-semibold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200">Xóa</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${opt.isCorrect
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
              )}

              {activeTab === 'SETTINGS' && material && (
                <QuizSettingsTab quiz={material} />
              )}
            </div>
          )}

          {/* Render Mindmap Workspace (Unified React Flow) */}
          {detail.materialType === 'MINDMAP' && detail.mermaidCode && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-blue-950">Bảng Vẽ Sơ Đồ Tư Duy (Mindmap)</h3>
                  <p className="text-xs text-blue-700 mt-0.5">Sử dụng chuột để kéo thả vị trí, click đúp vào chữ để sửa tên nhánh.</p>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-blue-200">
                  <button
                    onClick={() => setActiveTab('VIEW')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'VIEW' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700 hover:bg-blue-50'}`}
                  >
                    Xem Tĩnh
                  </button>
                  <button
                    onClick={() => setActiveTab('DRAG_DROP')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'DRAG_DROP' ? 'bg-accent text-white shadow-sm' : 'text-blue-700 hover:bg-blue-50'}`}
                  >
                    ✏️ Chỉnh Sửa 
                  </button>
                  <button
                    onClick={() => setActiveTab('RAW_CODE')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'RAW_CODE' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Mã Mermaid
                  </button>
                </div>
              </div>

              {activeTab === 'RAW_CODE' ? (
                <div className="w-full relative">
                  <pre className="p-6 rounded-2xl bg-slate-900 text-cyan-300 font-mono text-xs overflow-x-auto min-h-[500px] border border-slate-800 leading-relaxed shadow-inner">
                    {detail.mermaidCode}
                  </pre>
                </div>
              ) : activeTab === 'VIEW' ? (
                <div className="w-full h-[700px] border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                  <MindmapEditor
                    initialMermaidCode={detail.mermaidCode}
                    readOnly={true}
                  />
                </div>
              ) : (
                <div className="w-full h-[700px] border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                  <MindmapEditor
                    initialMermaidCode={detail.mermaidCode}
                    onSave={(code) => {
                      updateMermaidMutation.mutate({ id: detail.id, mermaidCode: code });
                      setActiveTab('VIEW');
                    }}
                  />
                </div>
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
                      className={`cursor-pointer min-h-[160px] p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md ${isFlipped
                        ? 'bg-gradient-to-br from-indigo-900 to-purple-950 text-white border-purple-800'
                        : 'bg-purple-50/60 text-purple-950 border-purple-200 hover:border-purple-400'
                        }`}
                    >
                      <div className="flex justify-between items-center text-xs font-extrabold opacity-80 mb-2">
                        <span>Thẻ #{idx + 1}</span>
                        <span className="underline">{isFlipped ? 'Mặt Sau (Khái niệm)' : 'Mặt Trước (Thuật ngữ)'}</span>
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

function CustomDateTimePicker({ value, onChange, label, onClear, hint }: { value: string; onChange: (v: string) => void; label: string; onClear?: () => void; hint?: string }) {
  const handleSetNow = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    onChange(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-end">
        <div>
          <label className="text-sm font-semibold text-gray-700 block">{label}</label>
          {hint && <span className="font-normal text-[11px] text-gray-500 mt-0.5 block">{hint}</span>}
        </div>
        {onClear && value && (
          <button type="button" onClick={onClear} className="text-[11px] text-red-600 hover:text-red-800 font-semibold bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors">Xóa</button>
        )}
      </div>
      <div className="flex items-stretch rounded-lg border border-gray-300 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 overflow-hidden bg-white shadow-sm transition-all">
        <input
          type="datetime-local"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="px-3 py-2 text-sm outline-none hover:bg-gray-50 flex-1 min-w-[150px] bg-transparent text-gray-800"
        />
        <button type="button" onClick={handleSetNow} title="Hiện tại" className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-cyan-700 border-l border-gray-200 transition-colors flex items-center justify-center">
          Hiện tại
        </button>
      </div>
    </div>
  )
}

/** Tab Cấu hình Quiz Thi Cử & Proctoring (Mới) */
function QuizSettingsTab({ quiz }: { quiz: InstructorMaterial }) {
  const queryClient = useQueryClient();

  type ExamPolicy = 'PRACTICE_UNLIMITED' | 'PRACTICE_LIMITED' | 'EXAM_STRICT';

  const initialPolicy = !quiz.maxAttempts
    ? 'PRACTICE_UNLIMITED'
    : (quiz.maxAttempts === 1 ? 'EXAM_STRICT' : 'PRACTICE_LIMITED');

  const [examPolicy, setExamPolicy] = useState<ExamPolicy>(initialPolicy);
  const [randomPickCount, setRandomPickCount] = useState<string>(quiz.randomPickCount ? String(quiz.randomPickCount) : '');
  const [customAttempts, setCustomAttempts] = useState<string>(quiz.maxAttempts && quiz.maxAttempts > 1 ? String(quiz.maxAttempts) : '2');
  const [durationMinutes, setDurationMinutes] = useState<string>(quiz.durationMinutes ? String(quiz.durationMinutes) : '15');
  const [allowReview, setAllowReview] = useState<boolean>(quiz.allowReview ?? true);
  const [isProctored, setIsProctored] = useState<boolean>(quiz.isProctored ?? false);
  const [maxViolations, setMaxViolations] = useState<string>(quiz.maxViolations ? String(quiz.maxViolations) : '3');
  const [startTime, setStartTime] = useState<string>(quiz.startTime ? quiz.startTime.substring(0, 16) : '');
  const [endTime, setEndTime] = useState<string>(quiz.endTime ? quiz.endTime.substring(0, 16) : '');

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
  };

  const handleDurationChange = (val: string) => {
    setDurationMinutes(val);
  };

  const updateQuizSettingsMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      materialsApi.updateQuizSettings(quiz.materialId as number, data),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình Quiz thành công!');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi lưu cấu hình Quiz');
    }
  });

  const handlePolicyChange = (policy: ExamPolicy) => {
    setExamPolicy(policy);
    if (policy === 'PRACTICE_UNLIMITED') {
      setAllowReview(true);
    } else if (policy === 'PRACTICE_LIMITED') {
      setAllowReview(true);
    } else if (policy === 'EXAM_STRICT') {
      setAllowReview(false);
    }
  };

  const handleSave = () => {
    const pick = randomPickCount ? Math.max(1, parseInt(randomPickCount)) : null;
    const dur = durationMinutes ? Math.max(1, parseInt(durationMinutes)) : null;

    let att: number | null = null;
    if (examPolicy === 'EXAM_STRICT') {
      att = 1;
    } else if (examPolicy === 'PRACTICE_LIMITED') {
      att = customAttempts ? Math.max(1, parseInt(customAttempts)) : 2;
    }

    const viol = maxViolations ? Math.max(1, parseInt(maxViolations)) : 3;

    if (examPolicy === 'EXAM_STRICT') {
      if (!startTime) {
        toast.error('Vui lòng thiết lập thời gian Mở bài thi cho chế độ Thi chính thức!');
        return;
      }
    }

    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      toast.error('Thời gian đóng bài phải lớn hơn thời gian mở bài!');
      return;
    }

    updateQuizSettingsMutation.mutate({
      randomPickCount: pick,
      durationMinutes: dur,
      maxAttempts: att,
      startTime: startTime ? startTime + ":00" : null,
      endTime: endTime ? endTime + ":00" : null,
      allowReview,
      isProctored,
      maxViolations: viol
    });
  };

  return (
    <div className="bg-white p-2">
      <div className="flex justify-between items-center pb-4 mb-6 border-b">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Cấu Hình Bài Thi</h3>
          <p className="text-sm text-gray-500 mt-1">Quản lý thời gian, số lượt làm bài, sinh đề ngẫu nhiên và tính năng giám sát</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateQuizSettingsMutation.isPending}
          className="rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50 shadow-md transition-all"
        >
          {updateQuizSettingsMutation.isPending ? 'Đang lưu...' : '💾 Lưu Cấu Hình'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">

          {/* Policy Selector */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-700">Chế độ bài thi</label>
            <div className="grid grid-cols-1 gap-3">
              <label className={`cursor-pointer flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${examPolicy === 'PRACTICE_UNLIMITED' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-cyan-300'}`}>
                <input
                  type="radio"
                  name="examPolicy"
                  checked={examPolicy === 'PRACTICE_UNLIMITED'}
                  onChange={() => handlePolicyChange('PRACTICE_UNLIMITED')}
                  className="mt-1 w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <div className="font-bold text-gray-900 text-sm">Luyện tập (Vô hạn)</div>
                  <div className="text-xs text-gray-500 mt-0.5">Sinh viên làm bao nhiêu lần tùy ý. Tự động lưu điểm cao nhất.</div>
                </div>
              </label>

              <label className={`cursor-pointer flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${examPolicy === 'PRACTICE_LIMITED' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-cyan-300'}`}>
                <input
                  type="radio"
                  name="examPolicy"
                  checked={examPolicy === 'PRACTICE_LIMITED'}
                  onChange={() => handlePolicyChange('PRACTICE_LIMITED')}
                  className="mt-1 w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <div className="w-full">
                  <div className="font-bold text-gray-900 text-sm">Ôn tập có giới hạn</div>
                  <div className="text-xs text-gray-500 mt-0.5 mb-2">Giới hạn số lần làm. Tự động lưu điểm cao nhất.</div>
                  {examPolicy === 'PRACTICE_LIMITED' && (
                    <input
                      type="number"
                      min="2"
                      value={customAttempts}
                      onChange={(e) => setCustomAttempts(e.target.value)}
                      placeholder="Số lần"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none w-24"
                    />
                  )}
                </div>
              </label>

              <label className={`cursor-pointer flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${examPolicy === 'EXAM_STRICT' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-cyan-300'}`}>
                <input
                  type="radio"
                  name="examPolicy"
                  checked={examPolicy === 'EXAM_STRICT'}
                  onChange={() => handlePolicyChange('EXAM_STRICT')}
                  className="mt-1 w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <div className="font-bold text-gray-900 text-sm">Thi chính thức (1 Lần)</div>
                  <div className="text-xs text-gray-500 mt-0.5">Mỗi sinh viên chỉ được làm 1 lần duy nhất. Bắt buộc nhập thời gian Mở bài.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <CustomDateTimePicker
              label="Khung giờ mở bài"
              value={startTime}
              onChange={handleStartTimeChange}
              onClear={examPolicy !== 'EXAM_STRICT' ? () => handleStartTimeChange('') : undefined}
            />

            <CustomDateTimePicker
              label="Khung giờ đóng bài"
              hint="Mở mãi mãi nếu không thiết lập"
              value={endTime}
              onChange={setEndTime}
              onClear={() => setEndTime('')}
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-bold text-gray-700 bg-gray-50 p-4 rounded-xl border">
            <input
              type="checkbox"
              checked={allowReview}
              onChange={(e) => setAllowReview(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            Cho phép học viên xem lại đáp án sau khi nộp bài
          </label>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-gray-700">
              Thời gian làm bài (Phút)
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold text-gray-700">
              Số câu hỏi mỗi lượt
              <input
                type="number"
                min="1"
                max={quiz.questionCount ?? 100}
                value={randomPickCount}
                onChange={(e) => setRandomPickCount(e.target.value)}
                placeholder={`Mặc định: ${quiz.questionCount ?? '0'} câu`}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-red-950 flex items-center gap-2">
                Giám Sát Thi Cử AI (Anti-Cheat)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProctored}
                  onChange={(e) => setIsProctored(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            <p className="text-sm text-red-800 leading-relaxed border-l-2 border-red-300 pl-3">
              Yêu cầu bật Camera. Hệ thống AI sẽ tự động giám sát khuôn mặt, cảnh báo khi học viên rời khỏi màn hình hoặc chuyển sang tab khác.
            </p>

            {isProctored && (
              <div className="pt-4 border-t border-red-200">
                <label className="flex flex-col gap-2 text-sm font-bold text-red-900">
                  Số lần vi phạm tối đa trước khi tự động thu bài
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxViolations}
                    onChange={(e) => setMaxViolations(e.target.value)}
                    className="rounded-xl border border-red-300 px-4 py-2.5 text-sm bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none w-full sm:w-1/2"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Giao diện Sinh AI Official Mới Cho Giảng Viên */
function GenerateAiOfficialView({ courseId, initialType, onClose, onSuccess }: { courseId: number; initialType: 'QUIZ' | 'FLASHCARD' | 'MINDMAP'; onClose: () => void; onSuccess: () => void }) {
  const [materialType, setMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP'>(initialType);
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
    if (!materialType) {
      toast.error("Vui lòng chọn loại học liệu bạn muốn tạo");
      return;
    }
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
    <div className="w-full rounded-3xl bg-white p-8 shadow-sm border border-gray-200">
      <div className="border-b pb-4 mb-6">
        <h3 className="text-2xl font-black text-gray-900">Tạo Học Liệu AI Tự Động</h3>
        <p className="text-sm text-gray-500 mt-1">Lựa chọn loại học liệu bạn muốn AI tự động tổng hợp từ nội dung bài giảng.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Bước 1: Chọn Loại Học Liệu (Card Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setMaterialType('QUIZ')}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'QUIZ' ? 'border-cyan-500 bg-cyan-50/50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-cyan-300 bg-white'
              }`}
          >
            <div className="text-4xl">📝</div>
            <div className="font-bold text-gray-900">Bài Thi Trắc Nghiệm</div>
            <div className="text-xs text-gray-500">Sinh câu hỏi trắc nghiệm kèm giải thích</div>
          </div>

          <div
            onClick={() => setMaterialType('FLASHCARD')}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'FLASHCARD' ? 'border-purple-500 bg-purple-50/50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
          >
            <div className="text-4xl">🃏</div>
            <div className="font-bold text-gray-900">Thẻ Flashcard</div>
            <div className="text-xs text-gray-500">Trích xuất thuật ngữ & khái niệm 2 mặt</div>
          </div>

          <div
            onClick={() => setMaterialType('MINDMAP')}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'MINDMAP' ? 'border-blue-500 bg-blue-50/50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
          >
            <div className="text-4xl">🧠</div>
            <div className="font-bold text-gray-900">Sơ Đồ Tư Duy</div>
            <div className="text-xs text-gray-500">Vẽ sơ đồ luồng kiến thức trực quan</div>
          </div>
        </div>

        {/* Bước 2: Hiển thị các Option nếu đã chọn loại */}
        {materialType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
            <h4 className="font-bold text-gray-800 border-b pb-2">Cấu Hình Chi Tiết</h4>

            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Phạm vi tạo học liệu
              <select
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value as 'WHOLE_COURSE' | 'CHAPTER')}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-cyan-500 outline-none bg-white"
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

            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
              <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                Hủy
              </button>
              <button
                type="submit"
                disabled={generateMutation.isPending || !materialType}
                className="rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50 shadow-md"
              >
                {generateMutation.isPending ? 'Đang gọi AI...' : '✨ Bắt Đầu Sinh'}
              </button>
            </div>
          </div>
        )}
      </form>
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
