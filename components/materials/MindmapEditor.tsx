'use client';

import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
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
  Panel,
  PanOnScrollMode,
  getNodesBounds
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { toPng, toJpeg, toSvg } from 'html-to-image';

interface MindmapEditorProps {
  initialMermaidCode: string;
  initialTemplate?: string;
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
];

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  if (nodes.length === 0) return { nodes, edges };
  
  // Default Dagre
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const actualDirection = (direction === 'FISHBONE' || direction === 'MATRIX') ? 'LR' : direction;
  const isHorizontal = actualDirection === 'LR' || actualDirection === 'RL';
  dagreGraph.setGraph({ rankdir: actualDirection, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  const validIds = new Set(nodes.map(n => n.id));
  edges.forEach((edge) => {
    if (validIds.has(edge.source) && validIds.has(edge.target)) {
        dagreGraph.setEdge(edge.source, edge.target);
    }
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

    let yOffset = 0;
    if (direction === 'FISHBONE' && node.data.level !== 0) {
        yOffset = (node.data.branchIndex as number % 2 === 0) ? -80 : 80;
    }

    return {
      ...node,
      targetPosition,
      sourcePosition,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: (nodeWithPosition.y - nodeHeight / 2) + yOffset,
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
  let inThemeStyle = false;

  lines.forEach((line) => {
    if (line.startsWith('%% THEME_STYLE_START')) {
       inThemeStyle = true;
       return;
    }
    if (line.startsWith('%% THEME_STYLE_END')) {
       inThemeStyle = false;
       return;
    }
    if (inThemeStyle) return;
    
    if (line.startsWith('%% POSITIONS: ')) return;
    if (!line || line.startsWith('graph') || line.startsWith('mindmap')) return;
    
    if (line.startsWith('style ')) {
      const match = line.match(/^style\s+([^\s]+)\s+(.*)$/);
      if (match) {
        const id = match[1] as string;
        const styles = match[2] as string;
        const fillMatch = styles.match(/fill:([^,]+)/);
        const colorMatch = styles.match(/color:([^,]+)/);
        
        if (!nodeMap.has(id)) {
           const newNode: Node = { id, position: {x:0, y:0}, data: { label: id, level: 0 } };
           nodes.push(newNode);
           nodeMap.set(id, newNode);
        }
        const node = nodeMap.get(id)!;
        if (fillMatch) node.data.customBg = fillMatch[1];
        if (colorMatch) node.data.customColor = colorMatch[1];
      }
      return;
    }
    
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

  if (nodes.length === 0) {
    nodes.push({ id: 'root', position: { x: 100, y: 100 }, data: { label: 'Chủ đề chính', level: 0 } });
  }

  // Calculate Levels using BFS
  const rootNode = nodes[0]!;
  rootNode.data.level = 0;
  const queue = [rootNode.id];
  const visited = new Set([rootNode.id]);

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
            if (childNode.data.level === 1) {
                childNode.data.branchIndex = idx;
            } else {
                childNode.data.branchIndex = currNode.data.branchIndex;
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
      const paletteColor = t.palette[bIdx % t.palette.length] || '#000000';

      if (level === 0) {
          n.style = { background: t.rootBg, color: t.rootColor, border: 'none', borderRadius: '8px', padding: '14px 24px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
      } else if (level === 1) {
          n.style = { background: '#FFFFFF', color: paletteColor, border: `2px solid ${paletteColor}`, borderRadius: '20px', padding: '10px 20px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
      } else {
          n.style = { background: 'transparent', color: '#475569', border: 'none', borderBottom: `2px solid ${paletteColor}`, borderRadius: '0', padding: '6px 12px', fontWeight: '500', fontSize: '13px' };
      }
      
      if (n.data.customBg) n.style.background = n.data.customBg as string;
      if (n.data.customColor) n.style.color = n.data.customColor as string;
  });

  edges.forEach(e => {
      const targetNode = nodes.find(n => n.id === e.target);
      const bIdx = (targetNode?.data.branchIndex as number) || 0;
      const paletteColor = t.palette[bIdx % t.palette.length] || '#000000';
      e.style = { stroke: paletteColor, strokeWidth: targetNode?.data.level === 1 ? 3 : 2 };
      e.type = 'smoothstep';
      e.markerEnd = { type: MarkerType.ArrowClosed, color: paletteColor };
  });

  return { nodes, edges };
}

function parseFlowToMarkdownList(nodes: Node[], edges: Edge[]): string {
    if (nodes.length === 0) return '';
    const rootNodes = nodes.filter(n => !edges.find(e => e.target === n.id));
    const root = rootNodes[0] || nodes[0];
    
    let md = '';
    
    const dfs = (nodeId: string, level: number) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        const label = node.data.label as string;
        if (level === 0) {
            md += `# ${label}\n`;
        } else {
            md += `${'  '.repeat(level - 1)}- ${label}\n`;
        }
        
        const children = edges.filter(e => e.source === nodeId).map(e => e.target);
        for (const childId of children) {
            dfs(childId, level + 1);
        }
    };
    
    if (root) dfs(root.id, 0);
    return md;
}

function parseFlowToMermaid(nodes: Node[], edges: Edge[], layout: string, theme: string) {
  let mermaid = `%% CONFIG: {"layout":"${layout}","theme":"${theme}"}\n`;
  
  let direction = layout;
  if (layout === 'ORG_CHART' || layout === 'TB') direction = 'TB';
  else if (layout === 'RL') direction = 'RL';
  else if (layout === 'BT') direction = 'BT';
  else direction = 'LR'; // Default for FISHBONE, LOGIC_CHART, etc.

  mermaid += `graph ${direction}\n`;
  const t = THEME_PRESETS[theme] || THEME_PRESETS['Dawn']!;
  let customStyles = '';
  let themeStyles = '%% THEME_STYLE_START\n';

  nodes.forEach(n => {
    const label = (n.data.label as string) || n.id;
    mermaid += `    ${n.id}["${label}"]\n`;
    
    // Theme Styles
    const level = n.data.level as number;
    const bIdx = (n.data.branchIndex as number) || 0;
    const paletteColor = t.palette[bIdx % t.palette.length] || '#000000';
    
    let themeBg = 'none';
    let themeColor = '#475569';
    let themeStroke = 'none';
    
    if (level === 0) {
        themeBg = t.rootBg;
        themeColor = t.rootColor;
    } else if (level === 1) {
        themeBg = '#FFFFFF';
        themeColor = paletteColor;
        themeStroke = paletteColor;
    }
    themeStyles += `    style ${n.id} fill:${themeBg},color:${themeColor},stroke:${themeStroke},stroke-width:2px\n`;
    
    // Custom Styles
    const styleStr = [];
    if (n.data.customBg) styleStr.push(`fill:${n.data.customBg}`);
    if (n.data.customColor) styleStr.push(`color:${n.data.customColor}`);
    
    if (styleStr.length > 0) {
       customStyles += `    style ${n.id} ${styleStr.join(',')}\n`;
    }
  });
  
  let linkStyles = '%% THEME_STYLE_START\n';
  edges.forEach((e, idx) => {
    mermaid += `    ${e.source} --> ${e.target}\n`;
    const targetNode = nodes.find(n => n.id === e.target);
    const bIdx = (targetNode?.data.branchIndex as number) || 0;
    const paletteColor = t.palette[bIdx % t.palette.length] || '#000000';
    const width = targetNode?.data.level === 1 ? '3px' : '2px';
    linkStyles += `    linkStyle ${idx} stroke:${paletteColor},stroke-width:${width}\n`;
  });
  
  themeStyles += '%% THEME_STYLE_END\n';
  linkStyles += '%% THEME_STYLE_END\n';

  return mermaid + themeStyles + linkStyles + customStyles;
}

export function FlowEditor({ initialMermaidCode, initialTemplate, onSave, readOnly = false }: MindmapEditorProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push({ nodes: newNodes, edges: newEdges });
          if (newHistory.length > 20) newHistory.shift(); // Keep 20 steps
          return newHistory;
      });
      setHistoryIndex(prev => prev >= 19 ? 19 : prev + 1);
  }, [historyIndex]);

  const applyTheme = useCallback((themeName: string, nds: Node[], eds: Edge[]) => {
      const t = THEME_PRESETS[themeName] || THEME_PRESETS['Dawn']!;
      const newNodes = nds.map(n => {
          const level = n.data.level as number;
          const bIdx = (n.data.branchIndex as number) || 0;
          const paletteColor = t.palette[bIdx % t.palette.length] || '#000000';
          const newStyle: React.CSSProperties = { ...n.style };
          
          if (level === 0) {
              Object.assign(newStyle, { background: t.rootBg, color: t.rootColor, border: 'none', borderRadius: '8px', padding: '14px 24px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' });
          } else if (level === 1) {
              Object.assign(newStyle, { background: '#FFFFFF', color: paletteColor, border: `2px solid ${paletteColor}`, borderRadius: '20px', padding: '10px 20px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' });
          } else {
              Object.assign(newStyle, { background: 'transparent', color: '#475569', border: 'none', borderBottom: `2px solid ${paletteColor}`, borderRadius: '0', padding: '6px 12px', fontWeight: '500', fontSize: '13px' });
          }
          
          if (n.data.customBg) newStyle.background = n.data.customBg as string;
          if (n.data.customColor) newStyle.color = n.data.customColor as string;
          
          return { ...n, style: newStyle };
      });
      
      const newEdges = eds.map(e => {
          const targetNode = nds.find(n => n.id === e.target);
          const bIdx = (targetNode?.data.branchIndex as number) || 0;
          const paletteColor = t.palette[bIdx % t.palette.length] || '#000000';
          return {
              ...e,
              style: { ...e.style, stroke: paletteColor, strokeWidth: targetNode?.data.level === 1 ? 3 : 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: paletteColor }
          };
      });
      
      setNodes(newNodes);
      setEdges(newEdges);
      setTimeout(() => pushHistory(newNodes, newEdges), 100);
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          if (prevState) {
              setNodes(prevState.nodes);
              setEdges(prevState.edges);
              setHistoryIndex(historyIndex - 1);
          }
      }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          if (nextState) {
              setNodes(nextState.nodes);
              setEdges(nextState.edges);
              setHistoryIndex(historyIndex + 1);
          }
      }
  }, [history, historyIndex]);

  const [editingNode, setEditingNode] = useState<{ id: string; label: string } | null>(null);
  const { fitView } = useReactFlow();

  const ref = useRef<HTMLDivElement>(null);
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [showLayouts, setShowLayouts] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'Map' | 'Style'>('Map');
  
  // Parse initial config from mermaid code or props
  const parsedConfig = useMemo(() => {
    let layout = initialTemplate || 'LR';
    let theme = 'Dawn';
    const match = initialMermaidCode.match(/%% CONFIG: (.+)/);
    if (match && match[1]) {
        try {
            const config = JSON.parse(match[1]);
            if (config.layout) layout = config.layout;
            if (config.theme) theme = config.theme;
        } catch {}
    }
    if (layout === 'LOGIC_CHART' || layout === 'BRACE_MAP' || layout === 'TREE_TABLE' || layout === 'TIMELINE') layout = 'LR';
    if (layout === 'ORG_CHART') layout = 'TB';

    return { layout, theme };
  }, [initialMermaidCode, initialTemplate]);

  const [mapStyle, setMapStyle] = useState(parsedConfig.layout);
  const [colorTheme, setColorTheme] = useState(parsedConfig.theme);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!readOnly);

  const initData = useCallback(() => {
    const { nodes: n, edges: ed } = parseMermaidToFlow(initialMermaidCode, parsedConfig.theme);
    const layouted = getLayoutedElements(n, ed, parsedConfig.layout);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setHistory([{nodes: layouted.nodes, edges: layouted.edges}]);
    setHistoryIndex(0);
    setTimeout(() => fitView(), 100);
  }, [initialMermaidCode, parsedConfig, fitView]);

  useEffect(() => { initData(); }, [initData]);

  // FIX 8: Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as globalThis.Node)) setShowExport(false);
      if (layoutRef.current && !layoutRef.current.contains(event.target as globalThis.Node)) setShowLayouts(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // FIX 5: Layout Re-render
  const applyLayout = useCallback((nds: Node[], eds: Edge[], layoutOverride?: string) => {
    const layoutToUse = layoutOverride || mapStyle;
    const tempMermaid = parseFlowToMermaid(nds, eds, layoutToUse, colorTheme);
    const { nodes: parsedNodes, edges: parsedEdges } = parseMermaidToFlow(tempMermaid, colorTheme);
    const layouted = getLayoutedElements(parsedNodes, parsedEdges, layoutToUse);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    pushHistory(layouted.nodes, layouted.edges);
    setTimeout(() => fitView({ duration: 300 }), 50);
  }, [mapStyle, colorTheme, fitView, pushHistory]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
      setNodes((nds) => {
          const newNodes = applyNodeChanges(changes, nds);
          const hasRemovals = changes.some(c => c.type === 'remove');
          if (hasRemovals || changes.some(c => c.type === 'position')) {
              if (hasRemovals) {
                  setEdges(eds => {
                      const validIds = new Set(newNodes.map(n => n.id));
                      const validEdges = eds.filter(e => validIds.has(e.source) && validIds.has(e.target));
                      setTimeout(() => applyLayout(newNodes, validEdges), 0);
                      return validEdges;
                  });
              } else {
                  setTimeout(() => applyLayout(newNodes, edges), 0);
              }
          }
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
        const md = parseFlowToMarkdownList(nodes, edges);
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
        
        const nodesBounds = getNodesBounds(nodes);
        const transformX = -nodesBounds.x + 50;
        const transformY = -nodesBounds.y + 50;
        const width = nodesBounds.width + 100;
        const height = nodesBounds.height + 100;

        const oldTransform = flowEl.style.transform;
        flowEl.style.transform = `translate(${transformX}px, ${transformY}px) scale(1)`;
        
        const bg = THEME_PRESETS[colorTheme]?.background || '#FFFFFF';
        try {
            let dataUrl = '';
            if (type === 'png') dataUrl = await toPng(flowEl, { backgroundColor: bg, width, height, style: { width: `${width}px`, height: `${height}px` } });
            if (type === 'jpeg') dataUrl = await toJpeg(flowEl, { backgroundColor: bg, quality: 0.95, width, height, style: { width: `${width}px`, height: `${height}px` } });
            if (type === 'svg') dataUrl = await toSvg(flowEl, { backgroundColor: bg, width, height, style: { width: `${width}px`, height: `${height}px` } });
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `mindmap.${type}`;
            a.click();
        } catch (err) { console.error('Export failed', err); } 
        finally { flowEl.style.transform = oldTransform; }
    }
  }, [nodes, edges, colorTheme]);

  const triggerAction = useCallback((action: 'TAB' | 'ENTER') => {
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
        if (selectedNode.id === 'root') return; // root cannot have sibling
        
        setNodes(nds => [...nds, newNode]);
        if (parentEdge) {
            const newEdge: Edge = { id: `e-${parentEdge.source}-${newId}`, source: parentEdge.source, target: newId };
            setEdges(eds => {
                const nextEds = [...eds, newEdge];
                setTimeout(() => applyLayout([...nodes, newNode], nextEds), 0);
                return nextEds;
            });
        }
      }
  }, [nodes, edges, applyLayout]);

  useEffect(() => {
    if (readOnly) return;
    const handler = (e: KeyboardEvent) => {
      if (editingNode) return; // FIX 3: Ignore backspace if editing
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNode = nodes.find(n => n.selected);
        if (!selectedNode || selectedNode.id === 'root') return; // Cannot delete root
        
        // Cascade delete
        const idsToDelete = new Set<string>([selectedNode.id]);
        let changed = true;
        while(changed) {
            changed = false;
            edges.forEach(ed => {
                if (idsToDelete.has(ed.source) && !idsToDelete.has(ed.target)) {
                    idsToDelete.add(ed.target);
                    changed = true;
                }
            });
        }

        setNodes(nds => {
           const newNodes = nds.filter(n => !idsToDelete.has(n.id));
           setEdges(eds => {
               const newEdges = eds.filter(ed => !idsToDelete.has(ed.source) && !idsToDelete.has(ed.target));
               setTimeout(() => applyLayout(newNodes, newEdges), 0);
               return newEdges;
           });
           return newNodes;
        });
      }
      
      // FIX 2: Shortcuts
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
      }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleRedo();
      }

      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (onSave) {
              const newCode = parseFlowToMermaid(nodes, edges, mapStyle, colorTheme);
              onSave(newCode);
          }
      }
      
      if (e.key === 'Tab') { e.preventDefault(); triggerAction('TAB'); }
      if (e.key === 'Enter') { e.preventDefault(); triggerAction('ENTER'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingNode, readOnly, nodes, edges, applyLayout, triggerAction, mapStyle, colorTheme, onSave, handleUndo, handleRedo]);

  const hasSelectedNode = nodes.some(n => n.selected);

  return (
    <div className="flex h-[800px] w-full border border-gray-200 rounded-xl overflow-hidden bg-gray-50 relative" ref={ref} style={{ backgroundColor: THEME_PRESETS[colorTheme]?.background }}>
      
      {/* Top Floating Toolbar */}
      {!readOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white shadow-xl rounded-xl border border-gray-200 px-2 py-1.5 flex gap-1 items-center animate-in slide-in-from-top-4">
            {/* FIX 4: Disabled states */}
            <button onClick={() => triggerAction('TAB')} disabled={!hasSelectedNode} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] transition-colors ${hasSelectedNode ? 'hover:bg-gray-100 text-gray-600' : 'opacity-40 cursor-not-allowed text-gray-400'}`} title="Thêm nhánh con (Tab)">
                <span className="text-lg">🌿</span><span className="text-[10px] font-bold mt-1">Subtopic</span>
            </button>
            <button onClick={() => triggerAction('ENTER')} disabled={!hasSelectedNode || nodes.find(n => n.selected)?.id === 'root'} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] transition-colors ${hasSelectedNode && nodes.find(n => n.selected)?.id !== 'root' ? 'hover:bg-gray-100 text-gray-600' : 'opacity-40 cursor-not-allowed text-gray-400'}`} title="Thêm nhánh ngang hàng (Enter)">
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
                            <button key={l.id} onClick={() => { setMapStyle(l.id); setShowLayouts(false); applyLayout(nodes, edges, l.id); }} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${mapStyle === l.id ? 'border-cyan-500 bg-cyan-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}>
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

            <div className="w-[1px] h-8 bg-gray-200 mx-1"></div>
            
            <button onClick={handleUndo} disabled={historyIndex <= 0} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-colors ${historyIndex > 0 ? 'hover:bg-gray-100 text-gray-600' : 'opacity-40 cursor-not-allowed text-gray-400'}`} title="Hoàn tác (Ctrl+Z)">
                <span className="text-lg">↩️</span><span className="text-[10px] font-bold mt-1">Undo</span>
            </button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-colors ${historyIndex < history.length - 1 ? 'hover:bg-gray-100 text-gray-600' : 'opacity-40 cursor-not-allowed text-gray-400'}`} title="Làm lại (Ctrl+Y)">
                <span className="text-lg">↪️</span><span className="text-[10px] font-bold mt-1">Redo</span>
            </button>
            
            {onSave && (
                <>
                    <div className="w-[1px] h-8 bg-gray-200 mx-1"></div>
                    <button onClick={() => {
                        const newCode = parseFlowToMermaid(nodes, edges, mapStyle, colorTheme);
                        onSave(newCode);
                    }} className="flex flex-col items-center justify-center p-2 hover:bg-cyan-50 rounded-lg min-w-[80px] text-cyan-600 transition-colors border border-transparent hover:border-cyan-200">
                        <span className="text-lg">💾</span><span className="text-[10px] font-bold mt-1">Lưu & Áp dụng</span>
                    </button>
                </>
            )}
        </div>
      )}

      {/* Main Flow Canvas */}
      <div className={`flex-1 relative transition-all duration-300 ${!isSidebarOpen ? 'mr-0' : 'mr-80'}`}>
        
        {/* FIX 1: Sidebar Toggle Arrow */}
        {!readOnly && (
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 shadow-lg flex items-center justify-center transition-all ${isSidebarOpen ? 'right-0 rounded-l-lg border-r-0 w-6 h-12' : 'right-0 rounded-l-lg w-8 h-16'}`}
                title="Toggle Sidebar"
            >
                {isSidebarOpen ? '▶' : '◀'}
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
          deleteKeyCode={null} // Prevent default deletion, handled custom
          fitView
          attributionPosition="bottom-left"
          panOnScroll={true} // FIX 6: Viewport interactions
          zoomOnPinch={true}
          panOnScrollMode={PanOnScrollMode.Free}
        >
          {readOnly && (
              <Panel position="bottom-center" className="bg-white/90 backdrop-blur border border-gray-200 px-4 py-2 rounded-full shadow-lg mb-4 flex gap-4 text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1">🖱️ Shift+Scroll to pan</span>
                  <span className="flex items-center gap-1">✋ Drag/Pinch to zoom</span>
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
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        setNodes((nds) => {
                            const newNodes = nds.map((n) => n.id === editingNode.id ? { ...n, data: { ...n.data, label: editingNode.label.trim() } } : n);
                            setTimeout(() => applyLayout(newNodes, edges), 0);
                            return newNodes;
                        });
                        setEditingNode(null);
                    }
                }}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none h-28 text-gray-700 outline-none transition-all font-medium"
              />
              <div className="flex gap-2 justify-end mt-5">
                <button onClick={() => setEditingNode(null)} className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100">Hủy</button>
                <button onClick={() => {
                    setNodes((nds) => {
                        const newNodes = nds.map((n) => n.id === editingNode.id ? { ...n, data: { ...n.data, label: editingNode.label.trim() } } : n);
                        setTimeout(() => applyLayout(newNodes, edges), 0);
                        return newNodes;
                    });
                    setEditingNode(null);
                  }}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 shadow-sm"
                >Cập nhật</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Inspector Panel */}
      {!readOnly && (
          <div className={`w-80 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20 absolute right-0 top-0 bottom-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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
                                      <button key={theme} onClick={() => { setColorTheme(theme); applyTheme(theme, nodes, edges); }} className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 ${colorTheme === theme ? 'border-cyan-500 bg-cyan-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
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
                      <div className="space-y-6">
                        {nodes.filter(n => n.selected).length === 1 ? (
                            <div className="space-y-4">
                                <div className="border p-4 rounded-xl border-gray-200">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Màu Nền (Fill)</label>
                                    <div className="flex gap-2">
                                        <input type="color" className="w-10 h-10 rounded cursor-pointer border-0 p-0" onChange={(e) => {
                                            const selectedId = nodes.find(n => n.selected)!.id;
                                            setNodes(nds => nds.map(n => n.id === selectedId ? {...n, data: {...n.data, customBg: e.target.value}, style: {...n.style, background: e.target.value}} : n));
                                        }} value={nodes.find(n => n.selected)?.data.customBg as string || '#ffffff'} />
                                        <button onClick={() => {
                                            const selectedId = nodes.find(n => n.selected)!.id;
                                            setNodes(nds => nds.map(n => n.id === selectedId ? {...n, data: {...n.data, customBg: undefined}, style: {...n.style, background: undefined}} : n));
                                        }} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 rounded text-gray-600 font-bold">Xóa</button>
                                    </div>
                                </div>
                                <div className="border p-4 rounded-xl border-gray-200">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Màu Chữ (Text)</label>
                                    <div className="flex gap-2">
                                        <input type="color" className="w-10 h-10 rounded cursor-pointer border-0 p-0" onChange={(e) => {
                                            const selectedId = nodes.find(n => n.selected)!.id;
                                            setNodes(nds => nds.map(n => n.id === selectedId ? {...n, data: {...n.data, customColor: e.target.value}, style: {...n.style, color: e.target.value}} : n));
                                        }} value={nodes.find(n => n.selected)?.data.customColor as string || '#000000'} />
                                        <button onClick={() => {
                                            const selectedId = nodes.find(n => n.selected)!.id;
                                            setNodes(nds => nds.map(n => n.id === selectedId ? {...n, data: {...n.data, customColor: undefined}, style: {...n.style, color: undefined}} : n));
                                        }} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 rounded text-gray-600 font-bold">Xóa</button>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-2 text-center">Tùy chỉnh sẽ được đồng bộ khi bạn nhấn &quot;Lưu &amp; Áp dụng&quot;</div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 text-sm mt-10 p-4 border border-dashed rounded-xl border-gray-200">
                                <strong>Node Style</strong><br/><br/>
                                Hãy click chọn một node cụ thể trên bản đồ để tuỳ chỉnh Màu nền và Màu chữ.
                            </div>
                        )}
                      </div>
                  )}
              </div>

              {/* Removed old duplicate save button */}
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
