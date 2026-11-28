'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowRight, ArrowUp, ArrowLeft } from 'lucide-react';

const DIRECTIONS = [
  { id: 'TB', name: 'Top-Bottom', Icon: ArrowDown },
  { id: 'LR', name: 'Left-Right', Icon: ArrowRight },
  { id: 'BT', name: 'Bottom-Top', Icon: ArrowUp },
  { id: 'RL', name: 'Right-Left', Icon: ArrowLeft },
] as const;

interface MermaidViewerProps {
  chart: string;
  /** Chỉ để tương thích với nơi gọi: nút xoay hướng là thao tác XEM nên luôn hiện, không phụ thuộc chế độ chỉ-xem. */
  readOnly?: boolean;
}

export function MermaidViewer({ chart }: MermaidViewerProps) {
  const t = useTranslations('learn.mermaid');
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR' | 'BT' | 'RL' | null>(null);
  const [styledChart, setStyledChart] = useState<string>('');


  useEffect(() => {
    const renderChart = async () => {
      try {
        if (!chart) return;
        // Hiệu năng đợt 7 (B6): mermaid ~1 MB chỉ tải khi thật sự có sơ đồ cần vẽ, không nằm trong bundle
        // ban đầu của trang. Trình duyệt cache module nên lần vẽ sau không tải lại.
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif',
          flowchart: { htmlLabels: false }
        });
        setLoading(true);
        setError(null);
        
        // Dọn dẹp các layout cũ không hợp lệ từ Database (VD: graph MINDMAP, graph FISHBONE)
        let modifiedChart = chart.replace(/^(graph|flowchart)\s+(FISHBONE|MATRIX|MINDMAP|TREE_TABLE|BRACE_MAP|TIMELINE|LOGIC_CHART)/im, `$1 LR`);
        modifiedChart = modifiedChart.replace(/^(graph|flowchart)\s+(ORG_CHART)/im, `$1 TB`);
        
        // Khắc phục lỗi "Unsupported markdown: list" bằng cách thay thế gạch đầu dòng thành ký tự bullet
        modifiedChart = modifiedChart.replace(/<br\s*\/?>\s*[-*]\s/g, '<br/>• ')
                                     .replace(/\n\s*[-*]\s/g, '<br/>• ')
                                     .replace(/\["(\d+)[\.)]\s/g, '["($1) ');

        // Đổi hướng sơ đồ nếu user chọn
        if (layoutDirection) {
            // Thay thế tất cả các dạng định hướng hiện tại
            modifiedChart = modifiedChart.replace(/^(graph|flowchart)\s+(TB|TD|BT|RL|LR)/im, `$1 ${layoutDirection}`);
            // Nếu chưa có hướng nào (chỉ có graph/flowchart), thêm vào
            if (!modifiedChart.match(/^(graph|flowchart)\s+(TB|TD|BT|RL|LR)/im)) {
                modifiedChart = modifiedChart.replace(/^(graph|flowchart)/im, `$1 ${layoutDirection}`);
            }
        }

        // Nếu sơ đồ chưa có styling đồng bộ từ Editor, thêm styling mặc định cho đẹp (xanh nước biển/chàm)
        if (!modifiedChart.includes('style ') && !modifiedChart.includes('classDef ')) {
            modifiedChart += `\n    classDef default fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#3730a3,rx:8,ry:8;`;
        }
        
        setStyledChart(modifiedChart);
        
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, modifiedChart);
        // Mermaid mặc định chỉ ràng buộc SVG theo chiều RỘNG (width="100%" + max-width, không set
        // height) — sơ đồ hẹp-nhưng-cao (thường gặp ở hướng LR/RL nhiều nhánh) sẽ tràn khung theo
        // chiều dọc, phải cuộn mới xem hết. Ép luôn width="100%" height="100%" +
        // preserveAspectRatio="xMidYMid meet" để SVG co theo CẢ 2 chiều vừa khít khung hiển thị
        // (kiểu object-fit: contain), giống hệt trải nghiệm TB/BT hiện có.
        const containedSvg = svg
          .replace(/width="[^"]*"/, 'width="100%"')
          .replace(/style="max-width:[^"]*"/, '') // bỏ trần "chỉ giới hạn theo chiều rộng" mermaid tự thêm
          .replace('<svg ', '<svg height="100%" preserveAspectRatio="xMidYMid meet" ');
        setSvgContent(containedSvg);
      } catch (err: unknown) {
        console.error("Mermaid Render Error:", err);
        setError('renderError');
      } finally {
        setLoading(false);
      }
    };

    renderChart();
  }, [chart, layoutDirection]);

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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(styledChart || chart);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyError'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Thanh công cụ điều khiển sơ đồ */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-2 rounded-xl border border-line">
        {/* 4 nút xoay hướng chỉ đổi CÁCH XEM sơ đồ (không sửa dữ liệu) nên hiện cho cả học liệu Official (chỉ xem) lẫn cá nhân. */}
        <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-line">
          {DIRECTIONS.map(dir => (
            <button
              key={dir.id}
              onClick={() => setLayoutDirection(dir.id)}
              className={`p-2 rounded-md transition-colors ${
                layoutDirection === dir.id ? 'bg-accent text-white shadow-sm' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
              }`}
              title={t('rotate', { direction: dir.name })}
            >
              <dir.Icon className="w-4 h-4" strokeWidth={1.75} />
            </button>
          ))}
        </div>

        {svgContent && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 bg-tint hover:bg-accent text-ink hover:text-white rounded-lg text-sm font-medium transition border border-line"
              title={t('copyCode')}
            >
              Copy Code
            </button>
            <button 
              onClick={handleDownloadSVG}
              className="flex items-center gap-2 px-4 py-2 bg-tint hover:bg-accent text-ink hover:text-white rounded-lg text-sm font-medium transition border border-line"
              title={t('downloadTitle')}
            >
              {t('download')}
            </button>
          </div>
        )}
      </div>

      {/* Vùng hiển thị sơ đồ */}
      <div className="relative w-full min-h-[400px] h-[600px] bg-surface-raised rounded-2xl border border-line p-4 overflow-auto">
        {loading && (
          <div className="absolute inset-0 bg-surface-raised/50 flex items-center justify-center z-10 backdrop-blur-sm">
            <span className="text-accent text-sm">{t('loading')}</span>
          </div>
        )}
        {error ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-danger/5 rounded-2xl border border-danger/30 text-danger p-8 text-center">
            <p className="mb-4 text-sm font-medium">{t(error)}</p>
            <pre className="text-xs text-left w-full overflow-auto p-4 bg-surface rounded-xl border border-line">{chart}</pre>
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
