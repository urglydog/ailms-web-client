'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { LocaleProvider } from '@/components/providers/LocaleProvider';
import { SystemBanner } from '@/components/layout/SystemBanner';
import { Toaster } from 'sonner';

/**
 * React Query provider.
 *
 * `useState` khởi tạo QueryClient thay vì tạo ở module scope: trên server, module
 * scope bị chia sẻ giữa các request nên cache của người dùng này có thể rò sang
 * người dùng khác. Đây là lỗi bảo mật, không chỉ là lỗi hiệu năng.
 *
 * Quy tắc phân chia state (lms-frontend-rules mục 5):
 *  - React Query giữ MỌI dữ liệu đến từ backend
 *  - Zustand chỉ giữ state client thuần (transport của Dual Player, panel mở/đóng)
 *  - Không bao giờ copy dữ liệu server vào Zustand
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dữ liệu khoá học đổi không thường xuyên
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // Không retry lỗi nghiệp vụ (4xx) — retry chỉ vô ích và làm chậm UI
            retry: (failureCount, error) => {
              const status = (error as { status?: number }).status;
              if (status !== undefined && status >= 400 && status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <NotificationProvider>
          <SystemBanner />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              unstyled: true,
              classNames: {
                toast:
                  'flex items-start gap-3 w-full rounded-card border px-4 py-3 shadow-card-hover font-sans text-sm bg-surface-raised border-line text-ink',
                title: 'font-bold',
                description: 'text-ink-muted text-xs mt-0.5',
                actionButton: 'bg-accent text-white rounded-card px-2.5 py-1 text-xs font-semibold',
                cancelButton: 'bg-surface text-ink-muted rounded-card px-2.5 py-1 text-xs font-semibold',
                closeButton: 'bg-surface-raised border-line text-ink-muted hover:text-ink',
                // 4 loại thông báo phải khác màu/rõ ràng — trước đây dùng `richColors` mặc định
                // của sonner, cho success/warning màu pastel gần giống nhau, khó phân biệt.
                success: 'border-success bg-success/10 text-success',
                error: 'border-danger bg-danger/10 text-danger',
                warning: 'border-warning bg-warning/10 text-warning',
                info: 'border-accent bg-accent/10 text-accent',
              },
            }}
          />
        </NotificationProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
