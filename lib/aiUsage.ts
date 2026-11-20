/** Nhãn tiếng Việt của các tính năng AI được ghi nhận chi phí (khớp tên tính năng AI Worker gửi về). */
export const AI_FEATURE_LABEL: Record<string, string> = {
  FLASHCARD: 'Flashcard',
  MINDMAP: 'Sơ đồ tư duy',
  QUIZ: 'Quiz',
  DUBBING_TRANSLATE: 'Lồng tiếng: dịch lời thoại',
  DUBBING_TRANSCRIBE: 'Lồng tiếng: nhận dạng giọng nói',
  TRANSCRIPT_EXTRACTION: 'Bóc băng bài giảng',
  TUTOR_CHAT: 'Gia sư AI (hỏi đáp)',
  TUTOR_QUIZ_EXPLAIN: 'Gia sư AI: giải thích đáp án',
  TUTOR_TITLE: 'Gia sư AI: đặt tiêu đề hội thoại',
  DISCOVERY_CHAT: 'Tìm khóa học bằng AI',
  INSTRUCTOR_AI: 'Trợ lý AI của giảng viên',
  PROCTORING_RISK: 'Giám sát thi: đánh giá rủi ro',
  PROCTORING_FRAME: 'Giám sát thi: phân tích hình ảnh',
  EMBEDDING_TUTOR: 'Nhúng dữ liệu bài giảng',
  EMBEDDING_COURSE: 'Nhúng dữ liệu khóa học',
  UNTAGGED: 'Chưa phân loại',
};

export const aiFeatureLabel = (feature: string): string => AI_FEATURE_LABEL[feature] ?? feature;

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
