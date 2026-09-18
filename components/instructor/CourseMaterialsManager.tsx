'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi, InstructorMaterial, MaterialDetailRes } from '@/lib/api/materials';

import { useMyCourseDetail } from "@/hooks/useCourses";

import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { MindmapEditor } from '@/components/materials/MindmapEditor';
import { MermaidViewer } from '@/components/materials/MermaidViewer';
import { MaterialLanguagePicker } from '@/components/materials/MaterialLanguagePicker';

import { Folder, FileText, MoreVertical, Plus, Trash2, BookOpen, Layers } from 'lucide-react';

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

  
  const [breadcrumbs] = useState<{id: number | null, name: string}[]>([{id: null, name: 'Workspace'}]);

  const [genMaterialType, setGenMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP' | null>(null);
  const [manualMaterialType, setManualMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP' | null>(null);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['instructor-materials', courseId],
    queryFn: () => materialsApi.getInstructorMaterials(courseId),
    enabled: !!courseId,
  });

  const { data: courseDetail } = useMyCourseDetail(courseId);
  const chapters = courseDetail?.chapters;

  // Placeholder for folder data
  const folders: {id: number, name: string}[] = [];


  const deleteMaterialMutation = useMutation({
    mutationFn: (id: number) => materialsApi.deleteMaterial(id),
    onSuccess: () => {
      toast.success('Đã xóa bộ học liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      setInspectGenerationId(null);
      setConfirmDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi khi xóa học liệu'),
  });

  const renderDeleteModal = () => {
    if (!confirmDeleteId) return null;
    
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl overflow-hidden border border-red-100">
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-bold text-red-950">Xóa Học Liệu</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-600 text-sm mb-4">
              Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMaterialMutation.mutate(confirmDeleteId)}
                disabled={deleteMaterialMutation.isPending}
                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {deleteMaterialMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="p-6 text-center text-sm text-gray-500 animate-pulse">Đang tải...</div>;

  if (inspectGenerationId) {
    const activeMat = materials?.find(m => m.id === inspectGenerationId);
    return (
      <>
        <MaterialWorkspaceViewer
          generationId={inspectGenerationId}
          material={activeMat}
          onBack={() => setInspectGenerationId(null)}
          onToggleOfficial={() => {}}
          onDelete={() => setConfirmDeleteId(inspectGenerationId)}
        />
        {renderDeleteModal()}
      </>
    );
  }

  if (genMaterialType) {
    return <GenerateAiOfficialView courseId={courseId} initialType={genMaterialType} onClose={() => setGenMaterialType(null)} onSuccess={() => { setGenMaterialType(null); queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] }); }} />;
  }

  if (manualMaterialType) {
    return <GenerateManualOfficialView courseId={courseId} initialType={manualMaterialType} onClose={() => setManualMaterialType(null)} onSuccess={(id) => { setManualMaterialType(null); queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] }); setInspectGenerationId(id); }} />;
  }

  let displayedMaterials = materials || [];

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 bg-gray-50 p-4 font-sans text-gray-800">
      
            {/* LEFT PANE: Curriculum Tree */}
      <div className="w-1/3 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <h3 className="font-bold text-sm text-gray-700">Phân Phối (Shortcuts)</h3>
        </div>
        <div className="overflow-y-auto p-2 flex flex-col gap-1 flex-1">
          {chapters?.map(chapter => {
            const chapterMaterials = materials?.filter(m => m.chapterId === chapter.id) || [];
            
            return (
              <div key={chapter.id} className="mt-2">
                <div className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-bold text-gray-800 bg-gray-50 rounded-md">
                  <span>📁</span> Chương: {chapter.title}
                </div>
                
                {/* Render chapter shortcuts */}
                {chapterMaterials.map(mat => (
                  <div key={`mat-${mat.id}`} className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600 pl-6 hover:bg-blue-50 rounded-md cursor-pointer transition-colors" title="Nháy đúp để xem trước, nháy đơn để chọn gỡ phân phối">
                    <span className="text-[10px]">🔗</span> {mat.title || 'Học liệu'}
                  </div>
                ))}
                
                <div className="flex flex-col gap-1 mt-1 ml-2">
                  {chapter.lessons.map(lesson => {
                    const lessonMaterials = materials?.filter(m => m.lessonId === lesson.id) || [];
                    return (
                      <div key={lesson.id} className="border-l border-gray-100 pl-2">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-50/50 rounded-md mt-1">
                          <span>📄</span> {lesson.title}
                        </div>
                        {/* Render lesson shortcuts */}
                        {lessonMaterials.map(mat => (
                          <div key={`mat-${mat.id}`} className="flex items-center gap-2 px-2 py-1 text-[11px] text-gray-600 pl-6 hover:bg-blue-50 rounded-md cursor-pointer transition-colors" title="Nháy đúp để xem trước, nháy đơn để chọn gỡ phân phối">
                            <span className="text-[10px]">🔗</span> {mat.title || 'Học liệu'}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

{/* RIGHT PANE: Master Vault */}
      <div className="w-2/3 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <button className="hover:text-blue-600 hover:underline">{b.name}</button>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              title="Tạo Thư Mục"
              className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <Folder className="w-4 h-4" />
            </button>
            <button
              title="Tạo AI"
              onClick={() => setGenMaterialType('QUIZ')}
              className="p-1.5 rounded-md hover:bg-gray-200 text-blue-600 transition-colors bg-blue-50"
            >
              <span className="text-xs font-bold px-1">AI</span>
            </button>
            <button
              title="Tạo Thủ công"
              onClick={() => setManualMaterialType('QUIZ')}
              className="p-1.5 rounded-md hover:bg-gray-200 text-emerald-600 transition-colors bg-emerald-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {folders.map((f) => (
              <div key={f.id} className="border border-gray-200 bg-white p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50 hover:border-blue-200 transition-colors group">
                <Folder className="w-8 h-8 text-blue-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm font-semibold text-gray-700 select-none truncate">{f.name}</span>
              </div>
            ))}

            {displayedMaterials.map(mat => (
              <div 
                key={mat.id} 
                onDoubleClick={() => {
                  setInspectGenerationId(mat.id);
                }}
                className={`relative border border-gray-200 bg-white rounded-lg flex flex-col overflow-hidden group hover:shadow-md transition-all cursor-pointer hover:border-blue-300`}
              >
                <div className="p-3 pb-2 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-md ${mat.materialType === 'MINDMAP' ? 'bg-blue-50 text-blue-600' : mat.materialType === 'FLASHCARD' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {mat.materialType === 'MINDMAP' ? <Layers className="w-4 h-4" /> : mat.materialType === 'FLASHCARD' ? <BookOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-gray-500">{mat.materialType}</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">
                    {mat.title || 'Học liệu không tên'}
                  </h4>
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    <span>{new Date(mat.createdAt).toLocaleDateString('vi-VN')}</span>
                    {mat.isOfficial && <span className="text-emerald-600 bg-emerald-50 px-1.5 rounded-sm">Official</span>}
                  </div>
                </div>
                
                {/* Status Bar */}
                {mat.status !== 'COMPLETED' && (
                  <div className="h-4 w-full bg-gray-100 overflow-hidden relative">
                     {(mat.status === 'PENDING' || mat.status === 'PROCESSING' || mat.status === 'PENDING_TRANSCRIPT') ? (
                      <div className="absolute top-0 left-0 h-full w-full bg-[repeating-linear-gradient(45deg,#000,#000_6px,#fbbf24_6px,#fbbf24_12px)] animate-[bg-scroll_1s_linear_infinite]" style={{ backgroundSize: '16px 16px' }} />
                    ) : mat.status === 'FAILED' ? (
                      <div className="absolute top-0 left-0 h-full w-full bg-red-500" />
                    ) : (
                      <div className="absolute top-0 left-0 h-full w-full bg-gray-400" />
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {displayedMaterials.length === 0 && folders.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                <Folder className="w-12 h-12 text-gray-200 mb-2" />
                <p className="text-xs font-medium">Thư mục trống</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals & Portals */}
      {renderDeleteModal()}
      {confirmAction && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-2">{confirmAction.title}</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">{confirmAction.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Hủy</button>
              <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Xác nhận</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/** Workspace Xem & Chỉnh Sửa Học Liệu Trực Quan Mở Rộng Đầy Đủ Không Gian */
function MaterialWorkspaceViewer({
  generationId,
  material,
  onBack,
  onToggleOfficial,
  onDelete
}: {
  generationId: number;
  material?: InstructorMaterial;
  onBack: () => void;
  onToggleOfficial: () => void;
  onDelete?: () => void;
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
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<{ id: number; frontText: string; backText: string } | null>(null);
  const [isAddingFlashcard, setIsAddingFlashcard] = useState(false);

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => materialsApi.deleteQuizQuestion(id),
    onSuccess: () => {
      toast.success('Đã xóa câu hỏi');
      queryClient.invalidateQueries({ queryKey: ['material-detail', generationId] });
    }
  });

  const deleteFlashcardMutation = useMutation({
    mutationFn: (id: number) => materialsApi.deleteFlashcard(id),
    onSuccess: () => {
      toast.success('Đã xóa Flashcard');
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
          {onDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center rounded-xl px-4 py-2 text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all ml-1 shadow-sm"
              title="Xóa toàn bộ học liệu này"
            >
              Xóa Bộ Học Liệu
            </button>
          )}
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
                  <div className="flex justify-end mb-2">
                    <button onClick={() => setIsAddingQuestion(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-sm border border-indigo-200 transition-colors">
                      + Thêm Câu Hỏi Mới
                    </button>
                  </div>
                  {detail.quizQuestions.map((q, idx) => (
                    <div key={q.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-3 shadow-sm hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-base text-gray-900">
                          <span className="text-blue-600 mr-2">Câu {idx + 1}:</span> {q.content}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setEditingQuestion(q)} className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 border border-gray-200">Sửa</button>
                          <button onClick={() => deleteQuestionMutation.mutate(q.id)} className="text-xs font-semibold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200">Xóa</button>
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
                <div className="w-full relative group">
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-slate-400 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(detail.mermaidCode || '');
                        toast.success('Đã copy!');
                      }}
                      className="flex items-center gap-2 text-xs font-mono w-full h-full outline-none"
                      title="Copy to clipboard"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      {detail.mermaidCode ? detail.mermaidCode.split('\n').length : 0} lines
                    </button>
                  </div>
                  <pre className="p-6 pt-16 rounded-2xl bg-slate-900 text-cyan-300 font-mono text-xs overflow-x-auto min-h-[500px] border border-slate-800 leading-relaxed shadow-inner">
                    {detail.mermaidCode}
                  </pre>
                </div>
              ) : activeTab === 'VIEW' ? (
                <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200">
                  <MermaidViewer chart={detail.mermaidCode} />
                </div>
              ) : (
                <div className="w-full h-[700px] border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                  <MindmapEditor
                    initialMermaidCode={detail.mermaidCode}
                    initialTemplate={(detail as unknown as { extraConfig?: { mapTemplate?: string } }).extraConfig?.mapTemplate}
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
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-purple-950">Bộ Thẻ Học Flashcards 2 Mặt Trực Quan</h3>
                  <p className="text-xs text-purple-700 mt-0.5">Bấm vào thẻ để lật, hoặc Sửa/Xóa bên dưới thẻ.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-purple-600 text-white font-extrabold text-xs px-3 py-1 rounded-full">
                    {detail.flashcards.length} Thẻ ôn tập
                  </span>
                  <button onClick={() => setIsAddingFlashcard(true)} className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-bold border border-purple-200 transition-colors">
                    + Thêm Thẻ Mới
                  </button>
                </div>
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

                      <div className="flex items-center justify-between mt-3 border-t border-purple-100 pt-3">
                        <div className="text-[11px] opacity-70">
                          {isFlipped ? 'Nhấn để lật lại' : 'Nhấn để xem giải nghĩa'}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingFlashcard(card); }} className="text-[11px] font-bold bg-white/50 hover:bg-white text-purple-700 px-2.5 py-1 rounded-md border border-purple-200">Sửa</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteFlashcardMutation.mutate(card.id); }} className="text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-md border border-red-200">Xóa</button>
                        </div>
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
          question={{...editingQuestion, usageCount: detail?.usageCount}}
          onClose={() => setEditingQuestion(null)}
          onSuccess={() => {
            setEditingQuestion(null);
            queryClient.invalidateQueries({ queryKey: ['material-detail', generationId] });
          }}
        />
      )}
      {isAddingQuestion && detail?.quizQuestions && (
        <NewQuizQuestionEditorModal
          quizId={material!.materialId!}
          onClose={() => setIsAddingQuestion(false)}
          onSuccess={() => {
            setIsAddingQuestion(false);
            queryClient.invalidateQueries({ queryKey: ['material-detail', generationId] });
          }}
        />
      )}
      {editingFlashcard && (
        <FlashcardEditorModal
          flashcard={{...editingFlashcard, usageCount: detail?.usageCount}}
          onClose={() => setEditingFlashcard(null)}
          onSuccess={() => {
            setEditingFlashcard(null);
            queryClient.invalidateQueries({ queryKey: ['material-detail', generationId] });
          }}
        />
      )}
      {isAddingFlashcard && detail && (
        <NewFlashcardEditorModal
          generationId={detail.id}
          onClose={() => setIsAddingFlashcard(false)}
          onSuccess={() => {
            setIsAddingFlashcard(false);
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
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">Cấu Hình Bài Thi</h3>
            {quiz.quizType === 'LECTURE_QUIZ' ? (
              <span className="px-2.5 py-1 text-xs font-extrabold bg-emerald-100 text-emerald-700 rounded-md uppercase tracking-wider">Quick Check</span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-extrabold bg-purple-100 text-purple-700 rounded-md uppercase tracking-wider">Official Exam</span>
            )}
          </div>
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
  const [quizType, setQuizType] = useState<'LECTURE_QUIZ' | 'OFFICIAL_EXAM'>('OFFICIAL_EXAM');
  const [scopeType, setScopeType] = useState<'WHOLE_COURSE' | 'CHAPTER' | 'LESSON'>('WHOLE_COURSE');
  const [scopeRefId, setScopeRefId] = useState<number | undefined>(undefined);
  const [lessonId, setLessonId] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [quantityLevel, setQuantityLevel] = useState<'FEWER' | 'STANDARD' | 'MORE'>('STANDARD');
  const [language, setLanguage] = useState<string>('');
  const [mapTemplate, setMapTemplate] = useState<string>('MINDMAP');

  const { data: languages } = useQuery({
    queryKey: ['available-languages', courseId],
    queryFn: () => materialsApi.getAvailableLanguages(courseId),
  });

  useEffect(() => {
    if (languages && languages.length > 0 && !language) {
      setLanguage(languages?.[0]?.code ?? '');
    }
  }, [languages, language]);

  const { data: courseDetail } = useMyCourseDetail(courseId);
  const chapters = courseDetail?.chapters;

  // Auto-generate title
  useEffect(() => {
    if (isTitleEdited) return;
    let typeName = materialType === 'QUIZ' ? 'Quick Check' : materialType === 'MINDMAP' ? 'Mindmap' : 'Flashcard';
    if (materialType === 'QUIZ' && scopeType === 'WHOLE_COURSE') typeName = 'Đề thi Tổng kết';

    let newTitle = '';
    if (scopeType === 'LESSON' && lessonId && chapters) {
      const lesson = chapters.flatMap(c => c.lessons).find(l => l.id === lessonId);
      if (lesson) newTitle = `${typeName} - ${lesson.title}`;
    } else if (scopeType === 'CHAPTER' && scopeRefId && chapters) {
      const chapter = chapters.find(c => c.id === scopeRefId);
      if (chapter) newTitle = `${typeName} Ôn tập - ${chapter.title}`;
    } else if (scopeType === 'WHOLE_COURSE') {
      newTitle = `${typeName} - Khóa học`;
    }

    if (newTitle && newTitle !== title) {
      setTitle(newTitle);
    }
  }, [materialType, scopeType, scopeRefId, lessonId, chapters, isTitleEdited, title]);

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
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }
    if (scopeType === 'CHAPTER' && !scopeRefId) {
      toast.error("Vui lòng chọn một chương");
      return;
    }
    if (scopeType === 'LESSON' && !lessonId) {
      toast.error("Vui lòng chọn một bài học");
      return;
    }
    generateMutation.mutate({
      courseId,
      materialType,
      title: title.trim(),
      scopeType: scopeType === 'LESSON' ? 'CUSTOM_LESSONS' : scopeType,
      scopeRefId: scopeType === 'CHAPTER' ? scopeRefId : undefined,
      customLessonIds: scopeType === 'LESSON' && lessonId ? [lessonId] : undefined,
      difficultyLevel,
      quantityLevel,
      language,
      // Pass the template to backend if needed (e.g. via metadata or extra param)
      extraConfig: materialType === 'MINDMAP' ? { mapTemplate } : undefined,
    });
  };

  return (
    <div className="w-full rounded-3xl bg-white p-8 shadow-sm border border-gray-200 relative">
      <div className="border-b pb-4 mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black text-gray-900">Tạo Học Liệu AI Tự Động</h3>
          <p className="text-sm text-gray-500 mt-1">Lựa chọn loại học liệu bạn muốn AI tự động tổng hợp từ nội dung bài giảng.</p>
        </div>
        <button type="button" onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Đóng">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Bước 1: Chọn Loại Học Liệu (Card Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => {
              setMaterialType('QUIZ');
              setScopeType(quizType === 'LECTURE_QUIZ' ? 'LESSON' : 'WHOLE_COURSE');
            }}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'QUIZ' ? 'border-cyan-500 bg-cyan-50/50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-cyan-300 bg-white'
              }`}
          >
            <div className="text-4xl">📝</div>
            <div className="font-bold text-gray-900">Bài Thi Trắc Nghiệm</div>
            <div className="text-xs text-gray-500">Sinh câu hỏi trắc nghiệm kèm giải thích</div>
          </div>

          <div
            onClick={() => {
              setMaterialType('FLASHCARD');
              setScopeType('CHAPTER');
            }}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'FLASHCARD' ? 'border-purple-500 bg-purple-50/50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
          >
            <div className="text-4xl">🃏</div>
            <div className="font-bold text-gray-900">Thẻ Flashcard</div>
            <div className="text-xs text-gray-500">Trích xuất thuật ngữ & khái niệm 2 mặt</div>
          </div>

          <div
            onClick={() => {
              setMaterialType('MINDMAP');
              setScopeType('CHAPTER');
            }}
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

            {materialType === 'QUIZ' && (
              <div className="flex flex-col gap-2 pt-2 pb-2">
                <span className="text-sm font-semibold text-gray-700">Phân loại Trắc nghiệm</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`cursor-pointer flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${quizType === 'LECTURE_QUIZ' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 bg-white hover:border-cyan-200'}`}>
                    <input type="radio" name="aiQuizType" value="LECTURE_QUIZ" checked={quizType === 'LECTURE_QUIZ'} onChange={() => {
                      setQuizType('LECTURE_QUIZ');
                      setScopeType('LESSON');
                      setScopeRefId(undefined);
                      setLessonId(undefined);
                    }} className="mt-1" />
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm">Kiểm tra nhanh (Quick Check)</span>
                      <span className="text-xs text-gray-500">Gắn vào 1 Bài học. Luôn hiện giải thích, làm vô hạn lần, không tính giờ.</span>
                    </div>
                  </label>
                  <label className={`cursor-pointer flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${quizType === 'OFFICIAL_EXAM' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 bg-white hover:border-cyan-200'}`}>
                    <input type="radio" name="aiQuizType" value="OFFICIAL_EXAM" checked={quizType === 'OFFICIAL_EXAM'} onChange={() => {
                      setQuizType('OFFICIAL_EXAM');
                      setScopeType('WHOLE_COURSE');
                      setScopeRefId(undefined);
                      setLessonId(undefined);
                    }} className="mt-1" />
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm">Thi chính thức (Official Exam)</span>
                      <span className="text-xs text-gray-500">Thi theo Chương/Khóa học. Có tính giờ, ghi Bảng điểm, tùy chỉnh lượt làm.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Tiêu đề học liệu
              <input
                type="text"
                key={`ai-title-${materialType}-${scopeType}-${scopeRefId || ''}-${lessonId || ''}`}
                defaultValue={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsTitleEdited(true);
                }}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-cyan-500 outline-none bg-white"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Phạm vi tạo học liệu
              <select
                value={scopeType}
                onChange={(e) => {
                  setScopeType(e.target.value as 'WHOLE_COURSE' | 'CHAPTER' | 'LESSON');
                  setIsTitleEdited(false); // Reset to allow auto-fill on change
                }}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-cyan-500 outline-none bg-white"
              >
                {materialType === 'QUIZ' && quizType === 'OFFICIAL_EXAM' && <option value="WHOLE_COURSE">Toàn bộ khóa học</option>}
                {materialType === 'QUIZ' && quizType === 'OFFICIAL_EXAM' && <option value="CHAPTER">Theo chương cụ thể</option>}
                {materialType === 'QUIZ' && quizType === 'LECTURE_QUIZ' && <option value="LESSON">Bài học cụ thể</option>}
                
                {materialType === 'FLASHCARD' && <option value="CHAPTER">Theo chương cụ thể</option>}
                {materialType === 'FLASHCARD' && <option value="LESSON">Bài học cụ thể</option>}
                
                {materialType === 'MINDMAP' && <option value="CHAPTER">Theo chương cụ thể</option>}
                {materialType === 'MINDMAP' && <option value="LESSON">Bài học cụ thể</option>}
              </select>
            </label>

            {scopeType === 'CHAPTER' && (
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                Chọn chương
                <select
                  value={scopeRefId ?? ''}
                  onChange={(e) => {
                    setScopeRefId(Number(e.target.value));
                    setIsTitleEdited(false);
                  }}
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

            {scopeType === 'LESSON' && (
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                Chọn bài học
                <select
                  value={lessonId ?? ''}
                  onChange={(e) => {
                    setLessonId(Number(e.target.value));
                    setIsTitleEdited(false);
                  }}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- Chọn bài học --</option>
                  {chapters?.flatMap(ch => ch.lessons).map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
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

            {materialType === 'MINDMAP' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-3">Mẫu sơ đồ (Template)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'LOGIC_CHART', name: 'Logic Chart', icon: '➡️' },
                      { id: 'ORG_CHART', name: 'Org Chart', icon: '🏢' },
                    ].map(tpl => (
                      <div 
                        key={tpl.id} 
                        onClick={() => setMapTemplate(tpl.id)}
                        className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${mapTemplate === tpl.id ? 'border-cyan-500 bg-cyan-50 shadow-sm ring-1 ring-cyan-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xl ${mapTemplate === tpl.id ? 'bg-cyan-100/50 opacity-100' : 'bg-gray-50 grayscale opacity-60'}`}>{tpl.icon}</div>
                        <span className={`text-[11px] font-bold text-center ${mapTemplate === tpl.id ? 'text-cyan-700' : 'text-gray-500'}`}>{tpl.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  Mức độ chi tiết nhánh
                  <select
                    value={quantityLevel}
                    onChange={(e) => setQuantityLevel(e.target.value as 'FEWER' | 'STANDARD' | 'MORE')}
                    className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="FEWER">Cơ bản, nhánh chính</option>
                    <option value="STANDARD">Tiêu chuẩn, vừa phải</option>
                    <option value="MORE">Chi tiết, chia nhiều nhánh nhỏ</option>
                  </select>
                </label>
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Ngôn ngữ học liệu
              <MaterialLanguagePicker
                languages={languages ?? []}
                value={language}
                onChange={setLanguage}
              />
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
    isMultipleChoice?: boolean;
    displayOrder: number;
    options: { id: number; content: string; isCorrect: boolean }[];
    usageCount?: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

function QuizQuestionEditorModal({ question, onClose, onSuccess }: QuizQuestionEditorProps) {
  const [content, setContent] = useState(question.content);
  const [isMultipleChoice, setIsMultipleChoice] = useState(question.isMultipleChoice || false);
  const [options, setOptions] = useState<{ id: number; content: string; isCorrect: boolean }[]>(
    JSON.parse(JSON.stringify(question.options))
  );

  const updateMutation = useMutation({
    mutationFn: () => {
      const validOptions = options.filter(o => o.content.trim() !== '');
      return materialsApi.updateQuizQuestion(question.id, { content, isMultipleChoice, options: validOptions });
    },
    onSuccess: () => {
      toast.success('Đã lưu thay đổi câu hỏi');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể lưu câu hỏi');
    }
  });

  const handleToggleCorrect = (idx: number) => {
    if (isMultipleChoice) {
      setOptions(options.map((o, i) => i === idx ? { ...o, isCorrect: !o.isCorrect } : o));
    } else {
      setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Chỉnh sửa Nội Dung Câu Hỏi</h3>
        
        {question.usageCount && question.usageCount > 0 ? (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
            ⚠️ Lưu ý: Học liệu này đã có lượt làm bài. Sửa đáp án câu hỏi sẽ ảnh hưởng đến kết quả chấm điểm của các bài thi đã nộp trước đó.
          </div>
        ) : null}

        <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung câu hỏi</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-xl mb-5 focus:border-indigo-500 focus:outline-none"
          rows={3}
        />

        <label className="block text-sm font-semibold text-gray-700 mb-1">Loại câu hỏi</label>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={!isMultipleChoice} onChange={() => setIsMultipleChoice(false)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
            Single Choice (1 đáp án đúng)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={isMultipleChoice} onChange={() => setIsMultipleChoice(true)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
            Multiple Choice (Nhiều đáp án đúng)
          </label>
        </div>

        <label className="block text-sm font-semibold text-gray-700 mb-2">Các đáp án</label>
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <div key={idx} className={`flex gap-3 items-center p-3 rounded-xl border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200'}`}>
              <input
                type={isMultipleChoice ? "checkbox" : "radio"}
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
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newOptions = [...options];
                    newOptions.splice(idx + 1, 0, { id: -Date.now(), content: '', isCorrect: false });
                    setOptions(newOptions);
                    setTimeout(() => {
                      const inputs = document.querySelectorAll('.option-input');
                      if (inputs[idx + 1]) (inputs[idx + 1] as HTMLElement).focus();
                    }, 50);
                  }
                }}
                className={`option-input flex-1 p-2 bg-transparent border-b ${opt.isCorrect ? 'border-emerald-200 focus:border-emerald-500' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none text-sm font-medium`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Xóa đáp án"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {isMultipleChoice && (
            <div className="flex gap-3 items-center p-3 rounded-xl border border-dashed border-gray-300 opacity-60 hover:opacity-100 transition-opacity">
              <input type="checkbox" disabled className="w-5 h-5 cursor-not-allowed" />
              <input
                type="text"
                placeholder="Nhập đáp án mới và nhấn Enter..."
                value=""
                onChange={() => {}}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newOptions = [...options, { id: -Date.now(), content: (e.target as HTMLInputElement).value || 'Đáp án mới', isCorrect: false }];
                    setOptions(newOptions);
                    setTimeout(() => {
                      const inputs = document.querySelectorAll('.option-input');
                      if (inputs.length > 0) (inputs[inputs.length - 1] as HTMLElement).focus();
                    }, 50);
                  }
                }}
                className={`flex-1 p-2 bg-transparent border-b border-gray-300 focus:outline-none text-sm font-medium`}
              />
            </div>
          )}
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

function NewQuizQuestionEditorModal({ quizId, onClose, onSuccess }: { quizId: number; onClose: () => void; onSuccess: () => void; }) {
  const [content, setContent] = useState('');
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [options, setOptions] = useState<{ id: number; content: string; isCorrect: boolean }[]>([
    { id: -1, content: 'Đáp án A', isCorrect: true },
    { id: -2, content: 'Đáp án B', isCorrect: false },
    { id: -3, content: 'Đáp án C', isCorrect: false },
    { id: -4, content: 'Đáp án D', isCorrect: false },
  ]);

  const addMutation = useMutation({
    mutationFn: () => {
      const validOptions = options.filter(o => o.content.trim() !== '');
      return materialsApi.addQuizQuestion(quizId, { content, isMultipleChoice, options: validOptions });
    },
    onSuccess: () => {
      toast.success('Đã thêm câu hỏi mới');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể thêm câu hỏi');
    }
  });

  const handleToggleCorrect = (idx: number) => {
    if (isMultipleChoice) {
      setOptions(options.map((o, i) => i === idx ? { ...o, isCorrect: !o.isCorrect } : o));
    } else {
      setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Thêm Câu Hỏi Mới</h3>

        <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung câu hỏi</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Nhập nội dung câu hỏi..."
          className="w-full border border-gray-300 p-3 rounded-xl mb-5 focus:border-indigo-500 focus:outline-none"
          rows={3}
        />

        <label className="block text-sm font-semibold text-gray-700 mb-1">Loại câu hỏi</label>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={!isMultipleChoice} onChange={() => setIsMultipleChoice(false)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
            Single Choice (1 đáp án đúng)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={isMultipleChoice} onChange={() => setIsMultipleChoice(true)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
            Multiple Choice (Nhiều đáp án đúng)
          </label>
        </div>

        <label className="block text-sm font-semibold text-gray-700 mb-2">Các đáp án</label>
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <div key={idx} className={`flex gap-3 items-center p-3 rounded-xl border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200'}`}>
              <input
                type={isMultipleChoice ? "checkbox" : "radio"}
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
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newOptions = [...options];
                    newOptions.splice(idx + 1, 0, { id: -Date.now(), content: '', isCorrect: false });
                    setOptions(newOptions);
                    setTimeout(() => {
                      const inputs = document.querySelectorAll('.option-input');
                      if (inputs[idx + 1]) (inputs[idx + 1] as HTMLElement).focus();
                    }, 50);
                  }
                }}
                className={`option-input flex-1 p-2 bg-transparent border-b ${opt.isCorrect ? 'border-emerald-200 focus:border-emerald-500' : 'border-gray-300 focus:border-indigo-500'} focus:outline-none text-sm font-medium`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Xóa đáp án"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {isMultipleChoice && (
            <div className="flex gap-3 items-center p-3 rounded-xl border border-dashed border-gray-300 opacity-60 hover:opacity-100 transition-opacity">
              <input type="checkbox" disabled className="w-5 h-5 cursor-not-allowed" />
              <input
                type="text"
                placeholder="Nhập đáp án mới và nhấn Enter..."
                value=""
                onChange={() => {}}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newOptions = [...options, { id: -Date.now(), content: (e.target as HTMLInputElement).value || 'Đáp án mới', isCorrect: false }];
                    setOptions(newOptions);
                    setTimeout(() => {
                      const inputs = document.querySelectorAll('.option-input');
                      if (inputs.length > 0) (inputs[inputs.length - 1] as HTMLElement).focus();
                    }, 50);
                  }
                }}
                className={`flex-1 p-2 bg-transparent border-b border-gray-300 focus:outline-none text-sm font-medium`}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 font-semibold text-gray-700 rounded-lg hover:bg-gray-200">Hủy</button>
          <button
            onClick={() => {
              if (!content.trim()) return toast.error('Vui lòng nhập nội dung câu hỏi');
              addMutation.mutate();
            }}
            disabled={addMutation.isPending}
            className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow disabled:opacity-50"
          >
            {addMutation.isPending ? 'Đang thêm...' : 'Thêm Câu Hỏi'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FlashcardEditorModal({ flashcard, onClose, onSuccess }: { flashcard: { id: number, frontText: string, backText: string, usageCount?: number }, onClose: () => void, onSuccess: () => void }) {
  const [frontText, setFrontText] = useState(flashcard.frontText);
  const [backText, setBackText] = useState(flashcard.backText);

  const updateMutation = useMutation({
    mutationFn: () => materialsApi.updateFlashcard(flashcard.id, { frontText, backText }),
    onSuccess: () => {
      toast.success('Đã cập nhật Flashcard');
      onSuccess();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Chỉnh sửa Flashcard</h3>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mặt Trước (Thuật ngữ)</label>
        <textarea value={frontText} onChange={e => setFrontText(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:border-purple-500 focus:outline-none" rows={3} />
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mặt Sau (Khái niệm)</label>
        <textarea value={backText} onChange={e => setBackText(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl mb-5 focus:border-purple-500 focus:outline-none" rows={3} />
        
        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 font-semibold text-gray-700 rounded-lg hover:bg-gray-200">Hủy</button>
          <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow disabled:opacity-50">Lưu Thay Đổi</button>
        </div>
      </div>
    </div>
  );
}

function NewFlashcardEditorModal({ generationId, onClose, onSuccess }: { generationId: number, onClose: () => void, onSuccess: () => void }) {
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  const addMutation = useMutation({
    mutationFn: () => materialsApi.addFlashcard(generationId, { frontText, backText }),
    onSuccess: () => {
      toast.success('Đã thêm Flashcard mới');
      onSuccess();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Thêm Flashcard Mới</h3>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mặt Trước (Thuật ngữ)</label>
        <textarea value={frontText} onChange={e => setFrontText(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:border-purple-500 focus:outline-none" rows={3} />
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mặt Sau (Khái niệm)</label>
        <textarea value={backText} onChange={e => setBackText(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl mb-5 focus:border-purple-500 focus:outline-none" rows={3} />
        
        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 font-semibold text-gray-700 rounded-lg hover:bg-gray-200">Hủy</button>
          <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !frontText.trim() || !backText.trim()} className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow disabled:opacity-50">Thêm Thẻ</button>
        </div>
      </div>
    </div>
  );
}

/** Giao diện Sinh Thủ Công Cho Giảng Viên */
function GenerateManualOfficialView({ courseId, initialType, onClose, onSuccess }: { courseId: number; initialType: 'QUIZ' | 'FLASHCARD' | 'MINDMAP'; onClose: () => void; onSuccess: (id: number) => void }) {
  const [materialType, setMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP'>(initialType);
  const [title, setTitle] = useState('');
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  const [language, setLanguage] = useState<string>('');
  const [quizType, setQuizType] = useState<'OFFICIAL_EXAM' | 'LECTURE_QUIZ'>('OFFICIAL_EXAM');

  const { data: languages } = useQuery({
    queryKey: ['available-languages', courseId],
    queryFn: () => materialsApi.getAvailableLanguages(courseId),
  });



  useEffect(() => {
    if (languages && languages.length > 0 && !language) {
      setLanguage(languages?.[0]?.code ?? '');
    }
  }, [languages, language]);

  // Auto-generate title for manual
  useEffect(() => {
    if (isTitleEdited) return;
    const typeName = materialType === 'QUIZ' ? (quizType === 'LECTURE_QUIZ' ? 'Quick Check' : 'Đề thi Tổng kết') : (materialType === 'MINDMAP' ? 'Mindmap' : 'Flashcard');

    const newTitle = `${typeName} - Khóa học`;

    if (newTitle && newTitle !== title) {
      setTitle(newTitle);
    }
  }, [materialType, quizType, isTitleEdited, title]);

  const generateManualMutation = useMutation({
    mutationFn: (input: { materialType: string; language: string; title: string; quizType?: string; scope: string; scopeRefId?: string; customLessonIds?: string }) => materialsApi.createManualMaterial(courseId, input),
    onSuccess: (data) => {
      toast.success('Đã khởi tạo học liệu trống thành công!');
      onSuccess(data.id);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể khởi tạo học liệu');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialType) {
      toast.error("Vui lòng chọn loại học liệu");
      return;
    }
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên học liệu");
      return;
    }
    generateManualMutation.mutate({
      materialType,
      language,
      title: title.trim(),
      ...(materialType === 'QUIZ' ? { quizType } : {}),
      scope: 'COURSE'
    });
  };

  return (
    <div className="w-full rounded-3xl bg-white p-8 shadow-sm border border-emerald-200 relative">
      <div className="border-b pb-4 mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>✍️</span> Tạo Học Liệu Thủ Công
          </h3>
          <p className="text-sm text-gray-500 mt-1">Khởi tạo một bản ghi rỗng để bạn tự tay nhập nội dung 100%.</p>
        </div>
        <button type="button" onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Đóng">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => {
              setMaterialType('QUIZ');
            }}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'QUIZ' ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-emerald-300 bg-white'}`}
          >
            <div className="text-4xl">📝</div>
            <div className="font-bold text-gray-900">Bài Thi (Quiz)</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded">Khởi tạo trống</div>
          </div>
          <div
            onClick={() => {
              setMaterialType('FLASHCARD');
            }}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'FLASHCARD' ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-emerald-300 bg-white'}`}
          >
            <div className="text-4xl">🃏</div>
            <div className="font-bold text-gray-900">Flashcard</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded">Khởi tạo trống</div>
          </div>
          <div
            onClick={() => {
              setMaterialType('MINDMAP');
            }}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'MINDMAP' ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-emerald-300 bg-white'}`}
          >
            <div className="text-4xl">🧠</div>
            <div className="font-bold text-gray-900">Mindmap</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded">Khởi tạo trống</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Tên học liệu
            <input
              type="text"
              key={`manual-title-${materialType}-${quizType}`}
              defaultValue={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsTitleEdited(true);
              }}
              placeholder="VD: Bài thi giữa kỳ, Khái niệm cơ bản..."
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 outline-none bg-white"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Ngôn ngữ học liệu
            <MaterialLanguagePicker
              languages={languages ?? []}
              value={language}
              onChange={setLanguage}
            />
          </label>

          {materialType === 'QUIZ' && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-sm font-semibold text-gray-700">Phân loại Trắc nghiệm</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`cursor-pointer flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${quizType === 'LECTURE_QUIZ' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}>
                  <input type="radio" name="quizTypeTop" value="LECTURE_QUIZ" checked={quizType === 'LECTURE_QUIZ'} onChange={() => {
                    setQuizType('LECTURE_QUIZ');
                  }} className="mt-1" />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm">Kiểm tra nhanh (Quick Check)</span>
                    <span className="text-xs text-gray-500">Gắn vào 1 Bài học. Luôn hiện giải thích, làm vô hạn lần, không tính giờ.</span>
                  </div>
                </label>
                <label className={`cursor-pointer flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${quizType === 'OFFICIAL_EXAM' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}>
                  <input type="radio" name="quizTypeTop" value="OFFICIAL_EXAM" checked={quizType === 'OFFICIAL_EXAM'} onChange={() => {
                    setQuizType('OFFICIAL_EXAM');
                  }} className="mt-1" />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm">Thi chính thức (Official Exam)</span>
                    <span className="text-xs text-gray-500">Thi theo Chương/Khóa học. Có tính giờ, ghi Bảng điểm, tùy chỉnh lượt làm.</span>
                  </div>
                </label>
              </div>
            </div>
          )}





          
          <div className="mt-4 flex justify-end gap-3 border-t pt-5">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">
              Hủy
            </button>
            <button
              type="submit"
              disabled={generateManualMutation.isPending || !materialType || !title.trim()}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md"
            >
              {generateManualMutation.isPending ? 'Đang tạo...' : '✨ Tạo Bản Ghi Trống'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

