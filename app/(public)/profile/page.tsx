/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditProfileModal from './edit-modal';
import ChangePasswordModal from './change-password-modal';

interface UserProfile {
  id?: number;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  authProvider?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivation, setMotivation] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const fetchUserAndRequest = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user profile
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        // Fetch requests status? For simplicity, we just allow them to submit.
        // A better approach would be fetching if they have a pending request.
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndRequest();
  }, [router]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/instructor-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ motivation, credentialUrl })
      });

      if (res.ok) {
        setMessage('Đã gửi yêu cầu thành công! Vui lòng chờ Admin duyệt.');
        setRequestStatus('PENDING');
      } else {
        const err = await res.json();
        setMessage(err.detail || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch {
      setMessage('Lỗi kết nối đến server.');
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;
  if (!user) return <div className="p-10 text-center">Không thể tải thông tin.</div>;

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Cột 1: Thông tin cá nhân */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 font-display text-2xl font-bold text-cyan-700">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                user.fullName?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-gray-900">{user.fullName}</h2>
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                Vai trò: {user.role}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
              <div className="mt-1 font-medium text-gray-900">{user.email}</div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngôn ngữ ưa thích</label>
              <div className="mt-1 font-medium text-gray-900">
                {user.preferredLanguage === 'en' ? 'English' : user.preferredLanguage === 'ja' ? '日本語' : 'Tiếng Việt'}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày tham gia</label>
              <div className="mt-1 font-medium text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa hồ sơ
              </button>
              {user.authProvider !== 'GOOGLE' && (
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
                >
                  Đổi mật khẩu
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cột 2: Đăng ký làm giảng viên */}
        {user.role === 'STUDENT' && (
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/30 p-6 shadow-sm">
            <h2 className="mb-2 font-display text-lg font-bold text-gray-900">Trở thành Giảng viên</h2>
            <p className="mb-6 text-sm text-gray-600">
              Chia sẻ kiến thức của bạn và tạo thêm thu nhập. Gửi yêu cầu để được xét duyệt.
            </p>

            {requestStatus === 'PENDING' ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-800 border border-amber-200">
                Yêu cầu của bạn đang được duyệt. Vui lòng chờ phản hồi từ Admin.
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    Lý do muốn làm giảng viên <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Giới thiệu kinh nghiệm giảng dạy của bạn..."
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    Link chứng chỉ / Portfolio
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
                  className="mt-2 w-full rounded-lg bg-cyan-600 py-3 text-sm font-bold text-white hover:bg-cyan-700 transition-colors"
                >
                  Gửi Yêu Cầu Nâng Cấp
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {showEditModal && user && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
            setShowEditModal(false);
          }}
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
