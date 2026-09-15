'use client';

import { useMemo, useState } from 'react';
import { useMyCourses } from '@/hooks/useCourses';
import { useCreateCoupon, useDeleteCoupon, useMyCoupons, useUpdateCoupon } from '@/hooks/useCoupons';
import { publicCoursesApi } from '@/lib/api/publicCourses';
import type { Coupon, CouponScopeType, CourseSummary, DiscountType } from '@/types/domain';

interface CouponManagerProps {
  /** Admin quản lý coupon TOÀN HỆ THỐNG; Instructor chỉ coupon của khóa học chính mình
   * (BR-COUPON-02/03/06) — backend tự phân quyền, khác biệt duy nhất ở FE là nguồn danh sách
   * khóa học để chọn (own courses vs tìm kiếm toàn bộ khóa đã xuất bản). */
  role: 'admin' | 'instructor';
}

interface FormState {
  code: string;
  autoApply: boolean;
  discountType: DiscountType;
  discountValue: string;
  scopeType: CouponScopeType;
  courseIds: number[];
  startAt: string;
  endAt: string;
  maxUsageCount: string;
  maxUsagePerUser: string;
  isActive: boolean;
}

function emptyForm(): FormState {
  return {
    code: '',
    autoApply: true,
    discountType: 'PERCENTAGE',
    discountValue: '',
    scopeType: 'ALL_COURSES',
    courseIds: [],
    startAt: '',
    endAt: '',
    maxUsageCount: '',
    maxUsagePerUser: '',
    isActive: true,
  };
}

function couponToForm(coupon: Coupon): FormState {
  return {
    code: coupon.code ?? '',
    autoApply: coupon.autoApply,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    scopeType: coupon.scopeType,
    courseIds: coupon.courses.map((c) => c.courseId),
    startAt: coupon.startAt.slice(0, 16),
    endAt: coupon.endAt.slice(0, 16),
    maxUsageCount: coupon.maxUsageCount != null ? String(coupon.maxUsageCount) : '',
    maxUsagePerUser: coupon.maxUsagePerUser != null ? String(coupon.maxUsagePerUser) : '',
    isActive: coupon.isActive,
  };
}

const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  PERCENTAGE: 'Theo %',
  FIXED_AMOUNT: 'Số tiền cố định',
};

const SCOPE_LABEL: Record<CouponScopeType, string> = {
  ALL_COURSES: 'Toàn bộ khóa học',
  SPECIFIC_COURSES: 'Nhiều khóa học chỉ định',
  SINGLE_COURSE: '1 khóa học',
};

