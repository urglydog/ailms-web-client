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

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const currentLabel = node.data.label as string;
    const newLabel = window.prompt('Nhập nội dung mới cho nhánh này:', currentLabel);
    if (newLabel !== null && newLabel.trim() !== '') {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              data: {
                ...n.data,
                label: newLabel.trim()
              }
            };
          }
          return n;
        })
      );
    }
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

  const handleSave = () => {
    if (onSave) {
      const code = parseFlowToMermaid(nodes, edges);
      onSave(code);
    }
  };

  return (
    <div style={{ height: '700px', width: '100%', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
      >
        <Controls />
        <Background gap={16} size={1} />
        
        <Panel position="top-right" className="flex gap-2">
          <button 
            onClick={initData}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm"
          >
            ↺ Xếp Lại Cây
          </button>
          {onSave && (
            <button 
              onClick={handleSave}
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm"
            >
              💾 Áp dụng thay đổi
            </button>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
