'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AudioLines, Bot, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';

const ICONS = [AudioLines, Bot, Award] as const;

/**
 * Khung chia đôi dùng chung cho Đăng nhập, Đăng ký và Quên mật khẩu: bảng thương hiệu azure bên trái nêu điểm
 * nổi bật (AI lồng tiếng, gia sư AI, chứng chỉ), thẻ form bên phải. Thuần hiển thị, không chứa logic nghiệp vụ.
 * Form tự hiện dần khi vào trang (chỉ opacity/transform); giảm chuyển động thì CSS toàn cục đã tắt hiệu ứng.
 */
export function AuthLayout({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  const t = useTranslations('auth.layout');
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const highlights = t.raw('highlights') as string[];

  return (
    <section className="shell flex min-h-[75vh] items-center justify-center py-12">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-card border border-line bg-surface-raised shadow-card-hover md:grid-cols-2">
        <div className="hidden flex-col justify-between gap-8 bg-accent p-10 text-white md:flex">
          <div>
            <div className="font-display text-xl font-bold">LinguaLearn</div>
            <p className="mt-6 font-display text-2xl font-bold leading-snug">{t('tagline')}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/85">{t('body')}</p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {highlights.map((text, i) => {
              const Icon = ICONS[i] ?? AudioLines;
              return (
                <li key={text} className="flex items-start gap-3 text-sm text-white">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>
          <div className="text-xs text-white/70">© {new Date().getFullYear()} LinguaLearn</div>
        </div>

        <div
          className={`flex flex-col justify-center p-8 transition-all duration-300 sm:p-10 ${
            entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <h1 className="mb-6 font-display text-2xl font-bold text-ink">{title}</h1>
          {children}
          <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>
        </div>
      </div>
    </section>
  );
}
