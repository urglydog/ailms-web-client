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
          muted: '#64748B',   // Slate 500
          faint: '#94A3B8',   // Slate 400
        },
        line: {
          DEFAULT: '#E2E8F0', // Viền mỏng, nhạt
          soft: '#F1F5F9',    // Đường phân cách mờ
          dot: '#CBD5E1',
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
    },
  },
  plugins: [],
};

export default config;
