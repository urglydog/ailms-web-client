'use client';

import { useState } from 'react';
import { useMyBundles, useCreateBundle, useUpdateBundle } from '@/hooks/useBundles';
import { useMyCourses } from '@/hooks/useCourses';
import type { CourseBundle, CreateBundleReq, UpdateBundleReq } from '@/types/domain';

// ── Helpers ──────────────────────────────────────────────────────

function fmt(amount: number) {
  return amount.toLocaleString('vi-VN') + '₫';
}

// ── Sidebar Form ─────────────────────────────────────────────────

interface BundleFormProps {
  editing: CourseBundle | null;
  onClose: () => void;
}

function BundleForm({ editing, onClose }: BundleFormProps) {
  const { data: coursesData } = useMyCourses({ status: 'PUBLISHED' });
  const publishedCourses = coursesData?.content ?? [];

  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [discountPercent, setDiscountPercent] = useState(editing?.discountPercent ?? 10);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [selectedIds, setSelectedIds] = useState<number[]>(editing?.courses.map((c) => c.id) ?? []);

  const isPending = createBundle.isPending || updateBundle.isPending;

  function toggleCourse(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // ── Preview pricing ─────────────────────────────────────────
  const selectedCourses = publishedCourses.filter((c) => selectedIds.includes(c.id));
  const originalSum = selectedCourses.reduce((s, c) => s + (c.price ?? 0), 0);
  const discountAmt = Math.round((originalSum * discountPercent) / 100);
  const finalPrice = originalSum - discountAmt;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length < 2) {
      alert('Gói phải có ít nhất 2 khóa học!');
      return;
    }
    if (editing) {
      const req: UpdateBundleReq = { title, description, discountPercent, isActive, courseIds: selectedIds };
      updateBundle.mutate({ id: editing.id, req }, { onSuccess: onClose });
    } else {
      const req: CreateBundleReq = { title, description, discountPercent, courseIds: selectedIds };
      createBundle.mutate(req, { onSuccess: onClose });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            {editing ? '✏️ Sửa gói khóa học' : '✨ Tạo gói khóa học mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          {/* Tên gói */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên gói <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Combo Lập trình Web Full-stack"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-gray-50"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả ngắn</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả lợi ích khi mua gói..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-gray-50 resize-none"
            />
          </div>

          {/* Giảm giá % */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mức giảm giá Bundle
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="flex-1 accent-cyan-500"
              />
              <span className="w-16 rounded-lg bg-cyan-100 text-cyan-700 font-bold text-sm text-center py-1.5">
                {discountPercent}%
              </span>
            </div>
          </div>

          {/* Chọn khóa học */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Chọn khóa học ({selectedIds.length} đã chọn — cần ít nhất 2)
            </label>
            {publishedCourses.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">
                Bạn chưa có khóa học nào đã xuất bản.
              </p>
            ) : (
              <div className="rounded-xl border border-gray-200 divide-y max-h-48 overflow-y-auto">
                {publishedCourses.map((course) => {
                  const selected = selectedIds.includes(course.id);
                  return (
                    <label
                      key={course.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selected ? 'bg-cyan-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCourse(course.id)}
                        className="h-4 w-4 rounded accent-cyan-600 flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-gray-800 truncate">{course.title}</span>
                      {course.price != null && (
                        <span className="text-sm font-semibold text-gray-500 flex-shrink-0">
                          {fmt(course.price)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview giá */}
          {selectedIds.length >= 2 && (
            <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Xem trước giá</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Giá gốc tổng</span>
                <span className="line-through text-slate-400">{fmt(originalSum)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Giảm {discountPercent}%</span>
                <span className="text-red-400 font-semibold">- {fmt(discountAmt)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2 mt-1">
                <span>Học viên trả</span>
                <span className="text-cyan-400">{fmt(finalPrice)}</span>
              </div>
            </div>
          )}

          {/* Trạng thái (khi sửa) */}
          {editing && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsActive((v) => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-cyan-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {isActive ? 'Đang hoạt động' : 'Đã tắt'}
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending || selectedIds.length < 2}
              className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Đang lưu...' : editing ? 'Cập nhật gói' : 'Tạo gói'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bundle Card ──────────────────────────────────────────────────

function BundleCard({ bundle, onEdit }: { bundle: CourseBundle; onEdit: () => void }) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden ${!bundle.isActive ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Header gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-700">
                -{bundle.discountPercent}%
              </span>
              {!bundle.isActive && (
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                  Đã tắt
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-[15px] font-bold text-gray-900 leading-tight line-clamp-2">
              {bundle.title}
            </h3>
            {bundle.description && (
              <p className="mt-1 text-xs text-gray-500 line-clamp-1">{bundle.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-cyan-300 hover:text-cyan-600 transition-colors"
          >
            Sửa
          </button>
        </div>

        {/* Courses list */}
        <ul className="space-y-1.5 mb-4">
          {bundle.courses.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              <span className="flex-1 truncate">{c.title}</span>
              <span className="font-semibold text-gray-400 flex-shrink-0">{fmt(c.price)}</span>
            </li>
          ))}
        </ul>

        {/* Price summary */}
        <div className="rounded-xl bg-gray-50 px-4 py-3 flex items-center justify-between border border-gray-100">
          <div className="text-xs text-gray-500">
            <span className="line-through">{fmt(bundle.originalPrice)}</span>
            <span className="ml-2 text-red-500 font-semibold">-{fmt(bundle.discountAmount)}</span>
          </div>
          <div className="text-base font-bold text-cyan-700">{fmt(bundle.finalPrice)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function BundleManager() {
  const { data, isLoading } = useMyBundles();
  const [editing, setEditing] = useState<CourseBundle | null>(null);
  const [showForm, setShowForm] = useState(false);

  const bundles = data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎁 Gói Khóa Học</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo combo khóa học với giá ưu đãi hơn để tăng doanh thu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-200 hover:from-cyan-700 hover:to-blue-700 transition-all active:scale-95"
        >
          <span className="text-lg leading-none">+</span>
          Tạo gói mới
        </button>
      </div>

      {/* Empty / Loading */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && bundles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-lg font-bold text-gray-700">Chưa có gói nào</h2>
          <p className="mt-1 text-sm text-gray-400 max-w-sm">
            Tạo gói đầu tiên để tăng tỷ lệ chuyển đổi và doanh thu trung bình mỗi đơn hàng.
          </p>
          <button
            type="button"
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="mt-5 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 transition-colors"
          >
            Tạo gói đầu tiên
          </button>
        </div>
      )}

      {!isLoading && bundles.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onEdit={() => { setEditing(bundle); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 flex gap-3">
        <span className="text-lg leading-tight flex-shrink-0">💡</span>
        <div>
          <p className="font-semibold mb-1">Cách gói khóa học hoạt động</p>
          <ul className="list-disc pl-4 space-y-0.5 text-blue-600">
            <li>Nếu học viên đã sở hữu 1 khóa trong gói, hệ thống tự <strong>trừ tiền</strong> khóa đó.</li>
            <li>Coupon riêng lẻ <strong>không áp dụng chồng</strong> lên khóa học trong gói.</li>
            <li>Giá được <strong>chốt ngay khi tạo đơn</strong>, không đổi kể cả khi bạn chỉnh giá sau.</li>
          </ul>
        </div>
      </div>

      {showForm && (
        <BundleForm
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
