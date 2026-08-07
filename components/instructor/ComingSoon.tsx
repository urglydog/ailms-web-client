interface ComingSoonProps {
  title: string;
  description: string;
}

/** Placeholder cho các trang thuộc Giai đoạn sau (vd. doanh thu/học viên — Giai đoạn 9). */
export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">{title}</h1>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
        <span className="text-3xl">🛠️</span>
        <p className="max-w-md text-[13.5px] text-gray-500">{description}</p>
      </div>
    </>
  );
}
