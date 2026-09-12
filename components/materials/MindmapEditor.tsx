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
  MiniMap,
  Panel
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

const THEME_PRESETS: Record<string, { background: string, palette: string[], rootBg: string, rootColor: string }> = {
  Dawn: {
    background: '#FFFFFF',
    palette: ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#DA77F2'],
    rootBg: '#212529',
    rootColor: '#FFFFFF'
  },
  'Dark Nebula': {
    background: '#1E1E2E',
    palette: ['#F38BA8', '#FAB387', '#A6E3A1', '#89B4FA', '#CBA6F7'],
    rootBg: '#CBA6F7',
    rootColor: '#1E1E2E'
  },
  'Classic Business': {
    background: '#F8F9FA',
    palette: ['#2B4C7E', '#3D6B9C', '#4A7FB2', '#679BCE', '#86B5E3'],
    rootBg: '#1A365D',
    rootColor: '#FFFFFF'
  },
  'Oceanic': {
    background: '#E0F2FE',
    palette: ['#0284C7', '#0369A1', '#075985', '#0C4A6E', '#082F49'],
    rootBg: '#0284C7',
    rootColor: '#FFFFFF'
  },
  'Forest': {
    background: '#F0FDF4',
    palette: ['#16A34A', '#15803D', '#166534', '#14532D', '#052E16'],
    rootBg: '#16A34A',
    rootColor: '#FFFFFF'
  }
};

