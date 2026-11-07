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
