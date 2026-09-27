/** Trung tâm trợ giúp — CHƯA có hệ thống ticket/FAQ thật, chỉ đưa kênh liên hệ trực tiếp đã có
 * sẵn ở Footer (theo yêu cầu: phần nào chưa triển khai thì chỉ ghi tiêu đề/thông tin thật). */
export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-14">
      <h1 className="m-0 font-display text-[28px] font-bold text-ink">Trợ giúp & Hỗ trợ</h1>
      <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">
        Trung tâm trợ giúp (câu hỏi thường gặp, hệ thống yêu cầu hỗ trợ) đang được xây dựng. Trong
        lúc chờ đợi, vui lòng liên hệ trực tiếp:
      </p>
      <div className="mt-6 flex flex-col gap-2 rounded-card border border-line bg-white p-5 shadow-card text-[14px]">
        <a href="mailto:csm@iuh.edu.vn" className="text-accent hover:text-accent-dark">Email: csm@iuh.edu.vn</a>
        <a href="tel:02838940390" className="text-accent hover:text-accent-dark">Điện thoại: 0283.8940 390</a>
      </div>
    </div>
  );
}