export function CouponManager({ role }: CouponManagerProps) {
  const { data: coupons, isLoading } = useMyCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const openCreate = () => {
    setForm(emptyForm());
    setEditing('new');
  };
  const openEdit = (coupon: Coupon) => {
    setForm(couponToForm(coupon));
    setEditing(coupon);
  };
  const closeModal = () => setEditing(null);

  const handleDelete = (coupon: Coupon) => {
    if (!window.confirm(`Xóa mã giảm giá "${coupon.code ?? '(tự động)'}"?`)) return;
    deleteCoupon.mutate(coupon.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req = {
      code: form.autoApply ? undefined : form.code.trim(),
      autoApply: form.autoApply,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      scopeType: form.scopeType,
      courseIds: form.scopeType === 'ALL_COURSES' ? undefined : form.courseIds,
      startAt: form.startAt,
      endAt: form.endAt,
      maxUsageCount: form.maxUsageCount ? Number(form.maxUsageCount) : null,
      maxUsagePerUser: form.maxUsagePerUser ? Number(form.maxUsagePerUser) : null,
    };

    if (editing === 'new') {
      createCoupon.mutate(req, { onSuccess: closeModal });
    } else if (editing) {
      updateCoupon.mutate({ id: editing.id, req: { ...req, isActive: form.isActive } }, { onSuccess: closeModal });
    }
  };

  const isSaving = createCoupon.isPending || updateCoupon.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Mã giảm giá</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {role === 'admin'
              ? 'Coupon toàn hệ thống hoặc cho khóa học bất kỳ.'
              : 'Coupon áp dụng cho khóa học của riêng bạn.'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-dark transition-colors"
        >
          + Tạo mã giảm giá
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-ink-muted">Đang tải...</div>
      ) : !coupons || coupons.length === 0 ? (
        <div className="card border border-line rounded-xl p-10 text-center text-sm text-ink-muted">
          Chưa có mã giảm giá nào.
        </div>
      ) : (
        <div className="overflow-x-auto card border border-line rounded-xl">
          <table className="w-full text-left text-sm text-ink-muted">
            <thead className="bg-surface-raised text-xs uppercase text-ink border-b border-line">
              <tr>
                <th className="px-6 py-4">Mã</th>
                <th className="px-6 py-4">Giảm giá</th>
                <th className="px-6 py-4">Phạm vi</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Đã dùng</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-ink">
                    {coupon.code ?? <span className="italic font-sans font-normal text-ink-muted">Tự động</span>}
                  </td>
                  <td className="px-6 py-4 text-ink">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}%`
                      : `${coupon.discountValue.toLocaleString('vi-VN')}đ`}
                  </td>
                  <td className="px-6 py-4">
                    {SCOPE_LABEL[coupon.scopeType]}
                    {coupon.scopeType !== 'ALL_COURSES' && (
                      <div className="mt-1 text-xs text-ink-muted max-w-[220px] truncate" title={coupon.courses.map((c) => c.courseTitle).join(', ')}>
                        {coupon.courses.map((c) => c.courseTitle).join(', ') || 'Chưa chọn khóa nào'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-ink-muted">
                    {new Date(coupon.startAt).toLocaleDateString('vi-VN')} –{' '}
                    {new Date(coupon.endAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-ink">
                    {coupon.usageCount}
                    {coupon.maxUsageCount != null ? ` / ${coupon.maxUsageCount}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        coupon.isActive
                          ? 'bg-success/10 text-success border border-success/20'
                          : 'bg-surface-raised text-ink-muted border border-line'
                      }`}
                    >
                      {coupon.isActive ? 'Đang bật' : 'Đã tắt'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(coupon)}
                      className="text-xs font-bold text-accent hover:underline mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(coupon)}
                      className="text-xs font-bold text-danger hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-line flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-ink">
                {editing === 'new' ? 'Tạo mã giảm giá' : 'Sửa mã giảm giá'}
              </h2>
              <button onClick={closeModal} className="text-ink-muted hover:text-ink text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={form.autoApply}
                  onChange={(e) => setForm((f) => ({ ...f, autoApply: e.target.checked }))}
                />
                Tự động áp dụng (không cần nhập mã)
              </label>

              {!form.autoApply && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Mã giảm giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-lg border border-line p-2.5 text-sm uppercase focus:border-accent focus:outline-none"
                    placeholder="VD: SALE50"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Loại giảm giá</label>
                  <select
                    className="w-full rounded-lg border border-line p-2.5 text-sm focus:border-accent focus:outline-none"
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as DiscountType }))}
                  >
                    {Object.entries(DISCOUNT_TYPE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Giá trị {form.discountType === 'PERCENTAGE' ? '(%)' : '(đ)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                    step="0.01"
                    className="w-full rounded-lg border border-line p-2.5 text-sm focus:border-accent focus:outline-none"
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Phạm vi áp dụng</label>
                <select
                  className="w-full rounded-lg border border-line p-2.5 text-sm focus:border-accent focus:outline-none"
                  value={form.scopeType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scopeType: e.target.value as CouponScopeType, courseIds: [] }))
                  }
                >
                  {role === 'admin' && <option value="ALL_COURSES">{SCOPE_LABEL.ALL_COURSES}</option>}
                  {role === 'instructor' && (
                    <option value="ALL_COURSES">Toàn bộ khóa học CỦA TÔI</option>
                  )}
                  <option value="SPECIFIC_COURSES">{SCOPE_LABEL.SPECIFIC_COURSES}</option>
                  <option value="SINGLE_COURSE">{SCOPE_LABEL.SINGLE_COURSE}</option>
                </select>
              </div>

              {form.scopeType !== 'ALL_COURSES' && (
                <CoursePicker
                  role={role}
                  multiple={form.scopeType === 'SPECIFIC_COURSES'}
                  selectedIds={form.courseIds}
                  onChange={(ids) => setForm((f) => ({ ...f, courseIds: ids }))}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full rounded-lg border border-line p-2.5 text-sm focus:border-accent focus:outline-none"
                    value={form.startAt}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full rounded-lg border border-line p-2.5 text-sm focus:border-accent focus:outline-none"
                    value={form.endAt}
                    onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Giới hạn lượt dùng (tổng)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-line p-2.5 text-sm focus:border-accent focus:outline-none"
                    placeholder="Không giới hạn"
                    value={form.maxUsageCount}
                    onChange={(e) => setForm((f) => ({ ...f, maxUsageCount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Giới hạn / học viên</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-line p-2.5 text-sm focus:border-accent focus:outline-none"
                    placeholder="Không giới hạn"
                    value={form.maxUsagePerUser}
                    onChange={(e) => setForm((f) => ({ ...f, maxUsagePerUser: e.target.value }))}
                  />
                </div>
              </div>

              {editing !== 'new' && (
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Đang bật (bỏ chọn để tạm ngừng coupon này)
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-line py-2.5 text-sm font-semibold text-ink hover:bg-surface-hover transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-dark transition-colors disabled:opacity-60"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CoursePicker({
  role, multiple, selectedIds, onChange,
}: {
  role: 'admin' | 'instructor';
  multiple: boolean;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const { data: myCoursesPage } = useMyCourses({ size: 100 }, { enabled: role === 'instructor' });
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<CourseSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const options = useMemo(() => {
    if (role === 'instructor') {
      return (myCoursesPage?.content ?? []).map((c) => ({ id: c.id, title: c.title }));
    }
    return searchResults.map((c) => ({ id: c.id, title: c.title }));
  }, [role, myCoursesPage, searchResults]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const results = await publicCoursesApi.search(
        { category: null, level: null, priceType: 'all', keyword, minRating: null, durationBucket: null },
        'newest',
        20,
      );
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const toggle = (id: number) => {
    if (multiple) {
      onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
    } else {
      onChange([id]);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">
        Chọn khóa học <span className="text-red-500">*</span>
      </label>
      {role === 'admin' && (
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-line p-2.5 text-sm focus:border-accent focus:outline-none"
            placeholder="Tìm khóa học theo tên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleSearch(); } }}
          />
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searching}
            className="rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-hover"
          >
            Tìm
          </button>
        </div>
      )}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-line divide-y divide-line">
        {options.length === 0 ? (
          <div className="p-4 text-center text-sm text-ink-muted">
            {role === 'admin' ? 'Tìm kiếm khóa học ở trên.' : 'Bạn chưa có khóa học nào.'}
          </div>
        ) : (
          options.map((course) => (
            <label key={course.id} className="flex items-center gap-2 p-2.5 text-sm text-ink hover:bg-surface-hover cursor-pointer">
              <input
                type={multiple ? 'checkbox' : 'radio'}
                checked={selectedIds.includes(course.id)}
                onChange={() => toggle(course.id)}
              />
              {course.title}
            </label>
          ))
        )}
      </div>
      {selectedIds.length === 0 && (
        <p className="mt-1 text-xs text-danger">Cần chọn ít nhất 1 khóa học.</p>
      )}
    </div>
  );
}
