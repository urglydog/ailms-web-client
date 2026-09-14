'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCourseFilterCounts } from '@/hooks/useCourseFilterCounts';
import { EMPTY_FILTERS } from '@/lib/api/publicCourses';
import type { Category, CourseFilterState } from '@/types/domain';

/**
 * Bộ lọc UC09 (14/09/2026, thiết kế lại kiểu Udemy — trước đây dùng `Pill.tsx`, một bug thật:
 * component đó tham chiếu class `.pill`/`.pill-active` KHÔNG TỒN TẠI trong `globals.css` —
 * design system đã đổi sang `.badge`/`.badge-active` từ trước nhưng `Pill.tsx` không được cập
 * nhật theo, nên mọi bộ lọc trước đây render ra CHỮ TRƠN không viền không nền, dễ hiểu lầm
 * không phải nút bấm. `Pill.tsx` không còn nơi nào khác dùng nên đã xoá hẳn, thay bằng
 * `CheckboxRow`/`RadioRow` tự vẽ ô vuông/tròn thật bên dưới.
 *
 * 5 nhóm lọc: Danh mục, Đánh giá (mới), Thời lượng video (mới), Học phí, Trình độ — đúng thứ
 * tự + kiểu ô chọn (radio cho Đánh giá vì các mốc "X sao trở lên" vốn loại trừ nhau, checkbox
 * cho 4 nhóm còn lại) như ảnh tham khảo Udemy. Số đếm bên cạnh mỗi lựa chọn tính từ
 * `useCourseFilterCounts` (xem docblock ở đó về giới hạn: đếm trên danh sách CHỈ áp `keyword`,
 * không phản ánh đúng tổ hợp các bộ lọc khác đang bật — cần facet search thật mới chính xác
 * tuyệt đối, chấp nhận được ở quy mô đồ án).
 */

const LEVELS = [
  { value: 'BEGINNER', label: 'Cơ bản' },
  { value: 'INTERMEDIATE', label: 'Trung cấp' },
  { value: 'ADVANCED', label: 'Nâng cao' },
] as const;

const RATING_TIERS = [4.5, 4.0, 3.5, 3.0] as const;

const DURATION_BUCKETS = [
  { value: '0-1', label: 'Dưới 1 giờ' },
  { value: '1-3', label: '1 - 3 giờ' },
  { value: '3-6', label: '3 - 6 giờ' },
  { value: '6-17', label: '6 - 17 giờ' },
  { value: '17+', label: 'Trên 17 giờ' },
] as const;

function durationBucketOf(totalDurationSec: number): (typeof DURATION_BUCKETS)[number]['value'] {
  const hours = totalDurationSec / 3600;
  if (hours <= 1) return '0-1';
  if (hours <= 3) return '1-3';
  if (hours <= 6) return '3-6';
  if (hours <= 17) return '6-17';
  return '17+';
}

interface CourseFiltersProps {
  filters: CourseFilterState;
  onChange: (next: CourseFilterState) => void;
  categories: Category[];
}

