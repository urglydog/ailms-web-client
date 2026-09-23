'use client';

import { useEffect, useState } from 'react';
import { Save, Sparkles } from 'lucide-react';
import { MermaidViewer } from './MermaidViewer';

/** A4b — mẫu Tree-card: cú pháp Mermaid `mindmap` chuẩn (thư viện đã hỗ trợ native), không phải
 * loại diagram riêng — chỉ là khung sẵn để giảng viên sửa tiếp thay vì gõ từ đầu. */
const TREE_CARD_TEMPLATE = `mindmap
  root((Chủ đề chính))
    Nhánh 1
      Ý con 1.1
      Ý con 1.2
    Nhánh 2
      Ý con 2.1
    Nhánh 3`;

interface MermaidCodeEditorProps {
  initialCode: string;
  onSave: (code: string) => void;
  isSaving?: boolean;
}

/**
 * UpComming_Plan.md A4a — Mermaid Live Preview split-screen: gõ code Mermaid bên trái, bên phải
 * render lại ngay (debounce 400ms) bằng `MermaidViewer` đã có sẵn — không cần thêm thư viện,
 * `mermaid.render()` đã nằm trong bundle. Dành cho giảng viên quen viết code sơ đồ trực tiếp
 * thay vì kéo thả (`MindmapEditor`/DRAG_DROP vẫn giữ nguyên, không đổi gì ở đó).
 */
export function MermaidCodeEditor({ initialCode, onSave, isSaving = false }: MermaidCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [debouncedCode, setDebouncedCode] = useState(initialCode);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCode(code), 400);
    return () => clearTimeout(timer);
  }, [code]);

  const isDirty = code !== initialCode;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-1.5 min-h-0">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Mã Mermaid</label>
            <button
              type="button"
              onClick={() => setCode(TREE_CARD_TEMPLATE)}
              className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
            >
              <Sparkles className="w-3 h-3" /> Chèn khung Tree-card mẫu
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 min-h-0 w-full p-4 rounded-card bg-slate-900 text-cyan-300 font-mono text-xs leading-relaxed border border-slate-800 shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="mindmap&#10;  root((Chủ đề))&#10;    Nhánh 1&#10;    Nhánh 2"
          />
        </div>
        <div className="flex flex-col gap-1.5 min-h-0">
          <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Xem trước trực tiếp</label>
          <div className="flex-1 min-h-0 overflow-y-auto rounded-card border border-line bg-surface-raised">
            <MermaidViewer chart={debouncedCode} readOnly />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => onSave(code)}
          disabled={!isDirty || isSaving || !code.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-bold rounded-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  );
}
