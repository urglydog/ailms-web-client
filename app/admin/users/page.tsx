'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface InstructorRequest {
  id: number;
  userId: number;
  motivation: string;
  credentialUrl?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<InstructorRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/instructor-requests?status=PENDING`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRequests(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchRequests()]).finally(() => setLoading(false));
  }, []);

  const handleToggleBlock = async (userId: number, currentStatus: boolean) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} người dùng này?`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: userToUpdate.fullName,
          role: userToUpdate.role,
          isActive: !currentStatus
        })
      });
      if (res.ok) fetchUsers();
    } catch {
      alert('Có lỗi xảy ra');
    }
  };

  const handleApproveRequest = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    const reason = status === 'REJECTED' ? window.prompt('Nhập lý do từ chối:') : '';
    if (status === 'REJECTED' && !reason) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/instructor-requests/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNotes: reason })
      });
      if (res.ok) {
        fetchRequests();
        fetchUsers(); // Cập nhật lại danh sách user vì role có thể đã thay đổi
      } else {
        const error = await res.json();
        alert(error.detail || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Lỗi kết nối');
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Quản lý Người dùng</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-[14px] font-semibold ${
            activeTab === 'users' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tất cả người dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-[14px] font-semibold ${
            activeTab === 'requests' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Yêu cầu duyệt Giảng viên ({requests.length})
        </button>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Họ và tên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">#{u.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{u.fullName}</td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'INSTRUCTOR' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="text-green-600 font-semibold text-xs flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> Đang hoạt động
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold text-xs flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button 
                          onClick={() => handleToggleBlock(u.id, u.isActive)}
                          className={`text-xs font-bold ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {requests.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">Không có yêu cầu nào đang chờ duyệt.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">User ID</th>
                    <th className="px-6 py-4">Lý do</th>
                    <th className="px-6 py-4">Link CV / Portfolio</th>
                    <th className="px-6 py-4">Ngày gửi</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">#{r.userId}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={r.motivation}>{r.motivation}</td>
                      <td className="px-6 py-4">
                        {r.credentialUrl ? (
                          <a href={r.credentialUrl} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline">Xem Link</a>
                        ) : (
                          <span className="text-gray-400">Không có</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right flex gap-3 justify-end">
                        <button 
                          onClick={() => handleApproveRequest(r.id, 'APPROVED')}
                          className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded hover:bg-green-100"
                        >
                          Duyệt
                        </button>
                        <button 
                          onClick={() => handleApproveRequest(r.id, 'REJECTED')}
                          className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded hover:bg-red-100"
                        >
                          Từ chối
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
