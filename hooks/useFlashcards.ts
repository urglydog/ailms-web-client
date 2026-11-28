import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashcardsApi, FlashcardReviewReq, FlashcardUpdateReq, FlashcardAddReq } from '@/lib/api/flashcards';
import { toast } from 'sonner';
import { tr } from '@/lib/i18n/translate';

export const useReviewFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: number; data: FlashcardReviewReq }) =>
      flashcardsApi.reviewCard(flashcardId, data),
    onSuccess: () => {
      // Invalidate deck study cards to refresh due status
      queryClient.invalidateQueries({ queryKey: ['deck-study-cards'] });
      // Also invalidate material detail so FlashcardStudyMode (which reads
      // from useMaterialDetail, NOT useDeckStudyCards) gets updated isDue flags.
      queryClient.invalidateQueries({ queryKey: ['materials', 'detail'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || tr('errors.toast.flashcards.progressFailed'));
    },
  });
};

export const useUpdateFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: number; data: FlashcardUpdateReq }) =>
      flashcardsApi.updateFlashcard(flashcardId, data),
    onSuccess: () => {
      toast.success(tr('errors.toast.flashcards.updated'));
      queryClient.invalidateQueries({ queryKey: ['materials', 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['deck-study-cards'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || tr('errors.toast.flashcards.updateFailed'));
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

export const useAddFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deckId, data }: { deckId: number; data: FlashcardAddReq }) =>
      flashcardsApi.addFlashcard(deckId, data),
    onSuccess: () => {
      toast.success(tr('errors.toast.flashcards.added'));
      queryClient.invalidateQueries({ queryKey: ['materials', 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['deck-study-cards'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || tr('errors.toast.flashcards.addFailed'));
    },
  });
};

export const useDeleteFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flashcardId: number) => flashcardsApi.deleteFlashcard(flashcardId),
    onSuccess: () => {
      toast.success(tr('errors.toast.flashcards.deleted'));
      queryClient.invalidateQueries({ queryKey: ['materials', 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['deck-study-cards'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || tr('errors.toast.flashcards.deleteFailed'));
    },
  });
};
