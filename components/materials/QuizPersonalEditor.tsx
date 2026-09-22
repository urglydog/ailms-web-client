'use client';

import { useState } from 'react';
import { useUpdatePersonalQuestion, useAddPersonalQuestion, useDeletePersonalQuestion } from '@/hooks/useQuizzes';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X } from 'lucide-react';
import { MaterialBadge } from '@/components/materials/ui/MaterialBadge';

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
        options: q.options.map((o, i) => ({ content: o.content, isCorrect: o.isCorrect, displayOrder: i }))
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
        displayOrder: q.displayOrder || 0,
        isMultipleChoice: q.isMultipleChoice,
        options: q.options.map((o, i) => ({ content: o.content, isCorrect: o.isCorrect, displayOrder: i }))
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
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white hover:bg-accent-dark rounded-card font-semibold text-sm transition-colors shadow-card"
        >
          <Plus className="w-4 h-4" /> Thêm Câu Hỏi Mới
        </button>
      </div>

      {(isAddingQuestion || editingQuestion) && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-surface-raised rounded-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
          <div key={q.id} className="p-5 rounded-card border border-line bg-surface-raised space-y-3 shadow-card hover:border-accent transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="font-bold text-base text-ink">
                <span className="text-accent mr-2">Câu {idx + 1}:</span> {q.content}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditingQuestion(q)}
                  className="text-xs font-semibold bg-surface-hover text-ink px-3 py-1.5 rounded-card hover:bg-line border border-line transition-colors"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-xs font-semibold bg-danger/10 text-danger px-3 py-1.5 rounded-card hover:bg-danger/20 border border-danger/20 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              {q.options.map((opt, oIdx) => (
                <div
                  key={opt.id || oIdx}
                  className={`p-3.5 rounded-card text-sm font-medium border flex items-center justify-between transition-all ${opt.isCorrect
                    ? 'bg-success/10 border-success/30 text-success font-bold'
                    : 'bg-surface border-line text-ink-muted'
                    }`}
                >
                  <span>{opt.content}</span>
                  {opt.isCorrect && (
                    <MaterialBadge tone="success" icon={<Check className="w-3 h-3" />}>Đáp án đúng</MaterialBadge>
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
  const [q, setQ] = useState(() => ({
    ...initialData,
    options: initialData.options.map(o => ({ ...o, _tempId: o.id || Math.random() }))
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1">Nội dung câu hỏi</label>
        <textarea
          value={q.content}
          onChange={e => setQ({ ...q, content: e.target.value })}
          className="w-full border border-line rounded-card p-3 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
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
          {q.options.map((opt: QuizOption & { _tempId?: number }, idx: number) => {
            const optKey = opt._tempId || opt.id || `opt_new_${idx}`;
            return (
            <div key={optKey} className="flex gap-2 items-center">
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
                onKeyDown={e => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={e => {
                  const newOpts = [...q.options];
                  if (newOpts[idx]) {
                    newOpts[idx] = { ...newOpts[idx], content: e.target.value };
                    setQ({ ...q, options: newOpts });
                  }
                }}
                className="flex-1 border border-line rounded-card p-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder={`Đáp án ${idx + 1}`}
              />
              <button
                type="button"
                onClick={() => {
                  const newOpts = q.options.filter((_, i) => i !== idx);
                  setQ({ ...q, options: newOpts });
                }}
                className="p-2 text-danger hover:bg-danger/10 rounded-card transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setQ({ ...q, options: [...q.options, { id: 0, _tempId: Math.random(), content: '', isCorrect: false }] });
          }}
          className="mt-2 text-sm font-semibold text-accent hover:underline"
        >
          + Thêm lựa chọn
        </button>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-line">
        <button onClick={onCancel} className="px-4 py-2 font-semibold text-ink-muted hover:bg-surface-hover rounded-card transition-colors">
          Hủy bỏ
        </button>
        <button
          onClick={() => onSave(q)}
          className="px-6 py-2 bg-accent text-white font-semibold rounded-card hover:bg-accent-dark shadow-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!q.content.trim() || q.options.length < 2 || !q.options.some(o => o.isCorrect)}
        >
          Lưu Câu Hỏi
        </button>
      </div>
    </div>
  );
}
