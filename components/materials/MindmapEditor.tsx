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
 * Phân tích Mermaid Graph TD siêu việt hỗ trợ:
 * - A["Label"] --> B["Label"]
 * - C --> D
 * - Đa kết nối trên 1 dòng
 */
function parseMermaidToFlow(code: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();
  
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('graph') && !l.startsWith('mindmap'));

  lines.forEach((line) => {
    // Tách các cụm bằng dấu mũi tên -->
    const edgeParts = line.split(/\s*-->\s*/);
    
    const partIds = edgeParts.map((part) => {
      // Regex lấy ID và Label (chấp nhận Unicode/Tiếng Nhật làm ID):
      const match = part.match(/^([^\[\]\(\)\s]+)(?:\["?(.*?)"?\]|\("?(.*?)"?\))?$/);
      if (match) {
        const id = match[1] || '';
        const label = match[2] || match[3];
        
        if (!nodeMap.has(id)) {
           const newNode = {
             id,
             // Auto grid layout cơ bản
             position: { x: (nodeMap.size % 4) * 300 + 50, y: Math.floor(nodeMap.size / 4) * 150 + 50 },
             data: { label: label || id },
             style: {
               background: '#F0F9FF',
               border: '2px solid #0284C7',
               borderRadius: '8px',
               padding: '10px 15px',
               fontWeight: 'bold',
               color: '#0369A1',
               minWidth: '150px',
               textAlign: 'center' as const
             }
           };
           nodes.push(newNode);
           nodeMap.set(id, newNode);
        } else if (label) {
           // Cập nhật lại nhãn nếu trước đó chỉ định nghĩa ID
           const existing = nodeMap.get(id)!;
           existing.data.label = label;
        }
        return id;
      }
      return null;
    });

    // Tạo Edges
    for (let i = 0; i < partIds.length - 1; i++) {
      const source = partIds[i];
      const target = partIds[i+1];
      if (source && target) {
        // Tránh trùng lặp Edge
        const edgeId = `e-${source}-${target}`;
        if (!edges.find(e => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source,
            target,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#0891B2', strokeWidth: 2 }
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

  return { nodes, edges };
}

function parseFlowToMermaid(nodes: Node[], edges: Edge[]) {
  let mermaid = 'graph TD\n';
  nodes.forEach(n => {
    // Render Node label
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

  useEffect(() => {
    const { nodes: n, edges: e } = parseMermaidToFlow(initialMermaidCode);
    setNodes(n);
    setEdges(e);
  }, [initialMermaidCode]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#0891B2', strokeWidth: 2 } }, eds)),
    []
  );

  const handleSave = () => {
    if (onSave) {
      const code = parseFlowToMermaid(nodes, edges);
      onSave(code);
    }
  };

  return (
    <div style={{ height: '600px', width: '100%', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background gap={12} size={1} />
        
        {onSave && (
          <Panel position="top-right">
            <button 
              onClick={handleSave}
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors"
            >
              💾 Lưu sơ đồ Mindmap
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
