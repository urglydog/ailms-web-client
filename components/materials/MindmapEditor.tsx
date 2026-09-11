'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface MindmapEditorProps {
  initialMermaidCode: string;
  onSave?: (newMermaidCode: string) => void;
}

/**
 * Thuật toán Auto Layout BFS: Xếp các node thành dạng Cây từ trên xuống
 */
function applyTreeLayout(nodes: Node[], edges: Edge[]) {
  const incoming = new Map<string, number>();
  const childrenMap = new Map<string, string[]>();
  nodes.forEach(n => {
    incoming.set(n.id, 0);
    childrenMap.set(n.id, []);
  });
  
  edges.forEach(e => {
    incoming.set(e.target, (incoming.get(e.target) || 0) + 1);
    const childrenList = childrenMap.get(e.source);
    if (childrenList) childrenList.push(e.target);
  });

  const roots = nodes.filter(n => incoming.get(n.id) === 0);
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0] as Node); 

  const levels = new Map<string, number>();
  const levelGroups = new Map<number, Node[]>();

  roots.forEach(r => levels.set(r.id, 0));
  const queue = [...roots];

  while(queue.length > 0) {
    const curr = queue.shift()!;
    const currLvl = levels.get(curr.id) || 0;
    
    if (!levelGroups.has(currLvl)) levelGroups.set(currLvl, []);
    // Tránh push trùng vào levelGroups
    if (!levelGroups.get(currLvl)!.find(n => n.id === curr.id)) {
        levelGroups.get(currLvl)!.push(curr);
    }

    const children = childrenMap.get(curr.id) || [];
    children.forEach(childId => {
      if (!levels.has(childId)) {
        levels.set(childId, currLvl + 1);
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) queue.push(childNode as Node);
      }
    });
  }

  // Quét các Node bị cô lập
  nodes.forEach(n => {
    if (!levels.has(n.id)) {
       const lvl = 0;
       levels.set(n.id, lvl);
       if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
       levelGroups.get(lvl)!.push(n);
    }
  });

  // Calculate X, Y based on level and index in level (Center alignment)
  const X_SPACING = 350;
  const Y_SPACING = 150;

  levelGroups.forEach((levelNodes, level) => {
    const totalWidth = (levelNodes.length - 1) * X_SPACING;
    const startX = -totalWidth / 2; // Căn giữa
    
    levelNodes.forEach((node, idx) => {
      node.position = {
        x: startX + idx * X_SPACING,
        y: level * Y_SPACING
      };
    });
  });

  return nodes;
}

function parseMermaidToFlow(code: string) {
  let nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();
  
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('graph') && !l.startsWith('mindmap'));

  lines.forEach((line) => {
    const edgeParts = line.split(/\s*-->\s*/);
    
    const partIds = edgeParts.map((part) => {
      const match = part.match(/^([^\[\]\(\)\s]+)(?:\["?(.*?)"?\]|\("?(.*?)"?\))?$/);
      if (match) {
        const id = match[1] || '';
        const label = match[2] || match[3];
        
        if (!nodeMap.has(id)) {
           const newNode = {
             id,
             position: { x: 0, y: 0 },
             data: { label: label || id },
             style: {
               background: '#F0F9FF',
               border: '2px solid #0284C7',
               borderRadius: '12px',
               padding: '12px 20px',
               fontWeight: 'bold',
               color: '#0369A1',
               minWidth: '200px',
               boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
               textAlign: 'center' as const
             }
           };
           nodes.push(newNode);
           nodeMap.set(id, newNode);
        } else if (label) {
           const existing = nodeMap.get(id)!;
           existing.data.label = label;
        }
        return id;
      }
      return null;
    });

    for (let i = 0; i < partIds.length - 1; i++) {
      const source = partIds[i];
      const target = partIds[i+1];
      if (source && target) {
        const edgeId = `e-${source}-${target}`;
        if (!edges.find(e => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source,
            target,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#0EA5E9', strokeWidth: 3 },
            animated: true
          });
        }
      }
    }
  });

  if (nodes.length === 0) {
    nodes.push({
      id: 'root',
      position: { x: 100, y: 100 },
      data: { label: 'Chưa hỗ trợ format cấu trúc Mermaid này' }
    });
  }

  // Áp dụng thuật toán Auto Layout
  nodes = applyTreeLayout(nodes, edges);

  return { nodes, edges };
}

function parseFlowToMermaid(nodes: Node[], edges: Edge[]) {
  let mermaid = 'graph TD\n';
  nodes.forEach(n => {
    const label = (n.data.label as string) || n.id;
    mermaid += `    ${n.id}["${label}"]\n`;
  });
  edges.forEach(e => {
    mermaid += `    ${e.source} --> ${e.target}\n`;
  });
  return mermaid;
}

