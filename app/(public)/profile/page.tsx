/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { useCurrentUser, useUpdatePrivacy } from '@/hooks/useCurrentUser';
import EditProfileModal from './edit-modal';
import ChangePasswordModal from './change-password-modal';

/**
 * Hồ sơ cá nhân (14/09/2026, hợp nhất) — trước đây tự `fetch()` thô + tự đọc token, không
 * đồng bộ với Header (xem `hooks/useCurrentUser.ts`). Giờ dùng chung 1 nguồn sự thật:
 * `useCurrentUser()` — đổi avatar/tên/quyền riêng tư ở đây thì Header cập nhật ngay (cùng
 * React Query cache), không cần refresh trang.
 *
 * `?edit=1` (từ link "tên" ở dropdown Header — kiểu Udemy "click tên → vào thẳng edit profile")
 * tự mở `EditProfileModal` khi vào trang — `useSearchParams` bắt buộc nằm trong `<Suspense>`
 * (yêu cầu Next.js App Router), theo đúng khuôn đã dùng ở `app/(public)/courses/page.tsx`.
 */
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Đang tải...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useCurrentUser();
  const updatePrivacy = useUpdatePrivacy();

  const [motivation, setMotivation] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (searchParams.get('edit') === '1') setShowEditModal(true);
  }, [searchParams]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/api/v1/instructor-requests', { motivation, credentialUrl }, { token: getAccessToken() ?? undefined });
      setMessage('Đã gửi yêu cầu thành công! Vui lòng chờ Admin duyệt.');
      setRequestStatus('PENDING');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  if (isLoading) return <div className="p-10 text-center">Đang tải...</div>;
  if (!user) return <div className="p-10 text-center">Không thể tải thông tin.</div>;

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Hồ sơ cá nhân</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Cột 1: Thông tin cá nhân */}
        <div className="rounded-card border border-line bg-white p-6 shadow-card">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 font-display text-2xl font-bold text-accent-dark">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                user.fullName?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{user.fullName}</h2>
              <span className="inline-block rounded-full bg-surface-hover px-3 py-1 text-xs font-semibold text-ink-muted">
                Vai trò: {user.role}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Email</label>
              <div className="mt-1 font-medium text-ink">{user.email}</div>
            </div>
            <div>
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Ngôn ngữ ưa thích</label>
              <div className="mt-1 font-medium text-ink">
                {user.preferredLanguage === 'en' ? 'English' : user.preferredLanguage === 'ja' ? '日本語' : 'Tiếng Việt'}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Ngày tham gia</label>
              <div className="mt-1 font-medium text-ink">
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                Chỉnh sửa hồ sơ
              </button>
              {user.authProvider !== 'GOOGLE' && (
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex-1 rounded-lg bg-ink-muted px-4 py-2 text-sm font-semibold text-white hover:bg-ink transition-colors"
                >
                  Đổi mật khẩu
                </button>
              )}
            </div>
            <Link
              href={`/u/${user.id}`}
              className="rounded-lg border border-line px-4 py-2 text-center text-sm font-semibold text-ink hover:border-accent hover:text-accent transition-colors no-underline"
            >
              Xem hồ sơ công khai
            </Link>
          </div>
        </div>

        {/* Cột 2: Quyền riêng tư + Đăng ký làm giảng viên */}
        <div className="flex flex-col gap-8">
          {/* "View public profile" (14/09/2026, mở rộng) — 2 công tắc tách riêng, xem User.java */}
          <div className="rounded-card border border-line bg-white p-6 shadow-card">
            <h2 className="mb-1 font-display text-lg font-bold text-ink">Quyền riêng tư hồ sơ công khai</h2>
            <p className="mb-4 text-sm text-ink-muted">
              Người khác xem trang{' '}
              <Link href={`/u/${user.id}`} className="text-accent underline-offset-4 hover:underline">
                hồ sơ công khai
              </Link>{' '}
              của bạn sẽ thấy những mục bạn bật dưới đây.
            </p>
            <div className="flex flex-col gap-3">
              <PrivacyToggle
                label="Hiện khóa học đã học"
                checked={user.coursesPublic}
                disabled={updatePrivacy.isPending}
                onChange={(checked) => updatePrivacy.mutate({ coursesPublic: checked, wishlistPublic: user.wishlistPublic })}
              />
              <PrivacyToggle
                label="Hiện danh sách yêu thích"
                checked={user.wishlistPublic}
                disabled={updatePrivacy.isPending}
                onChange={(checked) => updatePrivacy.mutate({ coursesPublic: user.coursesPublic, wishlistPublic: checked })}
              />
            </div>
          </div>

          {user.role === 'STUDENT' && (
            <div className="rounded-card border border-accent/20 bg-accent/5 p-6 shadow-card">
              <h2 className="mb-2 font-display text-lg font-bold text-ink">Trở thành Giảng viên</h2>
              <p className="mb-6 text-sm text-ink-muted">
                Chia sẻ kiến thức của bạn và tạo thêm thu nhập. Gửi yêu cầu để được xét duyệt.
              </p>

              {requestStatus === 'PENDING' ? (
                <div className="rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-800 border border-amber-200">
                  Yêu cầu của bạn đang được duyệt. Vui lòng chờ phản hồi từ Admin.
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      Lý do muốn làm giảng viên <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="w-full rounded-lg border border-line p-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Giới thiệu kinh nghiệm giảng dạy của bạn..."
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      Link chứng chỉ / Portfolio
                    </label>
                    <input
                      type="url"
                      className="w-full rounded-lg border border-line p-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="https://..."
                      value={credentialUrl}
                      onChange={(e) => setCredentialUrl(e.target.value)}
                    />
                  </div>

                  {message && (
                    <div className={`text-sm font-medium ${message.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="mt-2 w-full rounded-lg bg-accent py-3 text-sm font-bold text-white hover:bg-accent-dark transition-colors"
                  >
                    Gửi Yêu Cầu Nâng Cấp
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => setShowEditModal(false)}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}

function PrivacyToggle({
  label, checked, disabled, onChange,
}: {
  label: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? 'bg-accent' : 'bg-line'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
