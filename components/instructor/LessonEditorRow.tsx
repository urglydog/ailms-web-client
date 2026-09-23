'use client';

import { useState, type DragEvent } from 'react';
import { ChevronDownIcon, DragHandleIcon, PencilIcon, TrashIcon } from '@/components/instructor/CurriculumIcons';
import { LessonAssignmentPanel } from '@/components/instructor/LessonAssignmentPanel';
import { LessonResourcePanel } from '@/components/instructor/LessonResourcePanel';
import { VideoPreviewModal } from '@/components/instructor/VideoPreviewModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDuration } from '@/lib/format';
import type { LessonEditItem } from '@/types/domain';

interface LessonEditorRowProps {
  lesson: LessonEditItem;
  /** Số thứ tự hiển thị (0-based) — dùng để tự đánh lại "Bài giảng N" mỗi khi kéo-thả đổi vị
   * trí, KHÔNG dùng `lesson.displayOrder` trực tiếp (chỉ đồng bộ sau khi server phản hồi). */
  index: number;
  /** "Xem trước — Với tư cách là học viên" (19/09/2026) — mở trang chi tiết khóa CÔNG KHAI ở tab
   * mới, đúng như học viên thật sẽ thấy (mô tả, giá, đánh giá... mọi thứ), không phải chỉ video. */
  courseSlug: string;
  onRename: (title: string) => void;
  onUpdateDescription: (description: string) => void;
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

/** Tên hiển thị của video — YouTube không có "tên tệp" thật, Upload thì lấy đoạn cuối URL
 * (khớp tên file gốc đã tải lên, giống Udemy hiện "2026-06-30 14-15-39.mp4"). */
function deriveVideoDisplayName(lesson: LessonEditItem): string {
  if (lesson.videoSource === 'YOUTUBE') return 'Video YouTube';
  if (!lesson.videoUrl) return '';
  const clean = lesson.videoUrl.split('?')[0]!;
  const parts = clean.split('/');
  return decodeURIComponent(parts[parts.length - 1] || lesson.videoUrl);
}

/**
 * Hàng bài giảng — giao diện tham khảo Udemy "Chương trình giảng dạy" (15/09/2026, redesign;
 * 19/09/2026, tinh chỉnh lần 2 theo phản hồi):
 *
 * 1. Icon sửa (✎)/xóa (🗑) đổi sang SVG line-icon (trước dùng ký tự Unicode, hiển thị không đồng
 *    nhất giữa hệ điều hành và không giống Udemy). Cả 2 CHỈ hiện khi hover ĐÚNG hàng này — phạm
 *    vi `group` nằm NGAY TRÊN hàng bài giảng (không lồng trong `group` của Phần cha ở
 *    `ChapterEditorList`), nên hover 1 bài không còn làm hiện nhầm icon của Phần chứa nó.
 * 2. Xóa bài giảng phải xác nhận qua {@link ConfirmModal} (giống Udemy "Please confirm").
 * 3. Nút mũi tên (▾) bỏ viền/màu; bấm vào MỞ RỘNG (không phải popover nổi) hiện: video đã thêm
 *    (thumbnail/tên/trạng thái + nút "Xem trước" khi đã sẵn sàng), "+ Sự miêu tả", "+ Tài
 *    nguyên", "+ Bài tập". Mũi tên tự đổi chiều theo trạng thái mở rộng.
 *
 * (23/09/2026) — bỏ nút "+ Đính kèm": trùng chức năng với khung "Phân Phối" (kéo-thả) trong
 * Materials Workspace (tab "Học liệu & Quiz thi cử" ở Edit khoá học) — cùng gọi 1 API gán học
 * liệu vào bài học, chỉ là bản giới hạn hơn.
 */
export function LessonEditorRow({
  lesson,
  index,
  courseSlug,
  onRename,
  onUpdateDescription,
  onTogglePreview,
  onDelete,
  onManageVideo,
  onDragStart,
  onDragEnd,
  isDropTarget,
}: LessonEditorRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description ?? '');
  const [expanded, setExpanded] = useState(false);
  const [showDescriptionPanel, setShowDescriptionPanel] = useState(false);
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);
  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };

  const handleSaveEdit = () => {
    if (title.trim() && title !== lesson.title) onRename(title.trim());
    if (description !== (lesson.description ?? '')) onUpdateDescription(description.trim());
    setEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      title="Kéo để đổi thứ tự bài học"
      className={`flex flex-col gap-2 rounded-lg border bg-gray-50/60 px-3 py-2 transition-colors cursor-move ${
        isDropTarget ? 'border-cyan-300 bg-cyan-50/60' : 'border-gray-100'
      }`}
    >
      {editing ? (
        <div className="flex flex-col gap-2" draggable={false} onDragStart={(e) => e.preventDefault()}>
          <span className="text-[11.5px] font-bold text-gray-500">Bài giảng {index + 1}:</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề"
            draggable={false}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] font-medium focus:border-cyan-400 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Mô tả bài giảng — nêu rõ học viên sẽ làm được gì sau bài này."
            draggable={false}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              draggable={false}
              onClick={() => {
                setTitle(lesson.title);
                setDescription(lesson.description ?? '');
                setEditing(false);
              }}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-gray-100"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              draggable={false}
              onClick={handleSaveEdit}
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-cyan-700"
            >
              Lưu bài giảng
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex items-center gap-2.5">
          <span
            className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              lesson.status === 'READY'
                ? 'bg-green-50 text-green-600'
                : lesson.status === 'UNAVAILABLE'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {lesson.status === 'READY' ? '✓' : '○'}
          </span>

          {/* Tên + icon sửa/xóa CHUNG 1 container co giãn — icon vì vậy luôn bám sát ngay sau
              chữ, vị trí trôi theo độ dài tên. `group` đặt NGAY TRÊN HÀNG NÀY (không phải cả thẻ
              Phần cha) nên hover đúng hàng bài giảng mới hiện, không lộ nhầm icon của Phần. */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-gray-800">
              Bài giảng {index + 1}: {lesson.title}
            </span>
            <button
              type="button"
              draggable={false}
              onClick={() => setEditing(true)}
              title="Đổi tên/mô tả bài giảng"
              className="shrink-0 text-gray-400 opacity-0 hover:text-gray-700 group-hover:opacity-100"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              draggable={false}
              onClick={() => setConfirmDelete(true)}
              title="Xóa bài giảng"
              className="shrink-0 text-gray-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
            >
              <TrashIcon />
            </button>
          </div>

          <span className="shrink-0 text-[11px] text-gray-400">{LESSON_STATUS_LABEL[lesson.status]}</span>

          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11.5px] font-semibold text-gray-500">
            <input
              type="checkbox"
              draggable={false}
              checked={lesson.isPreview}
              onChange={(e) => onTogglePreview(e.target.checked)}
              className="accent-cyan-600"
            />
            Preview
          </label>

          <button
            type="button"
            draggable={false}
            onClick={onManageVideo}
            className="shrink-0 whitespace-nowrap rounded-full border border-cyan-200 px-2.5 py-1 text-[11px] font-bold text-cyan-700 hover:bg-cyan-50 transition-colors"
          >
            + Nội dung
          </button>
          {/* (19/09/2026) — bỏ viền/màu, chỉ còn icon mũi tên trơn; bấm để MỞ RỘNG ngay trong
              hàng (thay popover nổi trước đây), mũi tên tự xoay theo trạng thái. */}
          <button
            type="button"
            draggable={false}
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Thu gọn' : 'Mở rộng'}
            className="shrink-0 text-gray-500 hover:text-gray-800"
          >
            <ChevronDownIcon expanded={expanded} />
          </button>

          <span
            aria-hidden
            title="Kéo để đổi thứ tự"
            className="shrink-0 select-none text-gray-300 opacity-0 group-hover:opacity-100"
          >
            <DragHandleIcon />
          </span>
        </div>
      )}

      {!editing && lesson.description && !showDescriptionPanel && (
        <p className="truncate pl-[26px] text-[11.5px] text-gray-400">{lesson.description}</p>
      )}

      {expanded && (
        <div
          draggable={false}
          onDragStart={(e) => e.stopPropagation()}
          className="flex flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3"
        >
          {lesson.videoUrl && (
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2.5">
              <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-black">
                {lesson.videoSource === 'YOUTUBE' && lesson.youtubeId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video muted preload="metadata" src={lesson.videoUrl} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-gray-800">{deriveVideoDisplayName(lesson)}</p>
                <p className="text-[11px] text-gray-400">
                  {formatDuration(lesson.durationSec)} · {LESSON_STATUS_LABEL[lesson.status]}
                </p>
                <button
                  type="button"
                  draggable={false}
                  onClick={onManageVideo}
                  className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-purple-700 hover:underline"
                >
                  <PencilIcon className="h-3 w-3" /> Chỉnh sửa nội dung
                </button>
              </div>
              {lesson.status === 'READY' && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    draggable={false}
                    onClick={() => setShowPreviewMenu((v) => !v)}
                    className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-purple-700"
                  >
                    Xem trước <ChevronDownIcon className="h-3.5 w-3.5" expanded={showPreviewMenu} />
                  </button>
                  {showPreviewMenu && (
                    <div
                      draggable={false}
                      className="absolute right-0 top-full z-10 mt-1 w-52 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                    >
                      <button
                        type="button"
                        draggable={false}
                        onClick={() => {
                          setShowVideoPreview(true);
                          setShowPreviewMenu(false);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-[12px] text-gray-700 hover:bg-gray-50"
                      >
                        Với tư cách là Giảng viên
                      </button>
                      <button
                        type="button"
                        draggable={false}
                        onClick={() => {
                          window.open(`/courses/${courseSlug}`, '_blank', 'noopener,noreferrer');
                          setShowPreviewMenu(false);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-[12px] text-gray-700 hover:bg-gray-50"
                      >
                        Với tư cách là học viên
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            draggable={false}
            onClick={() => setShowDescriptionPanel((v) => !v)}
            className="self-start rounded-full border border-purple-200 px-3 py-1.5 text-[12px] font-bold text-purple-700 hover:bg-purple-50 transition-colors"
          >
            + Sự miêu tả
          </button>
          {showDescriptionPanel && (
            <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              <p className="text-[11.5px] text-gray-400">
                Thêm phần mô tả. Nêu rõ những điều học viên sẽ làm được sau khi hoàn thành bài giảng.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                draggable={false}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12.5px] focus:border-cyan-400 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  draggable={false}
                  onClick={() => {
                    setDescription(lesson.description ?? '');
                    setShowDescriptionPanel(false);
                  }}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  draggable={false}
                  onClick={() => {
                    onUpdateDescription(description.trim());
                    setShowDescriptionPanel(false);
                  }}
                  className="rounded-lg bg-cyan-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-cyan-700"
                >
                  Lưu
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            draggable={false}
            onClick={() => setShowResourcePanel((v) => !v)}
            className="self-start rounded-full border border-purple-200 px-3 py-1.5 text-[12px] font-bold text-purple-700 hover:bg-purple-50 transition-colors"
          >
            + Tài nguyên
          </button>
          {showResourcePanel && <LessonResourcePanel lessonId={lesson.id} />}

          <button
            type="button"
            draggable={false}
            onClick={() => setShowAssignmentPanel((v) => !v)}
            className="self-start rounded-full border border-purple-200 px-3 py-1.5 text-[12px] font-bold text-purple-700 hover:bg-purple-50 transition-colors"
          >
            + Bài tập
          </button>
          {showAssignmentPanel && <LessonAssignmentPanel lessonId={lesson.id} />}
        </div>
      )}

      {showVideoPreview && <VideoPreviewModal lesson={lesson} onClose={() => setShowVideoPreview(false)} />}

      {confirmDelete && (
        <ConfirmModal
          message="Bạn sắp xóa 1 mục trong chương trình giảng dạy. Bạn có chắc chắn muốn tiếp tục không?"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete();
          }}
        />
      )}
    </div>
  );
}
