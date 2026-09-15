'use client';

import { useState, useEffect } from 'react';
import { useUpdateFlashcard, useAddFlashcard, useDeleteFlashcard } from '@/hooks/useFlashcards';
import { toast } from 'sonner';

/** Map mã ngôn ngữ backend → BCP-47 tag cho Web Speech API */
const LANGUAGE_MAP: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  pt: 'pt-PT',
  ru: 'ru-RU',
  th: 'th-TH',
  id: 'id-ID',
};

interface Flashcard {
  id: number;
  frontText: string;
  backText: string;
  nextReviewAt?: string;
  intervalDays?: number;
  repetitions?: number;
  easiness?: number;
  isDue?: boolean;
}

/** `language` khớp với trường `language` của MaterialGeneration (ví dụ: 'vi', 'en', 'ja'). */
export function FlashcardViewer({ flashcards, language, deckId, readOnly = false }: { flashcards: Flashcard[]; language?: string; deckId?: number; readOnly?: boolean }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { mutate: updateCard } = useUpdateFlashcard();
  const { mutate: addCard } = useAddFlashcard();
  const { mutate: deleteCard } = useDeleteFlashcard();
  const [editMode, setEditMode] = useState<{ id: number; front: string; back: string } | null>(null);
  const [addMode, setAddMode] = useState<{ front: string; back: string } | null>(null);

  const handleDelete = (id: number) => {
    deleteCard(id, {
      onSuccess: () => {
        if (currentIdx >= flashcards.length - 1) {
          setCurrentIdx(Math.max(0, currentIdx - 1));
        }
      }
    });
  };

  const handleEditSave = () => {
    if (!editMode) return;
    updateCard({ flashcardId: editMode.id, data: { frontText: editMode.front, backText: editMode.back } }, {
      onSuccess: () => setEditMode(null)
    });
  };

  const handleAddSave = () => {
    if (!addMode || !deckId) return;
    addCard({ deckId, data: { frontText: addMode.front, backText: addMode.back } }, {
      onSuccess: () => {
        setAddMode(null);
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prevFlipped => {
          if (!prevFlipped) return true;
          setCurrentIdx(prevIdx => Math.min(prevIdx + 1, flashcards?.length ? flashcards.length - 1 : 0));
          return false;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [flashcards?.length]);


  if (!flashcards || flashcards.length === 0) {
    if (addMode) {
      return renderAddModal();
    }
    return (
      <div className="text-center text-ink-muted flex flex-col items-center">
        Chưa có flashcard nào.
        {deckId && (
          <button onClick={() => setAddMode({ front: '', back: '' })} className="mt-4 bg-accent text-white px-4 py-2 rounded-full font-bold">
            + Thêm thẻ mới
          </button>
        )}
      </div>
    );
  }

  const handleNext = () => {
    if (currentIdx < flashcards.length - 1) {
      setIsFlipped(false);
      setCurrentIdx(i => Math.min(i + 1, flashcards.length - 1));
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setIsFlipped(false);
      setCurrentIdx(i => Math.max(i - 1, 0));
    }
  };

  const safeIdx = Math.min(Math.max(currentIdx, 0), Math.max(flashcards.length - 1, 0));
  const card = flashcards[safeIdx];

  if (!card) {
    return <div className="text-center text-ink-muted">Đang tải thẻ...</div>;
  }

  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      toast.error('Trình duyệt không hỗ trợ phát âm thanh.');
      return;
    }
    const langCode = language?.toLowerCase().split('-')[0] ?? '';
    const bcp47 = LANGUAGE_MAP[langCode] ?? '';
    if (!bcp47) {
      toast.info('Ngôn ngữ của bộ thẻ chưa được hỗ trợ phát âm.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    window.speechSynthesis.speak(utterance);
  };

  const langCode = language?.toLowerCase().split('-')[0] ?? '';
  const isSpeakSupported = !!LANGUAGE_MAP[langCode] && 'speechSynthesis' in (typeof window !== 'undefined' ? window : {});



  function renderAddModal() {
    return (
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        <div className="w-full flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            Thêm Flashcard mới
          </h3>
          <button onClick={() => setAddMode(null)} className="text-ink-muted hover:text-ink text-sm font-semibold px-3 py-1 rounded-lg hover:bg-surface-hover transition-colors">
            Hủy
          </button>
        </div>
        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-1">Mặt trước (Front)</label>
            <textarea
              className="w-full p-3 rounded-xl border border-line bg-surface focus:ring-2 focus:ring-accent outline-none text-ink text-lg font-medium resize-none h-24"
              value={addMode?.front || ''}
              onChange={e => setAddMode(prev => prev ? { ...prev, front: e.target.value } : null)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-1">Mặt sau (Back)</label>
            <textarea
              className="w-full p-3 rounded-xl border border-line bg-surface focus:ring-2 focus:ring-accent outline-none text-ink text-lg font-medium resize-none h-24"
              value={addMode?.back || ''}
              onChange={e => setAddMode(prev => prev ? { ...prev, back: e.target.value } : null)}
            />
          </div>
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleAddSave}
              className="bg-accent hover:bg-accent-dark text-white font-bold px-6 py-2 rounded-full shadow-md transition-all"
            >
              Thêm Thẻ
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderEditModal() {
    return (
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        <div className="w-full flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            Chỉnh sửa Flashcard
          </h3>
          <button onClick={() => setEditMode(null)} className="text-ink-muted hover:text-ink text-sm font-semibold px-3 py-1 rounded-lg hover:bg-surface-hover transition-colors">
            Hủy
          </button>
        </div>
        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-1">Mặt trước (Front)</label>
            <textarea
              className="w-full p-3 rounded-xl border border-line bg-surface focus:ring-2 focus:ring-accent outline-none text-ink text-lg font-medium resize-none h-24"
              value={editMode?.front || ''}
              onChange={e => setEditMode(prev => prev ? { ...prev, front: e.target.value } : null)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-1">Mặt sau (Back)</label>
            <textarea
              className="w-full p-3 rounded-xl border border-line bg-surface focus:ring-2 focus:ring-accent outline-none text-ink text-lg font-medium resize-none h-24"
              value={editMode?.back || ''}
              onChange={e => setEditMode(prev => prev ? { ...prev, back: e.target.value } : null)}
            />
          </div>
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleEditSave}
              className="bg-accent hover:bg-accent-dark text-white font-bold px-6 py-2 rounded-full shadow-md transition-all"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (addMode) return renderAddModal();
  if (editMode) return renderEditModal();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex justify-between text-ink-muted mb-6 text-sm font-semibold">
        <div className="flex gap-4 items-center">
          <span>Flashcard {safeIdx + 1} / {flashcards.length}</span>
          {!readOnly && deckId && (
            <>
              <button
                onClick={() => setEditMode({ id: card.id, front: card.frontText, back: card.backText })}
                className="text-accent hover:underline flex items-center gap-1"
              >
                ✏️ Sửa thẻ này
              </button>
              <button
                onClick={() => setAddMode({ front: '', back: '' })}
                className="text-green-600 hover:underline flex items-center gap-1"
              >
                ➕ Thêm thẻ mới
              </button>
              <button
                onClick={() => handleDelete(card.id)}
                className="text-red-500 hover:underline flex items-center gap-1"
              >
                🗑️ Xóa thẻ này
              </button>
            </>
          )}
        </div>
        <span className="bg-surface-hover px-3 py-1 rounded-full border border-line">Click vào thẻ để lật</span>
      </div>

      <div 
        className="relative w-full max-w-2xl h-96 perspective-1000 cursor-pointer group"
        onClick={() => {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          setIsFlipped(!isFlipped);
        }}
      >
        <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-line-soft flex flex-col items-center justify-center p-8 group-hover:border-accent/30 transition-colors">
            {isSpeakSupported && (
            <button 
              onClick={(e) => handleSpeak(card.frontText, e)}
              className="absolute top-4 right-4 p-2 text-ink-muted hover:text-accent bg-surface hover:bg-surface-hover rounded-full transition-colors"
              title={`Nghe phát âm (${LANGUAGE_MAP[langCode]})`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
            )}
            <h3 className="text-3xl font-display font-medium text-ink text-center leading-relaxed">
              {card.frontText}
            </h3>
            
            {card.nextReviewAt && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${card.isDue ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                {card.isDue ? 'Tới hạn ôn tập' : `Ôn tập: ${new Date(card.nextReviewAt).toLocaleDateString()}`}
              </div>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink-muted flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span>Lật thẻ</span>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-accent text-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 rotate-y-180">
            {isSpeakSupported && (
            <button 
              onClick={(e) => handleSpeak(card.backText, e)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors"
              title={`Nghe phát âm (${LANGUAGE_MAP[langCode]})`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
            )}
            <h3 className="text-3xl font-display font-medium text-center leading-relaxed">
              {card.backText}
            </h3>
            

          </div>

        </div>
      </div>

      <div className="flex items-center space-x-6 mt-10">
        <button
          onClick={handlePrev}
          disabled={safeIdx === 0}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${safeIdx === 0 ? 'bg-surface border border-line text-ink-muted opacity-50 cursor-not-allowed' : 'bg-white border border-line shadow-sm hover:border-accent hover:text-accent transform hover:-translate-x-1'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className="flex space-x-2">
          {flashcards.map((_, i) => (
            <div 
              key={i} 
              className={`h-2.5 rounded-full transition-all ${i === safeIdx ? 'w-8 bg-accent' : 'w-2.5 bg-line hover:bg-line-soft cursor-pointer'}`}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIdx(i);
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={safeIdx === flashcards.length - 1}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${safeIdx === flashcards.length - 1 ? 'bg-surface border border-line text-ink-muted opacity-50 cursor-not-allowed' : 'bg-white border border-line shadow-sm hover:border-accent hover:text-accent transform hover:translate-x-1'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      
      {/* Thêm CSS cho lật 3D */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}
