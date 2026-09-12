'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
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
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { toPng, toJpeg, toSvg } from 'html-to-image';

interface MindmapEditorProps {
  initialMermaidCode: string;
  onSave?: (newMermaidCode: string) => void;
  readOnly?: boolean;
}

const nodeWidth = 200;
const nodeHeight = 50;

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'RL';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const targetPosition = isHorizontal ? Position.Left : Position.Top;
    const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    return {
      ...node,
      targetPosition,
      sourcePosition,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
}

function parseMermaidToFlow(code: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();
  
  const lines = code.split('\n').map(l => l.trim());

  lines.forEach((line) => {
    if (line.startsWith('%% POSITIONS: ')) return;
    
    if (!line || line.startsWith('graph') || line.startsWith('mindmap')) return;
    const edgeParts = line.split(/\s*-->\s*/);
    
    const partIds = edgeParts.map((part) => {
      const match = part.match(/^([^\[\]\(\)\s]+)(?:\["?(.*?)"?\]|\("?(.*?)"?\))?$/);
      if (match) {
        const id = match[1] || '';
        const label = match[2] || match[3];
        
        if (!nodeMap.has(id)) {
           const newNode: Node = {
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
      data: { label: 'Chủ đề chính' }
    });
  }

  return getLayoutedElements(nodes, edges, 'LR');
}

function parseFlowToMermaid(nodes: Node[], edges: Edge[]) {
  let mermaid = 'graph LR\n';
  nodes.forEach(n => {
    const label = (n.data.label as string) || n.id;
    mermaid += `    ${n.id}["${label}"]\n`;
  });
  
  edges.forEach(e => {
    mermaid += `    ${e.source} --> ${e.target}\n`;
  });
  
  return mermaid;
}

function FlowEditor({ initialMermaidCode, onSave, readOnly = false }: MindmapEditorProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [editingNode, setEditingNode] = useState<{ id: string; label: string } | null>(null);
  const { fitView } = useReactFlow();

  const ref = useRef<HTMLDivElement>(null);
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState<'Style' | 'Pitch' | 'Map'>('Map');
  const [mapStyle, setMapStyle] = useState('LR'); // LR, TB
  const [colorTheme, setColorTheme] = useState('Dawn');
  const [bgColor, setBgColor] = useState('#FFFFFF');

  const initData = useCallback(() => {
    const { nodes: n, edges: e } = parseMermaidToFlow(initialMermaidCode);
    const layouted = getLayoutedElements(n, e, mapStyle);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setTimeout(() => fitView(), 100);
  }, [initialMermaidCode, mapStyle, fitView]);

  useEffect(() => {
    initData();
  }, [initData]);

  // Handle auto layout on changes
  const applyLayout = useCallback((nds: Node[], eds: Edge[]) => {
    const layouted = getLayoutedElements(nds, eds, mapStyle);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setTimeout(() => fitView(), 50);
  }, [mapStyle, fitView]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);
        // If a node was removed, we should relayout
        if (changes.some(c => c.type === 'remove')) {
            setTimeout(() => applyLayout(newNodes, edges), 0);
        }
        return newNodes;
      });
    },
    [edges, applyLayout]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
        setEdges((eds) => {
            const newEdges = addEdge({ 
                ...params, 
                markerEnd: { type: MarkerType.ArrowClosed }, 
                style: { stroke: '#0EA5E9', strokeWidth: 3 },
                animated: true 
            }, eds);
            setTimeout(() => applyLayout(nodes, newEdges), 0);
            return newEdges;
        });
    },
    [nodes, applyLayout]
  );

  const handleExport = useCallback(async (type: 'png' | 'jpeg' | 'svg' | 'md') => {
    setShowExport(false);
    if (type === 'md') {
        const md = parseFlowToMermaid(nodes, edges);
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap.md';
        a.click();
        return;
    }
    
    if (ref.current) {
        const flowEl = ref.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (!flowEl) return;
        
        // Reset transform temporarily for export
        const oldTransform = flowEl.style.transform;
        flowEl.style.transform = 'translate(0,0) scale(1)';
        
        try {
            let dataUrl = '';
            if (type === 'png') dataUrl = await toPng(flowEl, { backgroundColor: bgColor });
            if (type === 'jpeg') dataUrl = await toJpeg(flowEl, { backgroundColor: bgColor, quality: 0.95 });
            if (type === 'svg') dataUrl = await toSvg(flowEl, { backgroundColor: bgColor });
            
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `mindmap.${type}`;
            a.click();
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            flowEl.style.transform = oldTransform;
        }
    }
  }, [nodes, edges, bgColor]);

  // Keyboard Shortcuts (Tab / Enter / Delete)
  useEffect(() => {
    if (readOnly) return;
    const handler = (e: KeyboardEvent) => {
      if (editingNode) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const selectedNode = nodes.find(n => n.selected);
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selectedNode) return;
        setNodes(nds => {
           const newNodes = nds.filter(n => n.id !== selectedNode.id);
           setEdges(eds => eds.filter(ed => ed.source !== selectedNode.id && ed.target !== selectedNode.id));
           setTimeout(() => applyLayout(newNodes, edges), 0);
           return newNodes;
        });
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (!selectedNode) return;
        const newId = `node_${Date.now()}`;
        const newNode: Node = {
            id: newId,
            position: { x: 0, y: 0 },
            data: { label: 'Nhánh con' },
            style: selectedNode.style
        };
        const newEdge: Edge = {
            id: `e-${selectedNode.id}-${newId}`,
            source: selectedNode.id,
            target: newId,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#0EA5E9', strokeWidth: 3 },
            animated: true
        };
        setNodes(nds => [...nds, newNode]);
        setEdges(eds => {
            const nextEds = [...eds, newEdge];
            setTimeout(() => applyLayout([...nodes, newNode], nextEds), 0);
            return nextEds;
        });
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (!selectedNode) return;
        // Find parent edge
        const parentEdge = edges.find(ed => ed.target === selectedNode.id);
        const newId = `node_${Date.now()}`;
        const newNode: Node = {
            id: newId,
            position: { x: 0, y: 0 },
            data: { label: 'Nhánh cùng cấp' },
            style: selectedNode.style
        };
        
        setNodes(nds => [...nds, newNode]);
        
        if (parentEdge) {
            const newEdge: Edge = {
                id: `e-${parentEdge.source}-${newId}`,
                source: parentEdge.source,
                target: newId,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#0EA5E9', strokeWidth: 3 },
                animated: true
            };
            setEdges(eds => {
                const nextEds = [...eds, newEdge];
                setTimeout(() => applyLayout([...nodes, newNode], nextEds), 0);
                return nextEds;
            });
        } else {
            setTimeout(() => applyLayout([...nodes, newNode], edges), 0);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingNode, readOnly, nodes, edges, applyLayout]);

  return (
    <div className="flex h-[750px] w-full border border-gray-200 rounded-xl overflow-hidden bg-gray-50" ref={ref} style={{ backgroundColor: bgColor }}>
      
      {/* Main Flow Canvas */}
      <div className="flex-1 relative">
        {/* Top toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            {!readOnly && (
                <div className="relative">
                    <button 
                        onClick={() => setShowExport(!showExport)}
                        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm flex items-center gap-2"
                    >
                        📤 Export As
                    </button>
                    {showExport && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-2 flex flex-col z-50">
                            <button onClick={() => handleExport('png')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium">PNG (Ảnh)</button>
                            <button onClick={() => handleExport('jpeg')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium">JPEG</button>
                            <button onClick={() => handleExport('svg')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium border-b border-gray-100">SVG</button>
                            <button onClick={() => handleExport('md')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium">Markdown</button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onNodeDoubleClick={(e, node) => !readOnly && setEditingNode({ id: node.id, label: String(node.data.label) })}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          deleteKeyCode={null}
          fitView
        >
          <Controls />
          <Background gap={20} size={1} />
        </ReactFlow>

        {/* Editing Node Modal */}
        {editingNode && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-96 max-w-[90%]">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                ✏️ Đổi tên nhánh
              </h3>
              <textarea
                autoFocus
                value={editingNode.label}
                onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none h-28 text-gray-700 outline-none transition-all font-medium"
              />
              <div className="flex gap-2 justify-end mt-5">
                <button onClick={() => setEditingNode(null)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 border border-gray-200 transition-colors">Hủy</button>
                <button 
                  onClick={() => {
                    setNodes((nds) => nds.map((n) => n.id === editingNode.id ? { ...n, data: { ...n.data, label: editingNode.label.trim() } } : n));
                    setEditingNode(null);
                    setTimeout(() => applyLayout(nodes, edges), 0);
                  }}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 shadow-sm transition-colors"
                >Cập nhật</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar (Xmind Style) */}
      {!readOnly && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 p-2 gap-1">
                  {['Style', 'Pitch', 'Map'].map(tab => (
                      <button 
                          key={tab}
                          onClick={() => setActiveTab(tab as 'Style' | 'Pitch' | 'Map')}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === tab ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-5">
                  {activeTab === 'Map' && (
                      <div className="space-y-6">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Map Style</label>
                              <select 
                                  value={mapStyle} 
                                  onChange={(e) => {
                                      setMapStyle(e.target.value);
                                      applyLayout(nodes, edges);
                                  }}
                                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20"
                              >
                                  <option value="LR">Mind Map (Left to Right)</option>
                                  <option value="TB">Logic Chart (Top to Bottom)</option>
                                  <option value="RL">Right to Left</option>
                              </select>
                          </div>
                          
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Color Theme</label>
                              <div className="grid grid-cols-2 gap-2">
                                  {['Dawn', 'Colorful', 'Classic', 'Dark'].map(theme => (
                                      <button 
                                          key={theme}
                                          onClick={() => setColorTheme(theme)}
                                          className={`py-2 px-3 text-xs font-bold rounded border ${colorTheme === theme ? 'border-accent bg-accent/5 text-accent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                      >
                                          {theme}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Background Color</label>
                              <div className="flex items-center gap-3">
                                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                                  <span className="text-sm font-mono text-gray-500 uppercase">{bgColor}</span>
                              </div>
                          </div>

                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Keyboard Shortcuts</label>
                              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-medium space-y-2 border border-blue-100">
                                  <p><strong>Tab:</strong> Thêm nhánh con</p>
                                  <p><strong>Enter:</strong> Thêm nhánh cùng cấp</p>
                                  <p><strong>Delete:</strong> Xoá nhánh</p>
                                  <p><strong>Double Click:</strong> Sửa chữ</p>
                              </div>
                          </div>
                      </div>
                  )}
                  {activeTab !== 'Map' && (
                      <div className="text-center text-gray-400 text-sm mt-10">
                          Tính năng <strong>{activeTab}</strong> đang được phát triển...
                      </div>
                  )}
              </div>

              {/* Save Footer */}
              {onSave && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <button 
                          onClick={() => setConfirmStep(1)}
                          className="w-full bg-accent hover:bg-accent-dark text-white py-3 rounded-xl font-bold shadow-md transition-all active:scale-95"
                      >
                          💾 Lưu thay đổi
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* 2-Step Verify Save Dialog */}
      {confirmStep > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-[420px] max-w-[90%]">
            {confirmStep === 1 ? (
              <>
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">⚠️ Xác nhận lưu?</h3>
                <p className="text-sm text-gray-600 mb-5">Bạn có chắc chắn muốn lưu sơ đồ này?</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmStep(0)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold">Hủy</button>
                  <button onClick={() => setConfirmStep(2)} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold">Tiếp tục →</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-red-700 mb-2 flex items-center gap-2">🔒 Xác nhận lần cuối</h3>
                <p className="text-sm text-gray-600 mb-5">Hành động này sẽ thay đổi giao diện học viên và không thể hoàn tác.</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmStep(0)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold">Hủy</button>
                  <button 
                    onClick={() => {
                        setConfirmStep(0);
                        if(onSave) onSave(parseFlowToMermaid(nodes, edges));
                    }} 
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold"
                  >✓ Xác nhận</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MindmapEditor(props: MindmapEditorProps) {
    return (
        <ReactFlowProvider>
            <FlowEditor {...props} />
        </ReactFlowProvider>
    );
}
