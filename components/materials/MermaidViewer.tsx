'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidViewerProps {
  chart: string;
}

export function MermaidViewer({ chart }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      flowchart: { htmlLabels: false }
    });

    const renderChart = async () => {
      try {
        if (!chart) return;
        setLoading(true);
        setError(null);
        
        // Dọn dẹp các layout cũ không hợp lệ từ Database (VD: graph MINDMAP, graph FISHBONE)
        let modifiedChart = chart.replace(/^(graph|flowchart)\s+(FISHBONE|MATRIX|MINDMAP|TREE_TABLE|BRACE_MAP|TIMELINE|LOGIC_CHART)/im, `$1 LR`);
        modifiedChart = modifiedChart.replace(/^(graph|flowchart)\s+(ORG_CHART)/im, `$1 TB`);
        
        // Khắc phục lỗi "Unsupported markdown: list" bằng cách thay thế gạch đầu dòng thành ký tự bullet
        // Mermaid hiểu nhầm "1. " và "1) " là ordered list markdown. Thay thành "(1) "
        modifiedChart = modifiedChart.replace(/<br\s*\/?>\s*[-*]\s/g, '<br/>• ')
                                     .replace(/\n\s*[-*]\s/g, '<br/>• ')
                                     .replace(/\["(\d+)[\.)]\s/g, '["($1) ');
        
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, modifiedChart);
        setSvgContent(svg);
      } catch (err: unknown) {
        console.error("Mermaid Render Error:", err);
        setError("Không thể vẽ Sơ đồ tư duy. Dữ liệu có thể bị lỗi định dạng.");
      } finally {
        setLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const svgEl = doc.documentElement;
    
    // 1. Nhúng CSS tổng quát
    const styleEl = doc.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
      * { font-family: sans-serif !important; }
      text, span, div, p { fill: #000000 !important; color: #000000 !important; }
      .node rect, .node circle, .node ellipse, .node polygon, .node path { fill: #ffffff !important; stroke: #52525b !important; stroke-width: 1px !important; }
      .edgePath .path { stroke: #a1a1aa !important; stroke-width: 1.5px !important; }
      .edgeLabel { background-color: #ffffff !important; fill: #000000 !important; }
      marker path { fill: #a1a1aa !important; stroke: none !important; }
    `;
    svgEl.insertBefore(styleEl, svgEl.firstChild);

    // 2. Ép style Inline cho tất cả các thẻ chữ (khắc phục triệt để lỗi của foreignObject trên một số app xem ảnh)
    const textNodes = svgEl.querySelectorAll('text, span, div, p, foreignObject');
    textNodes.forEach((node) => {
      if (node instanceof HTMLElement || node instanceof SVGElement) {
        node.style.setProperty('fill', '#000000', 'important');
        node.style.setProperty('color', '#000000', 'important');
      }
    });

    // 3. Thêm nền trắng
    const rect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "#ffffff"); 
    svgEl.insertBefore(rect, svgEl.firstChild);
    
    const finalSvg = new XMLSerializer().serializeToString(svgEl);

    const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Thanh công cụ điều khiển sơ đồ */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-2 rounded-xl border border-line">
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-line">
          {/* Layout controls removed as they are synced with MindmapEditor */}
        </div>

        {svgContent && (
          <button 
            onClick={handleDownloadSVG}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-accent text-ink hover:text-white rounded-lg text-sm font-medium transition-all border border-line"
            title="Tải sơ đồ dưới dạng ảnh SVG"
          >
            Tải ảnh (SVG)
          </button>
        )}
      </div>

      {/* Vùng hiển thị sơ đồ */}
      <div className="relative w-full min-h-[400px] h-[600px] bg-white rounded-2xl border border-line p-4 overflow-auto">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-sm">
            <span className="text-accent text-sm">Đang tải...</span>
          </div>
        )}
        {error ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-red-50/50 rounded-2xl border border-red-200 text-red-600 p-8 text-center">
            <p className="mb-4 text-sm font-medium">{error}</p>
            <pre className="text-xs text-left w-full overflow-auto p-4 bg-gray-50 rounded-xl border border-gray-200">{chart}</pre>
          </div>
        ) : (
          <div 
            ref={containerRef}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="mermaid-container min-w-max min-h-max p-4 transition-opacity duration-300"
            style={{ opacity: loading ? 0.3 : 1 }}
          />
        )}
      </div>
    </div>
  );
}
