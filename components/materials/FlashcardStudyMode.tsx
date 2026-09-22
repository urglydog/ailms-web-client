'use client';

import { useState, useCallback, useEffect } from 'react';
import { useReviewFlashcard } from '@/hooks/useFlashcards';
import { toast } from 'sonner';
import type { FlashcardCardWithReview } from '@/lib/api/flashcards';
import { CheckCircle2, ArrowLeft, Volume2, CalendarClock } from 'lucide-react';

/** Map language code → BCP-47 tag for Web Speech API */
const LANGUAGE_MAP: Record<string, string> = {
  vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR',
  zh: 'zh-CN', fr: 'fr-FR', de: 'de-DE', es: 'es-ES',
  pt: 'pt-PT', ru: 'ru-RU', th: 'th-TH', id: 'id-ID',
};

interface StudyModeProps {
  deckName: string;
  cards: FlashcardCardWithReview[];
  language?: string;
  onFinish?: () => void;
}

/**
 * Anki-like Study Mode:
 * - Shows only due cards (isDue=true or new cards without review)
 * - After flip, show 4 rating buttons: Again / Hard / Good / Easy
 * - Counter: New + Learning + Review (top-right)
 * - "Congratulations! You have finished this deck" when done
 * - Edit button to update front/back text
 * - Font size +/- controls
 */
