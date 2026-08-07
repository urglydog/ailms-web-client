'use client';

import { useState, type DragEvent } from 'react';
import { LessonEditorRow } from '@/components/instructor/LessonEditorRow';
import { LessonMediaModal } from '@/components/instructor/LessonMediaModal';
import {
  useCreateChapter,
  useCreateLesson,
  useDeleteChapter,
  useDeleteLesson,
  useReorderChapters,
  useReorderLessons,
  useUpdateChapter,
  useUpdateLesson,
} from '@/hooks/useCourses';
import type { ChapterEditItem } from '@/types/domain';

interface ChapterEditorListProps {
  courseId: number;
  chapters: ChapterEditItem[];
}

/** Sắp xếp lại chương/bài học bằng kéo-thả (HTML5 drag & drop, không cần thư viện). */
export function ChapterEditorList({ courseId, chapters }: ChapterEditorListProps) {
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newLessonTitleByChapter, setNewLessonTitleByChapter] = useState<Record<number, string>>({});
  const [draggedChapterId, setDraggedChapterId] = useState<number | null>(null);
  const [dropTargetChapterId, setDropTargetChapterId] = useState<number | null>(null);
  const [draggedLesson, setDraggedLesson] = useState<{ chapterId: number; lessonId: number } | null>(null);
  const [dropTargetLessonId, setDropTargetLessonId] = useState<number | null>(null);
  const [manageVideoLessonId, setManageVideoLessonId] = useState<number | null>(null);

  const createChapter = useCreateChapter(courseId);
  const updateChapter = useUpdateChapter(courseId);
  const deleteChapter = useDeleteChapter(courseId);
  const reorderChapters = useReorderChapters(courseId);
  const createLesson = useCreateLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);
  const reorderLessons = useReorderLessons(courseId);

  const sortedChapters = [...chapters].sort((a, b) => a.displayOrder - b.displayOrder);
  const activeLesson =
    manageVideoLessonId !== null
      ? (sortedChapters.flatMap((c) => c.lessons).find((l) => l.id === manageVideoLessonId) ?? null)
      : null;

  const handleChapterDrop = (targetChapterId: number) => {
    const draggedId = draggedChapterId;
    setDraggedChapterId(null);
    setDropTargetChapterId(null);
    if (draggedId === null || draggedId === targetChapterId) return;

    const ids = sortedChapters.map((c) => c.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetChapterId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved!);
    reorderChapters.mutate({ orderedIds: ids });
  };

  const handleLessonDrop = (chapter: ChapterEditItem, targetLessonId: number) => {
    const dragged = draggedLesson;
    setDraggedLesson(null);
    setDropTargetLessonId(null);
    if (!dragged || dragged.chapterId !== chapter.id || dragged.lessonId === targetLessonId) return;

    const lessons = [...chapter.lessons].sort((a, b) => a.displayOrder - b.displayOrder);
    const ids = lessons.map((l) => l.id);
    const fromIndex = ids.indexOf(dragged.lessonId);
    const toIndex = ids.indexOf(targetLessonId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved!);
    reorderLessons.mutate({ chapterId: chapter.id, input: { orderedIds: ids } });
  };

  const allowDrop = (e: DragEvent) => e.preventDefault();

  return (
    <div className="flex flex-col gap-4">
      {sortedChapters.map((chapter) => {
        const lessons = [...chapter.lessons].sort((a, b) => a.displayOrder - b.displayOrder);
        return (
          <div
            key={chapter.id}
            onDragOver={(e) => {
              allowDrop(e);
              if (draggedChapterId !== null) setDropTargetChapterId(chapter.id);
            }}
            onDragLeave={() => setDropTargetChapterId((prev) => (prev === chapter.id ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              handleChapterDrop(chapter.id);
            }}
            className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
              dropTargetChapterId === chapter.id && draggedChapterId !== chapter.id
                ? 'border-cyan-300 bg-cyan-50/40'
                : 'border-gray-200'
            }`}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedChapterId(chapter.id);
                }}
                onDragEnd={() => {
                  setDraggedChapterId(null);
                  setDropTargetChapterId(null);
                }}
                title="Kéo để đổi thứ tự chương"
                className="shrink-0 cursor-grab select-none text-lg leading-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
              >
                ⠿
              </span>
              <ChapterTitleInput
                title={chapter.title}
                onSave={(title) => updateChapter.mutate({ id: chapter.id, input: { title } })}
              />
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Xóa chương "${chapter.title}" và toàn bộ bài học bên trong?`)) {
                    deleteChapter.mutate(chapter.id);
                  }
                }}
                className="shrink-0 text-[12px] font-bold text-red-500 hover:text-red-700"
              >
                Xóa chương
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedLesson?.chapterId === chapter.id) setDropTargetLessonId(lesson.id);
                  }}
                  onDragLeave={() => setDropTargetLessonId((prev) => (prev === lesson.id ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLessonDrop(chapter, lesson.id);
                  }}
                >
                  <LessonEditorRow
                    lesson={lesson}
                    isDropTarget={dropTargetLessonId === lesson.id && draggedLesson?.lessonId !== lesson.id}
                    onDragStart={() => setDraggedLesson({ chapterId: chapter.id, lessonId: lesson.id })}
                    onDragEnd={() => {
                      setDraggedLesson(null);
                      setDropTargetLessonId(null);
                    }}
                    onRename={(title) =>
                      updateLesson.mutate({ id: lesson.id, input: { title, isPreview: lesson.isPreview } })
                    }
                    onTogglePreview={(isPreview) =>
                      updateLesson.mutate({ id: lesson.id, input: { title: lesson.title, isPreview } })
                    }
                    onDelete={() => {
                      if (window.confirm(`Xóa bài học "${lesson.title}"?`)) deleteLesson.mutate(lesson.id);
                    }}
                    onManageVideo={() => setManageVideoLessonId(lesson.id)}
                  />
                </div>
              ))}
              {lessons.length === 0 && (
                <p className="px-1 text-[12.5px] text-gray-400">Chương này chưa có bài học nào.</p>
              )}
            </div>

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const title = (newLessonTitleByChapter[chapter.id] ?? '').trim();
                if (!title) return;
                createLesson.mutate({ chapterId: chapter.id, input: { title } });
                setNewLessonTitleByChapter((prev) => ({ ...prev, [chapter.id]: '' }));
              }}
            >
              <input
                value={newLessonTitleByChapter[chapter.id] ?? ''}
                onChange={(e) =>
                  setNewLessonTitleByChapter((prev) => ({ ...prev, [chapter.id]: e.target.value }))
                }
                placeholder="Tên bài học mới..."
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-[12.5px] font-bold text-gray-700 hover:bg-gray-200"
              >
                + Thêm bài học
              </button>
            </form>
          </div>
        );
      })}

      {sortedChapters.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-[13px] text-gray-400">
          Chưa có chương nào — thêm chương đầu tiên bên dưới.
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newChapterTitle.trim()) return;
          createChapter.mutate({ title: newChapterTitle.trim() });
          setNewChapterTitle('');
        }}
      >
        <input
          value={newChapterTitle}
          onChange={(e) => setNewChapterTitle(e.target.value)}
          placeholder="Tên chương mới..."
          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-cyan-600 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-cyan-700"
        >
          + Thêm chương
        </button>
      </form>

      {activeLesson && (
        <LessonMediaModal
          courseId={courseId}
          lesson={activeLesson}
          onClose={() => setManageVideoLessonId(null)}
        />
      )}
    </div>
  );
}

function ChapterTitleInput({ title, onSave }: { title: string; onSave: (title: string) => void }) {
  const [value, setValue] = useState(title);
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value.trim() && value !== title) onSave(value.trim());
      }}
      className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 font-display text-[14.5px] font-bold text-gray-900 focus:border-cyan-300 focus:bg-white focus:outline-none"
    />
  );
}
