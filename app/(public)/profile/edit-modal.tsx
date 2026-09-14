/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useUpdateProfile, useUploadAvatar } from '@/hooks/useCurrentUser';
import type { User } from '@/types/domain';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * (14/09/2026) — ảnh đại diện giờ là UPLOAD FILE THẬT (cùng khuôn ảnh bìa khóa học,
 * `useUploadAvatar`/`UserService.uploadAvatar`), thay ô nhập URL thủ công cũ. Bấm chọn file
 * là tải lên NGAY (không chờ bấm "Lưu") — khớp cảm giác quen thuộc của Udemy/Facebook: đổi
 * avatar là 1 hành động độc lập, tách khỏi form họ tên/ngôn ngữ bên dưới.
 */
export default function EditProfileModal({ user, onClose, onSuccess }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage || 'vi');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate({ file });
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateProfile.mutateAsync({ fullName, preferredLanguage });
      onSuccess();
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-ink">Chỉnh sửa hồ sơ</h2>

        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 font-display text-2xl font-bold text-accent-dark">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-16 w-16 object-cover" />
            ) : (
              user.fullName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {uploadAvatar.isPending ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
            </button>
            <p className="mt-1 text-xs text-ink-faint">JPEG/PNG/WEBP, tối đa 5MB</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Họ tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Ngôn ngữ ưa thích</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex-1 bg-accent text-white py-2 rounded-lg hover:bg-accent-dark disabled:opacity-50 font-semibold transition-colors"
            >
              {updateProfile.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-line text-ink py-2 rounded-lg hover:bg-line-dot font-semibold transition-colors"
            >
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
