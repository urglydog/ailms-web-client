'use client';

import { BalanceCards } from '@/components/instructor/earnings/BalanceCards';
import { DebtCard } from '@/components/instructor/earnings/DebtCard';
import { LedgerTable } from '@/components/instructor/earnings/LedgerTable';
import { PayoutAccountCard } from '@/components/instructor/earnings/PayoutAccountCard';
import { PayoutHistory } from '@/components/instructor/earnings/PayoutHistory';
import { RequestPayoutCard } from '@/components/instructor/earnings/RequestPayoutCard';
import { PageHeader } from '@/components/instructor/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFinanceSummary } from '@/hooks/useFinance';

/**
 * "Thu nhập" của giảng viên (11/11/2026, Epic hoàn tiền – chi trả, Giai đoạn C): số dư, tài khoản nhận tiền, yêu cầu rút,
 * lịch sử và sao kê. Mọi con số do BE tính từ sổ cái; trang này chỉ hiển thị. Quyền thật do BE kiểm (INSTRUCTOR).
 */
export default function InstructorEarningsPage() {
  const { data: summary, isLoading, isError } = useFinanceSummary();

  return (
    <>
      <PageHeader
        title="Thu nhập & Rút tiền"
        subtitle="Thu nhập từ khóa học được giữ trong thời gian hoàn tiền rồi mới rút được. Bạn rút theo yêu cầu, có xác nhận qua email."
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : isError || !summary ? (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-center text-danger">
          Không tải được thông tin thu nhập. Vui lòng thử lại.
        </div>
      ) : (
        <>
          <BalanceCards summary={summary} />
          <DebtCard />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PayoutAccountCard summary={summary} />
            <RequestPayoutCard summary={summary} />
          </div>
          <PayoutHistory />
          <LedgerTable />
        </>
      )}
    </>
  );
}
