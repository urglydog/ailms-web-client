'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const REASONS = [
  { key: 'r1', image: '/teaching/6.webp' },
  { key: 'r2', image: '/teaching/5.webp' },
  { key: 'r3', image: '/teaching/4.webp' },
] as const;

const STEPS = [
  { key: 'plan', image: '/teaching/1.webp' },
  { key: 'video', image: '/teaching/2.webp' },
  { key: 'launch', image: '/teaching/3.webp' },
] as const;

/**
 * "Đến và giảng dạy cùng chúng tôi!" — trang giới thiệu trước khi vào wizard "Trở thành Giảng
 * viên" (19/09/2026, tính năng mới, giao diện tham khảo Udemy `/teaching`). Cố ý KHÔNG dùng số
 * liệu/lời chứng thực từ 1 người cụ thể như bản gốc — dự án demo chưa có số liệu thật, dựng lời
 * chứng thực giả gán cho 1 "giảng viên" cụ thể dễ bị hiểu nhầm là xác thực.
 *
 * Ảnh minh họa (19/09/2026, bổ sung) — file tĩnh trong `public/teaching/`, KHÔNG upload lên B2:
 * B2 dành cho nội dung người dùng tự quản lý qua API (ảnh bìa khóa học, video, ảnh CCCD...), còn
 * đây là tài nguyên thiết kế cố định đi kèm mã nguồn, không đổi theo dữ liệu — cùng cách xử lý
 * với font chữ tự lưu trữ trong `app/fonts/`.
 */
