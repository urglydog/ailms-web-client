'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useCreateCourse } from '@/hooks/useCourses';
import { useCurrentUser, useUpdateProfile } from '@/hooks/useCurrentUser';
import { ApiError } from '@/lib/api/client';

const TOTAL_STEPS = 3;

const WEEKLY_TIME_OPTIONS = ['busy', 'offHours', 'plenty', 'undecided'] as const;

/**
 * Wizard 3 bước tạo khóa học mới — giao diện tham khảo Udemy (19/09/2026, redesign; trước đây
 * là 1 form đơn duy nhất). Bỏ bước 1 gốc của Udemy ("Khóa học hay Bài kiểm tra?") vì dự án chỉ
 * có 1 loại nội dung. Bước 3 "Mỗi tuần dành bao nhiêu thời gian" CHỈ để giữ đúng cảm giác luồng
 * onboarding của Udemy — không gửi lên BE, không có tác dụng nghiệp vụ nào (đúng như Udemy thật:
 * chỉ là câu khảo sát, không có trường lưu trữ tương ứng).
 *
 * Giữ NGUYÊN logic BR-PROFILE-01 (chặn tạo khóa nếu hồ sơ Giảng viên chưa đủ headline/bio) từ
 * bản form cũ — chỉ đổi khung giao diện bao quanh, không đổi hành vi nghiệp vụ.
 */
export default function NewCoursePage() {
  const t = useTranslations('instructor.newCourse');
  const router = useRouter();
  const { data: categories } = useCategories();
  const createCourse = useCreateCourse();
  const updateProfile = useUpdateProfile();
  const { data: currentUser } = useCurrentUser();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [weeklyTime, setWeeklyTime] = useState<(typeof WEEKLY_TIME_OPTIONS)[number]>(WEEKLY_TIME_OPTIONS[0]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');

  const stepValid = step === 0 ? title.trim().length > 0 : step === 1 ? categoryId !== '' : true;

  const goNext = () => {
    if (!stepValid) return;
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    checkProfileAndSubmit();
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const checkProfileAndSubmit = () => {
    const isProfileIncomplete = !currentUser?.headline?.trim() || (currentUser?.bio?.trim()?.length ?? 0) < 20;
    if (isProfileIncomplete) {
      setHeadline(currentUser?.headline || '');
      setBio(currentUser?.bio || '');
      setShowProfileModal(true);
      return;
    }
    submitCourse();
  };

  const submitCourse = () => {
    createCourse.mutate(
      { title: title.trim(), categoryId: Number(categoryId), price: 0 },
      {
        onSuccess: (created) => router.replace(`/instructor/courses/${created.id}/edit/curriculum`),
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'PROFILE_INCOMPLETE') {
            setShowProfileModal(true);
          }
        },
      },
    );
  };

  const handleSaveProfile = () => {
    if (!headline.trim() || bio.trim().length < 20) return;
    updateProfile.mutate(
      { headline: headline.trim(), bio: bio.trim() },
      { onSuccess: () => { setShowProfileModal(false); submitCourse(); } },
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface-raised">
      <header className="shrink-0">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-accent font-display text-[13px] font-bold text-white">
              L
            </span>
            <span className="text-[13.5px] font-semibold text-ink-muted">{t('step', { step: step + 1, total: TOTAL_STEPS })}</span>
          </div>
          <Link href="/instructor/courses" className="text-[13.5px] font-semibold text-accent-dark no-underline hover:underline">
            Ra
          </Link>
        </div>
        <div className="h-[3px] w-full bg-tint">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center overflow-y-auto px-4 pt-20">
        {step === 0 && (
          <div className="flex w-full max-w-lg flex-col items-center gap-2 text-center">
            <h1 className="m-0 font-display text-2xl font-bold text-ink">{t('titleHeading')}</h1>
            <p className="text-[13.5px] text-ink-muted">
              {t('titleHint')}
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goNext()}
              autoFocus
              placeholder={t('titlePlaceholder')}
              className="mt-4 w-full rounded-lg border border-line px-4 py-3 text-[14px] focus:border-accent focus:outline-none"
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex w-full max-w-lg flex-col items-center gap-2 text-center">
            <h1 className="m-0 font-display text-2xl font-bold text-ink">{t('categoryHeading')}</h1>
            <p className="text-[13.5px] text-ink-muted">{t('categoryHint')}</p>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              autoFocus
              className="mt-4 w-full rounded-lg border border-line px-4 py-3 text-[14px] focus:border-accent focus:outline-none"
            >
              <option value="">{t('pickCategory')}</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="flex w-full max-w-lg flex-col items-center gap-2 text-center">
            <h1 className="m-0 font-display text-2xl font-bold text-ink">{t('timeHeading')}</h1>
            <p className="text-[13.5px] text-ink-muted">
              {t('timeHint')}
            </p>
            <div className="mt-4 flex w-full flex-col gap-2.5">
              {WEEKLY_TIME_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left text-[13.5px] font-semibold transition-colors ${
                    weeklyTime === option ? 'border-accent ring-1 ring-accent text-ink' : 'border-line text-ink hover:border-line'
                  }`}
                >
                  <input
                    type="radio"
                    name="weeklyTime"
                    checked={weeklyTime === option}
                    onChange={() => setWeeklyTime(option)}
                    className="accent-cyan-600"
                  />
                  {t(`weekly.${option}`)}
                </label>
              ))}
            </div>
          </div>
        )}

        {createCourse.error instanceof ApiError && (
          <div className="mt-4 w-full max-w-lg rounded-lg border border-danger/30 bg-danger/5 p-3 text-[12.5px] text-danger">
            {createCourse.error.message}
          </div>
        )}
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-line-soft px-6 py-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            className="rounded-full border border-accent px-5 py-2.5 text-[13px] font-bold text-accent-dark hover:bg-tint"
          >
            {t('back')}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!stepValid || createCourse.isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step < TOTAL_STEPS - 1 ? t('next') : createCourse.isPending ? t('creating') : t('create')}
        </button>
      </footer>

      {showProfileModal && (
        <Modal open onClose={() => setShowProfileModal(false)} bare ariaLabel={t('profile.title')} closeOnBackdrop={false} className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-surface-raised p-6 shadow-xl">
            <h2 className="m-0 text-lg font-bold text-ink">{t('profile.title')}</h2>
            <p className="text-sm text-ink-muted">
              {t('profile.body')}
            </p>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-ink-muted">{t('profile.headline')}</span>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={t('profile.headlinePlaceholder')}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-ink-muted">{t('profile.bio')}</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <span className="text-xs text-ink-faint text-right">{bio.length}/20</span>
            </label>

            <div className="mt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="rounded-full px-4 py-2 text-[13px] font-bold text-ink-muted hover:bg-tint"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={!headline.trim() || bio.trim().length < 20 || updateProfile.isPending}
                className="rounded-full bg-accent px-5 py-2 text-[13px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {updateProfile.isPending ? t('profile.saving') : t('profile.saveContinue')}
              </button>
            </div>
          </Modal>
      )}
    </div>
  );
}
