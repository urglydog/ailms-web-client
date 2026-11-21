// Xuất token thiết kế (DTCG) cho app mobile: node scripts/export-design-tokens.mjs
// Ghi ra doc/feat/uiux/design-tokens.json — chạy lại mỗi khi sửa lib/theme/colors.ts.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import jitiFactory from 'jiti';

// jiti (có sẵn qua tailwind) nạp được file .ts mà không cần build.
const jiti = jitiFactory(fileURLToPath(import.meta.url));
const { designTokens } = jiti('../lib/theme/designTokens.ts');
const out = fileURLToPath(new URL('../../../doc/feat/uiux/design-tokens.json', import.meta.url));
writeFileSync(out, JSON.stringify(designTokens(), null, 2) + '\n');
console.log('Đã ghi', out);