export function MindmapEditor({ initialMermaidCode, onSave }: MindmapEditorProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0); // 0=none, 1=first confirm, 2=second confirm

  const initData = useCallback(() => {
    const { nodes: n, edges: e } = parseMermaidToFlow(initialMermaidCode);
    setNodes(n);
    setEdges(e);
  }, [initialMermaidCode]);

  useEffect(() => {
    initData();
  }, [initData]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const [editingNode, setEditingNode] = useState<{ id: string; label: string } | null>(null);

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setEditingNode({ id: node.id, label: (node.data.label as string) || '' });
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      markerEnd: { type: MarkerType.ArrowClosed }, 
      style: { stroke: '#0EA5E9', strokeWidth: 3 },
      animated: true 
    }, eds)),
    []
  );

  // Delete selected nodes and edges
  const handleDeleteSelected = useCallback(() => {
    const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
    const selectedEdgeIds = edges.filter(e => e.selected).map(e => e.id);

    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;

    // Remove edges connected to deleted nodes + selected edges
    setEdges(eds => eds.filter(e => 
      !selectedEdgeIds.includes(e.id) && 
      !selectedNodeIds.includes(e.source) && 
      !selectedNodeIds.includes(e.target)
    ));
    setNodes(nds => nds.filter(n => !selectedNodeIds.includes(n.id)));
  }, [nodes, edges]);

  // Add new node
  const handleAddNode = useCallback(() => {
    const newId = `node_${Date.now()}`;
    const newNode: Node = {
      id: newId,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: { label: 'Nhánh mới' },
      style: {
        background: '#F0F9FF',
        border: '2px solid #0284C7',
        borderRadius: '12px',
        padding: '12px 20px',
        fontWeight: 'bold',
        color: '#0369A1',
        minWidth: '200px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        textAlign: 'center' as const
      }
    };
    setNodes(nds => [...nds, newNode]);
  }, []);

  // Keyboard Delete handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if editing text
        if (editingNode) return;
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDeleteSelected, editingNode]);

  // 2-step save flow
  const handleSaveClick = () => setConfirmStep(1);
  const handleConfirmStep1 = () => setConfirmStep(2);
  const handleConfirmStep2 = () => {
    setConfirmStep(0);
    if (onSave) {
      const code = parseFlowToMermaid(nodes, edges);
      onSave(code);
    }
  };

  const selectedCount = nodes.filter(n => n.selected).length + edges.filter(e => e.selected).length;

  return (
    <div style={{ height: '700px', width: '100%', border: '1px solid #E5E7EB', borderRadius: '12px', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        deleteKeyCode={null}
        fitView
      >
        <Controls />
        <Background gap={16} size={1} />
        
        <Panel position="top-right" className="flex gap-2 flex-wrap">
          <button 
            onClick={handleAddNode}
            className="bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm"
          >
            ➕ Thêm nhánh
          </button>
          {selectedCount > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm"
            >
              🗑️ Xóa ({selectedCount})
            </button>
          )}
          <button 
            onClick={initData}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm"
          >
            ↺ Xếp Lại Cây
          </button>
          {onSave && (
            <button 
              onClick={handleSaveClick}
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm"
            >
              💾 Lưu thay đổi
            </button>
          )}
        </Panel>
      </ReactFlow>

      {/* Custom Edit Modal */}
      {editingNode && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-96 max-w-[90%] transform transition-all">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-accent">✏️</span> Đổi tên nhánh sơ đồ
            </h3>
            <textarea
              autoFocus
              value={editingNode.label}
              onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none h-28 text-gray-700 outline-none transition-all font-medium"
              placeholder="Nhập nội dung mới..."
            />
            <div className="flex gap-2 justify-end mt-5">
              <button 
                onClick={() => setEditingNode(null)} 
                className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  setNodes((nds) => nds.map((n) => n.id === editingNode.id ? { ...n, data: { ...n.data, label: editingNode.label.trim() } } : n));
                  setEditingNode(null);
                }}
                className="px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 shadow-sm transition-colors"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step Verify Save Dialog */}
      {confirmStep > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-[420px] max-w-[90%]">
            {confirmStep === 1 ? (
              <>
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>⚠️</span> Xác nhận thay đổi?
                </h3>
                <p className="text-sm text-gray-600 mb-5">
                  Bạn có chắc chắn muốn lưu các thay đổi trên sơ đồ Mindmap này không?
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmStep(0)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 border border-gray-200 transition-colors">
                    Hủy
                  </button>
                  <button onClick={handleConfirmStep1} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-sm transition-colors">
                    Tiếp tục xác nhận →
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-red-700 mb-2 flex items-center gap-2">
                  <span>🔒</span> Xác nhận lần cuối
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Thay đổi sẽ được áp dụng cho <strong>tất cả sinh viên</strong> đang xem Mindmap này.
                </p>
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-lg mb-5 border border-red-100">
                  Hành động này không thể hoàn tác. Vui lòng kiểm tra kỹ trước khi xác nhận.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmStep(0)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 border border-gray-200 transition-colors">
                    Hủy bỏ
                  </button>
                  <button onClick={handleConfirmStep2} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-sm transition-colors">
                    ✓ Xác nhận áp dụng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

