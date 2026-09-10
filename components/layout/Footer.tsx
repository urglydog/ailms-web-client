export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface-raised">
      <div className="shell py-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-ink-muted">
        <div className="flex flex-col gap-2">
          <span className="font-display font-bold text-ink">LMS Platform</span>
          <span>Hệ thống quản lý học tập và thi cử trực tuyến chuẩn học thuật.</span>
          <span className="mt-2 text-xs text-ink-faint">
            &copy; {new Date().getFullYear()} — Trường Đại học Công nghiệp TP. Hồ Chí Minh
          </span>
        </div>
        <div className="flex flex-col md:items-end gap-2 text-left md:text-right">
          <span className="font-display font-bold text-ink mb-1">Liên Hệ</span>
          <a href="tel:02838940390" className="hover:text-accent transition-colors">Phone: 0283.8940 390</a>
          <a href="mailto:csm@iuh.edu.vn" className="hover:text-accent transition-colors">Email: csm@iuh.edu.vn</a>
        </div>
      </div>
    </footer>
  );
}
