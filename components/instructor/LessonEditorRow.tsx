'use client';

import { useState, type DragEvent } from 'react';
import type { LessonEditItem } from '@/types/domain';

interface LessonEditorRowProps {
  lesson: LessonEditItem;
  onRename: (title: string) => void;
  onTogglePreview: (isPreview: boolean) => void;
  onDelete: () => void;
  onManageVideo: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDropTarget: boolean;
}

const LESSON_STATUS_LABEL: Record<LessonEditItem['status'], string> = {
  DRAFT: 'Chưa có video',
  READY: 'Sẵn sàng',
  UNAVAILABLE: 'Video lỗi',
};

export function LessonEditorRow({
  lesson,
  onRename,
  onTogglePreview,
  onDelete,
  onManageVideo,
  onDragStart,
  onDragEnd,
  isDropTarget,
}: LessonEditorRowProps) {
  const [title, setTitle] = useState(lesson.title);

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border bg-gray-50/60 px-3 py-2 transition-colors ${
        isDropTarget ? 'border-cyan-300 bg-cyan-50/60' : 'border-gray-100'
      }`}
    >
      <span
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        title="Kéo để đổi thứ tự bài học"
        className="shrink-0 cursor-grab select-none text-base leading-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
      >
        ⠿
      </span>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (title.trim() && title !== lesson.title) onRename(title.trim());
        }}
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-[13px] font-medium text-gray-800 focus:border-cyan-300 focus:bg-white focus:outline-none"
      />

      <span
        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
          lesson.status === 'READY'
            ? 'bg-green-50 text-green-600'
            : lesson.status === 'UNAVAILABLE'
              ? 'bg-red-50 text-red-600'
              : 'bg-gray-100 text-gray-500'
        }`}
      >
        {LESSON_STATUS_LABEL[lesson.status]}
      </span>

      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11.5px] font-semibold text-gray-500">
        <input
          type="checkbox"
          checked={lesson.isPreview}
          onChange={(e) => onTogglePreview(e.target.checked)}
          className="accent-cyan-600"
        />
        Preview
      </label>

      <button
        type="button"
        onClick={onManageVideo}
        className="shrink-0 whitespace-nowrap rounded-full border border-cyan-200 px-2.5 py-1 text-[11px] font-bold text-cyan-700 hover:bg-cyan-50"
      >
        Quản lý video
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 text-[12px] font-bold text-red-500 hover:text-red-700"
      >
        Xóa
      </button>
    </div>
  );
}
