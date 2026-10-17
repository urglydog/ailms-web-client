/** Đọc `?category=<slug>` từ URL một cách an toàn: chỉ nhận slug có trong danh mục thật. */
export function resolveCategoryParam(
  raw: string | null,
  categories: ReadonlyArray<{ slug: string }>,
): string | null {
  if (!raw) return null;
  return categories.some((c) => c.slug === raw) ? raw : null;
}
