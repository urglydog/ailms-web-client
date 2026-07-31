'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

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
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </QueryClientProvider>
  );
}
