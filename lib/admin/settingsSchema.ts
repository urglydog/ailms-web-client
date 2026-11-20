/**
 * Lược đồ hiển thị trang Cấu hình hệ thống (20/11/2026): chia nhóm theo chức năng, nhãn tiếng Việt rõ nghĩa và kiểu điều khiển phù hợp
 * (công tắc cho giá trị bật/tắt, ô số có đơn vị, danh sách email, danh sách ngày...). KHÔNG hiển thị tên biến kỹ thuật ra giao diện.
 * Khóa không có trong lược đồ này (vd cấu hình nội bộ, hoặc giá trị do bên thứ ba quy định như phí PayOS) không hiện và không sửa được ở đây.
 */
export type SettingKind = 'switch' | 'number' | 'percent' | 'price' | 'text' | 'emails' | 'days' | 'dates';

export interface SettingItem {
  key: string;
  label: string;
  help?: string;
  kind: SettingKind;
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  /** Độ dài tối đa của ô văn bản. */
  maxLength?: number;
}

export interface SettingGroup {
  id: string;
  title: string;
  description: string;
  items: SettingItem[];
}

export const SETTING_GROUPS: SettingGroup[] = [
  {
    id: 'ai',
    title: 'Hạn mức AI',
    description: 'Giới hạn sử dụng các tính năng AI của mỗi người dùng.',
    items: [
      { key: 'QUOTA_DUB_STUDENT', label: 'Lồng tiếng mỗi học viên', help: 'Số lượt lồng tiếng tối đa của một học viên trong ngày.', kind: 'number', unit: 'lượt/ngày', min: 0, max: 1000 },
      { key: 'QUOTA_DUB_INSTRUCTOR', label: 'Lồng tiếng mỗi giảng viên', help: 'Số lượt lồng tiếng tối đa của một giảng viên trong ngày.', kind: 'number', unit: 'lượt/ngày', min: 0, max: 1000 },
      { key: 'QUOTA_MATERIALS', label: 'Sinh học liệu mỗi người', help: 'Số lần tạo học liệu bằng AI (quiz, flashcard, sơ đồ tư duy) trong ngày.', kind: 'number', unit: 'lần/ngày', min: 0, max: 1000 },
      { key: 'QUOTA_TUTOR', label: 'Tin nhắn AI Tutor', help: 'Số tin nhắn tối đa một người có thể gửi cho AI Tutor trong ngày.', kind: 'number', unit: 'tin/ngày', min: 0, max: 10000 },
      { key: 'QUOTA_GUEST_SEARCH', label: 'Tìm kiếm AI của khách', help: 'Số lượt tìm kiếm AI mỗi giờ cho người chưa đăng nhập.', kind: 'number', unit: 'lượt/giờ', min: 0, max: 1000 },
    ],
  },
  {
    id: 'aicost',
    title: 'Chi phí AI',
    description: 'Đơn giá dùng để quy đổi mức dùng AI thành chi phí ước tính trên trang AI Analytics. Hãy đặt theo bảng giá hiện hành của nhà cung cấp để số liệu sát hóa đơn.',
    items: [
      { key: 'AI_PRICE_INPUT_USD_PER_M', label: 'Đơn giá token đầu vào (Gemini)', help: 'USD cho mỗi 1 triệu token đầu vào.', kind: 'price', unit: 'USD / 1 triệu token', min: 0, max: 1000 },
      { key: 'AI_PRICE_OUTPUT_USD_PER_M', label: 'Đơn giá token đầu ra và token suy nghĩ (Gemini)', help: 'USD cho mỗi 1 triệu token đầu ra; token suy nghĩ ẩn tính cùng đơn giá này.', kind: 'price', unit: 'USD / 1 triệu token', min: 0, max: 1000 },
      { key: 'AI_PRICE_EMBED_USD_PER_M', label: 'Đơn giá nhúng dữ liệu', kind: 'price', unit: 'USD / 1 triệu token', min: 0, max: 1000 },
      { key: 'AI_PRICE_AUDIO_USD_PER_HOUR', label: 'Đơn giá nhận dạng giọng nói (Groq)', help: 'USD cho mỗi giờ âm thanh.', kind: 'price', unit: 'USD / giờ âm thanh', min: 0, max: 1000 },
      { key: 'USD_VND_RATE', label: 'Tỷ giá USD sang VND', help: 'Dùng để hiển thị chi phí AI bằng đồng.', kind: 'number', unit: 'đ / USD', min: 1000, max: 100000 },
    ],
  },
  {
    id: 'revenue',
    title: 'Doanh thu & chia sẻ',
    description: 'Tỷ lệ giảng viên nhận được trên mỗi đơn. Chỉ áp dụng cho đơn thanh toán thành công sau khi lưu; đơn cũ giữ nguyên tỷ lệ đã áp dụng.',
    items: [
      { key: 'REVENUE_ORGANIC_INSTRUCTOR_PCT', label: 'Giảng viên nhận khi học viên tự tìm thấy khóa', help: 'Phần còn lại thuộc về nền tảng.', kind: 'percent', unit: '%', min: 0, max: 100 },
      { key: 'REVENUE_REFERRAL_INSTRUCTOR_PCT', label: 'Giảng viên nhận khi mua qua liên kết giới thiệu của họ', help: 'Áp dụng cho đơn mua từ liên kết giới thiệu riêng của giảng viên.', kind: 'percent', unit: '%', min: 0, max: 100 },
    ],
  },
  {
    id: 'refund',
    title: 'Hoàn tiền & khiếu nại',
    description: 'Chính sách hoàn tiền cho học viên và thời hạn xử lý khiếu nại.',
    items: [
      { key: 'REFUND_WINDOW_DAYS', label: 'Hạn yêu cầu hoàn tiền', help: 'Tính từ lúc thanh toán thành công.', kind: 'number', unit: 'ngày', min: 0, max: 90 },
      { key: 'REFUND_MAX_PROGRESS_PCT', label: 'Tiến độ học tối đa để được hoàn tiền', help: 'Học quá mức này thì yêu cầu hoàn tiền "đổi ý" nằm ngoài chính sách.', kind: 'number', unit: '%', min: 0, max: 100 },
      { key: 'REFUND_HOLIDAYS', label: 'Ngày lễ được gia hạn thời hạn hoàn tiền', help: 'Chọn từng ngày lễ để thêm vào danh sách.', kind: 'dates' },
      { key: 'DISPUTE_INSTRUCTOR_RESPONSE_HOURS', label: 'Thời gian giảng viên phản hồi khiếu nại', kind: 'number', unit: 'giờ', min: 1, max: 720 },
      { key: 'DISPUTE_APPEAL_DAYS', label: 'Thời hạn giảng viên kháng nghị quyết định hoàn tiền', kind: 'number', unit: 'ngày', min: 1, max: 90 },
      { key: 'REFUND_FLAG_RATE_PCT', label: 'Cảnh báo khóa học có tỷ lệ hoàn tiền cao', help: 'Báo quản trị viên khi tỷ lệ hoàn tiền của một khóa trong 30 ngày vượt mức này.', kind: 'number', unit: '%', min: 1, max: 100 },
      { key: 'REFUND_FLAG_MIN_COUNT', label: 'Số lượt hoàn tối thiểu để cảnh báo', help: 'Khóa có ít lượt hoàn hơn mức này không bị cảnh báo, tránh báo nhầm với khóa mới.', kind: 'number', unit: 'lượt', min: 1, max: 1000 },
    ],
  },
  {
    id: 'payout',
    title: 'Chi trả giảng viên',
    description: 'Quy định rút tiền của giảng viên và việc chi tự động qua PayOS.',
    items: [
      { key: 'PAYOUT_MIN_AMOUNT', label: 'Số tiền rút tối thiểu', kind: 'number', unit: 'đ', min: 0, max: 100000000 },
      { key: 'PAYOUT_DAYS_OF_MONTH', label: 'Ngày chi trả trong tháng', help: 'Chọn tối đa 4 ngày trong tháng (từ 1 đến 28) để chi trả theo đợt.', kind: 'days' },
      { key: 'PAYOUT_HOLD_EXTRA_DAYS', label: 'Giữ tiền thêm sau hạn hoàn tiền', help: 'Thu nhập chỉ rút được sau hạn hoàn tiền cộng thêm số ngày này.', kind: 'number', unit: 'ngày', min: 0, max: 60 },
      { key: 'PAYOS_PAYOUT_ENABLED', label: 'Chi tự động qua PayOS', help: 'Tắt thì quản trị viên chỉ chuyển khoản thủ công.', kind: 'switch' },
      { key: 'PAYOS_PAYOUT_MAX_AMOUNT', label: 'Số tiền tối đa cho một lệnh chi tự động', help: 'Khoản lớn hơn mức này phải chuyển thủ công.', kind: 'number', unit: 'đ', min: 0, max: 100000000 },
      { key: 'PAYOS_RETRY_COOLDOWN_MINUTES', label: 'Thời gian chờ giữa hai lần chi lại', help: 'Áp dụng sau khi một lệnh chi thất bại.', kind: 'number', unit: 'phút', min: 0, max: 1440 },
      { key: 'PAYOS_MAX_ATTEMPTS', label: 'Số lần chi thất bại tối đa cho một khoản', help: 'Quá số lần này thì chỉ còn cách chuyển thủ công.', kind: 'number', unit: 'lần', min: 1, max: 20 },
    ],
  },
  {
    id: 'debt',
    title: 'Công nợ giảng viên',
    description: 'Mốc xử lý khi giảng viên có khoản nợ với nền tảng.',
    items: [
      { key: 'DEBT_RESTRICT_DAYS', label: 'Hạn chế sau khi nợ quá', help: 'Giảng viên không xuất bản khóa mới và không đăng ký quảng bá.', kind: 'number', unit: 'ngày', min: 1, max: 3650 },
      { key: 'DEBT_SUSPEND_DAYS', label: 'Tạm ngừng bán các khóa sau khi nợ quá', help: 'Học viên cũ vẫn học bình thường; chỉ ngừng nhận đơn mới.', kind: 'number', unit: 'ngày', min: 1, max: 3650 },
      { key: 'DEBT_MIN_REPAY', label: 'Số tiền trả nợ tối thiểu mỗi lần', help: 'Trừ khi trả hết phần còn lại.', kind: 'number', unit: 'đ', min: 1000, max: 100000000 },
    ],
  },
  {
    id: 'reports',
    title: 'Báo cáo & chứng từ',
    description: 'Báo cáo tài chính tự động cho quản trị viên và thông tin hiển thị trên chứng từ.',
    items: [
      { key: 'REPORT_DAILY_ENABLED', label: 'Gửi báo cáo tài chính hằng ngày', kind: 'switch' },
      { key: 'REPORT_WEEKLY_ENABLED', label: 'Gửi báo cáo tài chính hằng tuần', help: 'Gửi vào sáng thứ Hai, cho tuần vừa kết thúc.', kind: 'switch' },
      { key: 'REPORT_MONTHLY_ENABLED', label: 'Gửi báo cáo tài chính hằng tháng', help: 'Gửi vào sáng ngày 1, cho tháng vừa kết thúc.', kind: 'switch' },
      { key: 'REPORT_RECIPIENTS', label: 'Email nhận báo cáo', help: 'Cách nhau bằng dấu phẩy. Để trống thì gửi cho tất cả quản trị viên có email nhận thư được.', kind: 'emails', placeholder: 'ketoan@congty.vn, admin@congty.vn' },
      { key: 'STATEMENT_EMAIL_INSTRUCTORS', label: 'Gửi bảng kê thu nhập tháng qua email cho giảng viên', help: 'Tắt thì giảng viên vẫn xem và tải bảng kê trong trang Thu nhập.', kind: 'switch' },
      { key: 'PUBLIC_INVOICE_LINK_ENABLED', label: 'Cho phép mở chứng từ bằng mã QR trên file PDF', help: 'Tắt khẩn cấp để ngừng mọi liên kết QR của chứng từ; các file PDF đã phát hành vẫn xem được khi đăng nhập.', kind: 'switch' },
      { key: 'INVOICE_ISSUER_NAME', label: 'Tên bên phát hành trên chứng từ', kind: 'text', placeholder: 'LinguaLearn', maxLength: 100 },
      { key: 'INVOICE_ISSUER_NOTE', label: 'Ghi chú của bên phát hành trên chứng từ', kind: 'text', placeholder: 'Ví dụ: mã số thuế, địa chỉ', maxLength: 200 },
    ],
  },
];

