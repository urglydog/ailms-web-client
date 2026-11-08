/**
 * Token chuyển động dùng chung (skill motion-foundations + review-animations/STANDARDS.md).
 * Component KHÔNG ghi cứng thời lượng/đường cong/spring — luôn lấy từ đây.
 *
 * Nguyên tắc của dự án (phong cách "học thuật", gọn, không phô):
 *  - Chuyển động UI dưới 300ms; chỉ chuyển trang/hero mới được dài hơn.
 *  - Vào/ra dùng ease-out mạnh; không bao giờ ease-in cho UI.
 *  - Chỉ animate transform + opacity; không bắt đầu từ scale(0) mà từ 0.96–0.98.
 */
export type Bezier = [number, number, number, number];

export const duration = {
  /** Tooltip, đổi icon, badge */
  instant: 0.1,
  /** Phản hồi khi nhấn nút, chip, popover nhỏ */
  fast: 0.16,
  /** Dropdown, menu, modal mở */
  normal: 0.22,
  /** Panel lớn, ngăn kéo */
  slow: 0.3,
  /** Chuyển trang, phần hero — chỉ dùng cho bề mặt "persuade" */
  page: 0.45,
} as const;

export const ease = {
  /** Vào/ra — mặc định cho UI */
  out: [0.23, 1, 0.32, 1] as Bezier,
  /** Di chuyển/biến hình trên màn hình */
  inOut: [0.77, 0, 0.175, 1] as Bezier,
  /** Khớp `ease-soft` của Tailwind (tailwind.config.ts) */
  soft: [0.2, 0.7, 0.2, 1] as Bezier,
} as const;

export const distance = { xs: 4, sm: 8, md: 12, lg: 24 } as const;

export const scale = {
  /** Điểm bắt đầu khi hiện (thay cho scale(0)) */
  enter: 0.97,
  /** Nhấn nút */
  press: 0.97,
} as const;

/** Spring cho tương tác cần ngắt giữa chừng (kéo, bật/tắt). Không dùng bounce mạnh trong UI. */
export const springs = {
  snappy: { type: 'spring', stiffness: 420, damping: 34 },
  gentle: { type: 'spring', stiffness: 220, damping: 26 },
  release: { type: 'spring', stiffness: 240, damping: 24, restDelta: 0.001 },
} as const;

/** Khoảng so le giữa các phần tử trong danh sách (30–80ms theo STANDARDS). */
export const stagger = 0.05;
