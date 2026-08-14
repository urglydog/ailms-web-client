'use client';

import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidViewerProps {
  chart: string;
}

export function MermaidViewer({ chart }: MermaidViewerProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    const renderChart = async () => {
      try {
        if (!chart) return;
        // Generate a unique ID for the SVG
        const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
        setError(false);
      } catch (err) {
        console.error('Lỗi khi render Mermaid:', err);
        setError(true);
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
        Không thể hiển thị sơ đồ. Mã Mermaid có thể không hợp lệ.
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto bg-white p-4 rounded-lg border border-line flex justify-center items-center min-h-[400px]">
      {svgContent ? (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <p className="text-ink-muted text-sm">Đang vẽ sơ đồ...</p>
      )}
    </div>
  );
}
