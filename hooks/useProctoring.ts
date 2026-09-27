import { useQuery } from '@tanstack/react-query';
import { proctoringApi } from '@/lib/api/proctoring';

export const useProctoredAttempts = (courseId: number | undefined) => {
  return useQuery({
    queryKey: ['proctoring', 'attempts', courseId],
    queryFn: () => proctoringApi.getAttempts(courseId as number),
    enabled: !!courseId,
  });
};

export const useProctoredAttemptDetail = (attemptId: number | undefined) => {
  return useQuery({
    queryKey: ['proctoring', 'attempt-detail', attemptId],
    queryFn: () => proctoringApi.getAttemptDetail(attemptId as number),
    enabled: !!attemptId,
    // (27/09/2026, sửa lỗi "Chưa có video" bị kẹt) — video upload là 1 API riêng, bất đồng bộ SAU
    // khi nộp bài xong; nếu giảng viên mở xem đúng lúc video còn đang xử lý, tự poll mỗi 5s cho
    // tới khi có `videoUrl` thì dừng, không cần user tự F5 nữa.
    refetchInterval: (query) => (query.state.data?.videoUrl ? false : 5000),
  });
};
