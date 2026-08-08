/**
 * Dữ liệu giả còn lại cho màn Dual Player (UC18, UC20) — chưa tới giai đoạn xử lý lồng tiếng
 * thật (Giai đoạn 5). Duyệt khóa công khai (UC09, UC10), đánh giá (UC23) và học thử Preview
 * (UC11) đã chuyển sang API thật — xem `lib/api/publicCourses.ts`, `lib/api/reviews.ts`.
 */

/** Các bước pipeline hiển thị ở panel tiến độ (UC20). Khớp thứ tự thật của BR-DUB-01..03. */
export const MOCK_PIPELINE_STEPS = [
  { key: 'stt', label: 'Bóc tách lời thoại (Whisper)', done: true, active: false },
  { key: 'translate', label: 'Dịch ngữ cảnh 3 bước (Gemini)', done: false, active: true },
  { key: 'tts', label: 'Tổng hợp giọng đọc (Edge-TTS)', done: false, active: false },
];
