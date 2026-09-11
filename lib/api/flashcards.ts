import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

function authToken() {
  return getAccessToken() ?? undefined;
}

export interface FlashcardReviewReq {
  quality: number; // 0 to 5
}

export interface FlashcardReviewRes {
  flashcardId: number;
  nextReviewAt: string;
  intervalDays: number;
  repetitions: number;
  easiness: number;
}

export interface FlashcardUpdateReq {
  frontText?: string;
  backText?: string;
}

export interface FlashcardCardWithReview {
  id: number;
  frontText: string;
  backText: string;
  nextReviewAt: string | null;
  intervalDays: number;
  repetitions: number;
  easiness: number;
  isDue: boolean;
}

export const flashcardsApi = {
  reviewCard: (flashcardId: number, data: FlashcardReviewReq) =>
    api.post<FlashcardReviewRes>(`/api/v1/flashcards/${flashcardId}/review`, data, { token: authToken() }),

  updateFlashcard: (flashcardId: number, data: FlashcardUpdateReq) =>
    api.patch<void>(`/api/v1/flashcards/${flashcardId}`, data, { token: authToken() }),

  getDeckStudyCards: (deckId: number) =>
    api.get<FlashcardCardWithReview[]>(`/api/v1/flashcards/deck/${deckId}/study`, { token: authToken() }),
};
