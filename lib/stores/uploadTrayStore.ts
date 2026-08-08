import { create } from 'zustand';

/**
 * Khay tải lên kiểu Google Drive (Giai đoạn 4 — UC34, UC35) — theo dõi tiến độ upload
 * MP4/tài liệu/ảnh bìa Ở TẦNG TOÀN CỤC, không phải state riêng của modal, để việc tải
 * lên tiếp tục hiển thị tiến độ dù người dùng đã đóng modal hoặc chuyển sang thao tác
 * bài học khác. Đây là state client thuần (không phải dữ liệu server), đúng quy ước
 * Zustand của dự án (xem `app/providers.tsx`).
 */
export type UploadTaskStatus = 'uploading' | 'success' | 'error';

export type UploadTargetType = 'lesson-video' | 'lesson-document' | 'course-thumbnail';

export interface UploadTask {
  id: string;
  label: string;
  percent: number;
  status: UploadTaskStatus;
  errorMessage?: string;
  targetType: UploadTargetType;
  targetId: number;
  /** Chỉ có khi upload hỗ trợ hủy giữa chừng (hiện tại: nạp video, UC34). */
  abort?: () => void;
}

interface UploadTrayState {
  tasks: UploadTask[];
  isOpen: boolean;
  addTask: (task: {
    id: string;
    label: string;
    targetType: UploadTargetType;
    targetId: number;
    abort?: () => void;
  }) => void;
  updateProgress: (id: string, percent: number) => void;
  markSuccess: (id: string) => void;
  markError: (id: string, message: string) => void;
  dismissTask: (id: string) => void;
  /** Gọi `abort()` của task nếu có — việc dọn state/khay diễn ra khi Promise reject theo sau. */
  cancelTask: (id: string) => void;
  toggleOpen: () => void;
}

/** Tự động biến mất khỏi khay sau khi thành công — khớp yêu cầu "tải xong hết thì tự tắt". */
const AUTO_DISMISS_DELAY_MS = 3000;

export const useUploadTrayStore = create<UploadTrayState>((set, get) => ({
  tasks: [],
  isOpen: false,

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, percent: 0, status: 'uploading' }],
      isOpen: true,
    })),

  updateProgress: (id, percent) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, percent } : t)),
    })),

  markSuccess: (id) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, percent: 100, status: 'success' } : t)),
    }));
    setTimeout(() => get().dismissTask(id), AUTO_DISMISS_DELAY_MS);
  },

  markError: (id, message) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'error', errorMessage: message } : t)),
    })),

  dismissTask: (id) =>
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id);
      return { tasks, isOpen: tasks.length === 0 ? false : state.isOpen };
    }),

  cancelTask: (id) => get().tasks.find((t) => t.id === id)?.abort?.(),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
