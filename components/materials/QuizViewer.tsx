'use client';

import { useState, useEffect } from 'react';
import { useExplainWrongAnswer } from '@/hooks/useQuizzes';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useParams } from 'next/navigation';

interface QuizOption {
  id: number;
  content: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: number;
  content: string;
  displayOrder: number;
  options: QuizOption[];
}

export function QuizViewer({ questions, quizId }: { questions: QuizQuestion[], quizId?: number }) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;
  const params = useParams();
  const lessonId = params?.lessonId || 'general';
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDoing, setIsDoing] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (userId && quizId) {
      const draftKey = `quickcheck_state_${lessonId}_${quizId}`;
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
             if (typeof parsed.isDoing === 'boolean') {
               setIsDoing(parsed.isDoing);
             }
             if (typeof parsed.currentIdx === 'number' && parsed.currentIdx < questions.length) {
               setCurrentIdx(parsed.currentIdx);
             }
             if (typeof parsed.selectedOption === 'number') {
               setSelectedOption(parsed.selectedOption);
             }
             if (typeof parsed.showResult === 'boolean') {
               setShowResult(parsed.showResult);
             }
          }
        }
      } catch (e) {
        console.error("Failed to parse quiz draft", e);
        localStorage.removeItem(draftKey);
      }
    }
    setIsHydrated(true);
  }, [userId, quizId, lessonId, questions.length]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated && userId && quizId) {
      const draftKey = `quickcheck_state_${lessonId}_${quizId}`;
      try {
        localStorage.setItem(draftKey, JSON.stringify({ isDoing, currentIdx, selectedOption, showResult }));
      } catch (e) {
        console.error("Failed to save quiz draft", e);
      }
    }
  }, [isDoing, currentIdx, selectedOption, isHydrated, userId, quizId, lessonId, showResult]);



  // AI Tutor State
  const { mutate: explainWrongAnswer } = useExplainWrongAnswer();
  const [explanations, setExplanations] = useState<Record<number, { loading: boolean; text?: string }>>({});

  const handleExplain = (qId: number, selectedOpt: number | null) => {
    setExplanations(prev => ({ ...prev, [qId]: { loading: true } }));
    explainWrongAnswer({ questionId: qId, selectedOptionId: selectedOpt }, {
      onSuccess: (data) => {
        setExplanations(prev => ({ ...prev, [qId]: { loading: false, text: data.explanation } }));
      },
      onError: () => {
        setExplanations(prev => ({ ...prev, [qId]: { loading: false, text: 'Có lỗi khi kết nối AI.' } }));
        toast.error('Có lỗi khi lấy giải thích.');
      }
    });
  };

  if (!questions || questions.length === 0) {
    return <div className="text-center text-ink-muted">Chưa có câu hỏi trắc nghiệm nào.</div>;
  }

  if (!isDoing) {
    return (
      <div className="card p-10 text-center bg-surface-hover border border-line-soft">
        <div className="text-4xl mb-4">🧩</div>
        <h2 className="text-2xl font-bold font-display text-ink mb-4">Quick Check: Ôn tập nhanh</h2>
        <p className="text-ink-muted mb-8">
          Bài tập này có {questions.length} câu hỏi giúp bạn củng cố kiến thức vừa học.
        </p>
        <button
          onClick={() => setIsDoing(true)}
          className="btn-primary"
        >
          {currentIdx > 0 || selectedOption !== null ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}
        </button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="card p-10 text-center bg-surface-hover border border-line-soft">
        <h2 className="text-2xl font-bold font-display text-ink mb-4">Hoàn thành bài trắc nghiệm!</h2>
        <div className="text-5xl font-display font-black text-accent mb-6">
          {score} / {questions.length}
        </div>
        <p className="text-ink-muted mb-8">
          Tuyệt vời! Bạn đã hoàn thành {questions.length} câu hỏi.
        </p>
        <button
          onClick={() => {
            setCurrentIdx(0);
            setScore(0);
            setSelectedOption(null);
            setShowResult(false);
            setIsDoing(false);
            setExplanations({});
            if (userId && quizId) {
              try {
                localStorage.removeItem(`quickcheck_state_${lessonId}_${quizId}`);
              } catch {}
            }
          }}
          className="btn-primary"
        >
          Làm lại từ đầu
        </button>
      </div>
    );
  }

  const question = questions[currentIdx];
  if (!question) {
    return <div className="text-center text-ink-muted">Lỗi hiển thị câu hỏi.</div>;
  }
  
  const isAnswered = selectedOption !== null;
  const selectedIsCorrect = question.options.find((o) => o.id === selectedOption)?.isCorrect;

  const handleNext = () => {
    if (selectedIsCorrect) {
      setScore(s => s + 1);
    }
    
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
      if (userId && quizId) {
        try {
          localStorage.removeItem(`quickcheck_state_${lessonId}_${quizId}`);
        } catch {}
      }
    }
  };

  return (
    <div className="card border-line-soft shadow-sm overflow-hidden bg-white/70 backdrop-blur-md">
      <div className="bg-surface-hover px-6 py-4 border-b border-line flex justify-between items-center">
        <span className="font-semibold text-ink">Câu hỏi {currentIdx + 1} của {questions.length}</span>
        <div className="w-1/3 bg-line-soft h-2 rounded-full overflow-hidden">
          <div 
            className="bg-accent h-full transition-all duration-300" 
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="p-8">
        <h3 className="text-xl font-display font-medium text-ink mb-8">{question.content}</h3>
        
        <div className="space-y-4">
          {question.options.map((option) => {
            const isSelected = selectedOption === option.id;
            
            // Nếu đã trả lời, hiện thị đáp án đúng/sai
            let buttonClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 ";
            if (!isAnswered) {
              buttonClass += isSelected ? "border-accent bg-accent/5 ring-2 ring-accent/20" : "border-line hover:border-ink-muted hover:bg-surface-hover";
            } else {
              if (option.isCorrect) {
                buttonClass += "border-green-500 bg-green-50 text-green-900"; // Hiện đáp án đúng
              } else if (isSelected && !option.isCorrect) {
                buttonClass += "border-red-500 bg-red-50 text-red-900"; // Hiện đáp án sai nếu user chọn
              } else {
                buttonClass += "border-line opacity-50"; // Các đáp án khác mờ đi
              }
            }

            return (
              <button
                key={option.id}
                disabled={isAnswered}
                onClick={() => setSelectedOption(option.id)}
                className={buttonClass}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 flex-shrink-0 ${isAnswered ? (option.isCorrect ? 'bg-green-500 border-green-500' : (isSelected ? 'bg-red-500 border-red-500' : 'border-line')) : (isSelected ? 'border-accent border-4' : 'border-ink-muted')}`}>
                    {isAnswered && option.isCorrect && <span className="text-white text-xs">✓</span>}
                    {isAnswered && !option.isCorrect && isSelected && <span className="text-white text-xs">✕</span>}
                  </div>
                  <span className="font-medium">{option.content}</span>
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && !selectedIsCorrect && (
          <div className="mt-6 pt-6 border-t border-line">
            {!explanations[question.id] ? (
              <button
                onClick={() => handleExplain(question.id, selectedOption)}
                className="text-accent text-sm font-semibold hover:underline flex items-center gap-1"
              >
                Hỏi Gia sư AI tại sao sai?
              </button>
            ) : (
              <div className="bg-accent/5 p-4 rounded-lg border border-accent/15">
                <div className="flex items-center gap-2 font-bold text-accent-dark mb-2">
                  <span>Gia sư AI giải thích:</span>
                  {explanations[question.id]?.loading && <span className="animate-pulse text-accent">Đang suy nghĩ...</span>}
                </div>
                {explanations[question.id]?.text && (
                  <div className="text-sm text-ink leading-relaxed">
                    <MarkdownRenderer content={explanations[question.id]!.text!} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            disabled={!isAnswered}
            onClick={handleNext}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${isAnswered ? 'bg-accent text-white hover:bg-accent-hover transform hover:scale-105 active:scale-95' : 'bg-surface-hover text-ink-muted cursor-not-allowed'}`}
          >
            {currentIdx === questions.length - 1 ? 'Hoàn thành' : 'Câu tiếp theo'}
          </button>
        </div>
      </div>
    </div>
  );
}
