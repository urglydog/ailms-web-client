import type { Config } from 'tailwindcss';

/**
 * Enterprise/Academic Design System
 * 
 * Loại bỏ hoàn toàn phong cách "AI Vibe" (tím gradient, nút pill, phát sáng chói lóa).
 * Thay vào đó sử dụng phong cách nghiêm túc, sắc nét, mật độ thông tin cao:
 * - Màu chủ đạo: Slate/Zinc (Xám thép) kết hợp Xanh Navy đậm (Học thuật).
 * - Góc bo (Border Radius): 6px-8px (Gọn gàng, vuông vức hơn).
 * - Bóng đổ (Shadow): Cực kỳ tinh tế, chỉ dùng màu đen mờ (black opacity), không glow màu.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /** Accent chính — Màu Xanh Tín nhiệm / Học thuật (Enterprise Blue/Navy) */
        accent: {
          DEFAULT: '#2563EB', // Blue 600
          dark: '#1D4ED8',    // Blue 700
          glow: 'transparent',// Không dùng glow
        },
        ink: {
          DEFAULT: '#0F172A', // Slate 900 (Đen ngả xám thép)
          muted: '#475569',   // Slate 600 (đậm hơn Slate 500 cũ — text phụ từng quá nhạt trên nền trắng)
          faint: '#64748B',   // Slate 500 (đậm hơn Slate 400 cũ)
        },
        line: {
          DEFAULT: '#CBD5E1', // Slate 300 (đậm hơn Slate 200 cũ — border từng gần như vô hình trên nền trắng)
          soft: '#E2E8F0',    // Slate 200 — đường phân cách mờ, đậm hơn Slate 100 cũ
          dot: '#94A3B8',
        },
        surface: {
          DEFAULT: '#F8FAFC', // Slate 50 (Nền trang rất nhẹ)
          raised: '#FFFFFF',
          hover: '#F1F5F9',
        },
        success: '#16A34A',
        danger: '#DC2626', // Nhiều file đã dùng `bg-danger`/`border-danger` nhưng token này
                            // chưa từng được khai báo — các class đó trước đây không sinh CSS gì
                            // (giống lỗi `accent-glow` cũ), phần tử liên quan mất màu/viền.
        // (26/09/2026) — cùng lỗi y hệt `danger` ở trên: `bg-warning`/`text-warning` đã được dùng
        // ở vài nơi (vd trang lịch sử giao dịch) nhưng token chưa từng khai báo, KHÔNG sinh CSS
        // gì cả — khai báo bù ở đây khắc phục luôn các chỗ đó, không chỉ riêng SystemBanner mới
        // thêm. Amber 600, khác `star` (Amber 500) để 2 mục đích sử dụng không lẫn màu nhau.
        warning: '#D97706',
        star: '#F59E0B',
      },
      fontFamily: {
        display: ['var(--font-outfit)', 'sans-serif'],
        sans: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      borderRadius: {
        card: '8px', // Bỏ 16px. Dùng 8px chuẩn Enterprise
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      maxWidth: {
        shell: '1280px',
      },
      keyframes: {
        'bg-scroll': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '28px 0' },
        },
      },
      animation: {
        'bg-scroll': 'bg-scroll 1s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