const LAYOUTS = [
  { id: 'LR', name: 'Logic Chart (L-R)', icon: '➡️' },
  { id: 'RL', name: 'Logic Chart (R-L)', icon: '⬅️' },
  { id: 'TB', name: 'Org Chart (T-B)', icon: '⬇️' },
  { id: 'BT', name: 'Org Chart (B-T)', icon: '⬆️' },
  { id: 'MINDMAP', name: 'Mind Map (Radial)', icon: '🔀' }, // Mock radial with LR/RL split
  { id: 'FISHBONE', name: 'Fishbone', icon: '🐟' },
  { id: 'MATRIX', name: 'Matrix', icon: '▦' },
];

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Simple layout fallback for special types
  const actualDirection = (direction === 'MINDMAP' || direction === 'FISHBONE' || direction === 'MATRIX') ? 'LR' : direction;
  const isHorizontal = actualDirection === 'LR' || actualDirection === 'RL';
  
  dagreGraph.setGraph({ rankdir: actualDirection, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    let targetPosition = isHorizontal ? Position.Left : Position.Top;
    let sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    if (actualDirection === 'RL') {
        targetPosition = Position.Right;
        sourcePosition = Position.Left;
    } else if (actualDirection === 'BT') {
        targetPosition = Position.Bottom;
        sourcePosition = Position.Top;
    }

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

function parseMermaidToFlow(code: string, theme: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();
  const t = THEME_PRESETS[theme] || THEME_PRESETS['Dawn']!;
  
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
             data: { label: label || id, level: 0 },
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
          edges.push({ id: edgeId, source, target, animated: true });
        }
      }
    }
  });

  // Ensure root exists
  if (nodes.length === 0) {
    nodes.push({ id: 'root', position: { x: 100, y: 100 }, data: { label: 'Chủ đề chính', level: 0 } });
  }

  // Calculate Levels using BFS
  const rootNode = nodes[0]!;
  rootNode.data.level = 0;
  const queue = [rootNode.id];
  const visited = new Set([rootNode.id]);
  const parentMap = new Map<string, string>(); // child -> parent

  while(queue.length > 0) {
    const curr = queue.shift()!;
    const currNode = nodes.find(n => n.id === curr)!;
    const childrenEdges = edges.filter(e => e.source === curr);
    
    childrenEdges.forEach((e, idx) => {
      if (!visited.has(e.target)) {
        visited.add(e.target);
        const childNode = nodes.find(n => n.id === e.target);
        if (childNode) {
            childNode.data.level = (currNode.data.level as number) + 1;
            parentMap.set(childNode.id, currNode.id);
            if (childNode.data.level === 1) {
                childNode.data.branchIndex = idx;
            } else {
                childNode.data.branchIndex = currNode.data.branchIndex; // Inherit
            }
            queue.push(childNode.id);
        }
      }
    });
  }

  // Apply visual styling based on calculated levels
  nodes.forEach(n => {
      const level = n.data.level as number;
      const bIdx = (n.data.branchIndex as number) || 0;
      const paletteColor = t.palette[bIdx % t.palette.length];

      if (level === 0) {
          n.style = { background: t.rootBg, color: t.rootColor, border: 'none', borderRadius: '8px', padding: '14px 24px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
      } else if (level === 1) {
          n.style = { background: '#FFFFFF', color: paletteColor, border: `2px solid ${paletteColor}`, borderRadius: '20px', padding: '10px 20px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
      } else {
          n.style = { background: 'transparent', color: '#475569', border: 'none', borderBottom: `2px solid ${paletteColor}`, borderRadius: '0', padding: '6px 12px', fontWeight: '500', fontSize: '13px' };
      }
  });

  edges.forEach(e => {
      const targetNode = nodes.find(n => n.id === e.target);
      const bIdx = (targetNode?.data.branchIndex as number) || 0;
      const paletteColor = t.palette[bIdx % t.palette.length];
      e.style = { stroke: paletteColor, strokeWidth: targetNode?.data.level === 1 ? 3 : 2 };
      e.type = 'smoothstep';
      e.markerEnd = { type: MarkerType.ArrowClosed, color: paletteColor };
  });

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
  const exportRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [showLayouts, setShowLayouts] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'Map' | 'Style'>('Map');
  const [mapStyle, setMapStyle] = useState('LR');
  const [colorTheme, setColorTheme] = useState('Dawn');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!readOnly);

  const initData = useCallback(() => {
    const { nodes: n, edges: e } = parseMermaidToFlow(initialMermaidCode, colorTheme);
    const layouted = getLayoutedElements(n, e, mapStyle);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setTimeout(() => fitView(), 100);
  }, [initialMermaidCode, mapStyle, colorTheme, fitView]);

  useEffect(() => { initData(); }, [initData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as globalThis.Node)) setShowExport(false);
      if (layoutRef.current && !layoutRef.current.contains(event.target as globalThis.Node)) setShowLayouts(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle auto layout on changes
  const applyLayout = useCallback((nds: Node[], eds: Edge[]) => {
    // Re-run color parsing to maintain theme hierarchy
    const tempMermaid = parseFlowToMermaid(nds, eds);
    const { nodes: parsedNodes, edges: parsedEdges } = parseMermaidToFlow(tempMermaid, colorTheme);
    const layouted = getLayoutedElements(parsedNodes, parsedEdges, mapStyle);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setTimeout(() => fitView({ duration: 300 }), 50);
  }, [mapStyle, colorTheme, fitView]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);
        if (changes.some(c => c.type === 'remove')) setTimeout(() => applyLayout(newNodes, edges), 0);
        return newNodes;
      });
  }, [edges, applyLayout]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((params: Connection) => {
      setEdges((eds) => {
          const newEdges = addEdge({ ...params, animated: true }, eds);
          setTimeout(() => applyLayout(nodes, newEdges), 0);
          return newEdges;
      });
  }, [nodes, applyLayout]);

  const handleExport = useCallback(async (type: 'png' | 'jpeg' | 'svg' | 'md') => {
    setShowExport(false);
    if (type === 'md') {
        const md = parseFlowToMermaid(nodes, edges);
        const blob = new Blob([md], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'mindmap.md';
        a.click();
        return;
    }
    if (ref.current) {
        const flowEl = ref.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (!flowEl) return;
        const oldTransform = flowEl.style.transform;
        flowEl.style.transform = 'translate(0,0) scale(1)';
        const bg = THEME_PRESETS[colorTheme]?.background || '#FFFFFF';
        try {
            let dataUrl = '';
            if (type === 'png') dataUrl = await toPng(flowEl, { backgroundColor: bg });
            if (type === 'jpeg') dataUrl = await toJpeg(flowEl, { backgroundColor: bg, quality: 0.95 });
            if (type === 'svg') dataUrl = await toSvg(flowEl, { backgroundColor: bg });
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `mindmap.${type}`;
            a.click();
        } catch (err) { console.error('Export failed', err); } 
        finally { flowEl.style.transform = oldTransform; }
    }
  }, [nodes, edges, colorTheme]);

  const triggerAction = (action: 'TAB' | 'ENTER') => {
      const selectedNode = nodes.find(n => n.selected);
      if (!selectedNode) return;
      
      const newId = `node_${Date.now()}`;
      const newNode: Node = { id: newId, position: { x: 0, y: 0 }, data: { label: 'Nhánh mới' } };

      if (action === 'TAB') {
        setNodes(nds => [...nds, newNode]);
        const newEdge: Edge = { id: `e-${selectedNode.id}-${newId}`, source: selectedNode.id, target: newId };
        setEdges(eds => {
            const nextEds = [...eds, newEdge];
            setTimeout(() => applyLayout([...nodes, newNode], nextEds), 0);
            return nextEds;
        });
      }

      if (action === 'ENTER') {
        const parentEdge = edges.find(ed => ed.target === selectedNode.id);
        setNodes(nds => [...nds, newNode]);
        if (parentEdge) {
            const newEdge: Edge = { id: `e-${parentEdge.source}-${newId}`, source: parentEdge.source, target: newId };
            setEdges(eds => {
                const nextEds = [...eds, newEdge];
                setTimeout(() => applyLayout([...nodes, newNode], nextEds), 0);
                return nextEds;
            });
        } else {
            // It's root, acts like Tab
            const newEdge: Edge = { id: `e-${selectedNode.id}-${newId}`, source: selectedNode.id, target: newId };
            setEdges(eds => {
                const nextEds = [...eds, newEdge];
                setTimeout(() => applyLayout([...nodes, newNode], nextEds), 0);
                return nextEds;
            });
        }
      }
  };

  useEffect(() => {
    if (readOnly) return;
    const handler = (e: KeyboardEvent) => {
      if (editingNode) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNode = nodes.find(n => n.selected);
        if (!selectedNode || selectedNode.id === 'root') return;
        setNodes(nds => {
           const newNodes = nds.filter(n => n.id !== selectedNode.id);
           setEdges(eds => eds.filter(ed => ed.source !== selectedNode.id && ed.target !== selectedNode.id));
           setTimeout(() => applyLayout(newNodes, edges), 0);
           return newNodes;
        });
      }
      if (e.key === 'Tab') { e.preventDefault(); triggerAction('TAB'); }
      if (e.key === 'Enter') { e.preventDefault(); triggerAction('ENTER'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingNode, readOnly, nodes, edges, applyLayout]);

  return (
    <div className="flex h-[800px] w-full border border-gray-200 rounded-xl overflow-hidden bg-gray-50 relative" ref={ref} style={{ backgroundColor: THEME_PRESETS[colorTheme]?.background }}>
      
      {/* Top Floating Toolbar (Xmind Style) */}
      {!readOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white shadow-xl rounded-xl border border-gray-200 px-2 py-1.5 flex gap-1 items-center animate-in slide-in-from-top-4">
            <button onClick={() => triggerAction('TAB')} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 rounded-lg min-w-[64px] text-gray-600 transition-colors" title="Thêm nhánh con (Tab)">
                <span className="text-lg">🌿</span><span className="text-[10px] font-bold mt-1">Subtopic</span>
            </button>
            <button onClick={() => triggerAction('ENTER')} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 rounded-lg min-w-[64px] text-gray-600 transition-colors" title="Thêm nhánh ngang hàng (Enter)">
                <span className="text-lg">↔️</span><span className="text-[10px] font-bold mt-1">Topic</span>
            </button>
            <div className="w-[1px] h-8 bg-gray-200 mx-1"></div>
            <div className="relative" ref={layoutRef}>
                <button onClick={() => setShowLayouts(!showLayouts)} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 rounded-lg min-w-[64px] text-gray-600 transition-colors">
                    <span className="text-lg">✨</span><span className="text-[10px] font-bold mt-1">Layout</span>
                </button>
                {showLayouts && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 grid grid-cols-2 gap-2 z-50">
                        {LAYOUTS.map(l => (
                            <button key={l.id} onClick={() => { setMapStyle(l.id); setShowLayouts(false); }} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${mapStyle === l.id ? 'border-cyan-500 bg-cyan-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}>
                                <span className="text-2xl mb-1">{l.icon}</span>
                                <span className="text-[10px] font-bold text-center text-gray-600 leading-tight">{l.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="w-[1px] h-8 bg-gray-200 mx-1"></div>
            <div className="relative" ref={exportRef}>
                <button onClick={() => setShowExport(!showExport)} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 rounded-lg min-w-[64px] text-gray-600 transition-colors">
                    <span className="text-lg">📤</span><span className="text-[10px] font-bold mt-1">Export</span>
                </button>
                {showExport && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 flex flex-col z-50">
                        <button onClick={() => handleExport('png')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium">PNG Image</button>
                        <button onClick={() => handleExport('svg')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium">SVG Vector</button>
                        <button onClick={() => handleExport('md')} className="px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium border-t border-gray-100 mt-1 pt-2">Markdown Code</button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Main Flow Canvas */}
      <div className="flex-1 relative transition-all">
        {/* Toggle Sidebar Button */}
        {!readOnly && (
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-4 right-4 z-20 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 p-2.5 rounded-lg font-bold shadow-sm transition-colors text-xs flex items-center gap-2">
             {isSidebarOpen ? 'Đóng Panel ▶' : '◀ Panel'}
           </button>
        )}

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
          attributionPosition="bottom-left"
        >
          {readOnly && (
              <Panel position="bottom-center" className="bg-white/90 backdrop-blur border border-gray-200 px-4 py-2 rounded-full shadow-lg mb-4 flex gap-4 text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1">🖱️ Scroll to zoom</span>
                  <span className="flex items-center gap-1">✋ Drag to pan</span>
              </Panel>
          )}
          <Controls className="bg-white border-gray-200 shadow-md" />
          <MiniMap className="bg-white border-gray-200 shadow-md rounded-lg overflow-hidden" zoomable pannable nodeStrokeColor="#E2E8F0" nodeColor="#F1F5F9" />
          <Background gap={20} size={1} color="#E2E8F0" />
        </ReactFlow>

        {/* Editing Node Modal */}
        {editingNode && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-96 max-w-[90%] animate-in zoom-in-95">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">✏️ Nhập nội dung</h3>
              <textarea
                autoFocus
                value={editingNode.label}
                onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none h-28 text-gray-700 outline-none transition-all font-medium"
              />
              <div className="flex gap-2 justify-end mt-5">
                <button onClick={() => setEditingNode(null)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100">Hủy</button>
                <button onClick={() => {
                    setNodes((nds) => nds.map((n) => n.id === editingNode.id ? { ...n, data: { ...n.data, label: editingNode.label.trim() } } : n));
                    setEditingNode(null);
                    setTimeout(() => applyLayout(nodes, edges), 0);
                  }}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 shadow-sm"
                >Lưu thay đổi</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Inspector Panel */}
      {!readOnly && isSidebarOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20 absolute right-0 top-0 bottom-0 animate-in slide-in-from-right-8">
              <div className="flex border-b border-gray-100 p-2 gap-1 pt-16">
                  {['Map', 'Style'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab as 'Style' | 'Map')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === tab ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>{tab}</button>
                  ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5 pb-24">
                  {activeTab === 'Map' && (
                      <div className="space-y-6">
                          <div>
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 block">Color Theme (Bảng màu)</label>
                              <div className="grid gap-2">
                                  {Object.keys(THEME_PRESETS).map(theme => (
                                      <button key={theme} onClick={() => setColorTheme(theme)} className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 ${colorTheme === theme ? 'border-cyan-500 bg-cyan-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                          <span className="text-xs font-bold text-gray-700">{theme}</span>
                                          <div className="flex gap-1 h-3 rounded-full overflow-hidden w-full">
                                              {THEME_PRESETS[theme]?.palette.map(c => <div key={c} className="flex-1" style={{backgroundColor: c}}></div>)}
                                          </div>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}
                  {activeTab === 'Style' && (
                      <div className="text-center text-gray-400 text-sm mt-10 p-4 border border-dashed rounded-xl border-gray-200">
                          <strong>Node Style</strong><br/><br/>
                          Hãy click chọn một node cụ thể trên bản đồ để tuỳ chỉnh Shape, Border, Fill, Font cho riêng node đó.<br/><br/>
                          <span className="text-[10px]">(Đang phát triển)</span>
                      </div>
                  )}
              </div>

              {onSave && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/90 backdrop-blur">
                      <button onClick={() => setConfirmStep(1)} className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                          💾 Xác Nhận Cập Nhật
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Confirm Dialogs remain unchanged, but styled properly */}
      {confirmStep > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-[420px] max-w-[90%]">
            {confirmStep === 1 ? (
              <>
                <h3 className="text-base font-bold text-gray-900 mb-2">⚠️ Xác nhận lưu?</h3>
                <p className="text-sm text-gray-600 mb-5">Bạn có chắc chắn muốn lưu lại cấu trúc Mindmap này?</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmStep(0)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 border border-gray-200">Hủy</button>
                  <button onClick={() => setConfirmStep(2)} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600">Tiếp tục →</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-red-700 mb-2">🔒 Lần cuối</h3>
                <p className="text-sm text-gray-600 mb-5">Xác nhận công bố bản đồ này cho học viên? Không thể hoàn tác.</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmStep(0)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold border border-gray-200">Hủy</button>
                  <button onClick={() => { setConfirmStep(0); if(onSave) onSave(parseFlowToMermaid(nodes, edges)); }} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold">✓ Xác nhận</button>
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
