'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories';
import { ApiError } from '@/lib/api/client';
import type { Category } from '@/types/domain';

export function CategoryManager() {
  const t = useTranslations('admin.categories');
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setErrorMessage(null);
    createCategory.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => setNewName(''),
        onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : t('error')),
      },
    );
  };

  const handleDelete = (category: Category) => {
    setErrorMessage(null);
    deleteCategory.mutate(category.id, {
      onError: (err) =>
        setErrorMessage(
          err instanceof ApiError ? err.message : t('deleteError'),
        ),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleCreate} className="flex flex-wrap gap-2.5">
        <input
          aria-label={t('newLabel')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('newPh')}
          className="w-72 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={createCategory.isPending}
          className="rounded-full bg-accent px-5 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          + {t('add')}
        </button>
      </form>

      {errorMessage && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-white p-4 text-[13px] text-danger">{errorMessage}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-surface text-xs font-bold text-ink-muted uppercase">
            <tr>
              <th className="px-6 py-4">{t('cols.name')}</th>
              <th className="px-6 py-4">{t('cols.slug')}</th>
              <th className="px-6 py-4 text-right">{t('cols.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-ink-muted">
                  {t('loading')}
                </td>
              </tr>
            )}
            {!isLoading && categories?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-6 text-center text-ink-muted">
                  {t('empty')}
                </td>
              </tr>
            )}
            {categories?.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onSave={(name) => updateCategory.mutate({ id: category.id, input: { name } })}
                onDelete={() => setPendingDelete(category)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('confirm.title')}
        body={pendingDelete ? t('confirm.body', { name: pendingDelete.name }) : ''}
        confirmLabel={t('delete')}
        cancelLabel={t('confirm.cancel')}
        onConfirm={() => {
          if (pendingDelete) handleDelete(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function CategoryRow({
  category,
  onSave,
  onDelete,
}: {
  category: Category;
  onSave: (name: string) => void;
  onDelete: () => void;
}) {
  const t = useTranslations('admin.categories');
  const [name, setName] = useState(category.name);

  return (
    <tr className="hover:bg-surface">
      <td className="px-6 py-3">
        <input
          aria-label={t('nameLabel')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name !== category.name) onSave(name.trim());
          }}
          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold text-ink focus:border-accent focus:bg-white focus:outline-none"
        />
      </td>
      <td className="px-6 py-3 text-ink-muted">{category.slug}</td>
      <td className="px-6 py-3 text-right">
        <button type="button" onClick={onDelete} aria-label={`${t('delete')}: ${category.name}`} className="text-xs font-bold text-danger hover:opacity-80">
          {t('delete')}
        </button>
      </td>
    </tr>
  );
}
