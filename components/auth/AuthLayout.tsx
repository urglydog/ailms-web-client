'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, Sparkles, GraduationCap } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: BookOpen, text: 'Học liệu Official do giảng viên biên soạn' },
  { icon: Sparkles, text: 'Trợ lý AI hỗ trợ giải thích bài tập 24/7' },
  { icon: GraduationCap, text: 'Theo dõi tiến độ & bảng điểm minh bạch' },
];

/**
 * Khung split-screen dùng chung cho Đăng nhập/Đăng ký — panel thương hiệu bên trái
 * (accent solid, không gradient/glow theo đúng "Enterprise/Academic Design System"),
 * card form bên phải. Thuần hiển thị — không chứa logic nghiệp vụ.
 */
export function AuthLayout({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="shell flex min-h-[75vh] items-center justify-center py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-card overflow-hidden border border-line shadow-card-hover bg-surface-raised">
        {/* Panel thương hiệu — chỉ hiện ở màn hình vừa trở lên */}
        <div className="hidden md:flex flex-col justify-between bg-accent text-white p-10">
          <div>
            <div className="font-display text-xl font-bold">LinguaLearn</div>
            <p className="mt-3 text-sm text-white/80 leading-relaxed">Học không giới hạn — cùng đồng hành với giảng viên và trợ lý AI.</p>
          </div>
          <ul className="flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/90">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs text-white/50">© {new Date().getFullYear()} LinguaLearn</div>
        </div>

        {/* Panel form */}
        <div
          className={`p-8 sm:p-10 flex flex-col justify-center transition-all duration-300 ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <h1 className="font-display text-2xl font-bold text-ink mb-6">{title}</h1>
          {children}
          <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>
        </div>
      </div>
    </section>
  );
}