export default function TeachingIntroPage() {
  const t = useTranslations('pages.teaching');
  const { data: currentUser } = useCurrentUser();
  const isInstructor = currentUser?.role === 'INSTRUCTOR';
  const ctaHref = isInstructor ? '/instructor/courses' : '/teaching/onboarding';
  const ctaLabel = isInstructor ? t('ctaInstructor') : t('ctaStart');

  return (
    <div className="flex flex-col">
      {/* Hero — ảnh nền có sẵn khoảng trống màu xám bên trái (giống bản gốc Udemy), chữ nằm đè
          lên đúng phần đó thay vì tách thành 1 khối riêng. Màn hình nhỏ xếp chữ lên trên ảnh vì
          phần xám không đủ rộng để đè chữ dễ đọc ở tỉ lệ 3:1. */}
      <section className="relative w-full">
        <div className="bg-tint px-6 py-10 md:hidden">
          <HeroText ctaHref={ctaHref} ctaLabel={ctaLabel} />
        </div>
        <div className="relative hidden w-full md:block" style={{ aspectRatio: '3 / 1' }}>
          <Image src="/teaching/0.webp" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 flex items-center">
            <div className="shell w-full">
              <div className="max-w-sm">
                <HeroText ctaHref={ctaHref} ctaLabel={ctaLabel} onImage />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lý do nên bắt đầu */}
      <section className="bg-surface-raised py-14">
        <div className="shell flex flex-col gap-10">
          <h2 className="text-center font-display text-3xl font-bold text-ink md:text-4xl">
            {t('reasonsHeading')}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {REASONS.map((reason) => (
              <div key={reason.key} className="flex flex-col items-center gap-3 text-center">
                <Image src={reason.image} alt="" width={80} height={80} className="mb-1" />
                <h3 className="font-display text-xl font-bold text-ink">{t(`${reason.key}Title`)}</h3>
                <p className="text-lg leading-relaxed text-ink">{t(`${reason.key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Các bước bắt đầu — (19/09/2026, sửa lỗi) `bg-surface-raised` trước đây nằm CHUNG thẻ với
          `.shell` (có `max-w-shell` + `mx-auto`) nên chỉ tô trắng đúng phần nội dung ở giữa,
          2 bên rìa màn hình rộng vẫn lộ màu nền xám của trang. Nền trắng giờ đặt ở thẻ NGOÀI
          full-width, `.shell` chỉ còn nhiệm vụ canh giữa nội dung bên trong. */}
      <section className="bg-surface-raised py-14">
        <div className="shell">
          <StepsTabs />
        </div>
      </section>

      {/* Hỗ trợ */}
      <section className="bg-surface-hover py-14">
        <div className="shell grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-3xl font-bold text-ink">{t('supportHeading')}</h2>
            <p className="text-lg leading-relaxed text-ink">
              {t('supportBody')}
            </p>
          </div>
          {/* (19/09/2026, theo phản hồi) — bỏ khung thẻ trắng bọc ảnh, để ảnh liền khối với nền
              của cả khu vực thay vì tách rời thành 1 "hộp" riêng. */}
          <div className="relative h-72 md:h-[420px]">
            <Image src="/teaching/8.png" alt="" fill className="object-contain" />
          </div>
        </div>
      </section>

      {/* CTA cuối trang */}
      <section className="py-16 text-center">
        <h2 className="mb-3 font-display text-3xl font-bold text-ink">{t('ctaHeading')}</h2>
        <p className="mb-6 text-lg text-ink">{t('ctaSub')}</p>
        <Link
          href={ctaHref}
          className="rounded-full bg-accent px-9 py-3.5 font-display text-lg font-bold text-white no-underline hover:bg-accent-dark hover:text-white"
        >
          {ctaLabel}
        </Link>
      </section>
    </div>
  );
}

/**
 * `onImage`: chữ đè lên ảnh nền 0.webp — ảnh là bitmap có vùng xám sáng bên trái ở CẢ 2 chế độ, nên
 * không được dùng `text-ink` (đảo sang màu sáng ở dark mode → chữ sáng trên nền sáng). Dùng `night`
 * (tối cố định ở mọi chế độ). Bản mobile nằm trên `bg-tint` đổi theo chế độ nên vẫn dùng `ink`.
 */
function HeroText({ ctaHref, ctaLabel, onImage = false }: { ctaHref: string; ctaLabel: string; onImage?: boolean }) {
  const t = useTranslations('pages.teaching');
  const textColor = onImage ? 'text-night' : 'text-ink';
  return (
    <div className="flex flex-col gap-5">
      <h1 className={`font-display text-5xl font-extrabold leading-tight ${textColor} md:text-6xl`}>
        {t('heroTitle')}
      </h1>
      <p className={`max-w-md text-lg leading-relaxed ${textColor}`}>
        {t('heroSub')}
      </p>
      <Link
        href={ctaHref}
        className="w-fit rounded-full bg-accent px-8 py-3.5 font-display text-lg font-bold text-white no-underline hover:bg-accent-dark hover:text-white"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function StepsTabs() {
  const t = useTranslations('pages.teaching');
  const [active, setActive] = useState<string>(STEPS[0]!.key);
  const step = STEPS.find((s) => s.key === active) ?? STEPS[0]!;

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-center font-display text-2xl font-bold text-ink md:text-3xl">{t('stepsHeading')}</h2>
      <div className="flex justify-center gap-6 border-b border-line">
        {STEPS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={`border-b-2 px-1 pb-3 text-base font-semibold transition-colors ${
              active === s.key ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t(`${s.key}Label`)}
          </button>
        ))}
      </div>
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <p className="text-lg leading-relaxed text-ink">{t(`${step.key}Body`)}</p>
          <p className="text-base font-bold text-ink">{t('helpHeading')}</p>
          <p className="text-lg leading-relaxed text-ink">{t(`${step.key}Help`)}</p>
        </div>
        {/* (19/09/2026, theo phản hồi) — nền trắng trùng màu nền của chính ảnh minh họa (thay
            `bg-accent/5` trước đây tạo viền lệch màu rõ), ảnh phóng to hơn (bỏ padding, tăng
            chiều cao). */}
        <div className="relative h-80 overflow-hidden rounded-card bg-surface-raised md:h-[420px]">
          <Image src={step.image} alt="" fill className="object-contain" />
        </div>
      </div>
    </div>
  );
}
