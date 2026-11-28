'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';

import { useState } from 'react';
import { useCreateCoupon, useDeleteCoupon, useMyCoupons, useUpdateCoupon } from '@/hooks/useCoupons';
import type { Coupon, DiscountType } from '@/types/domain';

const DISCOUNT_TYPE_LABEL_KEY: Record<DiscountType, string> = {
  PERCENTAGE: 'typePercentage',
  FIXED_AMOUNT: 'typeFixed',
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
  const t = useTranslations('instructor.promotions');
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
      <div className="rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
        <h2 className="mb-1 font-display text-[16px] font-bold text-ink">{t('referralTitle')}</h2>
        <p className="text-[12.5px] text-ink-muted">
          {t('referralBody')}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface-raised p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-[16px] font-bold text-ink">{t('couponsTitle')}</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              {t('couponsHint')}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-[12.5px] font-bold text-white hover:bg-accent-dark"
          >
            {t('create')}
          </button>
        </div>

        {isLoading ? (
          <p className="text-[12.5px] text-ink-faint">{t('loading')}</p>
        ) : relevantCoupons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-[12.5px] text-ink-faint">
            {t('empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {relevantCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-soft bg-surface/60 px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] font-bold text-ink">
                    {coupon.code ?? <span className="italic font-sans font-normal text-ink-muted">{t('automatic')}</span>}
                  </span>
                  <span className="text-[12.5px] text-ink-muted">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `-${coupon.discountValue}%`
                      : `-${coupon.discountValue.toLocaleString('vi-VN')}đ`}
                  </span>
                  {coupon.scopeType === 'ALL_COURSES' && (
                    <span className="rounded-full bg-tint px-2 py-0.5 text-[10.5px] font-bold text-accent-dark">
                      {t('allCourses')}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                      coupon.isActive ? 'bg-success-tint text-success' : 'bg-tint text-ink-muted'
                    }`}
                  >
                    {coupon.isActive ? t('on') : t('off')}
                  </span>
                  <span className="text-[11.5px] text-ink-faint">
                    {new Date(coupon.startAt).toLocaleDateString('vi-VN')} – {new Date(coupon.endAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {coupon.scopeType !== 'ALL_COURSES' && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(coupon)}
                      className="text-[11.5px] font-bold text-accent-dark hover:underline"
                    >
                      {t('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCoupon.mutate(coupon.id)}
                      className="text-[11.5px] font-bold text-danger hover:underline"
                    >
                      {t('delete')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <Modal open onClose={() => setEditing(null)} bare ariaLabel={String(editing === 'new' ? t('createTitle') : t('editTitle'))} closeOnBackdrop={false} className="w-full max-w-md rounded-2xl bg-surface-raised p-6 shadow-2xl">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">
              {editing === 'new' ? t('createTitle') : t('editTitle')}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={form.autoApply}
                  onChange={(e) => setForm((f) => ({ ...f, autoApply: e.target.checked }))}
                />
                {t('autoApply')}
              </label>
              {!form.autoApply && (
                <input
                  required
                  type="text"
                  placeholder={t('codePlaceholder')}
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="rounded-lg border border-line px-3 py-2 text-sm uppercase focus:border-accent focus:outline-none"
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as DiscountType }))}
                  className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  {Object.entries(DISCOUNT_TYPE_LABEL_KEY).map(([value, labelKey]) => (
                    <option key={value} value={value}>{t(labelKey)}</option>
                  ))}
                </select>
                <input
                  required
                  type="number"
                  min={0}
                  max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                  step="0.01"
                  placeholder={t('valuePlaceholder')}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-semibold text-ink-muted">{t('start')}</span>
                  <input
                    required
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11.5px] font-semibold text-ink-muted">{t('end')}</span>
                  <input
                    required
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                    className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  placeholder={t('usageLimit')}
                  value={form.maxUsageCount}
                  onChange={(e) => setForm((f) => ({ ...f, maxUsageCount: e.target.value }))}
                  className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  min={1}
                  placeholder={t('perLearnerLimit')}
                  value={form.maxUsagePerUser}
                  onChange={(e) => setForm((f) => ({ ...f, maxUsagePerUser: e.target.value }))}
                  className="rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted hover:bg-tint"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-60"
                >
                  {isSaving ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </Modal>
      )}
    </div>
  );
}
