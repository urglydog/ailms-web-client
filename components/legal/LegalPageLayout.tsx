import type { ReactNode } from 'react';

/** Khung dùng chung cho các trang pháp lý/chính sách (Điều khoản, Quyền riêng tư, Hoàn tiền...).
 * Cùng kiểu trình bày với `app/(public)/about/page.tsx` (max-w-3xl, rounded-card, shadow-card)
 * để không tạo thêm 1 "ngôn ngữ thiết kế" riêng chỉ cho nhóm trang này. */
export function LegalPageLayout({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  /** Ngày cập nhật hiển thị dưới tiêu đề — string đã format sẵn, VD "26/09/2026". */
  updatedAt?: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-14">
      <h1 className="m-0 font-display text-[28px] font-bold text-ink">{title}</h1>
      {updatedAt && <p className="mt-2 text-[12.5px] text-ink-faint">Cập nhật lần cuối: {updatedAt}</p>}
      {intro && <div className="mt-4 text-[15px] leading-[1.7] text-ink-muted">{intro}</div>}
      <div className="legal-content mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}

/** 1 mục trong trang chính sách — tiêu đề phụ + nội dung, cùng khung "card" như VALUES ở About. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-5 shadow-card">
      <h2 className="m-0 font-display text-[16px] font-semibold text-ink">{title}</h2>
      <div className="mt-2 flex flex-col gap-2 text-[14px] leading-[1.7] text-ink-muted">{children}</div>
    </section>
  );
}

/** Trang chưa có nội dung thật — chỉ hiện tiêu đề + ghi chú "đang cập nhật", KHÔNG bịa nội dung
 * chưa được triển khai thật trong hệ thống (theo yêu cầu: phần nào chưa có thì chỉ ghi tiêu đề). */
export function LegalStubNotice() {
  return (
    <p className="rounded-card border border-dashed border-line bg-surface-raised p-5 text-[13.5px] text-ink-faint">
      Nội dung này đang được xây dựng và sẽ được cập nhật trong phiên bản tiếp theo.
    </p>
  );
}
