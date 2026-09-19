'use client';

import { useState } from 'react';
import { useCreateCoupon, useDeleteCoupon, useMyCoupons, useUpdateCoupon } from '@/hooks/useCoupons';
import type { Coupon, DiscountType } from '@/types/domain';

const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  PERCENTAGE: 'Theo %',
  FIXED_AMOUNT: 'Số tiền cố định',
};

interface FormState {
  code: string;
  autoApply: boolean;
  discountType: DiscountType;
  discountValue: string;
  startAt: string;
  endAt: string;
  maxUsageCount: string;
  maxUsagePerUser: string;
}

function emptyForm(): FormState {
  return {
    code: '',
    autoApply: true,
    discountType: 'PERCENTAGE',
    discountValue: '',
    startAt: '',
    endAt: '',
    maxUsageCount: '',
    maxUsagePerUser: '',
  };
}

/**
 * "Khuyến mãi" — giao diện tham khảo Udemy (19/09/2026, mở rộng ngoài đặc tả gốc). Rút gọn từ
 * `CouponManager.tsx` dùng chung (Admin/Instructor toàn hệ thống): trang NÀY luôn tạo coupon
 * phạm vi `SINGLE_COURSE` cho ĐÚNG khóa học đang mở, bỏ hẳn bước chọn phạm vi/chọn khóa học vì
 * đã biết trước — chỉ liệt kê coupon liên quan tới khóa này (`SINGLE_COURSE`/`SPECIFIC_COURSES`
 * có chứa khóa này, hoặc `ALL_COURSES` do CHÍNH giảng viên này tạo — coupon đó tự áp dụng cho
 * mọi khóa của họ, gồm cả khóa này, xem BR-COUPON-02).
 *
 * <b>Chưa làm</b> (theo yêu cầu, để lần sau): "Giới thiệu sinh viên" — link giới thiệu kiểu Udemy
 * theo dõi được ai mua qua link nào để chia thêm 1 nguồn doanh thu khác ngoài BR-PAY-05 (30/70
 * hiện có). Cần thêm cột theo dõi nguồn giới thiệu trên `Payment` + logic tính tỉ lệ chia mới —
 * phạm vi lớn hơn 1 trang Khuyến mãi, chưa làm trong lượt này.
 */
export function CoursePromotionsPanel({ courseId }: { courseId: number }) {
  const { data: coupons, isLoading } = useMyCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const relevantCoupons = (coupons ?? []).filter(
    (c) => c.scopeType === 'ALL_COURSES' || c.courses.some((ref) => ref.courseId === courseId),
  );

  const openCreate = () => {
    setForm(emptyForm());
    setEditing('new');
  };
  const openEdit = (coupon: Coupon) => {
    setForm({
      code: coupon.code ?? '',
      autoApply: coupon.autoApply,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      startAt: coupon.startAt.slice(0, 16),
      endAt: coupon.endAt.slice(0, 16),
      maxUsageCount: coupon.maxUsageCount != null ? String(coupon.maxUsageCount) : '',
      maxUsagePerUser: coupon.maxUsagePerUser != null ? String(coupon.maxUsagePerUser) : '',
    });
    setEditing(coupon);
  };
  const closeModal = () => setEditing(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req = {
      code: form.autoApply ? undefined : form.code.trim(),
      autoApply: form.autoApply,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      scopeType: 'SINGLE_COURSE' as const,
      courseIds: [courseId],
      startAt: form.startAt,
      endAt: form.endAt,
      maxUsageCount: form.maxUsageCount ? Number(form.maxUsageCount) : null,
      maxUsagePerUser: form.maxUsagePerUser ? Number(form.maxUsagePerUser) : null,
    };
    if (editing === 'new') {
      createCoupon.mutate(req, { onSuccess: closeModal });
    } else if (editing) {
      updateCoupon.mutate({ id: editing.id, req: { ...req, isActive: editing.isActive } }, { onSuccess: closeModal });
    }
  };

  const isSaving = createCoupon.isPending || updateCoupon.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-display text-[16px] font-bold text-gray-900">Giới thiệu sinh viên</h2>
        <p className="text-[12.5px] text-gray-500">
          Tính năng chia sẻ link giới thiệu và ghi nhận doanh số riêng đang được lên kế hoạch, chưa có ở
          phiên bản này.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-[16px] font-bold text-gray-900">Mã giảm giá cho khóa học này</h2>
            <p className="mt-1 text-[12.5px] text-gray-500">
              Áp dụng riêng cho khóa này. Mã &quot;tự động&quot; hiện giá đã giảm ngay trên trang khóa học, không
              cần học viên nhập mã.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 rounded-full bg-cyan-600 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-cyan-700"
          >
            + Tạo mã giảm giá
          </button>
        </div>

        {isLoading ? (
          <p className="text-[12.5px] text-gray-400">Đang tải...</p>
        ) : relevantCoupons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-[12.5px] text-gray-400">
            Chưa có mã giảm giá nào cho khóa học này.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {relevantCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] font-bold text-gray-900">
                    {coupon.code ?? <span className="italic font-sans font-normal text-gray-500">Tự động</span>}
                  </span>
                  <span className="text-[12.5px] text-gray-600">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `-${coupon.discountValue}%`
                      : `-${coupon.discountValue.toLocaleString('vi-VN')}đ`}
                  </span>
                  {coupon.scopeType === 'ALL_COURSES' && (
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10.5px] font-bold text-cyan-700">
                      Toàn bộ khóa học của bạn
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                      coupon.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {coupon.isActive ? 'Đang bật' : 'Đã tắt'}
                  </span>
                  <span className="text-[11.5px] text-gray-400">
                    {new Date(coupon.startAt).toLocaleDateString('vi-VN')} – {new Date(coupon.endAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {coupon.scopeType !== 'ALL_COURSES' && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(coupon)}
                      className="text-[11.5px] font-bold text-cyan-700 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCoupon.mutate(coupon.id)}
                      className="text-[11.5px] font-bold text-red-500 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 font-display text-lg font-bold text-gray-900">
              {editing === 'new' ? 'Tạo mã giảm giá' : 'Sửa mã giảm giá'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.autoApply}
                  onChange={(e) => setForm((f) => ({ ...f, autoApply: e.target.checked }))}
                />
                Tự động áp dụng (không cần nhập mã)
              </label>
              {!form.autoApply && (
                <input
                  required
                  type="text"
                  placeholder="Mã giảm giá, VD: SALE50"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase focus:border-cyan-400 focus:outline-none"
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as DiscountType }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                >
                  {Object.entries(DISCOUNT_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <input
                  required
                  type="number"
                  min={0}
                  max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                  step="0.01"
                  placeholder="Giá trị"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-semibold text-gray-600">Bắt đầu</span>
                  <input
                    required
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-semibold text-gray-600">Kết thúc</span>
                  <input
                    required
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  placeholder="Giới hạn lượt dùng"
                  value={form.maxUsageCount}
                  onChange={(e) => setForm((f) => ({ ...f, maxUsageCount: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Giới hạn / học viên"
                  value={form.maxUsagePerUser}
                  onChange={(e) => setForm((f) => ({ ...f, maxUsagePerUser: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
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
