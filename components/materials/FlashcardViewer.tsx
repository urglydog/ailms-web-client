'use client';

import { useState } from 'react';
import { useReviewFlashcard } from '@/hooks/useFlashcards';
import { toast } from 'sonner';

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

export function FlashcardViewer({ flashcards }: { flashcards: Flashcard[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { mutate: reviewCard } = useReviewFlashcard();
  const [localStats, setLocalStats] = useState<Record<number, { isDue?: boolean; easiness?: number; intervalDays?: number; nextReviewAt?: string }>>({});

  if (!flashcards || flashcards.length === 0) {
    return <div className="text-center text-ink-muted">Chưa có flashcard nào.</div>;
  }

  const handleNext = () => {
    if (currentIdx < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIdx(i => i + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIdx(i => i - 1), 150);
    }
  };

  const card = flashcards[currentIdx];

  if (!card) {
    return <div className="text-center text-ink-muted">Lỗi hiển thị thẻ.</div>;
  }

  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN'; // Assuming Vietnamese content
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Trình duyệt không hỗ trợ phát âm thanh.');
    }
  };

  const handleRate = (quality: number, e: React.MouseEvent) => {
    e.stopPropagation();
    reviewCard({ flashcardId: card.id, data: { quality } }, {
      onSuccess: (data) => {
        setLocalStats(prev => ({ ...prev, [card.id]: data }));
        toast.success(`Đã lưu tiến độ! Lần tới: ${new Date(data.nextReviewAt).toLocaleDateString()}`);
        handleNext();
      }
    });
  };

  const currentStats = localStats[card.id] || {
    isDue: card.isDue,
    easiness: card.easiness,
    intervalDays: card.intervalDays,
    nextReviewAt: card.nextReviewAt
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex justify-between text-ink-muted mb-6 text-sm font-semibold">
        <span>Flashcard {currentIdx + 1} / {flashcards.length}</span>
        <span className="bg-surface-hover px-3 py-1 rounded-full border border-line">Click vào thẻ để lật</span>
      </div>

      <div 
        className="relative w-full max-w-2xl h-96 perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-line-soft flex flex-col items-center justify-center p-8 group-hover:border-accent/30 transition-colors">
            <button 
              onClick={(e) => handleSpeak(card.frontText, e)}
              className="absolute top-4 right-4 p-2 text-ink-muted hover:text-accent bg-surface hover:bg-surface-hover rounded-full transition-colors"
              title="Nghe phát âm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
            <h3 className="text-3xl font-display font-medium text-ink text-center leading-relaxed">
              {card.frontText}
            </h3>
            
            {currentStats.nextReviewAt && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${currentStats.isDue ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                {currentStats.isDue ? 'Tới hạn ôn tập' : `Ôn tập: ${new Date(currentStats.nextReviewAt).toLocaleDateString()}`}
              </div>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink-muted flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span>Lật thẻ</span>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-accent text-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 rotate-y-180">
            <button 
              onClick={(e) => handleSpeak(card.backText, e)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors"
              title="Nghe phát âm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
            <h3 className="text-3xl font-display font-medium text-center leading-relaxed">
              {card.backText}
            </h3>
            
            {/* SM2 Rating Controls */}
            <div className="absolute bottom-6 w-full px-8" onClick={e => e.stopPropagation()}>
              <p className="text-center text-sm text-white/80 mb-3 font-medium">Mức độ ghi nhớ của bạn?</p>
              <div className="flex justify-center gap-2">
                <button onClick={(e) => handleRate(0, e)} className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/50 border border-red-400/50 rounded-lg text-xs font-bold transition-colors">Quên sạch</button>
                <button onClick={(e) => handleRate(2, e)} className="flex-1 py-2 bg-orange-500/20 hover:bg-orange-500/50 border border-orange-400/50 rounded-lg text-xs font-bold transition-colors">Khó nhớ</button>
                <button onClick={(e) => handleRate(4, e)} className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/50 border border-green-400/50 rounded-lg text-xs font-bold transition-colors">Dễ nhớ</button>
                <button onClick={(e) => handleRate(5, e)} className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/50 border border-blue-400/50 rounded-lg text-xs font-bold transition-colors">Hoàn hảo</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center space-x-6 mt-10">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${currentIdx === 0 ? 'bg-surface border border-line text-ink-muted opacity-50 cursor-not-allowed' : 'bg-white border border-line shadow-sm hover:border-accent hover:text-accent transform hover:-translate-x-1'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className="flex space-x-2">
          {flashcards.map((_, i) => (
            <div 
              key={i} 
              className={`h-2.5 rounded-full transition-all ${i === currentIdx ? 'w-8 bg-accent' : 'w-2.5 bg-line hover:bg-line-soft cursor-pointer'}`}
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => setCurrentIdx(i), 150);
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIdx === flashcards.length - 1}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${currentIdx === flashcards.length - 1 ? 'bg-surface border border-line text-ink-muted opacity-50 cursor-not-allowed' : 'bg-white border border-line shadow-sm hover:border-accent hover:text-accent transform hover:translate-x-1'}`}
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
