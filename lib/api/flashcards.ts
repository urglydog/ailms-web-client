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

export const flashcardsApi = {
  reviewCard: (flashcardId: number, data: FlashcardReviewReq) =>
    api.post<FlashcardReviewRes>(`/api/v1/flashcards/${flashcardId}/review`, data, { token: authToken() }),
};
