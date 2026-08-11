'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

export interface AdminPayment {
  txnRef: string;
  userEmail: string;
  courseTitle: string;
  amount: number;
  platformFee: number;
  instructorEarning: number;
  status: string;
  paidAt: string | null;
  gatewayTxnNo: string | null;
  billingName?: string;
  billingPhone?: string;
}

type SortField = 'txnRef' | 'userEmail' | 'amount' | 'paidAt';
type SortOrder = 'asc' | 'desc';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchDate, setSearchDate] = useState('');
  
  // Sort
  const [sortField, setSortField] = useState<SortField>('paidAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);
  
  const fetchPayments = () => {
    setLoading(true);
    paymentsApi
      .listAllAdmin()
      .then((data) => setPayments(data as unknown as AdminPayment[]))
      .catch(() => toast.error('Lỗi khi tải lịch sử giao dịch'))
      .finally(() => setLoading(false));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-success/10 text-success border-success/20';
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'FAILED':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'EXPIRED':
        return 'bg-ink-muted/10 text-ink-muted border-line';
      default:
        return 'bg-line text-ink border-line';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Thành công';
      case 'PENDING': return 'Đang chờ xử lý';
      case 'FAILED': return 'Thất bại';
      case 'EXPIRED': return 'Hết hạn';
      default: return status;
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

  // Lọc dữ liệu
  const filteredPayments = useMemo(() => {
    let result = [...payments];
    
    // Status
    if (statusFilter !== 'ALL') {
      result = result.filter(p => p.status === statusFilter);
    }
    
    // Email
    if (searchEmail.trim()) {
      const lowerSearch = searchEmail.toLowerCase();
      result = result.filter(p => p.userEmail?.toLowerCase().includes(lowerSearch));
    }
    
    // Date
    if (searchDate) {
      const targetDate = new Date(searchDate);
      result = result.filter(p => {
        if (!p.paidAt) return false;
        const pDate = new Date(p.paidAt);
        return isSameDay(pDate, targetDate);
      });
    }
    
    // Sắp xếp
    result.sort((a, b) => {
      let valA: string | number = a[sortField] || 0;
      let valB: string | number = b[sortField] || 0;
      
      if (sortField === 'paidAt') {
        valA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
        valB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [payments, statusFilter, searchEmail, searchDate, sortField, sortOrder]);

  // Phân trang
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchEmail, searchDate]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Đối soát thanh toán</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Quản lý và đối soát các giao dịch mua khóa học trên hệ thống.
          </p>
        </div>
        <button 
          onClick={fetchPayments}
          className="px-4 py-2 bg-surface-raised border border-line rounded-lg text-sm font-semibold hover:bg-line/50 transition-colors"
        >
          Làm mới dữ liệu
        </button>
      </div>
      
      {/* Bộ lọc */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1.5 w-full sm:w-64">
          <label className="text-xs font-semibold text-ink-muted uppercase">Tìm theo Email</label>
          <input 
            type="text" 
            placeholder="Nhập email học viên..." 
            className="w-full rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-cyan-500"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5 w-full sm:w-48">
          <label className="text-xs font-semibold text-ink-muted uppercase">Lọc theo ngày</label>
          <input 
            type="date" 
            className="w-full rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-cyan-500 text-ink"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5 w-full sm:w-48">
          <label className="text-xs font-semibold text-ink-muted uppercase">Trạng thái</label>
          <select 
            className="w-full rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-cyan-500 text-ink"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Thành công</option>
            <option value="PENDING">Đang chờ xử lý</option>
            <option value="FAILED">Thất bại</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-ink-muted">Đang tải dữ liệu...</div>
      ) : payments.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted border border-line">
          Chưa có giao dịch nào trên hệ thống.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto card border border-line rounded-xl">
            <table className="w-full text-left text-sm text-ink-muted">
              <thead className="bg-surface-raised text-xs uppercase text-ink border-b border-line">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('txnRef')}>
                    Mã giao dịch <SortIcon field="txnRef" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('userEmail')}>
                    Người dùng <SortIcon field="userEmail" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('amount')}>
                    Số tiền <SortIcon field="amount" />
                  </th>
                  <th className="px-6 py-4">Phí nền tảng</th>
                  <th className="px-6 py-4">Thực nhận</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-line/30" onClick={() => handleSort('paidAt')}>
                    Thời gian <SortIcon field="paidAt" />
                  </th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">Không tìm thấy giao dịch nào phù hợp với bộ lọc.</td>
                  </tr>
                ) : (
                  paginatedPayments.map((p) => (
                    <tr key={p.txnRef} className="hover:bg-surface-raised transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-ink">{p.txnRef.substring(0, 8)}</td>
                      <td className="px-6 py-4 font-medium text-ink max-w-[150px] truncate" title={p.userEmail}>{p.userEmail}</td>
                      <td className="px-6 py-4 font-semibold">
                        {p.amount?.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-6 py-4 text-warning font-semibold">
                        {p.platformFee ? p.platformFee.toLocaleString('vi-VN') + 'đ' : '-'}
                      </td>
                      <td className="px-6 py-4 text-success font-semibold">
                        {p.instructorEarning ? p.instructorEarning.toLocaleString('vi-VN') + 'đ' : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.paidAt ? format(new Date(p.paidAt), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedPayment(p)}
                          className="text-cyan-600 font-semibold hover:text-cyan-700 underline text-xs"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-2">
              <span className="text-sm text-ink-muted">
                Đang xem {paginatedPayments.length} / {filteredPayments.length} giao dịch
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
        </div>
      )}

      {/* Modal Chi Tiết */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-line flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-ink">Chi tiết giao dịch</h2>
              <button 
                onClick={() => setSelectedPayment(null)}
                className="text-ink-muted hover:text-ink text-xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="col-span-2">
                  <p className="text-sm font-medium text-ink-muted mb-1">Khóa học</p>
                  <p className="font-medium text-ink">{selectedPayment.courseTitle}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm font-medium text-ink-muted mb-1">Tài khoản mua</p>
                  <p className="font-medium text-ink">{selectedPayment.userEmail}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-ink-muted mb-1">Họ tên thanh toán</p>
                  <p className="font-medium text-ink">{selectedPayment.billingName || 'Không có'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-ink-muted mb-1">Số điện thoại</p>
                  <p className="font-medium text-ink">{selectedPayment.billingPhone || 'Không có'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink-muted mb-1">Phí nền tảng (30%)</p>
                  <p className="font-medium text-warning font-semibold">
                    {selectedPayment.platformFee ? selectedPayment.platformFee.toLocaleString('vi-VN') + 'đ' : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink-muted mb-1">Giảng viên nhận (70%)</p>
                  <p className="font-medium text-success font-semibold">
                    {selectedPayment.instructorEarning ? selectedPayment.instructorEarning.toLocaleString('vi-VN') + 'đ' : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink-muted mb-1">Trạng thái</p>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink-muted mb-1">Lý do thất bại</p>
                  <p className="font-medium text-ink">{selectedPayment.status === 'FAILED' ? 'Bị hủy bởi hệ thống cổng thanh toán hoặc người dùng tự hủy.' : 'Không có'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-ink-muted mb-1">Mã tham chiếu</p>
                  <p className="font-mono text-sm text-ink bg-surface-raised px-2 py-1 rounded inline-block">{selectedPayment.txnRef}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-ink-muted mb-1">Mã cổng TT</p>
                  <p className="font-mono text-sm text-ink">{selectedPayment.gatewayTxnNo || 'Chưa có'}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-surface-raised border-t border-line flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => toast.info('Tính năng hoàn tiền đang được phát triển.')}
                  className="px-3 py-1.5 bg-danger/10 text-danger text-sm font-semibold rounded hover:bg-danger/20 transition-colors"
                >
                  Hoàn tiền
                </button>
                <button
                  onClick={() => toast.info('Đã đánh dấu báo cáo thành công!')}
                  className="px-3 py-1.5 border border-line bg-surface text-ink text-sm font-semibold rounded hover:bg-line/50 transition-colors"
                >
                  Xử lý khiếu nại
                </button>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-5 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
