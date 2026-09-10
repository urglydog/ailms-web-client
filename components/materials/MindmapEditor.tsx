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
 * Hàm phân tích sơ cấp Mermaid -> React Flow Nodes/Edges
 * Giả định AI sinh ra: graph TD hoặc mindmap
 * A[Node A] --> B[Node B]
 */
function parseMermaidToFlow(code: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('graph') && !l.startsWith('mindmap'));
  

  const nodeMap = new Map<string, Node>();

  lines.forEach((line, index) => {
    // Edge: A --> B
    const edgeMatch = line.match(/^(\w+)\s*-->\s*(\w+)/);
    if (edgeMatch) {
      const source = (edgeMatch[1] as string) || '';
      const target = (edgeMatch[2] as string) || '';
      edges.push({
        id: `e-${source}-${target}`,
        source,
        target,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#0891B2', strokeWidth: 2 }
      });
      return;
    }

    // Node: id["Label"] hoặc id(Label)
    const nodeMatch = line.match(/^(\w+)\["?(.*?)"?\]/);
    if (nodeMatch) {
      const id = (nodeMatch[1] as string) || '';
      const label = (nodeMatch[2] as string) || '';
      const newNode = {
        id,
        position: { x: (index % 3) * 200 + 100, y: Math.floor(index / 3) * 100 + 50 },
        data: { label },
        style: {
          background: '#F0F9FF',
          border: '2px solid #0284C7',
          borderRadius: '8px',
          padding: '10px 15px',
          fontWeight: 'bold',
          color: '#0369A1'
        }
      };
      nodes.push(newNode);
      nodeMap.set(id, newNode);
    }
  });

  // Fallback: nếu không có nodeMap, tạo 1 node lỗi
  if (nodes.length === 0) {
    nodes.push({
      id: 'root',
      position: { x: 100, y: 100 },
      data: { label: 'Chưa hỗ trợ format cấu trúc Mermaid này' }
    });
  }

  return { nodes, edges };
}

/**
 * Sinh ngược lại mã Mermaid
 */
function parseFlowToMermaid(nodes: Node[], edges: Edge[]) {
  let mermaid = 'graph TD\n';
  nodes.forEach(n => {
    mermaid += `    ${n.id}["${n.data.label}"]\n`;
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
