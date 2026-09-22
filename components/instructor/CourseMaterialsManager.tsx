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
import { MaterialFolderTree } from './MaterialFolderTree';
import { getMaterialDistributionBadge } from '@/lib/materialStatus';
import { CourseActivityPanel } from './CourseActivityPanel';
import { MaterialBadge } from '@/components/materials/ui/MaterialBadge';
import { MaterialTabs } from '@/components/materials/ui/MaterialTabs';

import { DndContext, useDraggable, useDroppable, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { GripVertical, Trash2, FileText, Plus, Layers, LayoutGrid, List, Search, X, ChevronDown, FileQuestion, Workflow, File, Folder, Link as LinkIcon, History, FileEdit, Sparkles, Lock, ShieldAlert, Check, Copy, Save, GitBranch, Network, AlertTriangle, PencilLine } from 'lucide-react';


interface CourseMaterialsManagerProps {
  courseId: number;
}


function DraggableMaterialCard({ mat, onClick, isLoading: isPending }: { mat: InstructorMaterial; onClick: () => void; isLoading?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `material-${mat.id}`,
    data: { material: mat },
  });

  const badge = getMaterialDistributionBadge(mat);

  const typeConfig: Record<string, { Icon: typeof FileQuestion; label: string }> = {
    QUIZ:      { Icon: FileQuestion, label: 'Quiz' },
    FLASHCARD: { Icon: Layers, label: 'Flashcard' },
    MINDMAP:   { Icon: Workflow, label: 'Mindmap' },
  };
  const cfg = typeConfig[mat.materialType] ?? { Icon: File, label: mat.materialType };

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={(e) => { e.stopPropagation(); onClick(); }}
      {...attributes}
      className={`relative border rounded-card flex flex-col overflow-hidden group transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-95 border-accent border-dashed shadow-card-hover' :
        isPending  ? 'opacity-60 pointer-events-none' :
        'bg-surface-raised border-line hover:shadow-card-hover hover:border-accent/40'
      }`}
    >
      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-raised/60 z-20 rounded-card">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Drag handle */}
      <div
        {...listeners}
        className="absolute top-2 left-2 text-ink-faint p-1 bg-surface-raised/80 rounded-card z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        title="Kéo để phân phối vào bài học"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="p-3 pl-8 pb-2 flex-1">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <cfg.Icon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{cfg.label}</span>
          </div>
          {/* Hover actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="p-1 rounded-card bg-surface-raised/90 hover:bg-accent/10 text-ink-muted hover:text-accent transition-colors shadow-card border border-line"
              title="Xem / chỉnh sửa"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <h4 className="text-sm font-bold text-ink line-clamp-2 leading-tight">
          {mat.title || 'Học liệu không tên'}
        </h4>
      </div>

      <div className="px-3 py-1.5 border-t border-line flex items-center justify-between text-[10px] text-ink-faint">
        <span>{new Date(mat.createdAt).toLocaleDateString('vi-VN')}</span>
        <MaterialBadge tone={badge.tone}>{badge.label}</MaterialBadge>
      </div>
    </div>
  );
}

function DraggableMaterialRow({ mat, onDoubleClick }: { mat: InstructorMaterial; onDoubleClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `material-${mat.id}`,
    data: { material: mat },
  });
  const badge = getMaterialDistributionBadge(mat);
  const TypeIcon = mat.materialType === 'FLASHCARD' ? Layers : mat.materialType === 'QUIZ' ? FileQuestion : Workflow;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
      className={`flex items-center gap-2 flex-1 min-w-0 ${isDragging ? 'opacity-40' : ''}`}
    >
      <span
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing text-ink-faint hover:text-ink-muted flex-shrink-0"
        title="Kéo để phân phối vào bài học"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </span>
      <TypeIcon className="w-4 h-4 flex-shrink-0 text-ink-muted" strokeWidth={1.75} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{mat.title || 'Học liệu không tên'}</p>
        <p className="text-[10px] text-ink-faint">{new Date(mat.createdAt).toLocaleDateString('vi-VN')}</p>
      </div>
      <MaterialBadge tone={badge.tone} className="flex-shrink-0">{badge.label}</MaterialBadge>
    </div>
  );
}

function DroppableNode({ id, title, type, children }: { id: string, title: string, type: string, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { type }
  });

  return (
    <div ref={setNodeRef} className={`rounded-card transition-colors ${isOver ? 'bg-accent/5 border border-accent/30 border-dashed' : ''}`}>
      <div className={`flex items-center gap-2 px-2 py-1.5 text-xs ${type === 'CHAPTER' ? 'font-bold text-ink bg-surface-hover rounded-card' : 'font-semibold text-ink-muted bg-surface-hover/50 mt-1 rounded-card'}`}>
        {type === 'CHAPTER' ? <Folder className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} /> : <File className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />}
        {type === 'CHAPTER' ? `Chương: ${title}` : title}
      </div>
      {children}
    </div>
  );
}

export function CourseMaterialsManager({ courseId }: CourseMaterialsManagerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();
  const inspectGenerationId = searchParams.get('inspect') ? Number(searchParams.get('inspect')) : null;
  const inspectReadOnly = searchParams.get('readonly') === '1';
  const setInspectGenerationId = (id: number | null, readOnly = false) => {
    if (id) {
      router.push(`?inspect=${id}${readOnly ? '&readonly=1' : ''}`);
    } else {
      router.push(`/instructor/materials`);
    }
  };

  
  const [breadcrumbs] = useState<{id: number | null, name: string}[]>([{id: null, name: 'Workspace'}]);

  const [genMaterialType, setGenMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP' | null>(null);
  const [manualMaterialType, setManualMaterialType] = useState<'QUIZ' | 'FLASHCARD' | 'MINDMAP' | null>(null);
  

  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);

  const overwriteMaterialVersionMutation = useMutation({
    mutationFn: (variables: { id: number, targetLessonId?: number, targetChapterId?: number }) =>
      materialsApi.overwriteMaterialVersion(variables.id, variables),
    onSuccess: () => {
      toast.success('Đã cập nhật phiên bản mới');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      setConfirmAction(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi khi cập nhật phiên bản'),
  });


  const attachLessonMutation = useMutation({
    mutationFn: (variables: { id: number; target: { lessonId?: number | null; chapterId?: number | null } }) =>
      materialsApi.attachMaterial(variables.id, variables.target),
    onSuccess: () => {
      toast.success('Đã phân phối học liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Lỗi khi phân phối'),
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const materialId = parseInt(String(active.id).replace('material-', ''));
    setActiveDragId(materialId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    if (!over) return;

    const materialId = parseInt(String(active.id).replace('material-', ''));
    const material = materials?.find(m => m.id === materialId);
    if (!material) return;

    const targetIdStr = String(over.id);
    const isChapter = targetIdStr.startsWith('chapter-');
    const parsedTargetId = parseInt(targetIdStr.replace('lesson-', '').replace('chapter-', ''));

    // Bắt đúng trạng thái Versioning Overwrite: bất kỳ bản nào trong CÙNG DÒNG VERSION
    // (rootGenerationId) đã được gán vào đúng đích này — không chỉ riêng bản đang kéo,
    // để tránh trường hợp kéo lại bản gốc (đã archive assignment chuyển sang bản mới) bị
    // hiểu nhầm là "gán mới" thay vì tiếp tục version chain.
    const rootId = material.rootGenerationId ?? material.id;
    const lineage = materials?.filter(m => (m.rootGenerationId ?? m.id) === rootId) ?? [material];
    const alreadyAssignedInLineage = lineage.find(m =>
      m.assignments?.some(a => isChapter ? a.chapterId === parsedTargetId : a.lessonId === parsedTargetId)
    );

    if (alreadyAssignedInLineage) {
      const latestInLineage = lineage.reduce((a, b) => (b.versionNo ?? 1) > (a.versionNo ?? 1) ? b : a);
      setConfirmAction({
        title: "Cập nhật Phiên bản",
        message: "Bạn có muốn cập nhật phiên bản mới cho học liệu này? Điểm số cũ của học viên sẽ được bảo lưu.",
        onConfirm: () => {
          overwriteMaterialVersionMutation.mutate({
            id: latestInLineage.id,
            targetLessonId: isChapter ? undefined : parsedTargetId,
            targetChapterId: isChapter ? parsedTargetId : undefined
          });
        }
      });
    } else {
      // Phân phối mới (Epic 3)
      attachLessonMutation.mutate({
        id: materialId,
        target: {
          lessonId: isChapter ? undefined : parsedTargetId,
          chapterId: isChapter ? parsedTargetId : undefined
        }
      });
    }
  };


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [confirmAction, setConfirmAction] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['instructor-materials', courseId],
    queryFn: () => materialsApi.getInstructorMaterials(courseId),
    enabled: !!courseId,
  });

  const { data: courseDetail } = useMyCourseDetail(courseId);
  const chapters = courseDetail?.chapters;


  const { data: rawFolders } = useQuery({
    queryKey: ['instructor-folders', courseId],
    queryFn: () => materialsApi.getFolders(courseId),
    enabled: !!courseId,
  });
  const folders = rawFolders || [];



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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
        <div className="bg-surface-raised rounded-card max-w-sm w-full shadow-card-hover overflow-hidden border border-line">
          <div className="bg-danger/5 p-4 border-b border-danger/10 flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-danger" />
            <h3 className="text-base font-bold text-ink">Xóa Học Liệu</h3>
          </div>
          <div className="p-4">
            <p className="text-ink-muted text-sm mb-4">
              Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs font-bold text-ink-muted bg-surface-hover hover:bg-line-soft rounded-card transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMaterialMutation.mutate(confirmDeleteId)}
                disabled={deleteMaterialMutation.isPending}
                className="px-3 py-1.5 text-xs font-bold text-white bg-danger hover:bg-danger/90 rounded-card shadow-card transition-all disabled:opacity-50"
              >
                {deleteMaterialMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="p-6 text-center text-sm text-ink-muted animate-pulse">Đang tải...</div>;

  if (inspectGenerationId) {
    const activeMat = materials?.find(m => m.id === inspectGenerationId);
    return (
      <>
        <MaterialWorkspaceViewer
          generationId={inspectGenerationId}
          material={activeMat}
          onBack={() => setInspectGenerationId(null)}
          onDelete={() => setConfirmDeleteId(inspectGenerationId)}
          readOnly={inspectReadOnly}
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

  const displayedMaterials = materials || [];

  const activeDragMaterial = activeDragId ? materials?.find(m => m.id === activeDragId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-100px)] gap-4 bg-surface-hover p-4 font-sans text-ink">
        
        {/* LEFT PANE: Curriculum Tree */}
        <div className="w-1/3 bg-surface-raised border border-line rounded-card overflow-hidden flex flex-col shadow-sm">
          <div className="p-3 border-b border-line bg-surface-hover flex items-center gap-2">
            <Layers className="w-4 h-4 text-ink-muted" />
            <h3 className="font-bold text-sm text-ink">Phân Phối (Shortcuts)</h3>
          </div>
          <div className="overflow-y-auto p-2 flex flex-col gap-1 flex-1">
            {chapters?.map(chapter => {
              const chapterMaterials = materials?.filter(m => m.assignments?.some(a => a.chapterId === chapter.id)) || [];
              
              return (
                <div key={chapter.id} className="mt-2">
                  <DroppableNode id={`chapter-${chapter.id}`} title={chapter.title} type="CHAPTER">
                    {/* Render chapter shortcuts */}
                    {chapterMaterials.map(mat => {
                      const assignment = mat.assignments?.find(a => a.chapterId === chapter.id);
                      return (
                        <div key={`mat-${mat.id}`} onDoubleClick={() => setInspectGenerationId(mat.id, true)} className="flex items-center justify-between px-2 py-1 text-xs text-ink-muted pl-6 hover:bg-accent/5 rounded-card cursor-pointer transition-colors group" title="Nháy đúp để xem trước">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-3 h-3 text-ink-faint flex-shrink-0" /> {mat.title || 'Học liệu'}
                          </div>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            if (assignment) {
                              setConfirmAction({
                                title: "Gỡ phân phối",
                                message: "Bạn có chắc chắn muốn gỡ học liệu này khỏi chương?",
                                onConfirm: () => { if(assignment?.id) materialsApi.deleteAssignment(assignment.id).then(() => queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] })) }
                              });
                            }
                          }} className="opacity-0 group-hover:opacity-100 p-0.5 text-ink-faint hover:text-danger transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                  </DroppableNode>
                  
                  <div className="flex flex-col gap-1 mt-1 ml-2">
                    {chapter.lessons.map(lesson => {
                      const lessonMaterials = materials?.filter(m => m.assignments?.some(a => a.lessonId === lesson.id)) || [];
                      return (
                        <div key={lesson.id} className="border-l border-line pl-2 mt-1">
                          <DroppableNode id={`lesson-${lesson.id}`} title={lesson.title} type="LESSON">
                            {/* Render lesson shortcuts */}
                            {lessonMaterials.map(mat => {
                              const assignment = mat.assignments?.find(a => a.lessonId === lesson.id);
                              return (
                                <div key={`mat-${mat.id}`} onDoubleClick={() => setInspectGenerationId(mat.id, true)} className="flex items-center justify-between px-2 py-1 text-[11px] text-ink-muted pl-6 hover:bg-accent/5 rounded-card cursor-pointer transition-colors group" title="Nháy đúp để xem trước">
                                  <div className="flex items-center gap-2">
                                    <LinkIcon className="w-3 h-3 text-ink-faint flex-shrink-0" /> {mat.title || 'Học liệu'}
                                  </div>
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    if (assignment) {
                                      setConfirmAction({
                                        title: "Gỡ phân phối",
                                         message: "Bạn có chắc chắn muốn gỡ học liệu này khỏi bài học?",
                                        onConfirm: () => { if(assignment?.id) materialsApi.deleteAssignment(assignment.id).then(() => queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] })) }
                                      });
                                    }
                                  }} className="opacity-0 group-hover:opacity-100 p-0.5 text-ink-faint hover:text-danger transition-opacity">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )
                            })}
                          </DroppableNode>
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
        <div className="flex-1 min-w-0 bg-surface-raised border border-line rounded-card overflow-hidden flex flex-col shadow-sm">
          {/* Toolbar row 1: Breadcrumb + Create Dropdown */}
          <div className="px-3 pt-3 pb-2 border-b border-line flex items-center justify-between bg-surface-hover">
            <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  <span className="cursor-pointer hover:text-accent transition-colors">{bc.name}</span>
                  {idx < breadcrumbs.length - 1 && <span>/</span>}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowActivityPanel(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-card transition-colors border ${
                  showActivityPanel ? 'bg-ink text-white border-ink' : 'bg-surface-raised text-ink-muted border-line hover:bg-surface-hover'
                }`}
                title="Xem hoạt động gần đây"
              >
                <History className="w-3.5 h-3.5" /> Hoạt động
              </button>
              {/* Dropdown: Tạo Mới */}
              <div className="relative">
                <button
                  id="create-material-btn"
                  onClick={() => setShowCreateDropdown(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-dark text-white text-xs font-bold rounded-card transition-colors shadow-card"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo Mới <ChevronDown className="w-3 h-3" />
                </button>
                {showCreateDropdown && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-surface-raised border border-line rounded-card shadow-card-hover z-50 min-w-[180px] overflow-hidden"
                    onMouseLeave={() => setShowCreateDropdown(false)}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-ink-faint tracking-wider border-b border-line flex items-center gap-1.5"><FileEdit className="w-3 h-3" /> Thủ công</div>
                    {(['FLASHCARD', 'QUIZ', 'MINDMAP'] as const).map(t => {
                      const TIcon = t === 'FLASHCARD' ? Layers : t === 'QUIZ' ? FileQuestion : Workflow;
                      return (
                        <button key={t} onClick={() => { setManualMaterialType(t); setShowCreateDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-accent/5 flex items-center gap-2 transition-colors">
                          <TIcon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} /> {t}
                        </button>
                      );
                    })}
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-ink-faint tracking-wider border-t border-b border-line flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> AI Auto</div>
                    {(['FLASHCARD', 'QUIZ', 'MINDMAP'] as const).map(t => {
                      const TIcon = t === 'FLASHCARD' ? Layers : t === 'QUIZ' ? FileQuestion : Workflow;
                      return (
                        <button key={`ai-${t}`} onClick={() => { setGenMaterialType(t); setShowCreateDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-accent/5 flex items-center gap-2 transition-colors">
                          <TIcon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} /> {t} <MaterialBadge tone="accent" className="ml-auto">AI</MaterialBadge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar row 2: Search + View Toggle */}
          <div className="px-3 py-2 border-b border-line flex items-center gap-2 bg-surface-raised">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" />
              <input
                type="text"
                placeholder="Tìm kiếm học liệu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-line rounded-card focus:outline-none focus:border-accent transition-colors bg-surface"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* View toggle */}
            <MaterialTabs
              active={viewMode}
              onChange={(key) => setViewMode(key as 'grid' | 'list')}
              tabs={[
                { key: 'grid', label: '', icon: <LayoutGrid className="w-4 h-4" /> },
                { key: 'list', label: '', icon: <List className="w-4 h-4" /> },
              ]}
            />
          </div>
          
          <MaterialFolderTree 
            courseId={courseId} 
            folders={folders} 
            materials={searchQuery ? displayedMaterials.filter(m => (m.title || '').toLowerCase().includes(searchQuery.toLowerCase())) : displayedMaterials}
            onInspect={setInspectGenerationId} 
            setConfirmAction={setConfirmAction} 
            DraggableCard={DraggableMaterialCard}
            DraggableRow={DraggableMaterialRow}
            viewMode={viewMode}
          />
        </div>

        {showActivityPanel && <CourseActivityPanel courseId={courseId} onClose={() => setShowActivityPanel(false)} />}
      </div>

      <DragOverlay>
        {activeDragMaterial ? (
          <div className="bg-surface-raised opacity-90 shadow-card-hover scale-105 border-accent border rounded-card px-3 py-2 text-xs flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <span className="font-bold text-ink line-clamp-1">{activeDragMaterial.title || 'Học liệu'}</span>
          </div>
        ) : null}
      </DragOverlay>

      {renderDeleteModal()}

      {confirmAction && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="bg-surface-raised rounded-card max-w-sm w-full p-5 shadow-card-hover border border-line">
            <h3 className="text-base font-bold text-ink mb-2">{confirmAction.title}</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">{confirmAction.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-3 py-1.5 text-xs font-bold text-ink-muted bg-surface-hover rounded-card hover:bg-line-soft transition-colors">Hủy</button>
              <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="px-3 py-1.5 text-xs font-bold text-white bg-accent rounded-card hover:bg-accent-dark transition-colors">Xác nhận</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DndContext>
  );
}

/** Workspace Xem & Chỉnh Sửa Học Liệu Trực Quan Mở Rộng Đầy Đủ Không Gian */
function MaterialWorkspaceViewer({
  generationId,
  material,
  onBack,
  onDelete,
  readOnly = false,
}: {
  generationId: number;
  material?: InstructorMaterial;
  onBack: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
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
    <div className="flex flex-col gap-6 rounded-card bg-surface-raised p-6 shadow-sm border border-line min-h-[750px]">
      {readOnly && (
        <div className="flex items-center gap-2 bg-star/10 border border-star/20 text-star text-xs font-bold px-4 py-2 rounded-card">
          <Lock className="w-3.5 h-3.5" /> Chế độ xem trước — không thể chỉnh sửa nội dung ở đây.
        </div>
      )}
      {/* Top Workspace Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-line pb-4 gap-4">
        <div className="flex items-center gap-3">
          {/* Removed Back to list button */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink">{detail?.title || material?.title || 'Học liệu AI'}</h2>
              {material && (
                <MaterialBadge tone={getMaterialDistributionBadge(material).tone}>
                  {getMaterialDistributionBadge(material).label}
                </MaterialBadge>
              )}
              {material?.isProctored && (
                <MaterialBadge tone="danger" icon={<ShieldAlert className="w-3 h-3" />}>AI Anti-Cheat</MaterialBadge>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Loại: <strong className="text-accent">{detail?.materialType || material?.materialType}</strong> •
              Ngôn ngữ: <strong className="text-ink">{detail?.language || material?.language || 'Tiếng Việt'}</strong> •
              Phiên bản: #{detail?.versionNo || material?.versionNo || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Official & Delete actions: primary via right-click context menu,
              secondary buttons here for quick access when workspace is open */}
          {!readOnly && onDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center rounded-card px-3 py-1.5 text-xs font-bold bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all"
              title="Xóa toàn bộ học liệu này"
            >
              Xóa
            </button>
          )}
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-card bg-surface-hover hover:bg-line-soft text-ink-muted transition-colors"
            title="Đóng Workspace"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-ink-muted animate-pulse font-medium">Đang tải toàn bộ dữ liệu học liệu vào Workspace...</div>
      ) : detail ? (
        <div className="flex flex-col gap-6">

          {/* Render Quiz Workspace */}
          {detail.materialType === 'QUIZ' && detail.quizQuestions && (
            <div className="space-y-6">
              <div className="border-b border-line pb-2">
                <MaterialTabs
                  active={activeTab}
                  onChange={(key) => setActiveTab(key as 'QUESTIONS' | 'SETTINGS')}
                  tabs={[
                    { key: 'QUESTIONS', label: `Ngân Hàng Câu Hỏi (${detail.quizQuestions.length})` },
                    ...(!readOnly ? [{ key: 'SETTINGS', label: 'Cấu Hình Bài Thi' }] : []),
                  ]}
                />
              </div>

              {activeTab === 'QUESTIONS' && (
                <div className="grid grid-cols-1 gap-4">
                  {!readOnly && (
                    <div className="flex justify-end mb-2">
                      <button onClick={() => setIsAddingQuestion(true)} className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-card font-bold text-sm border border-accent/20 transition-colors">
                        <Plus className="w-4 h-4" /> Thêm Câu Hỏi Mới
                      </button>
                    </div>
                  )}
                  {detail.quizQuestions.map((q, idx) => (
                    <div key={q.id} className="p-5 rounded-card border border-line bg-surface-hover/70 space-y-3 shadow-card hover:border-accent/40 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-base text-ink">
                          <span className="text-accent mr-2">Câu {idx + 1}:</span> {q.content}
                        </div>
                        {!readOnly && (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => setEditingQuestion(q)} className="text-xs font-semibold bg-surface-hover text-ink px-3 py-1.5 rounded-card hover:bg-line-soft border border-line transition-colors">Sửa</button>
                            <button onClick={() => deleteQuestionMutation.mutate(q.id)} className="text-xs font-semibold bg-danger/10 text-danger px-3 py-1.5 rounded-card hover:bg-danger/20 border border-danger/20 transition-colors">Xóa</button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-card text-sm font-medium border flex items-center justify-between transition-all ${opt.isCorrect
                              ? 'bg-success/10 border-success/30 text-success font-bold'
                              : 'bg-surface-raised border-line text-ink'
                              }`}
                          >
                            <span>{opt.content}</span>
                            {opt.isCorrect && (
                              <MaterialBadge tone="success" icon={<Check className="w-3 h-3" />}>Đáp án đúng</MaterialBadge>
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
              <div className="bg-accent/5 border border-accent/15 rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Bảng Vẽ Sơ Đồ Tư Duy (Mindmap)</h3>
                  <p className="text-xs text-accent-dark/80 mt-0.5">Sử dụng chuột để kéo thả vị trí, click đúp vào chữ để sửa tên nhánh.</p>
                </div>
                <MaterialTabs
                  active={activeTab}
                  onChange={(key) => setActiveTab(key as 'VIEW' | 'DRAG_DROP' | 'RAW_CODE')}
                  tabs={[
                    { key: 'VIEW', label: 'Xem Tĩnh' },
                    ...(!readOnly ? [{ key: 'DRAG_DROP', label: 'Chỉnh Sửa', icon: <FileEdit className="w-3.5 h-3.5" /> }] : []),
                    { key: 'RAW_CODE', label: 'Mã Mermaid' },
                  ]}
                />
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
                      <Copy className="w-3.5 h-3.5" />
                      {detail.mermaidCode ? detail.mermaidCode.split('\n').length : 0} lines
                    </button>
                  </div>
                  <pre className="p-6 pt-16 rounded-card bg-slate-900 text-cyan-300 font-mono text-xs overflow-x-auto min-h-[500px] border border-slate-800 leading-relaxed shadow-inner">
                    {detail.mermaidCode}
                  </pre>
                </div>
              ) : activeTab === 'VIEW' ? (
                <div className="w-full bg-surface-raised rounded-card shadow-sm border border-line">
                  <MermaidViewer chart={detail.mermaidCode} />
                </div>
              ) : (
                <div className="w-full h-[700px] border border-line rounded-card overflow-hidden bg-surface-hover shadow-inner">
                  <MindmapEditor
                    initialMermaidCode={detail.mermaidCode}
                    initialTemplate={(detail as unknown as { extraConfig?: { mapTemplate?: string } }).extraConfig?.mapTemplate}
                    readOnly={readOnly}
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
              <div className="bg-accent/5 border border-accent/15 rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Bộ Thẻ Học Flashcards 2 Mặt Trực Quan</h3>
                  <p className="text-xs text-accent-dark/80 mt-0.5">Bấm vào thẻ để lật, hoặc Sửa/Xóa bên dưới thẻ.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-accent text-white font-extrabold text-xs px-3 py-1 rounded-card">
                    {detail.flashcards.length} Thẻ ôn tập
                  </span>
                  {!readOnly && (
                    <button onClick={() => setIsAddingFlashcard(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-card text-xs font-bold border border-accent/20 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Thêm Thẻ Mới
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {detail.flashcards.map((card, idx) => {
                  const isFlipped = flippedCards[card.id];
                  return (
                    <div
                      key={card.id}
                      onClick={() => toggleCard(card.id)}
                      className={`cursor-pointer min-h-[160px] p-5 rounded-card border transition-all duration-300 flex flex-col justify-between shadow-card hover:shadow-card-hover ${isFlipped
                        ? 'bg-accent text-white border-accent-dark'
                        : 'bg-surface-raised text-ink border-line hover:border-accent/40'
                        }`}
                    >
                      <div className="flex justify-between items-center text-xs font-extrabold opacity-80 mb-2">
                        <span>Thẻ #{idx + 1}</span>
                        <span className="underline">{isFlipped ? 'Mặt Sau (Khái niệm)' : 'Mặt Trước (Thuật ngữ)'}</span>
                      </div>

                      <div className="text-base font-bold my-auto leading-relaxed">
                        {isFlipped ? card.backText : card.frontText}
                      </div>

                      <div className={`flex items-center justify-between mt-3 border-t pt-3 ${isFlipped ? 'border-white/20' : 'border-line'}`}>
                        <div className="text-[11px] opacity-70">
                          {isFlipped ? 'Nhấn để lật lại' : 'Nhấn để xem giải nghĩa'}
                        </div>
                        {!readOnly && (
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setEditingFlashcard(card); }} className={`text-[11px] font-bold px-2.5 py-1 rounded-card border transition-colors ${isFlipped ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-surface-hover hover:bg-line-soft text-ink border-line'}`}>Sửa</button>
                            <button onClick={(e) => { e.stopPropagation(); deleteFlashcardMutation.mutate(card.id); }} className={`text-[11px] font-bold px-2.5 py-1 rounded-card border transition-colors ${isFlipped ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-danger/10 hover:bg-danger/20 text-danger border-danger/20'}`}>Xóa</button>
                          </div>
                        )}
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
          <label className="text-sm font-semibold text-ink block">{label}</label>
          {hint && <span className="font-normal text-[11px] text-ink-muted mt-0.5 block">{hint}</span>}
        </div>
        {onClear && value && (
          <button type="button" onClick={onClear} className="text-[11px] text-danger hover:text-danger/80 font-semibold bg-danger/10 hover:bg-danger/20 px-2 py-0.5 rounded-card transition-colors">Xóa</button>
        )}
      </div>
      <div className="flex items-stretch rounded-card border border-line focus-within:border-accent focus-within:ring-1 focus-within:ring-accent overflow-hidden bg-surface-raised shadow-card transition-all">
        <input
          type="datetime-local"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="px-3 py-2 text-sm outline-none hover:bg-surface-hover flex-1 min-w-[150px] bg-transparent text-ink"
        />
        <button type="button" onClick={handleSetNow} title="Hiện tại" className="px-3 py-2 text-xs font-semibold text-ink-muted bg-surface-hover hover:bg-line-soft hover:text-accent border-l border-line transition-colors flex items-center justify-center">
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
    <div className="bg-surface-raised p-2">
      <div className="flex justify-between items-center pb-4 mb-6 border-b">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-ink">Cấu Hình Bài Thi</h3>
            {quiz.quizType === 'LECTURE_QUIZ' ? (
              <MaterialBadge tone="neutral">Quick Check</MaterialBadge>
            ) : (
              <MaterialBadge tone="accent">Official Exam</MaterialBadge>
            )}
          </div>
          <p className="text-sm text-ink-muted mt-1">Quản lý thời gian, số lượt làm bài, sinh đề ngẫu nhiên và tính năng giám sát</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateQuizSettingsMutation.isPending}
          className="flex items-center gap-2 rounded-card bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50 shadow-card transition-all"
        >
          <Save className="w-4 h-4" /> {updateQuizSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu Cấu Hình'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">

          {/* Policy Selector */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-ink">Chế độ bài thi</label>
            <div className="grid grid-cols-1 gap-3">
              <label className={`cursor-pointer flex items-start gap-3 p-4 rounded-card border-2 transition-all ${examPolicy === 'PRACTICE_UNLIMITED' ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/50'}`}>
                <input
                  type="radio"
                  name="examPolicy"
                  checked={examPolicy === 'PRACTICE_UNLIMITED'}
                  onChange={() => handlePolicyChange('PRACTICE_UNLIMITED')}
                  className="mt-1 w-4 h-4 text-accent focus:ring-accent"
                />
                <div>
                  <div className="font-bold text-ink text-sm">Luyện tập (Vô hạn)</div>
                  <div className="text-xs text-ink-muted mt-0.5">Sinh viên làm bao nhiêu lần tùy ý. Tự động lưu điểm cao nhất.</div>
                </div>
              </label>

              <label className={`cursor-pointer flex items-start gap-3 p-4 rounded-card border-2 transition-all ${examPolicy === 'PRACTICE_LIMITED' ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/50'}`}>
                <input
                  type="radio"
                  name="examPolicy"
                  checked={examPolicy === 'PRACTICE_LIMITED'}
                  onChange={() => handlePolicyChange('PRACTICE_LIMITED')}
                  className="mt-1 w-4 h-4 text-accent focus:ring-accent"
                />
                <div className="w-full">
                  <div className="font-bold text-ink text-sm">Ôn tập có giới hạn</div>
                  <div className="text-xs text-ink-muted mt-0.5 mb-2">Giới hạn số lần làm. Tự động lưu điểm cao nhất.</div>
                  {examPolicy === 'PRACTICE_LIMITED' && (
                    <input
                      type="number"
                      min="2"
                      value={customAttempts}
                      onChange={(e) => setCustomAttempts(e.target.value)}
                      placeholder="Số lần"
                      className="rounded-lg border border-line px-3 py-1.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none w-24"
                    />
                  )}
                </div>
              </label>

              <label className={`cursor-pointer flex items-start gap-3 p-4 rounded-card border-2 transition-all ${examPolicy === 'EXAM_STRICT' ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/50'}`}>
                <input
                  type="radio"
                  name="examPolicy"
                  checked={examPolicy === 'EXAM_STRICT'}
                  onChange={() => handlePolicyChange('EXAM_STRICT')}
                  className="mt-1 w-4 h-4 text-accent focus:ring-accent"
                />
                <div>
                  <div className="font-bold text-ink text-sm">Thi chính thức (1 Lần)</div>
                  <div className="text-xs text-ink-muted mt-0.5">Mỗi sinh viên chỉ được làm 1 lần duy nhất. Bắt buộc nhập thời gian Mở bài.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-line">
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

          <label className="flex items-center gap-3 text-sm font-bold text-ink bg-surface-hover p-4 rounded-card border">
            <input
              type="checkbox"
              checked={allowReview}
              onChange={(e) => setAllowReview(e.target.checked)}
              className="h-5 w-5 rounded border-line text-accent focus:ring-accent"
            />
            Cho phép học viên xem lại đáp án sau khi nộp bài
          </label>

          <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-ink">
              Thời gian làm bài (Phút)
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="rounded-card border border-line px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold text-ink">
              Số câu hỏi mỗi lượt
              <input
                type="number"
                min="1"
                max={quiz.questionCount ?? 100}
                value={randomPickCount}
                onChange={(e) => setRandomPickCount(e.target.value)}
                placeholder={`Mặc định: ${quiz.questionCount ?? '0'} câu`}
                className="rounded-card border border-line px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-card border border-danger/20 bg-danger/5 p-6 space-y-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-ink flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-danger" /> Giám Sát Thi Cử AI (Anti-Cheat)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProctored}
                  onChange={(e) => setIsProctored(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-raised after:border-line after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-danger"></div>
              </label>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed border-l-2 border-danger/30 pl-3">
              Yêu cầu bật Camera. Hệ thống AI sẽ tự động giám sát khuôn mặt, cảnh báo khi học viên rời khỏi màn hình hoặc chuyển sang tab khác.
            </p>

            {isProctored && (
              <div className="pt-4 border-t border-danger/20">
                <label className="flex flex-col gap-2 text-sm font-bold text-ink">
                  Số lần vi phạm tối đa trước khi tự động thu bài
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxViolations}
                    onChange={(e) => setMaxViolations(e.target.value)}
                    className="rounded-card border border-danger/30 px-4 py-2.5 text-sm bg-surface-raised focus:border-danger focus:ring-1 focus:ring-danger outline-none w-full sm:w-1/2"
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
    <div className="w-full rounded-3xl bg-surface-raised p-8 shadow-sm border border-line relative">
      <div className="border-b pb-4 mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black text-ink">Tạo Học Liệu AI Tự Động</h3>
          <p className="text-sm text-ink-muted mt-1">Lựa chọn loại học liệu bạn muốn AI tự động tổng hợp từ nội dung bài giảng.</p>
        </div>
        <button type="button" onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-card bg-surface-hover hover:bg-line-soft text-ink-muted transition-colors" title="Đóng"><X className="w-4 h-4" /></button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Bước 1: Chọn Loại Học Liệu (Card Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => {
              setMaterialType('QUIZ');
              setScopeType(quizType === 'LECTURE_QUIZ' ? 'LESSON' : 'WHOLE_COURSE');
            }}
            className={`cursor-pointer rounded-card p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'QUIZ' ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' : 'border-line hover:border-accent/50 bg-surface-raised'
              }`}
          >
            <div className="flex justify-center"><FileQuestion className="w-9 h-9 text-accent" strokeWidth={1.5} /></div>
            <div className="font-bold text-ink">Bài Thi Trắc Nghiệm</div>
            <div className="text-xs text-ink-muted">Sinh câu hỏi trắc nghiệm kèm giải thích</div>
          </div>

          <div
            onClick={() => {
              setMaterialType('FLASHCARD');
              setScopeType('CHAPTER');
            }}
            className={`cursor-pointer rounded-card p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'FLASHCARD' ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' : 'border-line hover:border-accent/40 bg-surface-raised'
              }`}
          >
            <div className="flex justify-center"><Layers className="w-9 h-9 text-accent" strokeWidth={1.5} /></div>
            <div className="font-bold text-ink">Thẻ Flashcard</div>
            <div className="text-xs text-ink-muted">Trích xuất thuật ngữ & khái niệm 2 mặt</div>
          </div>

          <div
            onClick={() => {
              setMaterialType('MINDMAP');
              setScopeType('CHAPTER');
            }}
            className={`cursor-pointer rounded-card p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'MINDMAP' ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' : 'border-line hover:border-accent/40 bg-surface-raised'
              }`}
          >
            <div className="flex justify-center"><Workflow className="w-9 h-9 text-accent" strokeWidth={1.5} /></div>
            <div className="font-bold text-ink">Sơ Đồ Tư Duy</div>
            <div className="text-xs text-ink-muted">Vẽ sơ đồ luồng kiến thức trực quan</div>
          </div>
        </div>

        {/* Bước 2: Hiển thị các Option nếu đã chọn loại */}
        {materialType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col gap-4 bg-surface-hover p-5 rounded-card border border-line">
            <h4 className="font-bold text-ink border-b pb-2">Cấu Hình Chi Tiết</h4>

            {materialType === 'QUIZ' && (
              <div className="flex flex-col gap-2 pt-2 pb-2">
                <span className="text-sm font-semibold text-ink">Phân loại Trắc nghiệm</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`cursor-pointer flex items-start gap-3 p-3 rounded-card border-2 transition-all ${quizType === 'LECTURE_QUIZ' ? 'border-accent bg-accent/5' : 'border-line bg-surface-raised hover:border-accent/30'}`}>
                    <input type="radio" name="aiQuizType" value="LECTURE_QUIZ" checked={quizType === 'LECTURE_QUIZ'} onChange={() => {
                      setQuizType('LECTURE_QUIZ');
                      setScopeType('LESSON');
                      setScopeRefId(undefined);
                      setLessonId(undefined);
                    }} className="mt-1" />
                    <div className="flex flex-col">
                      <span className="font-bold text-ink text-sm">Kiểm tra nhanh (Quick Check)</span>
                      <span className="text-xs text-ink-muted">Gắn vào 1 Bài học. Luôn hiện giải thích, làm vô hạn lần, không tính giờ.</span>
                    </div>
                  </label>
                  <label className={`cursor-pointer flex items-start gap-3 p-3 rounded-card border-2 transition-all ${quizType === 'OFFICIAL_EXAM' ? 'border-accent bg-accent/5' : 'border-line bg-surface-raised hover:border-accent/30'}`}>
                    <input type="radio" name="aiQuizType" value="OFFICIAL_EXAM" checked={quizType === 'OFFICIAL_EXAM'} onChange={() => {
                      setQuizType('OFFICIAL_EXAM');
                      setScopeType('WHOLE_COURSE');
                      setScopeRefId(undefined);
                      setLessonId(undefined);
                    }} className="mt-1" />
                    <div className="flex flex-col">
                      <span className="font-bold text-ink text-sm">Thi chính thức (Official Exam)</span>
                      <span className="text-xs text-ink-muted">Thi theo Chương/Khóa học. Có tính giờ, ghi Bảng điểm, tùy chỉnh lượt làm.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Tiêu đề học liệu
              <input
                type="text"
                key={`ai-title-${materialType}-${scopeType}-${scopeRefId || ''}-${lessonId || ''}`}
                defaultValue={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsTitleEdited(true);
                }}
                className="rounded-card border border-line px-4 py-2.5 text-sm focus:border-accent outline-none bg-surface-raised"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Phạm vi tạo học liệu
              <select
                value={scopeType}
                onChange={(e) => {
                  setScopeType(e.target.value as 'WHOLE_COURSE' | 'CHAPTER' | 'LESSON');
                  setIsTitleEdited(false); // Reset to allow auto-fill on change
                }}
                className="rounded-card border border-line px-4 py-2.5 text-sm focus:border-accent outline-none bg-surface-raised"
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
              <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
                Chọn chương
                <select
                  value={scopeRefId ?? ''}
                  onChange={(e) => {
                    setScopeRefId(Number(e.target.value));
                    setIsTitleEdited(false);
                  }}
                  required
                  className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">-- Chọn chương --</option>
                  {chapters?.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                  ))}
                </select>
              </label>
            )}

            {scopeType === 'LESSON' && (
              <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
                Chọn bài học
                <select
                  value={lessonId ?? ''}
                  onChange={(e) => {
                    setLessonId(Number(e.target.value));
                    setIsTitleEdited(false);
                  }}
                  required
                  className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
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
                <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
                  Độ khó câu hỏi
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                    className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="EASY">Cơ bản (Easy)</option>
                    <option value="MEDIUM">Vừa (Medium)</option>
                    <option value="HARD">Nâng cao (Hard)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
                  Số lượng câu hỏi
                  <select
                    value={quantityLevel}
                    onChange={(e) => setQuantityLevel(e.target.value as 'FEWER' | 'STANDARD' | 'MORE')}
                    className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="FEWER">Ít (~10 câu)</option>
                    <option value="STANDARD">Vừa (~20 câu)</option>
                    <option value="MORE">Nhiều (~30 câu)</option>
                  </select>
                </label>
              </div>
            )}

            {materialType === 'FLASHCARD' && (
              <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
                Số lượng thẻ Flashcard
                <select
                  value={quantityLevel}
                  onChange={(e) => setQuantityLevel(e.target.value as 'FEWER' | 'STANDARD' | 'MORE')}
                  className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
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
                  <label className="text-sm font-bold text-ink block mb-3">Mẫu sơ đồ (Template)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'LOGIC_CHART', name: 'Logic Chart', Icon: GitBranch },
                      { id: 'ORG_CHART', name: 'Org Chart', Icon: Network },
                    ].map(tpl => (
                      <div
                        key={tpl.id}
                        onClick={() => setMapTemplate(tpl.id)}
                        className={`cursor-pointer border rounded-card p-3 flex flex-col items-center justify-center gap-2 transition-all ${mapTemplate === tpl.id ? 'border-accent bg-accent/5 shadow-card ring-1 ring-accent' : 'border-line hover:border-line hover:bg-surface-hover bg-surface-raised'}`}
                      >
                        <div className={`w-8 h-8 rounded-card flex items-center justify-center ${mapTemplate === tpl.id ? 'bg-accent/10 text-accent opacity-100' : 'bg-surface-hover text-ink-muted opacity-60'}`}><tpl.Icon className="w-4 h-4" strokeWidth={1.75} /></div>
                        <span className={`text-[11px] font-bold text-center ${mapTemplate === tpl.id ? 'text-accent' : 'text-ink-muted'}`}>{tpl.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
                  Mức độ chi tiết nhánh
                  <select
                    value={quantityLevel}
                    onChange={(e) => setQuantityLevel(e.target.value as 'FEWER' | 'STANDARD' | 'MORE')}
                    className="rounded-lg border border-line px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="FEWER">Cơ bản, nhánh chính</option>
                    <option value="STANDARD">Tiêu chuẩn, vừa phải</option>
                    <option value="MORE">Chi tiết, chia nhiều nhánh nhỏ</option>
                  </select>
                </label>
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Ngôn ngữ học liệu
              <MaterialLanguagePicker
                languages={languages ?? []}
                value={language}
                onChange={setLanguage}
              />
            </label>

            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
              <button type="button" onClick={onClose} className="rounded-card px-5 py-2.5 text-sm font-bold text-ink-muted hover:bg-line-soft transition-colors">
                Hủy
              </button>
              <button
                type="submit"
                disabled={generateMutation.isPending || !materialType}
                className="flex items-center gap-2 rounded-card bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50 shadow-card"
              >
                <Sparkles className="w-4 h-4" /> {generateMutation.isPending ? 'Đang gọi AI...' : 'Bắt Đầu Sinh'}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="bg-surface-raised p-6 rounded-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-card-hover border border-line">
        <h3 className="font-bold text-lg mb-4 text-ink">Chỉnh sửa Nội Dung Câu Hỏi</h3>

        {question.usageCount && question.usageCount > 0 ? (
          <div className="mb-4 p-3 bg-star/10 border border-star/20 rounded-card text-star text-sm font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Lưu ý: Học liệu này đã có lượt làm bài. Sửa đáp án câu hỏi sẽ ảnh hưởng đến kết quả chấm điểm của các bài thi đã nộp trước đó.
          </div>
        ) : null}

        <label className="block text-sm font-semibold text-ink mb-1">Nội dung câu hỏi</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full border border-line p-3 rounded-card mb-5 focus:border-accent focus:outline-none"
          rows={3}
        />

        <label className="block text-sm font-semibold text-ink mb-1">Loại câu hỏi</label>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={!isMultipleChoice} onChange={() => setIsMultipleChoice(false)} className="w-4 h-4 text-accent focus:ring-accent" />
            Single Choice (1 đáp án đúng)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={isMultipleChoice} onChange={() => setIsMultipleChoice(true)} className="w-4 h-4 text-accent focus:ring-accent" />
            Multiple Choice (Nhiều đáp án đúng)
          </label>
        </div>

        <label className="block text-sm font-semibold text-ink mb-2">Các đáp án</label>
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <div key={idx} className={`flex gap-3 items-center p-3 rounded-card border ${opt.isCorrect ? 'bg-success/10 border-success/30' : 'bg-surface-hover border-line'}`}>
              <input
                type={isMultipleChoice ? "checkbox" : "radio"}
                checked={opt.isCorrect}
                onChange={() => handleToggleCorrect(idx)}
                className="w-5 h-5 text-success focus:ring-success cursor-pointer"
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
                className={`option-input flex-1 p-2 bg-transparent border-b ${opt.isCorrect ? 'border-success/20 focus:border-success' : 'border-line focus:border-accent'} focus:outline-none text-sm font-medium`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                  className="p-1 text-ink-faint hover:text-danger transition-colors"
                  title="Xóa đáp án"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {isMultipleChoice && (
            <div className="flex gap-3 items-center p-3 rounded-card border border-dashed border-line opacity-60 hover:opacity-100 transition-opacity">
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
                className={`flex-1 p-2 bg-transparent border-b border-line focus:outline-none text-sm font-medium`}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 bg-surface-hover font-semibold text-ink rounded-lg hover:bg-line-soft">Hủy</button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="px-5 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent-dark shadow disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="bg-surface-raised p-6 rounded-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-card-hover border border-line">
        <h3 className="font-bold text-lg mb-4 text-ink">Thêm Câu Hỏi Mới</h3>

        <label className="block text-sm font-semibold text-ink mb-1">Nội dung câu hỏi</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Nhập nội dung câu hỏi..."
          className="w-full border border-line p-3 rounded-card mb-5 focus:border-accent focus:outline-none"
          rows={3}
        />

        <label className="block text-sm font-semibold text-ink mb-1">Loại câu hỏi</label>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={!isMultipleChoice} onChange={() => setIsMultipleChoice(false)} className="w-4 h-4 text-accent focus:ring-accent" />
            Single Choice (1 đáp án đúng)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={isMultipleChoice} onChange={() => setIsMultipleChoice(true)} className="w-4 h-4 text-accent focus:ring-accent" />
            Multiple Choice (Nhiều đáp án đúng)
          </label>
        </div>

        <label className="block text-sm font-semibold text-ink mb-2">Các đáp án</label>
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <div key={idx} className={`flex gap-3 items-center p-3 rounded-card border ${opt.isCorrect ? 'bg-success/10 border-success/30' : 'bg-surface-hover border-line'}`}>
              <input
                type={isMultipleChoice ? "checkbox" : "radio"}
                checked={opt.isCorrect}
                onChange={() => handleToggleCorrect(idx)}
                className="w-5 h-5 text-success focus:ring-success cursor-pointer"
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
                className={`option-input flex-1 p-2 bg-transparent border-b ${opt.isCorrect ? 'border-success/20 focus:border-success' : 'border-line focus:border-accent'} focus:outline-none text-sm font-medium`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                  className="p-1 text-ink-faint hover:text-danger transition-colors"
                  title="Xóa đáp án"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {isMultipleChoice && (
            <div className="flex gap-3 items-center p-3 rounded-card border border-dashed border-line opacity-60 hover:opacity-100 transition-opacity">
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
                className={`flex-1 p-2 bg-transparent border-b border-line focus:outline-none text-sm font-medium`}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 bg-surface-hover font-semibold text-ink rounded-lg hover:bg-line-soft">Hủy</button>
          <button
            onClick={() => {
              if (!content.trim()) return toast.error('Vui lòng nhập nội dung câu hỏi');
              addMutation.mutate();
            }}
            disabled={addMutation.isPending}
            className="px-5 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent-dark shadow disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="bg-surface-raised p-6 rounded-card w-full max-w-lg shadow-card-hover border border-line">
        <h3 className="font-bold text-lg mb-4 text-ink">Chỉnh sửa Flashcard</h3>
        <label className="block text-sm font-semibold text-ink mb-1">Mặt Trước (Thuật ngữ)</label>
        <textarea value={frontText} onChange={e => setFrontText(e.target.value)} className="w-full border border-line p-3 rounded-card mb-4 focus:border-accent focus:outline-none" rows={3} />
        <label className="block text-sm font-semibold text-ink mb-1">Mặt Sau (Khái niệm)</label>
        <textarea value={backText} onChange={e => setBackText(e.target.value)} className="w-full border border-line p-3 rounded-card mb-5 focus:border-accent focus:outline-none" rows={3} />
        
        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 bg-surface-hover font-semibold text-ink rounded-lg hover:bg-line-soft">Hủy</button>
          <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="px-5 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent-dark shadow disabled:opacity-50">Lưu Thay Đổi</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="bg-surface-raised p-6 rounded-card w-full max-w-lg shadow-card-hover border border-line">
        <h3 className="font-bold text-lg mb-4 text-ink">Thêm Flashcard Mới</h3>
        <label className="block text-sm font-semibold text-ink mb-1">Mặt Trước (Thuật ngữ)</label>
        <textarea value={frontText} onChange={e => setFrontText(e.target.value)} className="w-full border border-line p-3 rounded-card mb-4 focus:border-accent focus:outline-none" rows={3} />
        <label className="block text-sm font-semibold text-ink mb-1">Mặt Sau (Khái niệm)</label>
        <textarea value={backText} onChange={e => setBackText(e.target.value)} className="w-full border border-line p-3 rounded-card mb-5 focus:border-accent focus:outline-none" rows={3} />
        
        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 bg-surface-hover font-semibold text-ink rounded-lg hover:bg-line-soft">Hủy</button>
          <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !frontText.trim() || !backText.trim()} className="px-5 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent-dark shadow disabled:opacity-50">Thêm Thẻ</button>
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
    <div className="w-full rounded-card bg-surface-raised p-8 shadow-card border border-line relative">
      <div className="border-b border-line pb-4 mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black text-ink flex items-center gap-2">
            <PencilLine className="w-5 h-5 text-accent" /> Tạo Học Liệu Thủ Công
          </h3>
          <p className="text-sm text-ink-muted mt-1">Khởi tạo một bản ghi rỗng để bạn tự tay nhập nội dung 100%.</p>
        </div>
        <button type="button" onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-card bg-surface-hover hover:bg-line-soft text-ink-muted transition-colors" title="Đóng"><X className="w-4 h-4" /></button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => {
              setMaterialType('QUIZ');
            }}
            className={`cursor-pointer rounded-card p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'QUIZ' ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' : 'border-line hover:border-accent/40 bg-surface-raised'}`}
          >
            <div className="flex justify-center"><FileQuestion className="w-9 h-9 text-accent" strokeWidth={1.5} /></div>
            <div className="font-bold text-ink">Bài Thi (Quiz)</div>
            <div className="text-[10px] font-bold text-accent uppercase bg-accent/10 px-2 py-0.5 rounded">Khởi tạo trống</div>
          </div>
          <div
            onClick={() => {
              setMaterialType('FLASHCARD');
            }}
            className={`cursor-pointer rounded-card p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'FLASHCARD' ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' : 'border-line hover:border-accent/40 bg-surface-raised'}`}
          >
            <div className="flex justify-center"><Layers className="w-9 h-9 text-accent" strokeWidth={1.5} /></div>
            <div className="font-bold text-ink">Flashcard</div>
            <div className="text-[10px] font-bold text-accent uppercase bg-accent/10 px-2 py-0.5 rounded">Khởi tạo trống</div>
          </div>
          <div
            onClick={() => {
              setMaterialType('MINDMAP');
            }}
            className={`cursor-pointer rounded-card p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${materialType === 'MINDMAP' ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' : 'border-line hover:border-accent/40 bg-surface-raised'}`}
          >
            <div className="flex justify-center"><Workflow className="w-9 h-9 text-accent" strokeWidth={1.5} /></div>
            <div className="font-bold text-ink">Mindmap</div>
            <div className="text-[10px] font-bold text-accent uppercase bg-accent/10 px-2 py-0.5 rounded">Khởi tạo trống</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-surface-hover p-5 rounded-card border border-line">
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
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
              className="rounded-card border border-line px-4 py-2.5 text-sm focus:border-accent outline-none bg-surface-raised"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
            Ngôn ngữ học liệu
            <MaterialLanguagePicker
              languages={languages ?? []}
              value={language}
              onChange={setLanguage}
            />
          </label>

          {materialType === 'QUIZ' && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-sm font-semibold text-ink">Phân loại Trắc nghiệm</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`cursor-pointer flex items-start gap-3 p-3 rounded-card border-2 transition-all ${quizType === 'LECTURE_QUIZ' ? 'border-accent bg-accent/5' : 'border-line bg-surface-raised hover:border-accent/20'}`}>
                  <input type="radio" name="quizTypeTop" value="LECTURE_QUIZ" checked={quizType === 'LECTURE_QUIZ'} onChange={() => {
                    setQuizType('LECTURE_QUIZ');
                  }} className="mt-1" />
                  <div className="flex flex-col">
                    <span className="font-bold text-ink text-sm">Kiểm tra nhanh (Quick Check)</span>
                    <span className="text-xs text-ink-muted">Gắn vào 1 Bài học. Luôn hiện giải thích, làm vô hạn lần, không tính giờ.</span>
                  </div>
                </label>
                <label className={`cursor-pointer flex items-start gap-3 p-3 rounded-card border-2 transition-all ${quizType === 'OFFICIAL_EXAM' ? 'border-accent bg-accent/5' : 'border-line bg-surface-raised hover:border-accent/20'}`}>
                  <input type="radio" name="quizTypeTop" value="OFFICIAL_EXAM" checked={quizType === 'OFFICIAL_EXAM'} onChange={() => {
                    setQuizType('OFFICIAL_EXAM');
                  }} className="mt-1" />
                  <div className="flex flex-col">
                    <span className="font-bold text-ink text-sm">Thi chính thức (Official Exam)</span>
                    <span className="text-xs text-ink-muted">Thi theo Chương/Khóa học. Có tính giờ, ghi Bảng điểm, tùy chỉnh lượt làm.</span>
                  </div>
                </label>
              </div>
            </div>
          )}





          
          <div className="mt-4 flex justify-end gap-3 border-t pt-5">
            <button type="button" onClick={onClose} className="rounded-card px-5 py-2.5 text-sm font-bold text-ink-muted hover:bg-line-soft transition-colors">
              Hủy
            </button>
            <button
              type="submit"
              disabled={generateManualMutation.isPending || !materialType || !title.trim()}
              className="flex items-center gap-2 rounded-card bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-50 shadow-card"
            >
              <Plus className="w-4 h-4" /> {generateManualMutation.isPending ? 'Đang tạo...' : 'Tạo Bản Ghi Trống'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

