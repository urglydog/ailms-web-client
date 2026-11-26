'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { useCreateNote, useDeleteNote, useLessonNotes, useUpdateNote } from '@/hooks/useLessonNotes';
import { formatTimestamp, type LessonNote, type NoteScope } from '@/lib/api/notes';

const MAX_LEN = 2000;

interface NotesPanelProps {
  lessonId: number;
  /** Thời điểm đang phát (giây) — ghi chú mới gắn vào mốc này. */
  currentSec: number;
  /** Bấm mốc thời gian: tua video (bài khác thì chuyển sang bài đó). */
  onSeek: (sec: number, lessonId: number) => void;
}

/**
 * Tab "Ghi chú" dưới video (UDEMY_LAYOUT_ANALYSIS mục 9): tạo ghi chú tại mốc đang phát, danh sách
 * sắp theo mốc thời gian, bấm mốc để tua, sửa/xoá, lọc bài hiện tại / mọi bài trong khoá.
 */
export function NotesPanel({ lessonId, currentSec, onSeek }: NotesPanelProps) {
  const t = useTranslations('learn.notes');
  const [scope, setScope] = useState<NoteScope>('lesson');
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [captured, setCaptured] = useState(0);
  const { data: notes, isLoading, isError } = useLessonNotes(lessonId, scope);
  const create = useCreateNote(lessonId, t('errorSave'));

  const startCompose = () => {
    setCaptured(Math.floor(currentSec));
    setComposing(true);
  };

  const submit = () => {
    const content = draft.trim();
    if (!content || create.isPending) return;
    create.mutate(
      { timestampSec: captured, content },
      {
        onSuccess: () => {
          setDraft('');
          setComposing(false);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {composing ? (
        <form
          className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="note-draft" className="text-xs font-semibold text-ink-muted">
            {t('newAt', { time: formatTimestamp(captured) })}
          </label>
          <textarea
            id="note-draft"
            value={draft}
            maxLength={MAX_LEN}
            autoFocus
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            className="resize-y rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setComposing(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={!draft.trim() || create.isPending}>
              {t('save')}
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={startCompose}
          className="flex w-full items-center justify-between rounded-card border border-line bg-surface px-4 py-3 text-left text-sm text-ink-muted transition-colors hover:border-accent hover:text-ink motion-reduce:transition-none"
        >
          <span>{t('createAt', { time: formatTimestamp(currentSec) })}</span>
          <Plus size={18} aria-hidden />
        </button>
      )}

      <div className="flex items-center gap-2">
        <label htmlFor="note-scope" className="text-xs font-semibold text-ink-muted">
          {t('filter')}
        </label>
        <select
          id="note-scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as NoteScope)}
          className="rounded-lg border border-line bg-surface-raised px-2 py-1 text-sm text-ink"
        >
          <option value="lesson">{t('scopeLesson')}</option>
          <option value="course">{t('scopeCourse')}</option>
        </select>
      </div>

      {isLoading && <p className="m-0 text-sm text-ink-faint">{t('loading')}</p>}
      {isError && <p className="m-0 text-sm text-danger">{t('errorLoad')}</p>}
      {notes && notes.length === 0 && <p className="m-0 text-sm text-ink-muted">{t('empty')}</p>}
      {notes && notes.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {notes.map((n) => (
            <NoteItem key={n.id} note={n} showLesson={scope === 'course'} onSeek={onSeek} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteItem({ note, showLesson, onSeek }: { note: LessonNote; showLesson: boolean; onSeek: NotesPanelProps['onSeek'] }) {
  const t = useTranslations('learn.notes');
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const update = useUpdateNote(t('errorSave'));
  const remove = useDeleteNote(t('errorDelete'));

  return (
    <li className="flex gap-3">
      <button
        type="button"
        onClick={() => onSeek(note.timestampSec, note.lessonId)}
        aria-label={t('seekTo', { time: formatTimestamp(note.timestampSec) })}
        className="h-fit shrink-0 rounded-full bg-ink px-2.5 py-1 font-mono text-xs font-semibold text-surface-raised transition-opacity hover:opacity-85"
      >
        {formatTimestamp(note.timestampSec)}
      </button>
      <div className="min-w-0 flex-1">
        {showLesson && <p className="m-0 mb-1 truncate text-xs text-ink-faint">{note.lessonTitle}</p>}
        {editing ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const content = text.trim();
              if (!content) return;
              update.mutate({ id: note.id, content }, { onSuccess: () => setEditing(false) });
            }}
          >
            <textarea
              aria-label={t('editLabel')}
              value={text}
              maxLength={MAX_LEN}
              rows={3}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              className="resize-y rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setText(note.content);
                  setEditing(false);
                }}
                variant="ghost"
                size="sm"
              >
                {t('cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={!text.trim() || update.isPending}>
                {t('save')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="m-0 whitespace-pre-wrap break-words text-sm text-ink">{note.content}</p>
          </div>
        )}
      </div>
      {!editing && (
        <div className="flex shrink-0 items-start gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t('edit')}
            title={t('edit')}
            className="rounded-full p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink"
          >
            <Pencil size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('confirmDelete'))) remove.mutate(note.id);
            }}
            disabled={remove.isPending}
            aria-label={t('delete')}
            title={t('delete')}
            className="rounded-full p-1.5 text-ink-muted hover:bg-surface-hover hover:text-danger"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      )}
    </li>
  );
}
