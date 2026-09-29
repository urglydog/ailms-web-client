'use client';

import Link from 'next/link';
import { useBundlesForCourse } from '@/hooks/useBundles';
import type { CourseBundle } from '@/types/domain';

function fmt(amount: number) {
  return amount.toLocaleString('vi-VN') + '₫';
}

function BundleUpsellCard({ bundle, currentCourseId }: { bundle: CourseBundle; currentCourseId: number }) {
  const otherCourses = bundle.courses.filter((c) => c.id !== currentCourseId);

  return (
    <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 overflow-hidden">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />

      <div className="p-4">
        {/* Badge + title */}
        <div className="flex items-start gap-2 mb-2.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
            🎁 -{bundle.discountPercent}%
          </span>
          <h4 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
            {bundle.title}
          </h4>
        </div>

        {/* Other courses in bundle */}
        {otherCourses.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Đi kèm trong gói:
            </p>
            <ul className="space-y-1">
              {otherCourses.map((c) => (
                <li key={c.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                  <span className="text-cyan-500 flex-shrink-0">✓</span>
                  <span className="truncate">{c.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 border border-white px-3 py-2.5 shadow-sm">
          <div className="text-xs text-gray-500">
            <span className="line-through text-gray-400">{fmt(bundle.originalPrice)}</span>
            <span className="ml-1.5 text-red-500 font-bold">-{fmt(bundle.discountAmount)}</span>
          </div>
          <span className="text-base font-extrabold text-cyan-700">{fmt(bundle.finalPrice)}</span>
        </div>

        {/* CTA — links to cart with bundle pre-selected */}
        <Link
          href={`/cart?bundle=${bundle.id}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-sm font-bold text-white shadow hover:from-cyan-700 hover:to-blue-700 transition-all active:scale-95 no-underline"
        >
          Mua gói để tiết kiệm thêm →
        </Link>
      </div>
    </div>
  );
}

interface BundleUpsellWidgetProps {
  courseId: number;
}

/**
 * Widget gợi ý Bundle — hiển thị bên dưới nút mua trong cột ghi danh của trang chi tiết
 * khóa học. Fetch theo courseId, không render gì cả nếu không có gói nào.
 */
export function BundleUpsellWidget({ courseId }: BundleUpsellWidgetProps) {
  const { data: bundles, isLoading } = useBundlesForCourse(courseId);

  if (isLoading || !bundles || bundles.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-dashed border-gray-200 pt-4 mt-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        💡 Tiết kiệm hơn với gói combo
      </p>
      {bundles.map((bundle) => (
        <BundleUpsellCard key={bundle.id} bundle={bundle} currentCourseId={courseId} />
      ))}
    </div>
  );
}
