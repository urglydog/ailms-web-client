import React, { useState } from 'react';
import { Folder, MoreVertical, Plus, Trash2, ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

export function MaterialFolderTree({ courseId, folders, materials, onInspect, setConfirmAction, DraggableCard }: { courseId: number, folders: {id: number, name: string, parentId?: number}[], materials: {id: number, title?: string, folderId?: number}[], onInspect: (id: number) => void, setConfirmAction: (action: any) => void, DraggableCard: React.ElementType }) {
  const queryClient = useQueryClient();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'ROOT' | 'FOLDER' | 'MATERIAL', targetId?: number } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: (vars: { name: string, parentId?: number }) => materialsApi.createFolder(courseId, vars.name, vars.parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-folders', courseId] }),
  });
  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => materialsApi.deleteFolder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-folders', courseId] }),
    onError: (_err: unknown) => toast.error('Không thể xóa thư mục (Có thể do lỗi ràng buộc)')
  });
  const moveToFolderMutation = useMutation({
    mutationFn: (vars: { id: number, folderId: number | null }) => materialsApi.moveToFolder(vars.id, vars.folderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-materials', courseId] }),
  });

  const handleContextMenu = (e: React.MouseEvent, type: 'ROOT' | 'FOLDER' | 'MATERIAL', targetId?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, targetId });
  };

  const handleCreateFolder = (parentId?: number) => {
    const name = prompt("Nhập tên thư mục:");
    if (name) createFolderMutation.mutate({ name, parentId });
    setContextMenu(null);
  };

  const handleDeleteFolder = (id: number) => {
    const hasMaterials = materials.some((m: {folderId?: number}) => m.folderId === id);
    if (hasMaterials) {
      setConfirmAction({
        title: "Thư mục đang chứa học liệu",
        message: "Thư mục này đang chứa học liệu. Nếu tiếp tục xóa, các học liệu bên trong sẽ bị đẩy ra ngoài Workspace gốc. Bạn có chắc chắn không?",
        onConfirm: () => deleteFolderMutation.mutate(id)
      });
    } else {
      setConfirmAction({
        title: "Xóa Thư Mục",
        message: "Bạn có chắc chắn muốn xóa thư mục này không?",
        onConfirm: () => deleteFolderMutation.mutate(id)
      });
    }
    setContextMenu(null);
  };

  const handleMoveMaterial = (matId: number) => {
    const folderName = prompt("Nhập ID thư mục để chuyển đến (Để trống = Đẩy ra Workspace gốc):");
    const folderId = folderName ? parseInt(folderName) : null;
    if (folderName && isNaN(folderId as number)) {
      toast.error("ID thư mục không hợp lệ");
      return;
    }
    moveToFolderMutation.mutate({ id: matId, folderId });
    setContextMenu(null);
  };

  // Close context menu on click anywhere
  React.useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Build recursive tree
  const rootFolders = folders.filter((f: {parentId?: number}) => !f.parentId);
  const rootMaterials = materials.filter((m: {folderId?: number}) => !m.folderId);

  const toggleFolder = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderFolder = (folder: {id: number, name: string}) => {
    const isExpanded = expandedFolders[folder.id];
    const childFolders = folders.filter((f: {parentId?: number}) => f.parentId === folder.id);
    const childMaterials = materials.filter((m: {folderId?: number}) => m.folderId === folder.id);

    return (
      <div key={folder.id} className="ml-4 mt-2">
        <div 
          onClick={(e) => toggleFolder(folder.id, e)}
          onContextMenu={(e) => handleContextMenu(e, 'FOLDER', folder.id)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer text-gray-700 transition-colors group"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          {isExpanded ? <FolderOpen className="w-5 h-5 text-blue-500" /> : <Folder className="w-5 h-5 text-blue-400" />}
          <span className="font-semibold text-sm">{folder.name}</span>
          <button className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-500" onClick={(e) => handleContextMenu(e, 'FOLDER', folder.id)}>
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        
        {isExpanded && (
          <div className="ml-6 border-l border-gray-200 pl-2">
            {childFolders.map(renderFolder)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {childMaterials.map((mat: {id: number, title?: string, folderId?: number}) => (
                <div key={mat.id} className="relative group/mat" onContextMenu={(e) => handleContextMenu(e, 'MATERIAL', mat.id)}>
                  <DraggableCard mat={mat} onClick={() => onInspect(mat.id)} />
                  <button className="absolute top-2 right-2 opacity-0 group-hover/mat:opacity-100 p-1 bg-white/80 rounded hover:bg-gray-200 text-gray-600 z-10" onClick={(e) => handleContextMenu(e, 'MATERIAL', mat.id)}>
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {childFolders.length === 0 && childMaterials.length === 0 && (
              <div className="text-xs text-gray-400 py-2 pl-2 italic">Thư mục trống</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 bg-gray-50/50 min-h-[400px]"
      onContextMenu={(e) => handleContextMenu(e, 'ROOT')}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thư Mục Gốc (Click chuột phải để thêm)</span>
      </div>
      
      {rootFolders.map(renderFolder)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {rootMaterials.map((mat: {id: number, title?: string, folderId?: number}) => (
          <div key={mat.id} className="relative group/mat" onContextMenu={(e) => handleContextMenu(e, 'MATERIAL', mat.id)}>
            <DraggableCard mat={mat} onClick={() => onInspect(mat.id)} />
            <button className="absolute top-2 right-2 opacity-0 group-hover/mat:opacity-100 p-1 bg-white/80 rounded hover:bg-gray-200 text-gray-600 z-10" onClick={(e) => handleContextMenu(e, 'MATERIAL', mat.id)}>
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {rootFolders.length === 0 && rootMaterials.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
          <Folder className="w-16 h-16 mb-2 opacity-30" />
          <p className="text-sm font-medium">Workspace đang trống</p>
          <p className="text-xs mt-1">Click chuột phải để tạo thư mục mới.</p>
        </div>
      )}

      {/* Context Menu Portal */}
      {contextMenu && createPortal(
        <div 
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] z-[100000]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'ROOT' && (
            <button onClick={() => handleCreateFolder()} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tạo Thư mục Mới
            </button>
          )}
          
          {contextMenu.type === 'FOLDER' && (
            <>
              <button onClick={() => handleCreateFolder(contextMenu.targetId)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tạo Thư mục con
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button onClick={() => handleDeleteFolder(contextMenu.targetId!)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Xóa Thư mục
              </button>
            </>
          )}
          
          {contextMenu.type === 'MATERIAL' && (
            <>
              <button onClick={() => handleMoveMaterial(contextMenu.targetId!)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                <Folder className="w-4 h-4" /> Move to Folder...
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
