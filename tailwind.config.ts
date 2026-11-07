import type { Config } from 'tailwindcss';
import { tw } from './lib/theme/cssVars';

/**
 * Design system giao diện học viên (spec: doc/feat/uiux/DacTa_CaiTienUIUX_HocVien.md, mục 3).
 * Màu lấy từ `lib/theme/colors.ts` qua biến CSS (`lib/theme/cssVars.ts`) — KHÔNG ghi cứng mã hex ở đây.
 * Chế độ tối: lớp `dark` trên <html> đổi giá trị biến, mọi lớp `bg-surface`, `text-ink`… tự đổi theo.
 * Phong cách: sáng, đơn giản, chuyên nghiệp; bóng chỉ xuất hiện khi hover; điểm nhấn cyan
 * dành riêng cho tính năng lồng tiếng AI, vàng chỉ dùng tô nền cụm chữ nhấn.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: tw('accent'),
          dark: tw('accentDark'), // cũng là màu chữ accent trên nền tint/surface (đạt AA)
          glow: 'transparent',
        },
        ink: {
          DEFAULT: tw('ink'),
          muted: tw('inkMuted'),
          faint: tw('inkFaint'),
        },
        line: {
          DEFAULT: tw('line'),
          soft: tw('lineSoft'),
          dot: tw('lineDot'),
        },
        surface: {
          DEFAULT: tw('surface'),
          raised: tw('surfaceRaised'),
          hover: tw('tint'),
        },
        tint: tw('tint'),
        cyan: {
          DEFAULT: tw('cyan'),
          ink: tw('cyanInk'), // chữ trên nền cyan
        },
        highlight: tw('highlight'), // tô nền cụm chữ nhấn, chữ trên đó là `ink`
        success: {
          DEFAULT: tw('success'),
          ink: tw('successInk'), // chữ xanh lá trên nền success-tint
          tint: tw('successTint'),
        },
        streak: {
          bg: tw('streakBg'),
          ink: tw('streakInk'),
        },
        danger: tw('danger'),
        warning: tw('warning'),
        star: tw('star'),
        night: tw('night'), // nền tối cố định ở cả 2 chế độ (lớp phủ, thanh điều khiển video)
      },
      fontFamily: {
        display: ['var(--font-outfit)', 'sans-serif'],
        sans: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      borderRadius: {
        card: '10px',
        panel: '12px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(10, 37, 64, 0.05)',
        'card-hover': '0 10px 20px rgba(10, 37, 64, 0.12)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(.2, .7, .2, 1)',
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
