'use client';

import { Sparkles, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTutorSuggestions } from '@/hooks/useLessonNotes';
import type { TutorSuggestion } from '@/lib/api/notes';

const TEMPLATE_KEYS = ['summary', 'quiz', 'hardest', 'relation', 'chapter'] as const;
type TemplateKey = (typeof TEMPLATE_KEYS)[number];

/** Câu mẫu hiển thị theo ngôn ngữ giao diện; câu POPULAR/AI giữ nguyên văn. */
export function useSuggestionText() {
  const t = useTranslations('learn.tutorSuggest.templates');
  return (s: TutorSuggestion): string => {
    if (s.source === 'TEMPLATE' && s.key && (TEMPLATE_KEYS as readonly string[]).includes(s.key)) {
      return t(s.key as TemplateKey, {
        lesson: s.params.lesson ?? '',
        previous: s.params.previous ?? '',
        chapter: s.params.chapter ?? '',
      });
    }
    return s.text;
  };
}

/**
 * Trạng thái rỗng của AI Gia sư (UDEMY_LAYOUT_ANALYSIS mục 9): 4 thẻ câu hỏi gợi ý theo bài đang
 * học — câu hỏi phổ biến của học viên khác trước, rồi câu AI sinh từ nội dung bài, rồi câu mẫu
 * điền tên bài/chương. Bấm thẻ là gửi.
 */
export function TutorSuggestions({ lessonId, onPick, disabled }: { lessonId: number; onPick: (q: string) => void; disabled?: boolean }) {
  const t = useTranslations('learn.tutorSuggest');
  const toText = useSuggestionText();
  const { data } = useTutorSuggestions(lessonId);
  if (!data || data.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="m-0 mb-2 text-xs font-semibold text-ink-muted">{t('title')}</p>
      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
        {data.slice(0, 4).map((s, i) => {
          const text = toText(s);
          return (
            <li key={`${s.source}-${i}`}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(text)}
                className="flex h-full w-full items-start gap-2 rounded-card border border-line bg-surface-raised p-3 text-left text-sm text-ink transition-colors hover:border-accent disabled:opacity-50 motion-reduce:transition-none"
              >
                {s.source === 'POPULAR' ? (
                  <Users size={15} className="mt-0.5 shrink-0 text-accent-dark" aria-hidden />
                ) : (
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-accent-dark" aria-hidden />
                )}
                <span>
                  {text}
                  {s.source === 'POPULAR' && <span className="sr-only"> ({t('popular')})</span>}
                  {s.source === 'AI' && <span className="sr-only"> ({t('aiGenerated')})</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Ghi chú nhỏ dưới ô hỏi: câu trả lời AI có thể sai. */
export function AiDisclaimer() {
  const t = useTranslations('learn.tutorSuggest');
  return <p className="m-0 px-3 pb-2 text-center text-[11px] text-ink-faint">{t('disclaimer')}</p>;
}
