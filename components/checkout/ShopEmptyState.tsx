import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';

interface ShopEmptyStateProps {
  kind: 'cart' | 'wishlist';
  message: string;
  cta: string;
  href: string;
}

/** Trạng thái trống dùng chung cho giỏ hàng và danh sách yêu thích: biểu tượng, lời nhắn và nút dẫn đi khám phá. */
export function ShopEmptyState({ kind, message, cta, href }: ShopEmptyStateProps) {
  const Icon = kind === 'cart' ? ShoppingCart : Heart;
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tint text-accent">
        <Icon size={26} aria-hidden />
      </span>
      <p className="m-0 text-ink-muted">{message}</p>
      <Link
        href={href}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-accent-dark hover:text-white"
      >
        {cta}
      </Link>
    </div>
  );
}
