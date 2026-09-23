'use client';

import { useState, type DragEvent } from 'react';
import { PencilIcon, TrashIcon, DragHandleIcon } from '@/components/instructor/CurriculumIcons';
import { LessonEditorRow } from '@/components/instructor/LessonEditorRow';
import { LessonMediaModal } from '@/components/instructor/LessonMediaModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
  courseSlug: string;
  chapters: ChapterEditItem[];
}

/**
 * "Chương trình giảng dạy" — giao diện tham khảo Udemy (15/09/2026, redesign toàn bộ).
 *
 * Kéo-thả sắp xếp lại Phần/Bài giảng bằng HTML5 Drag & Drop thuần (không cần thư viện) — cả
 * NGUYÊN CẢ CARD (không chỉ 1 icon nắm nhỏ như bản cũ) đều kéo được, để chuột vào khoảng trống
 * bất kỳ trong card sẽ đổi thành con trỏ "di chuyển" (`cursor-move`) đúng như Udemy. Nhãn "Phần
 * N"/"Bài giảng N" LUÔN tính lại từ vị trí hiện tại trong mảng đã sắp xếp (`index + 1`), không
 * dùng số cứng nào lưu sẵn — nên tự động đổi số ngay khi kéo-thả xong, không cần chờ tải lại.
 */
