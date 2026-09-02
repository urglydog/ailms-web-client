import { useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardsApi, FlashcardReviewReq } from '@/lib/api/flashcards';
import { toast } from 'sonner';

export const useReviewFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: number; data: FlashcardReviewReq }) =>
      flashcardsApi.reviewCard(flashcardId, data),
    onSuccess: (res) => {
      // Refresh material detail to get new flashcard stats if needed
      // Or we can just let the component handle the local state update for faster UI
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi cập nhật tiến độ ôn tập');
    },
  });
};
