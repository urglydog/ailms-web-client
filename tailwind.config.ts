import type { Config } from 'tailwindcss';

/**
 * Design token trích từ Claude Design project "LinguaLearn Interactive Prototype".
 *
 * Bảng màu và font là quyết định có chủ đích, không phải mặc định:
 *  - Accent cyan/teal đơn sắc, CỐ TÌNH tránh "AI purple" và tông beige/đồng
 *    thường thấy ở sản phẩm cao cấp (theo taste-skill).
 *  - Font Outfit + Plus Jakarta Sans, CỐ TÌNH tránh Inter/Fraunces mặc định.
 *
 * Đổi các giá trị này là đổi nhận diện của cả sản phẩm — cần lý do rõ ràng.
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
        /** Accent chính — dùng cho link, nút chính, số liệu nhấn mạnh */
        accent: {
          DEFAULT: '#0891B2',
          dark: '#0E7490',
          /** Dùng cho hiệu ứng glow của trạng thái "AI đang xử lý" */
          glow: '#22D3EE',
        },
        ink: {
          /** Màu chữ chính */
          DEFAULT: '#131620',
          /** Chữ phụ, nhãn */
          muted: '#5B6472',
          /** Chữ mờ nhất, breadcrumb */
          faint: '#94A0AF',
        },
        line: {
          /** Viền card, viền header */
          DEFAULT: '#E4E7EC',
          /** Đường phân cách bên trong card */
          soft: '#EEF0F3',
          /** Dấu chấm phân tách */
          dot: '#C9D0D8',
        },
        surface: {
          /** Nền trang */
          DEFAULT: '#F7F8FA',
          /** Nền card */
          raised: '#FFFFFF',
        },
        /** Khoá học miễn phí */
        success: '#16A34A',
        /** Sao đánh giá */
        star: '#F59E0B',
      },
      fontFamily: {
        /** Tiêu đề, số liệu, giá */
        display: ['var(--font-outfit)', 'sans-serif'],
        /** Nội dung */
        sans: ['var(--font-jakarta)', 'sans-serif'],
        /** Nhãn kỹ thuật, mốc thời gian */
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(19, 22, 32, 0.04)',
        'card-hover': '0 14px 30px rgba(19, 22, 32, 0.10)',
      },
      maxWidth: {
        shell: '1280px',
      },
      keyframes: {
        /** Dấu chấm nhấp nháy: AI đang xử lý */
        aiPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.85)' },
        },
        /** Vầng sáng lan ra từ nút kích hoạt lồng tiếng */
        aiGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.35), 0 8px 24px rgba(8, 145, 178, 0.25)',
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(34, 211, 238, 0), 0 8px 30px rgba(8, 145, 178, 0.35)',
          },
        },
        aiSpin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        skeletonShine: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: '200px 0' },
        },
      },
      animation: {
        'ai-pulse': 'aiPulse 1.4s ease-in-out infinite',
        'ai-glow': 'aiGlow 2s ease-in-out infinite',
        'ai-spin': 'aiSpin 0.8s linear infinite',
        'skeleton-shine': 'skeletonShine 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
