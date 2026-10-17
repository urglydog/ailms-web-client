/** True khi người dùng bật "giảm chuyển động" của hệ điều hành. An toàn khi chạy phía server. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
