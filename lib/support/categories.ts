import type { SupportCategory } from '@/types/domain';

/** Thứ tự các nhóm vấn đề ở Trung tâm trợ giúp và ô chọn nhóm — khớp enum `SupportTicketCategory` phía BE. */
export const SUPPORT_CATEGORIES: SupportCategory[] = [
  'ACCOUNT', 'PAYMENT', 'COURSE', 'LEARNING', 'AI_FEATURES', 'EXAM', 'CERTIFICATE',
  'COMMUNITY', 'LIVE', 'INSTRUCTOR', 'PRIVACY', 'TECHNICAL', 'OTHER',
];
