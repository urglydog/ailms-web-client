const VALUES = [
  {
    title: 'Xoá rào cản ngôn ngữ',
    desc: 'AI tự động dịch và lồng tiếng bài giảng nước ngoài sang tiếng Việt (và ngược lại), đồng bộ chính xác tới mili-giây với hình ảnh gốc — học viên không còn phải vừa xem vừa đọc phụ đề.',
  },
  {
    title: 'Học chủ động, không chỉ xem',
    desc: 'Trợ lý ảo Socratic Tutor gợi mở câu hỏi theo đúng ngữ cảnh bài học đang xem, thay vì chỉ đưa đáp án — giúp học viên thực sự hiểu bài thay vì học vẹt.',
  },
  {
    title: 'Minh bạch tiến độ học tập',
    desc: 'Theo dõi tiến độ từng bài học, kết quả bài kiểm tra và lộ trình học rõ ràng cho cả học viên lẫn giảng viên.',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-14">
      <h1 className="m-0 font-display text-[28px] font-bold text-ink">Về LinguaLearn</h1>
      <p className="mt-3 text-[15px] leading-[1.7] text-ink-muted">
        LinguaLearn là nền tảng học trực tuyến (LMS) tích hợp AI, ra đời từ đề tài khóa luận tốt
        nghiệp với mục tiêu giúp học viên Việt Nam tiếp cận kho bài giảng chất lượng cao từ khắp
        thế giới mà không bị giới hạn bởi ngôn ngữ gốc của video.
      </p>

      <div className="mt-10 flex flex-col gap-6">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-card border border-line bg-white p-5 shadow-card">
            <h2 className="m-0 font-display text-[16px] font-semibold text-ink">{v.title}</h2>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-muted">{v.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-[13px] text-ink-faint">
        Đây là sản phẩm nghiên cứu học thuật, được phát triển và vận hành nhằm mục đích minh hoạ
        các tính năng AI trong giáo dục trực tuyến.
      </p>
    </div>
  );
}
