'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useCreateCourse } from '@/hooks/useCourses';
import { useCurrentUser, useUpdateProfile } from '@/hooks/useCurrentUser';
import { ApiError } from '@/lib/api/client';

const TOTAL_STEPS = 3;

const WEEKLY_TIME_OPTIONS = [
  'Tôi đang rất bận (0-2 giờ)',
  'Tôi sẽ làm việc này ngoài giờ (2-4 tiếng)',
  'Tôi có nhiều thời gian rảnh (hơn 5 tiếng)',
  'Tôi vẫn chưa quyết định xem mình có thời gian hay không',
];

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
  const router = useRouter();
  const { data: categories } = useCategories();
  const createCourse = useCreateCourse();
  const updateProfile = useUpdateProfile();
  const { data: currentUser } = useCurrentUser();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [weeklyTime, setWeeklyTime] = useState(WEEKLY_TIME_OPTIONS[0]);

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
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      <header className="shrink-0">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-display text-[13px] font-bold text-white">
              L
            </span>
            <span className="text-[13.5px] font-semibold text-gray-500">Bước {step + 1}/{TOTAL_STEPS}</span>
          </div>
          <Link href="/instructor/courses" className="text-[13.5px] font-semibold text-cyan-700 no-underline hover:underline">
            Ra
          </Link>
        </div>
        <div className="h-[3px] w-full bg-gray-100">
          <div
            className="h-full bg-cyan-600 transition-[width] duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center overflow-y-auto px-4 pt-20">
        {step === 0 && (
          <div className="flex w-full max-w-lg flex-col items-center gap-2 text-center">
            <h1 className="m-0 font-display text-2xl font-bold text-gray-900">Vậy thì sao không chọn một tựa đề tạm thời?</h1>
            <p className="text-[13.5px] text-gray-500">
              Không sao nếu bạn chưa nghĩ ra được tiêu đề hay ngay bây giờ. Bạn có thể thay đổi sau.
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goNext()}
              autoFocus
              placeholder="Ví dụ: Học Photoshop CS6 từ đầu"
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-[14px] focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex w-full max-w-lg flex-col items-center gap-2 text-center">
            <h1 className="m-0 font-display text-2xl font-bold text-gray-900">Loại kiến thức bạn sẽ chia sẻ phù hợp nhất với danh mục nào?</h1>
            <p className="text-[13.5px] text-gray-500">Nếu bạn không chắc chắn về danh mục phù hợp, bạn có thể thay đổi sau.</p>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              autoFocus
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-[14px] focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Chọn một danh mục</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="flex w-full max-w-lg flex-col items-center gap-2 text-center">
            <h1 className="m-0 font-display text-2xl font-bold text-gray-900">Mỗi tuần bạn có thể dành bao nhiêu thời gian để tạo khóa học của mình?</h1>
            <p className="text-[13.5px] text-gray-500">
              Không có câu trả lời sai. Chúng tôi có thể giúp bạn đạt được mục tiêu ngay cả khi bạn không có nhiều thời gian.
            </p>
            <div className="mt-4 flex w-full flex-col gap-2.5">
              {WEEKLY_TIME_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left text-[13.5px] font-semibold transition-colors ${
                    weeklyTime === option ? 'border-cyan-500 ring-1 ring-cyan-500 text-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="weeklyTime"
                    checked={weeklyTime === option}
                    onChange={() => setWeeklyTime(option)}
                    className="accent-cyan-600"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        )}

        {createCourse.error instanceof ApiError && (
          <div className="mt-4 w-full max-w-lg rounded-lg border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-700">
            {createCourse.error.message}
          </div>
        )}
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            className="rounded-full border border-cyan-600 px-5 py-2.5 text-[13px] font-bold text-cyan-700 hover:bg-cyan-50"
          >
            Trước
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!stepValid || createCourse.isPending}
          className="rounded-full bg-cyan-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step < TOTAL_STEPS - 1 ? 'Tiếp tục' : createCourse.isPending ? 'Đang tạo...' : 'Tạo khóa học'}
        </button>
      </footer>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="m-0 text-lg font-bold text-gray-900">Hoàn thiện hồ sơ Giảng viên</h2>
            <p className="text-sm text-gray-600">
              Bạn cần cập nhật chức danh nghề nghiệp và tiểu sử trước khi tạo khóa học đầu tiên.
            </p>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-gray-600">Chức danh nghề nghiệp</span>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="VD: Kỹ sư phần mềm / Giảng viên tiếng Anh"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-gray-600">Tiểu sử ngắn (tối thiểu 20 ký tự)</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-xs text-gray-400 text-right">{bio.length}/20</span>
            </label>

            <div className="mt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="rounded-full px-4 py-2 text-[13px] font-bold text-gray-600 hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={!headline.trim() || bio.trim().length < 20 || updateProfile.isPending}
                className="rounded-full bg-cyan-600 px-5 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                {updateProfile.isPending ? 'Đang lưu...' : 'Lưu & Tiếp tục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
