'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const REASONS = [
  {
    title: 'Dạy theo cách của bạn',
    description: 'Đăng khóa học bạn muốn, theo cách bạn muốn, và bạn luôn giữ toàn quyền kiểm soát nội dung của mình.',
    image: '/teaching/6.webp',
  },
  {
    title: 'Truyền cảm hứng cho học viên',
    description: 'Dạy những gì bạn biết và giúp học viên khám phá sở thích, tiếp thu kỹ năng mới, phát triển sự nghiệp.',
    image: '/teaching/5.webp',
  },
  {
    title: 'Nhận phần thưởng xứng đáng',
    description: 'Mở rộng mạng lưới chuyên môn, xây dựng uy tín cá nhân, và có thêm thu nhập từ mỗi lượt đăng ký trả phí.',
    image: '/teaching/4.webp',
  },
];

const STEPS = [
  {
    key: 'plan',
    label: 'Lên kế hoạch chương trình',
    body: 'Bắt đầu từ đam mê và kiến thức của bạn, sau đó chọn 1 chủ đề phù hợp. Bạn là người quyết định phương pháp giảng dạy và nội dung kiến thức.',
    help: 'Trình soạn "Chương trình giảng dạy" giúp bạn sắp xếp Phần/Bài giảng rõ ràng, có checklist điều kiện gửi duyệt ngay trong lúc soạn.',
    image: '/teaching/1.webp',
  },
  {
    key: 'video',
    label: 'Quay video',
    body: 'Bạn không cần thiết bị đắt tiền — chỉ cần âm thanh rõ ràng và hình ảnh dễ nhìn. Có thể tải video lên trực tiếp hoặc dùng đường dẫn YouTube.',
    help: 'Hệ thống tự tách phụ đề gốc và hỗ trợ lồng tiếng AI đa ngôn ngữ ngay sau khi bạn tải video lên, không cần thao tác thêm.',
    image: '/teaching/2.webp',
  },
  {
    key: 'launch',
    label: 'Ra mắt khóa học',
    body: 'Hoàn thiện thông tin cơ bản, giá cả, rồi gửi khóa học đi duyệt. Sau khi được duyệt, khóa học của bạn sẽ hiển thị công khai để học viên tìm thấy.',
    help: 'Bạn có thể chỉnh sửa nội dung/giá bất cứ lúc nào — chỉ lần gửi duyệt ĐẦU TIÊN cần được kiểm duyệt.',
    image: '/teaching/3.webp',
  },
];

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
  const { data: currentUser } = useCurrentUser();
  const isInstructor = currentUser?.role === 'INSTRUCTOR';
  const ctaHref = isInstructor ? '/instructor/courses' : '/teaching/onboarding';
  const ctaLabel = isInstructor ? 'Đến kênh giảng viên' : 'Bắt đầu';

  return (
    <div className="flex flex-col">
      {/* Hero — ảnh nền có sẵn khoảng trống màu xám bên trái (giống bản gốc Udemy), chữ nằm đè
          lên đúng phần đó thay vì tách thành 1 khối riêng. Màn hình nhỏ xếp chữ lên trên ảnh vì
          phần xám không đủ rộng để đè chữ dễ đọc ở tỉ lệ 3:1. */}
      <section className="relative w-full">
        <div className="bg-[#ececec] px-6 py-10 md:hidden">
          <HeroText ctaHref={ctaHref} ctaLabel={ctaLabel} />
        </div>
        <div className="relative hidden w-full md:block" style={{ aspectRatio: '3 / 1' }}>
          <Image src="/teaching/0.webp" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 flex items-center">
            <div className="shell w-full">
              <div className="max-w-sm">
                <HeroText ctaHref={ctaHref} ctaLabel={ctaLabel} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lý do nên bắt đầu */}
      <section className="bg-white py-14">
        <div className="shell flex flex-col gap-10">
          <h2 className="text-center font-display text-3xl font-bold text-ink md:text-4xl">
            Có rất nhiều lý do để bắt đầu.
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {REASONS.map((reason) => (
              <div key={reason.title} className="flex flex-col items-center gap-3 text-center">
                <Image src={reason.image} alt="" width={80} height={80} className="mb-1" />
                <h3 className="font-display text-xl font-bold text-ink">{reason.title}</h3>
                <p className="text-lg leading-relaxed text-ink">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Các bước bắt đầu — (19/09/2026, sửa lỗi) `bg-white` trước đây nằm CHUNG thẻ với
          `.shell` (có `max-w-shell` + `mx-auto`) nên chỉ tô trắng đúng phần nội dung ở giữa,
          2 bên rìa màn hình rộng vẫn lộ màu nền xám của trang. Nền trắng giờ đặt ở thẻ NGOÀI
          full-width, `.shell` chỉ còn nhiệm vụ canh giữa nội dung bên trong. */}
      <section className="bg-white py-14">
        <div className="shell">
          <StepsTabs />
        </div>
      </section>

      {/* Hỗ trợ */}
      <section className="bg-surface-hover py-14">
        <div className="shell grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-3xl font-bold text-ink">Bạn sẽ không đơn độc.</h2>
            <p className="text-lg leading-relaxed text-ink">
              Trợ lý Socratic AI Tutor, học liệu tự sinh và trình soạn Chương trình giảng dạy có
              checklist ngay trong lúc soạn — tất cả đã sẵn sàng đồng hành cùng bạn từ bài giảng
              đầu tiên. Bạn chỉ cần tập trung vào kiến thức muốn chia sẻ.
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
        <h2 className="mb-3 font-display text-3xl font-bold text-ink">Trở thành giảng viên ngay hôm nay!</h2>
        <p className="mb-6 text-lg text-ink">Tham gia cộng đồng giảng viên đang phát triển của LinguaLearn.</p>
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

function HeroText({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-5xl font-extrabold leading-tight text-ink md:text-6xl">
        Đến và giảng dạy cùng chúng tôi!
      </h1>
      <p className="max-w-md text-lg leading-relaxed text-ink">
        Trở thành giảng viên và thay đổi cuộc sống của người khác — kể cả chính bạn.
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
  const [active, setActive] = useState(STEPS[0]!.key);
  const step = STEPS.find((s) => s.key === active) ?? STEPS[0]!;

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-center font-display text-2xl font-bold text-ink md:text-3xl">Cách bắt đầu</h2>
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
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <p className="text-lg leading-relaxed text-ink">{step.body}</p>
          <p className="text-base font-bold text-ink">Chúng tôi hỗ trợ bạn thế nào</p>
          <p className="text-lg leading-relaxed text-ink">{step.help}</p>
        </div>
        {/* (19/09/2026, theo phản hồi) — nền trắng trùng màu nền của chính ảnh minh họa (thay
            `bg-accent/5` trước đây tạo viền lệch màu rõ), ảnh phóng to hơn (bỏ padding, tăng
            chiều cao). */}
        <div className="relative h-80 overflow-hidden rounded-card bg-white md:h-[420px]">
          <Image src={step.image} alt="" fill className="object-contain" />
        </div>
      </div>
    </div>
  );
}
