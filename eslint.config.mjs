import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Quy chuẩn dự án: ZERO `any` (lms-frontend-rules mục 1)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // UI v2: nền trắng cứng không đổi theo dark mode — dùng `bg-surface-raised`. `bg-white/xx` (lớp phủ
      // trên nền tối) vẫn được phép. Cố ý giữ trắng (núm công tắc, chứng chỉ in) thì eslint-disable kèm lý do.
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value=/(^| )bg-white( |$)/], TemplateElement[value.raw=/(^| )bg-white( |$)/]",
          message: 'Dùng token bg-surface-raised thay cho bg-white (xem doc/feat/uiux/DESIGN_RULES_Web_Mobile.md).',
        },
      ],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
