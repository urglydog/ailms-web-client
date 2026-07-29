import type { ReactNode } from 'react';

interface PillProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Hiện dấu chấm nhấp nháy — dùng khi ngôn ngữ chưa có bản lồng tiếng (UC18) */
  warnDot?: boolean;
  className?: string;
}

/**
 * Nhãn dạng viên thuốc, dùng cho danh mục, bộ lọc và chọn ngôn ngữ.
 *
 * Render thành <button> khi có onClick để bàn phím và screen reader dùng được;
 * không dùng <div onClick> vì không thể focus bằng Tab.
 */
export function Pill({ children, active = false, onClick, warnDot = false, className = '' }: PillProps) {
  const classes = `pill ${active ? 'pill-active' : ''} ${className}`;
  const content = (
    <>
      {children}
      {warnDot && (
        <span
          className="ml-0.5 h-1.5 w-1.5 shrink-0 animate-ai-pulse rounded-full bg-star"
          aria-label="Chưa có bản lồng tiếng"
        />
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={classes}>
        {content}
      </button>
    );
  }
  return <span className={classes}>{content}</span>;
}