export function FlashcardStudyMode({ deckName: _deckName, cards, language, onFinish }: StudyModeProps) {
  const { mutate: reviewCard } = useReviewFlashcard();

  // Filter due cards: isDue=true (includes new cards with no review)
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [isFlipped, setIsFlipped] = useState(false);
  const [fontSize, setFontSize] = useState(28); // px

  // Separate cards into categories for counter
  const newCards = cards.filter(c => c.isDue && c.repetitions === 0 && !completedIds.has(c.id));
  const learningCards = cards.filter(c => c.isDue && c.repetitions > 0 && c.repetitions < 3 && !completedIds.has(c.id));
  const reviewCards = cards.filter(c => c.isDue && c.repetitions >= 3 && !completedIds.has(c.id));

  // All due cards (in study order: new first, then learning, then review)
  const dueCards = [...newCards, ...learningCards, ...reviewCards];
  const currentCard = dueCards.length > 0 ? dueCards[0] : null;

  const isFinished = dueCards.length === 0;

  const handleFlip = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsFlipped(prev => !prev);
  }, []);

  const handleRate = useCallback((quality: number) => {
    if (!currentCard) return;

    reviewCard({ flashcardId: currentCard.id, data: { quality } }, {
      onSuccess: () => {
        setCompletedIds(prev => new Set(prev).add(currentCard.id));
        setIsFlipped(false);
      }
    });
  }, [currentCard, reviewCard]);


  const handleSpeak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Trình duyệt không hỗ trợ phát âm.');
      return;
    }
    const langCode = language?.toLowerCase().split('-')[0] ?? '';
    const bcp47 = LANGUAGE_MAP[langCode] ?? '';
    if (!bcp47) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const langCode = language?.toLowerCase().split('-')[0] ?? '';
  const isSpeakSupported = !!LANGUAGE_MAP[langCode] && typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-card bg-success/10 text-success">
          <CheckCircle2 className="w-8 h-8" strokeWidth={1.75} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink mb-3">
          Congratulations! You have finished this deck for now.
        </h2>
        <p className="text-ink-muted text-sm mb-8 max-w-md">
          Tất cả thẻ đã được ôn tập xong. Hãy quay lại sau khi có thẻ mới cần ôn.
        </p>
        {onFinish && (
          <button
            onClick={onFinish}
            className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-card shadow-card transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        )}
      </div>
    );
  }


  // ─── STUDY SCREEN ───
  return (
    <div className="flex flex-col items-center">
      {/* Top Bar: Deck name + Controls + Counter */}
      <div className="w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Font size controls */}
          <button
            onClick={() => setFontSize(s => Math.max(16, s - 4))}
            className="w-8 h-8 flex items-center justify-center bg-surface-hover border border-line rounded-lg text-ink-muted hover:text-ink hover:bg-line transition-colors font-bold text-lg"
            title="Giảm cỡ chữ"
          >
            −
          </button>
          <button
            onClick={() => setFontSize(s => Math.min(48, s + 4))}
            className="w-8 h-8 flex items-center justify-center bg-surface-hover border border-line rounded-lg text-ink-muted hover:text-ink hover:bg-line transition-colors font-bold text-lg"
            title="Tăng cỡ chữ"
          >
            +
          </button>
        </div>

        {/* Counter: New + Learning + Review */}
        <div className="flex items-center gap-0 text-sm font-bold select-none">
          <span className="text-accent">{newCards.length}</span>
          <span className="text-ink-muted mx-1">+</span>
          <span className="text-star">{learningCards.length}</span>
          <span className="text-ink-muted mx-1">+</span>
          <span className="text-success">{reviewCards.length}</span>
        </div>
      </div>

      {/* Card Area */}
      {currentCard && (
        <div
          className="relative w-full max-w-2xl cursor-pointer group"
          onClick={handleFlip}
        >
          <div className={`w-full min-h-[400px] perspective-1000`}>
            <div className={`w-full min-h-[400px] transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div
                className="absolute inset-0 backface-hidden bg-surface-raised/95 backdrop-blur-md rounded-card shadow-card-hover border border-line flex flex-col items-center justify-center p-8 group-hover:border-accent/40 transition-colors"
                style={{ minHeight: '400px' }}
              >
                {isSpeakSupported && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSpeak(currentCard.frontText); }}
                    className="absolute top-4 right-4 p-2 text-ink-muted hover:text-accent bg-surface hover:bg-surface-hover rounded-card transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                )}
                <h3
                  className="font-display font-medium text-ink text-center leading-relaxed"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {currentCard.frontText}
                </h3>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  Click để xem đáp án
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 backface-hidden rotate-y-180 bg-accent text-white rounded-card shadow-card-hover flex flex-col items-center justify-center p-8"
                style={{ minHeight: '400px' }}
              >
                {isSpeakSupported && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSpeak(currentCard.backText); }}
                    className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-card transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                )}

                {/* Separator line */}
                <div className="absolute top-1/2 left-8 right-8 border-t border-white/10" />

                <h3
                  className="font-display font-medium text-center leading-relaxed mb-2"
                  style={{ fontSize: `${Math.max(16, fontSize - 4)}px` }}
                >
                  {currentCard.frontText}
                </h3>
                <div className="my-4 w-full border-t border-white/20" />
                <h3
                  className="font-display font-medium text-center leading-relaxed"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {currentCard.backText}
                </h3>
              </div>
            </div>
          </div>

          {/* Rating buttons (only show after flip) */}
          {isFlipped && (
            <div className="mt-6 w-full" onClick={e => e.stopPropagation()}>
              {(() => {
                const now = new Date();
                const fmt = (d: Date) => {
                  const diff = d.getTime() - now.getTime();
                  if (diff < 3600000) return `${Math.round(diff / 60000)} phút`;
                  if (diff < 86400000) return `${Math.round(diff / 3600000)} giờ`;
                  return `${Math.round(diff / 86400000)} ngày`;
                };
                const nextAgain  = new Date(now.getTime() + 1   * 60000);
                const nextHard   = new Date(now.getTime() + 6   * 60000);
                const nextGood   = new Date(now.getTime() + 10  * 60000);
                const nextEasy   = new Date(now.getTime() + 3   * 86400000);
                return (
                  <div className="flex justify-center gap-3">
                    {[
                      { label: 'Again', quality: 0, next: nextAgain, cls: 'bg-danger hover:bg-danger/90' },
                      { label: 'Hard',  quality: 2, next: nextHard,  cls: 'bg-star hover:bg-star/90' },
                      { label: 'Good',  quality: 3, next: nextGood,  cls: 'bg-success hover:bg-success/90' },
                      { label: 'Easy',  quality: 5, next: nextEasy,  cls: 'bg-accent hover:bg-accent-dark' },
                    ].map(btn => (
                      <div key={btn.label} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-ink-muted font-medium flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" /> {fmt(btn.next)}
                        </span>
                        <button
                          onClick={() => handleRate(btn.quality)}
                          className={`px-5 py-2.5 ${btn.cls} text-white font-semibold rounded-card text-sm shadow-card hover:shadow-card-hover transition-all`}
                        >
                          {btn.label}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* 3D flip CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}
