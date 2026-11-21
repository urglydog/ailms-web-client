/**
 * Origin công khai của web (11/11/2026, Giai đoạn D) cho OpenGraph/canonical/sitemap. Ưu tiên biến do chủ dự án đặt
 * (`NEXT_PUBLIC_SITE_URL`), sau đó biến hệ thống Vercel tự cấp (domain production rồi domain của bản deploy), cuối cùng là
 * localhost. Không cần thêm biến môi trường nào để chạy.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;
  return 'http://localhost:3000';
}
