import Link from 'next/link';

const NAV = [
  { href: '/courses', label: 'Kho khóa học' },
  { href: '/#how-it-works', label: 'Cách hoạt động' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-raised">
      <div className="shell flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-extrabold text-ink no-underline hover:no-underline">
          Lingua<span className="text-accent">Learn</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-muted no-underline hover:text-accent hover:no-underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Giai đoạn 1 sẽ thay bằng trạng thái đăng nhập thật (UC02) */}
          <Link
            href="/login"
            className="text-sm font-semibold text-ink-muted no-underline hover:text-accent hover:no-underline"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold
                       text-white no-underline hover:bg-accent-dark hover:no-underline"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </header>
  );
}
