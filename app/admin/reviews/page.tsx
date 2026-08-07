import { ReviewManager } from '@/components/admin/ReviewManager';

export default function AdminReviewsPage() {
  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Kiểm duyệt đánh giá</h1>
      <ReviewManager />
    </>
  );
}
