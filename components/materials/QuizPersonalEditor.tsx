'use client';

import { useState } from 'react';
import { useUpdatePersonalQuestion, useAddPersonalQuestion, useDeletePersonalQuestion } from '@/hooks/useQuizzes';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface QuizOption {
  id: number;
  content: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: number;
  content: string;
  displayOrder: number;
  isMultipleChoice?: boolean;
  options: QuizOption[];
}

export function QuizPersonalEditor({ questions, quizId }: { questions: QuizQuestion[]; quizId: number }) {
  const queryClient = useQueryClient();
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const updateQuestionMutation = useUpdatePersonalQuestion();
  const addQuestionMutation = useAddPersonalQuestion();
  const deleteQuestionMutation = useDeletePersonalQuestion();

  const handleUpdate = (q: QuizQuestion) => {
    updateQuestionMutation.mutate({
      questionId: q.id,
      data: {
        content: q.content,
        isMultipleChoice: q.isMultipleChoice,
        options: q.options.map(o => ({ content: o.content, isCorrect: o.isCorrect }))
      }
    }, {
      onSuccess: () => {
        toast.success('Cập nhật câu hỏi thành công');
        queryClient.invalidateQueries({ queryKey: ['material-detail'] });
        setEditingQuestion(null);
      },
      onError: (err: Error) => {
        toast.error(err.message || 'Cập nhật thất bại');
      }
    });
  };

  const handleAdd = (q: QuizQuestion) => {
    addQuestionMutation.mutate({
      quizId,
      data: {
        content: q.content,
        isMultipleChoice: q.isMultipleChoice,
        options: q.options.map(o => ({ content: o.content, isCorrect: o.isCorrect }))
      }
    }, {
      onSuccess: () => {
        toast.success('Thêm câu hỏi thành công');
        queryClient.invalidateQueries({ queryKey: ['material-detail'] });
        setIsAddingQuestion(false);
      },
      onError: (err: Error) => {
        toast.error(err.message || 'Thêm thất bại');
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteQuestionMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Đã xóa câu hỏi');
        queryClient.invalidateQueries({ queryKey: ['material-detail'] });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsAddingQuestion(true)} 
          className="px-4 py-2 bg-accent text-white hover:bg-accent-hover rounded-xl font-bold text-sm transition-colors shadow-sm"
        >
          + Thêm Câu Hỏi Mới
        </button>
      </div>

      {(isAddingQuestion || editingQuestion) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 font-display text-ink">
              {isAddingQuestion ? 'Thêm Câu Hỏi' : 'Sửa Câu Hỏi'}
            </h3>
            <QuestionForm
              initialData={editingQuestion || {
                id: 0,
                content: '',
                displayOrder: 0,
                isMultipleChoice: false,
                options: [
                  { id: 1, content: '', isCorrect: true },
                  { id: 2, content: '', isCorrect: false },
                  { id: 3, content: '', isCorrect: false },
                  { id: 4, content: '', isCorrect: false }
                ]
              }}
              onSave={(q) => {
                if (isAddingQuestion) handleAdd(q);
                else handleUpdate(q);
              }}
              onCancel={() => {
                setEditingQuestion(null);
                setIsAddingQuestion(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-5 rounded-2xl border border-line-soft bg-surface space-y-3 shadow-sm hover:border-accent transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="font-bold text-base text-ink">
                <span className="text-accent mr-2">Câu {idx + 1}:</span> {q.content}
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => setEditingQuestion(q)} 
                  className="text-xs font-semibold bg-surface-hover text-ink px-3 py-1.5 rounded-lg hover:bg-line border border-line transition-colors"
                >
                  Sửa
                </button>
                <button 
                  onClick={() => handleDelete(q.id)} 
                  className="text-xs font-semibold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              {q.options.map((opt, oIdx) => (
                <div
                  key={opt.id || oIdx}
                  className={`p-3.5 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${opt.isCorrect
                    ? 'bg-green-50 border-green-200 text-green-900 font-bold shadow-sm'
                    : 'bg-white border-line text-ink-muted'
                    }`}
                >
                  <span>{opt.content}</span>
                  {opt.isCorrect && (
                    <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-md font-extrabold uppercase">
                      Đáp án đúng ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionForm({ initialData, onSave, onCancel }: { initialData: QuizQuestion, onSave: (q: QuizQuestion) => void, onCancel: () => void }) {
  const [q, setQ] = useState(initialData);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1">Nội dung câu hỏi</label>
        <textarea
          value={q.content}
          onChange={e => setQ({ ...q, content: e.target.value })}
          className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={q.isMultipleChoice}
          onChange={e => {
            const isMulti = e.target.checked;
            let newOpts = [...q.options];
            if (!isMulti) {
              // Reset to only one correct if switching back to single choice
              let foundCorrect = false;
              newOpts = newOpts.map(o => {
                if (o.isCorrect && !foundCorrect) {
                  foundCorrect = true;
                  return o;
                }
                return { ...o, isCorrect: false };
              });
            }
            setQ({ ...q, isMultipleChoice: isMulti, options: newOpts });
          }}
          className="w-4 h-4 text-accent rounded"
        />
        <label className="text-sm font-semibold text-ink">Câu hỏi có nhiều đáp án đúng (Multi-answer)</label>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Đáp án (Check vào ô xanh để đánh dấu đáp án đúng)</label>
        <div className="space-y-2">
          {q.options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type={q.isMultipleChoice ? "checkbox" : "radio"}
                name={`correct_option_${q.id}`}
                checked={opt.isCorrect}
                onChange={e => {
                  let newOpts = [...q.options];
                  if (!q.isMultipleChoice) {
                    newOpts = newOpts.map((o, i) => ({ ...o, isCorrect: i === idx }));
                  } else if (newOpts[idx]) {
                    newOpts[idx] = { ...newOpts[idx], isCorrect: e.target.checked };
                  }
                  setQ({ ...q, options: newOpts });
                }}
                className="w-5 h-5 text-accent focus:ring-accent"
              />
              <input
                type="text"
                value={opt.content}
                onChange={e => {
                  const newOpts = [...q.options];
                  if (newOpts[idx]) {
                    newOpts[idx] = { ...newOpts[idx], content: e.target.value };
                    setQ({ ...q, options: newOpts });
                  }
                }}
                className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder={`Đáp án ${idx + 1}`}
              />
              <button
                type="button"
                onClick={() => {
                  const newOpts = q.options.filter((_, i) => i !== idx);
                  setQ({ ...q, options: newOpts });
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setQ({ ...q, options: [...q.options, { id: 0, content: '', isCorrect: false }] });
          }}
          className="mt-2 text-sm font-semibold text-accent hover:underline"
        >
          + Thêm lựa chọn
        </button>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button onClick={onCancel} className="px-4 py-2 font-semibold text-ink-muted hover:bg-surface-hover rounded-xl">
          Hủy bỏ
        </button>
        <button 
          onClick={() => onSave(q)} 
          className="px-6 py-2 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover shadow-sm"
          disabled={!q.content.trim() || q.options.length < 2 || !q.options.some(o => o.isCorrect)}
        >
          Lưu Câu Hỏi
        </button>
      </div>
    </div>
  );
}
