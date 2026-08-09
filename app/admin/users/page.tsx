'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface InstructorRequest {
  id: number;
  userId: number;
  motivation: string;
  credentialUrl?: string;
  createdAt: string;
}

type SortField = 'id' | 'fullName' | 'email' | 'role' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<InstructorRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Sort
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch {
      toast.error('Lỗi khi tải danh sách người dùng');
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/instructor-requests?status=PENDING`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRequests(await res.json());
    } catch {
      toast.error('Lỗi khi tải danh sách yêu cầu giảng viên');
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
      if (res.ok) {
        toast.success(`Đã ${currentStatus ? 'khóa' : 'mở khóa'} người dùng`);
        fetchUsers();
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật');
      }
    } catch {
      toast.error('Có lỗi kết nối');
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
        toast.success(`Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} yêu cầu`);
        fetchRequests();
        fetchUsers(); // Cập nhật lại danh sách user vì role có thể đã thay đổi
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="opacity-30 ml-1">↕</span>;
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // Filter and Sort Users
  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(lowerQ) || 
        u.email.toLowerCase().includes(lowerQ)
      );
    }
    
    if (roleFilter !== 'ALL') {
      result = result.filter(u => u.role === roleFilter);
    }
    
    result.sort((a, b) => {
      let valA: string | number = (a as Record<string, string | number>)[sortField] || 0;
      let valB: string | number = (b as Record<string, string | number>)[sortField] || 0;
      
      if (sortField === 'createdAt') {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [users, searchQuery, roleFilter, sortField, sortOrder]);

  // Pagination Users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  if (loading) return <div className="text-ink-muted">Đang tải dữ liệu...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Quản lý Người dùng</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Quản lý tài khoản, vai trò và phê duyệt giảng viên mới.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-line">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-[14px] font-semibold transition-colors ${
            activeTab === 'users' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Tất cả người dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-[14px] font-semibold transition-colors ${
            activeTab === 'requests' ? 'border-b-2 border-cyan-600 text-cyan-600' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Yêu cầu duyệt Giảng viên ({requests.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {activeTab === 'users' ? (
          <>
            {/* Bộ lọc Users */}
            <div className="card p-4 flex flex-wrap gap-4 items-center border border-line bg-surface">
              <div className="flex flex-col gap-1.5 w-full sm:w-64">
                <label className="text-xs font-semibold text-ink-muted uppercase">Tìm kiếm</label>
                <input 
                  type="text" 
                  placeholder="Tên hoặc email..." 
                  className="w-full rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-cyan-500 text-ink"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full sm:w-48">
                <label className="text-xs font-semibold text-ink-muted uppercase">Vai trò</label>
                <select 
                  className="w-full rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-cyan-500 text-ink"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="STUDENT">Học viên (STUDENT)</option>
                  <option value="INSTRUCTOR">Giảng viên (INSTRUCTOR)</option>
                  <option value="ADMIN">Quản trị (ADMIN)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto card border border-line rounded-xl">
              <table className="w-full text-left text-sm text-ink-muted">
                <thead className="bg-surface-raised text-xs uppercase text-ink border-b border-line">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('id')}>
                      ID <SortIcon field="id" />
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('fullName')}>
                      Họ và tên <SortIcon field="fullName" />
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('email')}>
                      Email <SortIcon field="email" />
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('createdAt')}>
                      Ngày tạo <SortIcon field="createdAt" />
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('role')}>
                      Vai trò <SortIcon field="role" />
                    </th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">Không tìm thấy người dùng phù hợp.</td>
                    </tr>
                  ) : (
                    paginatedUsers.map(u => (
                      <tr key={u.id} className="hover:bg-surface-raised transition-colors">
                        <td className="px-6 py-4 font-medium text-ink">#{u.id}</td>
                        <td className="px-6 py-4 font-semibold text-ink">{u.fullName}</td>
                        <td className="px-6 py-4 text-ink-muted">{u.email}</td>
                        <td className="px-6 py-4 text-ink-muted">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-accent/10 text-accent border border-accent/20' :
                            u.role === 'INSTRUCTOR' ? 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20' : 'bg-surface-raised text-ink-muted border border-line'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.isActive ? (
                            <span className="text-success font-semibold text-xs flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-success"></span> Hoạt động
                            </span>
                          ) : (
                            <span className="text-danger font-semibold text-xs flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-danger"></span> Bị khóa
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {u.role !== 'ADMIN' && (
                            <button 
                              onClick={() => handleToggleBlock(u.id, u.isActive)}
                              className={`text-xs font-bold underline ${u.isActive ? 'text-danger hover:text-danger-dark' : 'text-success hover:text-success-dark'}`}
                            >
                              {u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang Users */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-2">
                <span className="text-sm text-ink-muted">
                  Đang xem {paginatedUsers.length} / {filteredUsers.length} người dùng
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-3 py-1.5 rounded bg-surface-raised border border-line text-sm font-semibold disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold text-ink">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-3 py-1.5 rounded bg-surface-raised border border-line text-sm font-semibold disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="overflow-x-auto card border border-line rounded-xl">
            {requests.length === 0 ? (
              <div className="p-10 text-center text-sm text-ink-muted">Không có yêu cầu nào đang chờ duyệt.</div>
            ) : (
              <table className="w-full text-left text-sm text-ink-muted">
                <thead className="bg-surface-raised text-xs uppercase text-ink border-b border-line">
                  <tr>
                    <th className="px-6 py-4">User ID</th>
                    <th className="px-6 py-4">Lý do</th>
                    <th className="px-6 py-4">Link CV / Portfolio</th>
                    <th className="px-6 py-4">Ngày gửi</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-surface-raised transition-colors">
                      <td className="px-6 py-4 font-semibold text-ink">#{r.userId}</td>
                      <td className="px-6 py-4 text-ink max-w-xs truncate" title={r.motivation}>{r.motivation}</td>
                      <td className="px-6 py-4">
                        {r.credentialUrl ? (
                          <a href={r.credentialUrl} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline">Xem Link</a>
                        ) : (
                          <span className="text-ink-muted">Không có</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-ink-muted">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right flex gap-2 justify-end">
                        <button 
                          onClick={() => handleApproveRequest(r.id, 'APPROVED')}
                          className="text-xs font-bold text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded hover:bg-success/20"
                        >
                          Duyệt
                        </button>
                        <button 
                          onClick={() => handleApproveRequest(r.id, 'REJECTED')}
                          className="text-xs font-bold text-danger bg-danger/10 border border-danger/20 px-3 py-1.5 rounded hover:bg-danger/20"
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
    </div>
  );
}
