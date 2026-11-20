/**
 * Lược đồ hiển thị trang Cấu hình hệ thống (20/11/2026): chia nhóm theo chức năng, nhãn tiếng Việt rõ nghĩa và kiểu điều khiển phù hợp
 * (công tắc cho giá trị bật/tắt, ô số có đơn vị, danh sách email, danh sách ngày...). KHÔNG hiển thị tên biến kỹ thuật ra giao diện.
 * Khóa không có trong lược đồ này (vd cấu hình nội bộ, hoặc giá trị do bên thứ ba quy định như phí PayOS) không hiện và không sửa được ở đây.
 */
export type SettingKind = 'switch' | 'number' | 'text' | 'emails' | 'list';

export interface SettingItem {
  key: string;
  label: string;
  help?: string;
  kind: SettingKind;
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
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
    title: 'AI Worker & hạn mức',
    description: 'Tình trạng dịch vụ AI và giới hạn sử dụng mỗi ngày của người dùng.',
    items: [
      { key: 'QUOTA_DUB_STUDENT', label: 'Lồng tiếng mỗi học viên', help: 'Số lượt lồng tiếng tối đa của một học viên trong ngày.', kind: 'number', unit: 'lượt/ngày', min: 0, max: 1000 },
      { key: 'QUOTA_DUB_INSTRUCTOR', label: 'Lồng tiếng mỗi giảng viên', help: 'Số lượt lồng tiếng tối đa của một giảng viên trong ngày.', kind: 'number', unit: 'lượt/ngày', min: 0, max: 1000 },
      { key: 'QUOTA_MATERIALS', label: 'Sinh học liệu mỗi người', help: 'Số lần tạo học liệu bằng AI (quiz, flashcard, sơ đồ tư duy) trong ngày.', kind: 'number', unit: 'lần/ngày', min: 0, max: 1000 },
      { key: 'QUOTA_TUTOR', label: 'Tin nhắn AI Tutor', help: 'Số tin nhắn tối đa một người có thể gửi cho AI Tutor trong ngày.', kind: 'number', unit: 'tin/ngày', min: 0, max: 10000 },
      { key: 'QUOTA_GUEST_SEARCH', label: 'Tìm kiếm AI của khách', help: 'Số lượt tìm kiếm AI mỗi giờ cho người chưa đăng nhập.', kind: 'number', unit: 'lượt/giờ', min: 0, max: 1000 },
    ],
  },
  {
    id: 'revenue',
    title: 'Doanh thu & chia sẻ',
    description: 'Tỷ lệ giảng viên nhận được trên mỗi đơn. Chỉ áp dụng cho đơn thanh toán thành công sau khi lưu; đơn cũ giữ nguyên tỷ lệ đã áp dụng.',
    items: [
      { key: 'REVENUE_ORGANIC_INSTRUCTOR_PCT', label: 'Giảng viên nhận khi học viên tự tìm thấy khóa', help: 'Phần còn lại thuộc về nền tảng.', kind: 'number', unit: '%', min: 0, max: 100 },
      { key: 'REVENUE_REFERRAL_INSTRUCTOR_PCT', label: 'Giảng viên nhận khi mua qua liên kết giới thiệu của họ', help: 'Áp dụng cho đơn mua từ liên kết giới thiệu riêng của giảng viên.', kind: 'number', unit: '%', min: 0, max: 100 },
    ],
  },
  {
    id: 'refund',
    title: 'Hoàn tiền & khiếu nại',
    description: 'Chính sách hoàn tiền cho học viên và thời hạn xử lý khiếu nại.',
    items: [
      { key: 'REFUND_WINDOW_DAYS', label: 'Hạn yêu cầu hoàn tiền', help: 'Tính từ lúc thanh toán thành công.', kind: 'number', unit: 'ngày', min: 0, max: 90 },
      { key: 'REFUND_MAX_PROGRESS_PCT', label: 'Tiến độ học tối đa để được hoàn tiền', help: 'Học quá mức này thì yêu cầu hoàn tiền "đổi ý" nằm ngoài chính sách.', kind: 'number', unit: '%', min: 0, max: 100 },
      { key: 'REFUND_HOLIDAYS', label: 'Ngày lễ được gia hạn thời hạn hoàn tiền', help: 'Nhập các ngày theo dạng năm-tháng-ngày, cách nhau bằng dấu phẩy.', kind: 'list', placeholder: '2026-12-25, 2027-01-01' },
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
      { key: 'PAYOUT_DAYS_OF_MONTH', label: 'Ngày chi trả trong tháng', help: 'Các ngày từ 1 đến 28, cách nhau bằng dấu phẩy.', kind: 'list', placeholder: '5, 20' },
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
      { key: 'INVOICE_ISSUER_NAME', label: 'Tên bên phát hành trên chứng từ', kind: 'text', placeholder: 'LinguaLearn' },
      { key: 'INVOICE_ISSUER_NOTE', label: 'Ghi chú của bên phát hành trên chứng từ', kind: 'text', placeholder: 'Ví dụ: mã số thuế, địa chỉ' },
    ],
  },
];

const EMAIL = /^[^@\s,]+@[^@\s,]+\.[^@\s,]+$/;

/** Kiểm tra một giá trị theo kiểu điều khiển; trả thông báo lỗi tiếng Việt hoặc null nếu hợp lệ. */
export function validateSetting(item: SettingItem, value: string): string | null {
  if (item.kind === 'number') {
    if (value.trim() === '' || Number.isNaN(Number(value))) return 'Vui lòng nhập một số.';
    const n = Number(value);
    if (item.min !== undefined && n < item.min) return `Giá trị tối thiểu là ${item.min.toLocaleString('vi-VN')}.`;
    if (item.max !== undefined && n > item.max) return `Giá trị tối đa là ${item.max.toLocaleString('vi-VN')}.`;
  }
  if (item.kind === 'emails' && value.trim() !== '') {
    const bad = value.split(',').map((s) => s.trim()).find((s) => !EMAIL.test(s));
    if (bad !== undefined) return `"${bad}" chưa phải địa chỉ email hợp lệ.`;
  }
  if (item.key === 'INVOICE_ISSUER_NAME' && value.trim() === '') return 'Tên bên phát hành không được để trống.';
  return null;
}
