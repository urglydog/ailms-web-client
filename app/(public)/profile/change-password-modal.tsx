'use client';

import { Modal } from '@/components/ui/Modal';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api/client';
import { usersApi } from '@/lib/api/users';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ onClose, onSuccess }: ChangePasswordModalProps) {
  const t = useTranslations('pages.changePassword');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t('mismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('tooShort'));
      return;
    }

    setLoading(true);

    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      setSuccess(t('success'));
      setTimeout(() => onSuccess(), 1500);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t('title')} closeOnBackdrop={false}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">{t('current')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">{t('new')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">{t('confirm')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          {success && <p className="text-success text-sm font-semibold">{success}</p>}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent text-white py-2 rounded-lg hover:bg-accent-dark disabled:opacity-50 font-semibold transition-colors"
            >
              {loading ? t('processing') : t('title')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-tint text-ink py-2 rounded-lg hover:bg-line font-semibold transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
    </Modal>
  );
}
