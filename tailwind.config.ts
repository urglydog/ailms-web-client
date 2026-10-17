import type { Config } from 'tailwindcss';
import { COLORS } from './lib/theme/colors';

/**
 * Design system giao diện học viên (spec: doc/feat/uiux/DacTa_CaiTienUIUX_HocVien.md, mục 3).
 * Màu lấy từ `lib/theme/colors.ts` — KHÔNG ghi cứng mã hex ở đây.
 * Phong cách: sáng, đơn giản, chuyên nghiệp; bóng chỉ xuất hiện khi hover; điểm nhấn cyan
 * dành riêng cho tính năng lồng tiếng AI, vàng chỉ dùng tô nền cụm chữ nhấn.
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
        accent: {
          DEFAULT: COLORS.accent,
          dark: COLORS.accentDark, // cũng là màu chữ accent trên nền tint/surface (đạt AA)
          glow: 'transparent',
        },
        ink: {
          DEFAULT: COLORS.ink,
          muted: COLORS.inkMuted,
          faint: COLORS.inkFaint,
        },
        line: {
          DEFAULT: COLORS.line,
          soft: COLORS.lineSoft,
          dot: COLORS.lineDot,
        },
        surface: {
          DEFAULT: COLORS.surface,
          raised: COLORS.surfaceRaised,
          hover: COLORS.tint,
        },
        tint: COLORS.tint,
        cyan: {
          DEFAULT: COLORS.cyan,
          ink: COLORS.cyanInk, // chữ trên nền cyan
        },
        highlight: COLORS.highlight, // tô nền cụm chữ nhấn, chữ trên đó là `ink`
        success: {
          DEFAULT: COLORS.success,
          ink: COLORS.successInk, // chữ xanh lá trên nền success-tint
          tint: COLORS.successTint,
        },
        streak: {
          bg: COLORS.streakBg,
          ink: COLORS.streakInk,
        },
        danger: COLORS.danger,
        warning: COLORS.warning,
        star: COLORS.star,
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
