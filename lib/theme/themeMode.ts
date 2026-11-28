/** Chế độ giao diện sáng/tối. Lựa chọn lưu ở localStorage; chưa chọn thì theo cài đặt hệ điều hành. */
export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'lms-theme';

export function parseTheme(value: unknown): ThemeMode | null {
  return value === 'light' || value === 'dark' ? value : null;
}

/** Theme thực tế: lựa chọn đã lưu, nếu không có thì theo hệ điều hành. */
export function resolveTheme(stored: unknown, prefersDark: boolean): ThemeMode {
  return parseTheme(stored) ?? (prefersDark ? 'dark' : 'light');
}

/**
 * Script chạy trong <head> TRƯỚC khi trang vẽ, gắn lớp `dark` sớm để không bị "chớp trắng" khi
 * người dùng đã chọn chế độ tối. Bọc try/catch vì localStorage có thể bị chặn (chế độ ẩn danh).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

/**
 * Gắn lại lớp `dark` theo lựa chọn đã lưu (27/11/2026, sửa lỗi): khi React phải dựng lại cây gốc
 * lúc hydrate (một lỗi lệch hydrate bất kỳ), thuộc tính `class` của <html> trở về giá trị máy chủ
 * và mất lớp `dark` do {@link THEME_INIT_SCRIPT} gắn — các trang "Giao tiếp" của giảng viên hiện
 * sáng dù đã chọn tối. Gọi sau khi mount để đồng bộ lại.
 */
export function applyStoredTheme(root: HTMLElement = document.documentElement): ThemeMode {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }
  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = resolveTheme(stored, prefersDark);
  root.classList.toggle('dark', mode === 'dark');
  return mode;
}
