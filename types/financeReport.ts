export type Granularity = 'DAY' | 'WEEK' | 'MONTH';

export interface ReportSummary {
  orders: number;
  grossRevenue: number;
  refundCount: number;
  refunds: number;
  refundRatePct: number;
  netRevenue: number;
  platformFee: number;
  instructorEarning: number;
  payoutsPaidCount: number;
  payoutsPaid: number;
  payosOrders: number;
  payosFee: number;
  pendingPayouts: number;
  obligations: number;
  receivables: number;
}

export interface ReportBucket {
  period: string;
  orders: number;
  grossRevenue: number;
  refunds: number;
  platformFee: number;
  instructorEarning: number;
  payoutsPaid: number;
}

export interface ReportCourse {
  courseId: number;
  title: string;
  instructorName: string;
  orders: number;
  grossRevenue: number;
  platformFee: number;
  instructorEarning: number;
  refundedOrders: number;
}

export interface ReportInstructor {
  instructorId: number;
  name: string;
  email: string;
  orders: number;
  grossRevenue: number;
  instructorEarning: number;
  payoutsPaid: number;
}

export interface ReportReconciliation {
  payosOutflow: number;
  recordedRefunds: number;
  recordedPayouts: number;
  difference: number;
  payosOrders: number;
  recordedCount: number;
}

export interface ReportRefundReason {
  reason: string;
  count: number;
  amount: number;
}

export interface ReportSource {
  source: string;
  orders: number;
  grossRevenue: number;
}

export interface ReportPayoutStage {
  status: string;
  count: number;
  amount: number;
  oldestDays: number;
}

export interface ReportMismatch {
  kind: string;
  reference: string;
  amount: number;
  at: string | null;
  detail: string;
}

export interface FinanceReport {
  from: string;
  to: string;
  granularity: Granularity;
  summary: ReportSummary;
  /** Kỳ liền trước có cùng độ dài, để so sánh tăng/giảm. */
  previous: ReportSummary;
  buckets: ReportBucket[];
  courses: ReportCourse[];
  instructors: ReportInstructor[];
  reconciliation: ReportReconciliation;
  refundReasons: ReportRefundReason[];
  sources: ReportSource[];
  payoutPipeline: ReportPayoutStage[];
  mismatches: ReportMismatch[];
}

export interface ReportSnapshot {
  id: number;
  reportType: string;
  periodFrom: string;
  periodTo: string;
  triggerType: string;
  emailedTo: string | null;
  createdAt: string;
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
