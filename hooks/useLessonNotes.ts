import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import { notesApi, tutorSuggestionsApi, type NoteScope } from '@/lib/api/notes';

const NOTES_KEY = ['lesson-notes'] as const;

export function useLessonNotes(lessonId: number, scope: NoteScope, enabled = true) {
  return useQuery({
    queryKey: [...NOTES_KEY, lessonId, scope],
    queryFn: () => notesApi.list(lessonId, scope),
    enabled,
  });
}

function useNotesMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>, errorMessage: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => void qc.invalidateQueries({ queryKey: NOTES_KEY }),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : errorMessage),
  });
}

export function useCreateNote(lessonId: number, errorMessage: string) {
  return useNotesMutation(
    ({ timestampSec, content }: { timestampSec: number; content: string }) =>
      notesApi.create(lessonId, timestampSec, content),
    errorMessage,
  );
}

export function useUpdateNote(errorMessage: string) {
  return useNotesMutation(({ id, content }: { id: number; content: string }) => notesApi.update(id, content), errorMessage);
}

export function useDeleteNote(errorMessage: string) {
  return useNotesMutation((id: number) => notesApi.remove(id), errorMessage);
}

export function useTutorSuggestions(lessonId: number, enabled = true) {
  return useQuery({
    queryKey: ['tutor-suggestions', lessonId],
    queryFn: () => tutorSuggestionsApi.list(lessonId),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