const EMAIL = /^[^@\s,]+@[^@\s,]+\.[^@\s,]+$/;
const INTEGER = /^\d{1,9}$/;
const PERCENT = /^\d{1,3}(\.\d{1,2})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Tách chuỗi danh sách (phân cách dấu phẩy) thành các phần tử đã cắt khoảng trắng; chuỗi rỗng cho danh sách rỗng. */
export function parseList(value: string): string[] {
  return value.trim() === '' ? [] : value.split(',').map((s) => s.trim());
}

export function formatList(items: string[]): string {
  return items.join(',');
}

function isRealDate(v: string): boolean {
  if (!ISO_DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Kiểm tra một giá trị theo kiểu điều khiển; trả thông báo lỗi tiếng Việt hoặc null nếu hợp lệ. Cùng quy tắc với BE (FinanceConfigKeys). */
export function validateSetting(item: SettingItem, value: string): string | null {
  const v = value.trim();
  if (item.kind === 'number') {
    if (v === '') return 'Vui lòng nhập một số.';
    if (!INTEGER.test(v)) return 'Chỉ nhập số nguyên không âm, không dùng dấu chấm, dấu phẩy hay chữ.';
    const n = Number(v);
    if (item.min !== undefined && n < item.min) return `Giá trị tối thiểu là ${item.min.toLocaleString('vi-VN')}.`;
    if (item.max !== undefined && n > item.max) return `Giá trị tối đa là ${item.max.toLocaleString('vi-VN')}.`;
  }
  if (item.kind === 'percent') {
    if (v === '') return 'Vui lòng nhập một số.';
    if (!PERCENT.test(v)) return 'Chỉ nhập số không âm, tối đa 2 chữ số sau dấu chấm (ví dụ 37 hoặc 97.5).';
    const n = Number(v);
    if (n < (item.min ?? 0) || n > (item.max ?? 100)) return `Giá trị phải từ ${item.min ?? 0} đến ${item.max ?? 100}.`;
  }
  if (item.kind === 'price') {
    if (v === '') return 'Vui lòng nhập một số.';
    if (!/^\d{1,4}(\.\d{1,4})?$/.test(v)) return 'Chỉ nhập số không âm, tối đa 4 chữ số sau dấu chấm (ví dụ 0.30).';
    if (Number(v) > (item.max ?? 1000)) return `Giá trị tối đa là ${item.max ?? 1000}.`;
  }
  if (item.kind === 'emails' && v !== '') {
    const items = parseList(v);
    const bad = items.find((s) => !EMAIL.test(s));
    if (bad !== undefined) return `"${bad}" chưa phải địa chỉ email hợp lệ.`;
    if (new Set(items.map((s) => s.toLowerCase())).size !== items.length) return 'Có email bị nhập trùng.';
  }
  if (item.kind === 'days') {
    const items = parseList(v);
    if (items.length === 0) return 'Cần chọn ít nhất 1 ngày.';
    if (items.length > 4) return 'Chỉ chọn tối đa 4 ngày chi trả mỗi tháng.';
    if (items.some((s) => !INTEGER.test(s) || Number(s) < 1 || Number(s) > 28)) return 'Ngày chi trả phải từ 1 đến 28.';
    if (new Set(items).size !== items.length) return 'Có ngày bị chọn trùng.';
  }
  if (item.kind === 'dates') {
    const items = parseList(v);
    if (items.length > 60) return 'Tối đa 60 ngày.';
    const bad = items.find((s) => !isRealDate(s));
    if (bad !== undefined) return `"${bad}" không phải ngày hợp lệ.`;
    if (new Set(items).size !== items.length) return 'Có ngày bị chọn trùng.';
  }
  if (item.kind === 'text') {
    if (item.key === 'INVOICE_ISSUER_NAME' && v === '') return 'Tên bên phát hành không được để trống.';
    if (item.maxLength !== undefined && value.length > item.maxLength) return `Tối đa ${item.maxLength} ký tự.`;
  }
  if (item.kind === 'switch' && v !== '0' && v !== '1') return 'Giá trị bật/tắt không hợp lệ.';
  return null;
}
