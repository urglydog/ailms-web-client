export interface AiUsageTotals {
  costUsd: number;
  tokens: number;
  requests: number;
  audioSeconds: number;
}

export interface AiUsageOverview {
  from: string;
  to: string;
  totals: AiUsageTotals;
  previous: AiUsageTotals;
  byFeature: { feature: string; costUsd: number; tokens: number; requests: number }[];
  daily: { day: string; feature: string; costUsd: number }[];
  usdToVnd: number;
  trackingSince: string;
  /** Kỳ đang xem bắt đầu trước ngày ghi nhận đầy đủ nên số liệu cũ chỉ gồm Flashcard/Mindmap/Quiz. */
  partialCoverage: boolean;
  /** So với hóa đơn Google đã nhập (chỉ có khi có hóa đơn nằm trọn trong khoảng đang xem). */
  reconciliation: { billedVnd: number; trackedVnd: number; unexplainedVnd: number; entries: number } | null;
}

export interface AiBillingEntry {
  id: number;
  periodStart: string;
  periodEnd: string;
  amountVnd: number;
  source: string;
  note: string | null;
}

export const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 })}`;
export const vnd = (usdAmount: number, rate: number) => `${Math.round(usdAmount * rate).toLocaleString('vi-VN')}đ`;
