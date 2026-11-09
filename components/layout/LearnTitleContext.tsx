'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Cho phép trang `/learn/[lessonId]` (con của layout) đẩy tên khóa học lên thanh header dùng
 * chung trong `app/(learn)/layout.tsx` — layout không tự fetch được dữ liệu bài học (chỉ page
 * mới gọi hook đó), nên cần 1 kênh chia sẻ state đơn giản thay vì lặp lại logic fetch ở layout.
 * Tham khảo Udemy: logo và tên khóa học nằm chung 1 hàng trên cùng.
 */
const LearnTitleContext = createContext<{
  title: string;
  setTitle: (t: string) => void;
  progressPct: number | null;
  setProgressPct: (p: number | null) => void;
} | null>(null);

export function LearnTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('');
  const [progressPct, setProgressPct] = useState<number | null>(null);
  return (
    <LearnTitleContext.Provider value={{ title, setTitle, progressPct, setProgressPct }}>
      {children}
    </LearnTitleContext.Provider>
  );
}

export function useLearnTitle(): string {
  const ctx = useContext(LearnTitleContext);
  return ctx?.title ?? '';
}

/** Task 1 — % tiến độ khóa học đang học, để thanh header hiện progress bar (Udemy-style). */
export function useLearnProgress(): number | null {
  const ctx = useContext(LearnTitleContext);
  return ctx?.progressPct ?? null;
}

/** Gọi trong page để đặt tên khóa học hiện tại lên thanh header — an toàn khi `title` là
 * `undefined` (đang tải), thanh header khi đó chỉ hiện logo, không hiện dấu phân cách. */
export function useSetLearnTitle(title: string | undefined): void {
  const ctx = useContext(LearnTitleContext);
  useEffect(() => {
    ctx?.setTitle(title ?? '');
  }, [ctx, title]);
}

/** Gọi trong page để đặt % tiến độ khóa học hiện tại lên thanh header (Task 1). */
export function useSetLearnProgress(progressPct: number | undefined | null): void {
  const ctx = useContext(LearnTitleContext);
  useEffect(() => {
    ctx?.setProgressPct(progressPct ?? null);
  }, [ctx, progressPct]);
}
