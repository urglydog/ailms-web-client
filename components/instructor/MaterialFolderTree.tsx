'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Folder, MoreVertical, Plus, Trash2, ChevronRight, ChevronDown, FolderOpen, MoveRight, Pencil, History } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi, InstructorMaterial } from '@/lib/api/materials';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { VersionHistoryModal } from './VersionHistoryModal';

type FolderItem = { id: number; name: string; parentId?: number };
type MaterialItem = InstructorMaterial;

interface MaterialFolderTreeProps {
  courseId: number;
  folders: FolderItem[];
  materials: MaterialItem[];
  onInspect: (id: number, readOnly?: boolean) => void;
  setConfirmAction: (action: { title: string; message: string; onConfirm: () => void | Promise<unknown> } | null) => void;
  DraggableCard: React.ElementType;
  DraggableRow: React.ElementType;
  viewMode?: 'grid' | 'list';
}

export function MaterialFolderTree({
  courseId,
  folders,
  materials,
  onInspect,
  setConfirmAction,
  DraggableCard,
  DraggableRow,
  viewMode = 'grid',
}: MaterialFolderTreeProps) {
  const queryClient = useQueryClient();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'ROOT' | 'FOLDER' | 'MATERIAL';
    targetId?: number;
  } | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});

  // New: folder-picker modal state (replaces raw-ID prompt for move-to-folder)
  const [folderPickerFor, setFolderPickerFor] = useState<number | null>(null); // materialId
  const [folderPickerSearch, setFolderPickerSearch] = useState('');

  // Simple text-input modal for folder creation (name only — no raw IDs)
  const [createFolderModal, setCreateFolderModal] = useState<{ parentId?: number } | null>(null);
  const [createFolderName, setCreateFolderName] = useState('');

  // Rename modal for materials
  const [renameModal, setRenameModal] = useState<{ materialId: number } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Version history modal
  const [versionHistoryFor, setVersionHistoryFor] = useState<number | null>(null);

  // Keyboard clipboard state (Issue 4)
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [clipboard, setClipboard] = useState<number | null>(null); // materialId copied

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: (vars: { name: string; parentId?: number }) =>
      materialsApi.createFolder(courseId, vars.name, vars.parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-folders', courseId] }),
    onError: () => toast.error('Không thể tạo thư mục'),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => materialsApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-folders', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể xóa thư mục'),
  });

  const moveToFolderMutation = useMutation({
    mutationFn: (vars: { id: number; folderId: number | null }) =>
      materialsApi.moveToFolder(vars.id, vars.folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      toast.success('Đã di chuyển học liệu');
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể di chuyển học liệu'),
  });

  const renameMaterialMutation = useMutation({
    mutationFn: (vars: { id: number; title: string }) => materialsApi.renameMaterial(vars.id, vars.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      toast.success('Đã đổi tên học liệu');
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể đổi tên học liệu'),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: number) => materialsApi.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] });
      toast.success('Đã xóa học liệu');
    },
    onError: () => toast.error('Không thể xóa học liệu'),
  });


  // Close context menu on global click
  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // ─── Keyboard Shortcuts (Issue 4) ────────────────────────────────────────────
  // GUARDRAIL: Only active when focus is NOT inside an input / textarea / select / contenteditable
  const isInputFocused = useCallback(() => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      (el as HTMLElement).isContentEditable
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: ignore when user is typing
      if (isInputFocused()) return;
      if (!selectedMaterialId) return;

      const mat = materials.find(m => m.id === selectedMaterialId);

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (mat) {
          setConfirmAction({
            title: 'Xóa Học Liệu',
            message: `Bạn có chắc chắn muốn xóa "${mat.title || 'học liệu này'}" không? Hành động này không thể hoàn tác.`,
            onConfirm: () => deleteMaterialMutation.mutateAsync(selectedMaterialId),
          });
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        toast.info('Chức năng Copy (nhân bản) chưa được hỗ trợ');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        setClipboard(selectedMaterialId);
        toast.info(`Đã cắt "${mat?.title || 'học liệu'}" — chọn thư mục đích và nhấn Ctrl+V để dán`);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (clipboard !== null) {
          setFolderPickerFor(clipboard);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMaterialId, clipboard, materials, setConfirmAction, deleteMaterialMutation, isInputFocused]);

  // ─── Folder Picker Helpers ────────────────────────────────────────────────
  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(folderPickerSearch.toLowerCase())
  );

  const handleContextMenu = (
    e: React.MouseEvent,
    type: 'ROOT' | 'FOLDER' | 'MATERIAL',
    targetId?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, targetId });
    if (type === 'MATERIAL' && targetId) setSelectedMaterialId(targetId);
  };

  const handleCreateFolder = (parentId?: number) => {
    setCreateFolderModal({ parentId });
    setCreateFolderName('');
    setContextMenu(null);
  };

  const handleDeleteFolder = (id: number) => {
    const hasMaterials = materials.some(m => m.folderId === id);
    setConfirmAction({
      title: hasMaterials ? 'Thư mục đang chứa học liệu' : 'Xóa Thư Mục',
      message: hasMaterials
        ? 'Thư mục này đang chứa học liệu. Nếu tiếp tục xóa, các học liệu bên trong sẽ bị đẩy ra ngoài Workspace gốc. Bạn có chắc chắn không?'
        : 'Bạn có chắc chắn muốn xóa thư mục này không?',
      onConfirm: () => deleteFolderMutation.mutateAsync(id),
    });
    setContextMenu(null);
  };

  const handleMoveMaterial = (matId: number) => {
    setFolderPickerFor(matId);
    setFolderPickerSearch('');
    setContextMenu(null);
  };

  const handleRenameMaterial = (matId: number) => {
    const mat = materials.find(m => m.id === matId);
    setRenameModal({ materialId: matId });
    setRenameValue(mat?.title || '');
    setContextMenu(null);
  };


  const handleDeleteMaterial = (matId: number) => {
    const mat = materials.find(m => m.id === matId);
    setConfirmAction({
      title: 'Xóa Học Liệu',
      message: `Bạn có chắc chắn muốn xóa "${mat?.title || 'học liệu này'}" không? Hành động này không thể hoàn tác.`,
      onConfirm: () => deleteMaterialMutation.mutateAsync(matId),
    });
    setContextMenu(null);
  };

  const toggleFolder = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build recursive tree
  const rootFolders = folders.filter(f => !f.parentId);
  const rootMaterials = materials.filter(m => !m.folderId);

  const renderMaterialCard = (mat: MaterialItem) => (
    <div
      key={mat.id}
      className={`relative group/mat ${selectedMaterialId === mat.id ? 'ring-2 ring-blue-400 rounded-card' : ''}`}
      onContextMenu={e => handleContextMenu(e, 'MATERIAL', mat.id)}
      onClick={e => { e.stopPropagation(); setSelectedMaterialId(mat.id); }}
    >
      <DraggableCard mat={mat} onClick={() => onInspect(mat.id)} />
    </div>
  );

  const renderMaterialRow = (mat: MaterialItem) => {
    return (
      <div
        key={mat.id}
        onContextMenu={e => handleContextMenu(e, 'MATERIAL', mat.id)}
        onClick={e => { e.stopPropagation(); setSelectedMaterialId(mat.id); }}
        className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-surface-hover cursor-pointer transition-colors group/row ${
          selectedMaterialId === mat.id ? 'bg-accent/5' : ''
        }`}
      >
        <DraggableRow mat={mat} onDoubleClick={() => onInspect(mat.id)} />
      </div>
    );
  };

  const renderFolder = (folder: FolderItem) => {
    const isExpanded = expandedFolders[folder.id];
    const childFolders = folders.filter(f => f.parentId === folder.id);
    const childMaterials = materials.filter(m => m.folderId === folder.id);

    return (
      <div key={folder.id} className="ml-4 mt-2">
        <div
          onClick={e => toggleFolder(folder.id, e)}
          onContextMenu={e => handleContextMenu(e, 'FOLDER', folder.id)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/5 cursor-pointer text-ink transition-colors group"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 text-ink-faint" /> : <ChevronRight className="w-4 h-4 text-ink-faint" />}
          {isExpanded ? <FolderOpen className="w-5 h-5 text-accent" /> : <Folder className="w-5 h-5 text-accent/70" />}
          <span className="font-semibold text-sm">{folder.name}</span>
          <button
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-line-soft rounded text-ink-muted"
            onClick={e => { e.stopPropagation(); handleContextMenu(e, 'FOLDER', folder.id); }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {isExpanded && (
          <div className="ml-6 border-l border-line pl-2">
            {childFolders.map(renderFolder)}
            {viewMode === 'list' ? (
              <div className="border border-line rounded-card overflow-hidden mt-2">
                {childMaterials.map(renderMaterialRow)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {childMaterials.map(renderMaterialCard)}
              </div>
            )}
            {childFolders.length === 0 && childMaterials.length === 0 && (
              <div className="text-xs text-ink-faint py-2 pl-2 italic">Thư mục trống</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render folder tree nodes for picker
  const renderPickerNode = (f: FolderItem, depth = 0) => (
    <button
      key={f.id}
      className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-accent/5 rounded-lg flex items-center gap-2 transition-colors"
      style={{ paddingLeft: `${12 + depth * 16}px` }}
      onClick={() => {
        if (folderPickerFor !== null) {
          moveToFolderMutation.mutate({ id: folderPickerFor, folderId: f.id });
          setFolderPickerFor(null);
          setClipboard(null);
        }
      }}
    >
      <Folder className="w-4 h-4 text-accent/70 flex-shrink-0" />
      {f.name}
    </button>
  );

  const buildPickerTree = (parentId?: number, depth = 0): React.ReactNode[] => {
    const children = filteredFolders.filter(f => (f.parentId ?? undefined) === parentId);
    return children.flatMap(f => [
      renderPickerNode(f, depth),
      ...buildPickerTree(f.id, depth + 1),
    ]);
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 bg-surface-hover/50 min-h-[400px]"
      onContextMenu={e => handleContextMenu(e, 'ROOT')}
      onClick={() => setSelectedMaterialId(null)}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
          Thư Mục Gốc (Click chuột phải để thêm)
        </span>
        {selectedMaterialId && (
          <span className="text-[10px] text-ink-faint italic">
            ✓ Đã chọn — Del: xóa · Ctrl+X: cắt · Ctrl+V: dán
          </span>
        )}
      </div>

      {rootFolders.map(renderFolder)}

      {viewMode === 'list' ? (
        <div className="border border-line rounded-card overflow-hidden mt-3">
          {rootMaterials.length === 0 ? null : rootMaterials.map(renderMaterialRow)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {rootMaterials.map(renderMaterialCard)}
        </div>
      )}

      {rootFolders.length === 0 && rootMaterials.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-ink-faint py-10">
          <Folder className="w-16 h-16 mb-2 opacity-30" />
          <p className="text-sm font-medium">Workspace đang trống</p>
          <p className="text-xs mt-1">Click chuột phải để tạo thư mục mới.</p>
        </div>
      )}

      {/* ─── Context Menu Portal ─── */}
      {contextMenu && createPortal(
        <div
          className="fixed bg-surface-raised rounded-lg shadow-xl border border-line py-1 min-w-[200px] z-[100000]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type === 'ROOT' && (
            <button
              onClick={() => handleCreateFolder()}
              className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-accent/5 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tạo Thư mục Mới
            </button>
          )}

          {contextMenu.type === 'FOLDER' && (
            <>
              <button
                onClick={() => handleCreateFolder(contextMenu.targetId)}
                className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-accent/5 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tạo Thư mục con
              </button>
              <div className="h-px bg-surface-hover my-1" />
              <button
                onClick={() => handleDeleteFolder(contextMenu.targetId!)}
                className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Xóa Thư mục
              </button>
            </>
          )}

          {contextMenu.type === 'MATERIAL' && (() => {
            return (
              <>
                <button
                  onClick={() => { if (contextMenu.targetId) onInspect(contextMenu.targetId); setContextMenu(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-accent/5 flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" /> Xem / Chỉnh sửa
                </button>
                <button
                  onClick={() => { if (contextMenu.targetId) handleRenameMaterial(contextMenu.targetId); }}
                  className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-accent/5 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" /> Đổi tên
                </button>
                <button
                  onClick={() => { if (contextMenu.targetId) { setVersionHistoryFor(contextMenu.targetId); setContextMenu(null); } }}
                  className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-accent/5 flex items-center gap-2"
                >
                  <History className="w-4 h-4" /> Lịch sử phiên bản
                </button>
                <div className="h-px bg-surface-hover my-1" />
                <button
                  onClick={() => { if (contextMenu.targetId) handleMoveMaterial(contextMenu.targetId); }}
                  className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-accent/5 flex items-center gap-2"
                >
                  <MoveRight className="w-4 h-4" /> Chuyển vào Thư mục...
                </button>
                <div className="h-px bg-surface-hover my-1" />
                <button
                  onClick={() => { if (contextMenu.targetId) handleDeleteMaterial(contextMenu.targetId); }}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Xóa Học Liệu
                </button>
              </>
            );
          })()}
        </div>,
        document.body
      )}

      {/* ─── Folder Picker Modal (thay thế raw-ID prompt) ─── */}
      {folderPickerFor !== null && createPortal(
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setFolderPickerFor(null)}
        >
          <div
            className="bg-surface-raised rounded-card max-w-sm w-full p-5 shadow-2xl border border-line"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
              <Folder className="w-5 h-5 text-accent" /> Chọn Thư mục Đích
            </h3>
            <input
              autoFocus
              className="w-full px-3 py-2 border border-line rounded-lg mb-3 outline-none focus:border-accent text-sm"
              placeholder="Tìm kiếm thư mục..."
              value={folderPickerSearch}
              onChange={e => setFolderPickerSearch(e.target.value)}
            />
            <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
              {/* Option: move to root workspace */}
              <button
                className="w-full text-left px-3 py-2 text-sm text-ink-muted hover:bg-surface-hover rounded-lg flex items-center gap-2 italic"
                onClick={() => {
                  if (folderPickerFor !== null) {
                    moveToFolderMutation.mutate({ id: folderPickerFor, folderId: null });
                    setFolderPickerFor(null);
                  }
                }}
              >
                <FolderOpen className="w-4 h-4 text-ink-faint" /> Workspace gốc (bỏ khỏi thư mục)
              </button>
              <div className="h-px bg-surface-hover my-1" />
              {buildPickerTree(undefined)}
              {filteredFolders.length === 0 && (
                <p className="text-xs text-ink-faint text-center py-4">Không tìm thấy thư mục nào</p>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setFolderPickerFor(null)}
                className="px-3 py-1.5 text-xs font-bold text-ink-muted bg-surface-hover rounded-lg hover:bg-line-soft"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Create Folder Modal (name-only, no raw IDs) ─── */}
      {createFolderModal !== null && createPortal(
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setCreateFolderModal(null)}
        >
          <div
            className="bg-surface-raised rounded-card max-w-xs w-full p-5 shadow-2xl border border-line"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-ink mb-3">
              {createFolderModal.parentId ? 'Tạo Thư mục Con' : 'Tạo Thư mục Mới'}
            </h3>
            <input
              autoFocus
              className="w-full px-3 py-2 border border-line rounded-lg mb-4 outline-none focus:border-accent text-sm"
              placeholder="Tên thư mục..."
              value={createFolderName}
              onChange={e => setCreateFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && createFolderName.trim()) {
                  createFolderMutation.mutate({ name: createFolderName.trim(), parentId: createFolderModal.parentId });
                  setCreateFolderModal(null);
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCreateFolderModal(null)}
                className="px-3 py-1.5 text-xs font-bold text-ink-muted bg-surface-hover rounded-lg hover:bg-line-soft"
              >
                Hủy
              </button>
              <button
                disabled={!createFolderName.trim()}
                onClick={() => {
                  if (createFolderName.trim()) {
                    createFolderMutation.mutate({ name: createFolderName.trim(), parentId: createFolderModal.parentId });
                    setCreateFolderModal(null);
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-accent rounded-lg hover:bg-accent-dark disabled:opacity-50"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Rename Material Modal ─── */}
      {renameModal !== null && createPortal(
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setRenameModal(null)}
        >
          <div
            className="bg-surface-raised rounded-card max-w-xs w-full p-5 shadow-2xl border border-line"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-ink mb-3">Đổi tên Học liệu</h3>
            <input
              autoFocus
              className="w-full px-3 py-2 border border-line rounded-lg mb-4 outline-none focus:border-accent text-sm"
              placeholder="Tên học liệu..."
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  renameMaterialMutation.mutate({ id: renameModal.materialId, title: renameValue.trim() });
                  setRenameModal(null);
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRenameModal(null)}
                className="px-3 py-1.5 text-xs font-bold text-ink-muted bg-surface-hover rounded-lg hover:bg-line-soft"
              >
                Hủy
              </button>
              <button
                disabled={!renameValue.trim()}
                onClick={() => {
                  if (renameValue.trim()) {
                    renameMaterialMutation.mutate({ id: renameModal.materialId, title: renameValue.trim() });
                    setRenameModal(null);
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-accent rounded-lg hover:bg-accent-dark disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {versionHistoryFor !== null && (
        <VersionHistoryModal
          courseId={courseId}
          materialId={versionHistoryFor}
          onClose={() => setVersionHistoryFor(null)}
          onInspect={onInspect}
        />
      )}
    </div>
  );
}