export function ChapterEditorList({ courseId, courseSlug, chapters }: ChapterEditorListProps) {
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDescription, setNewChapterDescription] = useState('');
  const [showAddChapterForm, setShowAddChapterForm] = useState(false);
  const [newLessonTitleByChapter, setNewLessonTitleByChapter] = useState<Record<number, string>>({});
  const [addLessonFormOpenFor, setAddLessonFormOpenFor] = useState<number | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterDescription, setEditChapterDescription] = useState('');
  const [draggedChapterId, setDraggedChapterId] = useState<number | null>(null);
  const [dropTargetChapterId, setDropTargetChapterId] = useState<number | null>(null);
  const [draggedLesson, setDraggedLesson] = useState<{ chapterId: number; lessonId: number } | null>(null);
  const [dropTargetLessonId, setDropTargetLessonId] = useState<number | null>(null);
  const [manageVideoLessonId, setManageVideoLessonId] = useState<number | null>(null);
  const [confirmDeleteChapterId, setConfirmDeleteChapterId] = useState<number | null>(null);

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

  const openChapterEdit = (chapter: ChapterEditItem) => {
    setEditingChapterId(chapter.id);
    setEditChapterTitle(chapter.title);
    setEditChapterDescription(chapter.description ?? '');
  };

  const handleSaveChapterEdit = () => {
    if (!editChapterTitle.trim() || editingChapterId === null) return;
    updateChapter.mutate({
      id: editingChapterId,
      input: { title: editChapterTitle.trim(), description: editChapterDescription.trim() || null },
    });
    setEditingChapterId(null);
  };

  const handleCreateChapter = () => {
    if (!newChapterTitle.trim()) return;
    const description = newChapterDescription.trim();
    createChapter.mutate(
      { title: newChapterTitle.trim() },
      {
        // Backend chỉ nhận `title` lúc tạo (đúng khuôn UC32 hiện có) — mô tả (nếu đã nhập ngay ở
        // form thêm Phần, theo đúng giao diện Udemy) được lưu tiếp qua 1 lượt update ngay sau đó.
        onSuccess: (created) => {
          if (description) {
            updateChapter.mutate({ id: created.id, input: { title: created.title, description } });
          }
        },
      },
    );
    setNewChapterTitle('');
    setNewChapterDescription('');
    setShowAddChapterForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {sortedChapters.map((chapter, chapterIndex) => {
        const lessons = [...chapter.lessons].sort((a, b) => a.displayOrder - b.displayOrder);
        const isEditing = editingChapterId === chapter.id;
        return (
          <div
            key={chapter.id}
            draggable={!isEditing}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              setDraggedChapterId(chapter.id);
            }}
            onDragEnd={() => {
              setDraggedChapterId(null);
              setDropTargetChapterId(null);
            }}
            onDragOver={(e) => {
              allowDrop(e);
              if (draggedChapterId !== null) setDropTargetChapterId(chapter.id);
            }}
            onDragLeave={() => setDropTargetChapterId((prev) => (prev === chapter.id ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              handleChapterDrop(chapter.id);
            }}
            title="Kéo để đổi thứ tự chương"
            className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
              isEditing ? '' : 'cursor-move'
            } ${
              dropTargetChapterId === chapter.id && draggedChapterId !== chapter.id
                ? 'border-cyan-300 bg-cyan-50/40'
                : 'border-gray-200'
            }`}
          >
            {isEditing ? (
              <div className="mb-3 flex flex-col gap-2" draggable={false} onDragStart={(e) => e.preventDefault()}>
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-bold text-gray-500">Phần {chapterIndex + 1}:</span>
                  <input
                    value={editChapterTitle}
                    onChange={(e) => setEditChapterTitle(e.target.value)}
                    draggable={false}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 font-display text-[14.5px] font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] text-gray-500">
                    Sau khi hoàn thành phần này, học viên sẽ có thể làm được những gì?
                  </span>
                  <textarea
                    value={editChapterDescription}
                    onChange={(e) => setEditChapterDescription(e.target.value)}
                    rows={2}
                    placeholder="Nhập mục tiêu học tập..."
                    draggable={false}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    draggable={false}
                    onClick={() => setEditingChapterId(null)}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-gray-100"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    draggable={false}
                    onClick={handleSaveChapterEdit}
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-cyan-700"
                  >
                    Lưu phần
                  </button>
                </div>
              </div>
            ) : (
              // (19/09/2026) — `group` đặt NGAY TRÊN HÀNG TIÊU ĐỀ này (không phải cả thẻ Phần ở
              // ngoài) — hàng danh sách bài học nằm NGOÀI phạm vi group này (là 1 div anh em, xem
              // JSX bên dưới), nên hover 1 bài giảng bên trong KHÔNG còn làm lộ nhầm icon sửa/xóa
              // của Phần cha (trước đây `group` đặt trên cả thẻ nên bị "leo" lên do hover con luôn
              // kéo theo :hover của mọi phần tử cha trong CSS).
              <div className="group mb-1 flex items-center gap-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate font-display text-[14.5px] font-bold text-gray-900">
                    Phần {chapterIndex + 1}: {chapter.title}
                  </span>
                  <button
                    type="button"
                    draggable={false}
                    onClick={() => openChapterEdit(chapter)}
                    title="Đổi tên/mô tả phần"
                    className="shrink-0 text-gray-400 opacity-0 hover:text-gray-700 group-hover:opacity-100"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    draggable={false}
                    onClick={() => setConfirmDeleteChapterId(chapter.id)}
                    title="Xóa chương"
                    className="shrink-0 text-gray-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <span
                  aria-hidden
                  title="Kéo để đổi thứ tự"
                  className="shrink-0 select-none text-gray-300 opacity-0 group-hover:opacity-100"
                >
                  <DragHandleIcon />
                </span>
              </div>
            )}
            {!isEditing && chapter.description && (
              <p className="mb-3 text-[12px] text-gray-400">{chapter.description}</p>
            )}
            {!isEditing && !chapter.description && <div className="mb-3" />}

            <div className="flex flex-col gap-2">
              {lessons.map((lesson, lessonIndex) => (
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
                    index={lessonIndex}
                    courseSlug={courseSlug}
                    isDropTarget={dropTargetLessonId === lesson.id && draggedLesson?.lessonId !== lesson.id}
                    onDragStart={() => setDraggedLesson({ chapterId: chapter.id, lessonId: lesson.id })}
                    onDragEnd={() => {
                      setDraggedLesson(null);
                      setDropTargetLessonId(null);
                    }}
                    onRename={(title) =>
                      updateLesson.mutate({ id: lesson.id, input: { title, isPreview: lesson.isPreview, description: lesson.description } })
                    }
                    onUpdateDescription={(description) =>
                      updateLesson.mutate({ id: lesson.id, input: { title: lesson.title, isPreview: lesson.isPreview, description: description || null } })
                    }
                    onTogglePreview={(isPreview) =>
                      updateLesson.mutate({ id: lesson.id, input: { title: lesson.title, isPreview, description: lesson.description } })
                    }
                    onDelete={() => {
                      deleteLesson.mutate(lesson.id);
                    }}
                    onManageVideo={() => setManageVideoLessonId(lesson.id)}
                  />
                </div>
              ))}
              {lessons.length === 0 && (
                <p className="px-1 text-[12.5px] text-gray-400">Chương này chưa có bài học nào.</p>
              )}
            </div>

            {addLessonFormOpenFor === chapter.id ? (
              <form
                className="mt-3 flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onSubmit={(e) => {
                  e.preventDefault();
                  const title = (newLessonTitleByChapter[chapter.id] ?? '').trim();
                  if (!title) return;
                  createLesson.mutate({ chapterId: chapter.id, input: { title } });
                  setNewLessonTitleByChapter((prev) => ({ ...prev, [chapter.id]: '' }));
                  setAddLessonFormOpenFor(null);
                }}
              >
                <span className="text-[11.5px] font-bold text-gray-500">Bài giảng {lessons.length + 1}:</span>
                <input
                  autoFocus
                  value={newLessonTitleByChapter[chapter.id] ?? ''}
                  onChange={(e) =>
                    setNewLessonTitleByChapter((prev) => ({ ...prev, [chapter.id]: e.target.value }))
                  }
                  placeholder="Nhập tiêu đề bài giảng"
                  draggable={false}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] focus:border-cyan-400 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400">
                  Sau khi thêm, bấm &quot;+ Nội dung&quot; ở hàng bài giảng để tải video hoặc dán link YouTube.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    draggable={false}
                    onClick={() => setAddLessonFormOpenFor(null)}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-gray-100"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    draggable={false}
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-cyan-700"
                  >
                    Thêm bài giảng
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                draggable={false}
                onClick={() => setAddLessonFormOpenFor(chapter.id)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-[12.5px] font-bold text-gray-600 hover:border-cyan-300 hover:text-cyan-700"
              >
                + Mục trong chương trình giảng dạy
              </button>
            )}
          </div>
        );
      })}

      {sortedChapters.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-[13px] text-gray-400">
          Chưa có chương nào — thêm chương đầu tiên bên dưới.
        </p>
      )}

      {showAddChapterForm ? (
        <form
          className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateChapter();
          }}
        >
          <span className="text-[11.5px] font-bold text-gray-500">Phần mới:</span>
          <input
            autoFocus
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="Nhập tiêu đề"
            className="rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-cyan-400 focus:outline-none"
          />
          <span className="text-[11.5px] text-gray-500">
            Sau khi hoàn thành phần này, học viên sẽ có thể làm được những gì?
          </span>
          <textarea
            value={newChapterDescription}
            onChange={(e) => setNewChapterDescription(e.target.value)}
            rows={2}
            placeholder="Nhập mục tiêu học tập..."
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddChapterForm(false);
                setNewChapterTitle('');
                setNewChapterDescription('');
              }}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-gray-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-cyan-700"
            >
              Thêm phần
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddChapterForm(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-3 text-[13px] font-bold text-gray-600 hover:border-cyan-300 hover:text-cyan-700"
        >
          + Phần
        </button>
      )}

      {activeLesson && (
        <LessonMediaModal
          courseId={courseId}
          lesson={activeLesson}
          onClose={() => setManageVideoLessonId(null)}
        />
      )}

      {confirmDeleteChapterId !== null && (
        <ConfirmModal
          message="Bạn sắp xóa 1 Phần và toàn bộ bài giảng bên trong. Bạn có chắc chắn muốn tiếp tục không?"
          onCancel={() => setConfirmDeleteChapterId(null)}
          onConfirm={() => {
            deleteChapter.mutate(confirmDeleteChapterId);
            setConfirmDeleteChapterId(null);
          }}
        />
      )}
    </div>
  );
}
