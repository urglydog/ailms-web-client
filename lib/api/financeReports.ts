import { api, apiBlob } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import type { ExportFormat, FinanceReport, Granularity, ReportSnapshot } from '@/types/financeReport';

const token = () => ({ token: getAccessToken() ?? undefined });
const range = (from: string, to: string, g: Granularity) => `from=${from}&to=${to}&granularity=${g}`;

/** Thống kê tài chính toàn nền tảng (admin): xem theo kỳ, xuất CSV/XLSX/PDF, lịch sử báo cáo và "chạy ngay". */
export const financeReportsApi = {
  get: (from: string, to: string, g: Granularity) =>
    api.get<FinanceReport>(`/api/v1/admin/finance-reports?${range(from, to, g)}`, token()),
  export: (from: string, to: string, g: Granularity, format: ExportFormat) =>
    apiBlob(`/api/v1/admin/finance-reports/export?${range(from, to, g)}&format=${format}`),
  snapshots: () => api.get<ReportSnapshot[]>('/api/v1/admin/finance-reports/snapshots?limit=20', token()),
  runNow: (from: string, to: string) =>
    api.post<{ snapshot: ReportSnapshot; emailsSent: number }>(`/api/v1/admin/finance-reports/run?from=${from}&to=${to}`, {}, token()),
};