export function CourseFilters({ filters, onChange, categories }: CourseFiltersProps) {
  const router = useRouter();
  const { data: countingCourses } = useCourseFilterCounts(filters.keyword);

  const counts = useMemo(() => {
    const list = countingCourses ?? [];
    const byCategory = new Map<string, number>();
    const byLevel = new Map<string, number>();
    let free = 0;
    let paid = 0;
    const byRating = new Map<number, number>();
    const byDuration = new Map<string, number>();

    for (const course of list) {
      byCategory.set(course.categorySlug, (byCategory.get(course.categorySlug) ?? 0) + 1);
      byLevel.set(course.level, (byLevel.get(course.level) ?? 0) + 1);
      if (course.isFree) free += 1;
      else paid += 1;
      for (const tier of RATING_TIERS) {
        if (course.avgRating >= tier) byRating.set(tier, (byRating.get(tier) ?? 0) + 1);
      }
      const bucket = durationBucketOf(course.totalDurationSec);
      byDuration.set(bucket, (byDuration.get(bucket) ?? 0) + 1);
    }

    return { byCategory, byLevel, free, paid, byRating, byDuration };
  }, [countingCourses]);

  const toggle = <K extends keyof CourseFilterState>(key: K, value: CourseFilterState[K]) => {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  };

  const hasActiveFilter =
    filters.category !== null ||
    filters.level !== null ||
    filters.priceType !== 'all' ||
    filters.minRating !== null ||
    filters.durationBucket !== null ||
    filters.keyword.trim() !== '';

  const clearFilters = () => {
    onChange(EMPTY_FILTERS);
    router.push('/courses');
  };

  return (
    <aside className="flex flex-col divide-y divide-line-soft" aria-label="Bộ lọc khoá học">
      <div className="flex items-center justify-between pb-4">
        <span className="font-display text-sm font-bold text-ink">Bộ lọc</span>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[13px] font-semibold text-accent underline-offset-4 hover:underline"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      <FilterSection title="Danh mục">
        {categories.map((cat) => (
          <CheckboxRow
            key={cat.slug}
            label={cat.name}
            count={counts.byCategory.get(cat.slug) ?? 0}
            checked={filters.category === cat.slug}
            onChange={() => toggle('category', cat.slug)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Đánh giá">
        {RATING_TIERS.map((tier) => (
          <RadioRow
            key={tier}
            checked={filters.minRating === tier}
            onChange={() => toggle('minRating', tier)}
            count={counts.byRating.get(tier) ?? 0}
          >
            <StarsIcon />
            <span className="text-ink">{tier.toFixed(1)} trở lên</span>
          </RadioRow>
        ))}
      </FilterSection>

      <FilterSection title="Thời lượng video">
        {DURATION_BUCKETS.map((bucket) => (
          <CheckboxRow
            key={bucket.value}
            label={bucket.label}
            count={counts.byDuration.get(bucket.value) ?? 0}
            checked={filters.durationBucket === bucket.value}
            onChange={() => toggle('durationBucket', bucket.value)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Học phí">
        <CheckboxRow
          label="Miễn phí"
          count={counts.free}
          checked={filters.priceType === 'free'}
          onChange={() => onChange({ ...filters, priceType: filters.priceType === 'free' ? 'all' : 'free' })}
        />
        <CheckboxRow
          label="Trả phí"
          count={counts.paid}
          checked={filters.priceType === 'paid'}
          onChange={() => onChange({ ...filters, priceType: filters.priceType === 'paid' ? 'all' : 'paid' })}
        />
      </FilterSection>

      <FilterSection title="Trình độ">
        {LEVELS.map((lv) => (
          <CheckboxRow
            key={lv.value}
            label={lv.label}
            count={counts.byLevel.get(lv.value) ?? 0}
            checked={filters.level === lv.value}
            onChange={() => toggle('level', lv.value)}
          />
        ))}
      </FilterSection>
    </aside>
  );
}

/** Thu gọn/mở rộng + "Hiện thêm/Hiện ít hơn" khi nhiều hơn 5 lựa chọn — đúng khuôn Udemy. */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const items = Array.isArray(children) ? children : [children];
  const SHOW_LIMIT = 5;
  const canCollapse = items.length > SHOW_LIMIT;
  const visibleItems = expanded || !canCollapse ? items : items.slice(0, SHOW_LIMIT);

  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-sm font-bold text-ink">{title}</span>
        <span className={`text-ink-muted transition-transform ${collapsed ? '-rotate-90' : ''}`} aria-hidden>
          ▾
        </span>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-2.5">
          {visibleItems}
          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 w-fit text-[13px] font-semibold text-accent underline-offset-4 hover:underline"
            >
              {expanded ? 'Hiện ít hơn' : `Hiện thêm (${items.length - SHOW_LIMIT})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CheckboxRow({
  label, count, checked, onChange,
}: {
  label: string; count: number; checked: boolean; onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
      <span
        role="checkbox"
        aria-checked={checked}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked ? 'border-accent bg-accent text-white' : 'border-line bg-white'
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-ink">{label}</span>
      <span className="text-ink-faint">({count.toLocaleString('vi-VN')})</span>
    </label>
  );
}

function RadioRow({
  checked, onChange, count, children,
}: {
  checked: boolean; onChange: () => void; count: number; children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13.5px]">
      <span
        role="radio"
        aria-checked={checked}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          checked ? 'border-accent' : 'border-line'
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-accent" />}
      </span>
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex items-center gap-1.5">{children}</span>
      <span className="text-ink-faint">({count.toLocaleString('vi-VN')})</span>
    </label>
  );
}

function StarsIcon() {
  return (
    <span className="text-star" aria-hidden>
      ★
    </span>
  );
}
