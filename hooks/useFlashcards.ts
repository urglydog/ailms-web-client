import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashcardsApi, FlashcardReviewReq, FlashcardUpdateReq } from '@/lib/api/flashcards';
import { toast } from 'sonner';

export const useReviewFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: number; data: FlashcardReviewReq }) =>
      flashcardsApi.reviewCard(flashcardId, data),
    onSuccess: () => {
      // Invalidate deck study cards to refresh due status
      queryClient.invalidateQueries({ queryKey: ['deck-study-cards'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi cập nhật tiến độ ôn tập');
    },
  });
};

export const useUpdateFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: number; data: FlashcardUpdateReq }) =>
      flashcardsApi.updateFlashcard(flashcardId, data),
    onSuccess: () => {
      toast.success('Đã cập nhật nội dung flashcard!');
      queryClient.invalidateQueries({ queryKey: ['material-detail'] });
      queryClient.invalidateQueries({ queryKey: ['deck-study-cards'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi cập nhật flashcard');
    },
  });
};

export const useDeckStudyCards = (deckId: number | undefined) => {
  return useQuery({
    queryKey: ['deck-study-cards', deckId],
    queryFn: () => flashcardsApi.getDeckStudyCards(deckId!),
    enabled: !!deckId,
  });
};
