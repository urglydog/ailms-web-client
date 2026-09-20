'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useBecomeInstructor, useInstructorVerificationStatus, useSubmitInstructorVerification } from '@/hooks/useInstructor';
import { getCurrentRole } from '@/lib/auth/token';
import { ApiError } from '@/lib/api/client';

const TEACHING_EXPERIENCE_OPTIONS = ['Trực tiếp, không chính thức', 'Trực tiếp, chuyên nghiệp', 'Online', 'Ý khác'];
const VIDEO_EXPERIENCE_OPTIONS = ['Tôi là người mới', 'Tôi có một chút kiến thức', 'Tôi có kinh nghiệm', 'Tôi có video sẵn sàng để tải lên'];
const AUDIENCE_OPTIONS = ['Không phải lúc này', 'Tôi có một lượng người theo dõi nhỏ', 'Tôi có lượng người theo dõi khá lớn'];

const TOTAL_STEPS = 4;

/**
 * Wizard "Trở thành Giảng viên" (19/09/2026, tính năng mới — giao diện tham khảo Udemy) — full
 * màn hình, cùng khuôn với `app/instructor/courses/new/page.tsx` (đặt NGOÀI `(public)` để không
 * kế thừa Header/Footer của layout đó).
 *
 * 3 bước khảo sát đầu (kinh nghiệm giảng dạy/quay video/đối tượng sẵn có) CHỈ để giữ đúng cảm
 * giác onboarding của Udemy — KHÔNG gửi lên BE, không có tác dụng nghiệp vụ nào (cùng lựa chọn
 * đã áp dụng cho khảo sát "thời gian mỗi tuần" ở wizard tạo khóa học, vì dự án chưa có hệ thống
 * cá nhân hóa/khuyến nghị nào tiêu thụ dữ liệu này).
 *
 * Bước 4 (form xác minh định danh) tái dùng NGUYÊN các hook/API đã có
 * (`useBecomeInstructor`/`useSubmitInstructorVerification`) — trước đây form này nằm trong
 * `/profile`, giờ dời hẳn vào đây (xem yêu cầu "xóa chức năng trở thành giảng viên ở hồ sơ").
 * Bấm "Hoàn tất" gọi TUẦN TỰ: nâng role (nếu đang là Học viên) → làm mới JWT → gửi xác minh —
 * đúng thứ tự bắt buộc vì endpoint xác minh yêu cầu role Giảng viên.
 */
export default function BecomeInstructorWizard() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const isAlreadyInstructor = currentUser?.role === 'INSTRUCTOR';

  const becomeInstructor = useBecomeInstructor();
  const submitVerification = useSubmitInstructorVerification();
  const { data: verificationStatus } = useInstructorVerificationStatus(isAlreadyInstructor);

  const [step, setStep] = useState(0);
  const [teachingExperience, setTeachingExperience] = useState(TEACHING_EXPERIENCE_OPTIONS[0]);
  const [videoExperience, setVideoExperience] = useState(VIDEO_EXPERIENCE_OPTIONS[0]);
  const [audience, setAudience] = useState(AUDIENCE_OPTIONS[0]);

  const [idNumber, setIdNumber] = useState('');
  const [addressText, setAddressText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!getCurrentRole()) router.replace('/login');
  }, [router]);

  // Đã là Giảng viên (quay lại hoàn tất xác minh dở dang) — bỏ qua 3 bước khảo sát, vào thẳng form.
  useEffect(() => {
    if (isAlreadyInstructor) setStep(3);
  }, [isAlreadyInstructor]);

  // Đã xác minh xong rồi — không còn gì để làm ở đây, về thẳng Kênh Giảng viên.
  useEffect(() => {
    if (verificationStatus?.verified) router.replace('/instructor/courses');
  }, [verificationStatus, router]);

  const isFormValid = idNumber.trim().length > 0 && addressText.trim().length > 0 && confirmed;
  const isSubmitting = becomeInstructor.isPending || submitVerification.isPending;

  const handleFinish = async () => {
    setSubmitError(null);
    try {
      if (!isAlreadyInstructor) {
        await becomeInstructor.mutateAsync();
      }
      await submitVerification.mutateAsync({
        idNumber: idNumber.trim(),
        addressText: addressText.trim(),
        contentOwnershipConfirmed: confirmed,
      });
      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  if (userLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">Đang tải...</div>;
  }

  if (step === 4) {
    return <SuccessScreen />;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-white">
      <header className="shrink-0">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dark font-display text-[13px] font-bold text-white">
              L
            </span>
            <span className="text-[13.5px] font-semibold text-ink-muted">Bước {step + 1}/{TOTAL_STEPS}</span>
          </div>
          <Link href="/teaching" className="text-[13.5px] font-semibold text-accent no-underline hover:underline">
            Thoát
          </Link>
        </div>
        <div className="h-[3px] w-full bg-line-soft">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pt-16 pb-10">
        {step === 0 && (
          <SurveyStep
            title="Chia sẻ kiến thức của bạn"
            description="Các khóa học trên LinguaLearn đều mang lại trải nghiệm học tập bằng video. Dù bạn đã có kinh nghiệm giảng dạy hay đây là lần đầu tiên, chúng tôi sẽ giúp bạn đưa kiến thức của mình vào khóa học online."
            question="Bạn đã từng thực hiện hình thức giảng dạy nào trước đây?"
            options={TEACHING_EXPERIENCE_OPTIONS}
            value={teachingExperience}
            onChange={setTeachingExperience}
          />
        )}
        {step === 1 && (
          <SurveyStep
            title="Tạo một khóa học"
            description="Chúng tôi sẽ trang bị cho bạn tài nguyên, bí quyết và sự hỗ trợ để bạn tự tin quay video bài giảng, dù bạn ở mức độ kinh nghiệm nào."
            question='Bạn sản xuất video "chuyên nghiệp" ở mức độ nào?'
            options={VIDEO_EXPERIENCE_OPTIONS}
            value={videoExperience}
            onChange={setVideoExperience}
          />
        )}
        {step === 2 && (
          <SurveyStep
            title="Mở rộng phạm vi tiếp cận của bạn"
            description="Sau khi xuất bản khóa học, bạn có thể tăng lượng học viên bằng hoạt động marketing của riêng bạn, kết hợp với việc khóa học hiển thị trong tìm kiếm trên LinguaLearn."
            question="Bạn có đối tượng để chia sẻ khóa học của mình không?"
            options={AUDIENCE_OPTIONS}
            value={audience}
            onChange={setAudience}
          />
        )}
        {step === 3 && (
          <div className="flex w-full max-w-lg flex-col gap-4">
            <div className="text-center">
              <h1 className="m-0 font-display text-2xl font-bold text-ink">Xác minh thông tin định danh</h1>
              <p className="mt-2 text-[13.5px] text-ink-muted">
                Cần hoàn tất 1 lần duy nhất trước khi gửi khóa học đầu tiên đi duyệt — không lặp
                lại cho các khóa sau.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">
                Số CCCD/CMND <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full rounded-lg border border-line p-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">
                Địa chỉ thường trú <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                className="w-full rounded-lg border border-line p-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>Tôi xác nhận đây là thông tin của chính mình và tôi sở hữu/có quyền chia sẻ nội dung khóa học sẽ đăng tải.</span>
            </label>

            {submitError && <p className="text-[13px] text-red-600">{submitError}</p>}
          </div>
        )}
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-line px-6 py-4">
        {step > 0 && step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-full border border-accent px-5 py-2.5 text-[13px] font-bold text-accent hover:bg-accent/5"
          >
            Trước
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-full bg-accent px-5 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark"
          >
            Tiếp tục
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!isFormValid || isSubmitting}
            className="rounded-full bg-accent px-5 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất'}
          </button>
        )}
      </footer>
    </div>
  );
}

function SurveyStep({
  title, description, question, options, value, onChange,
}: {
  title: string;
  description: string;
  question: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-2 text-center">
      <h1 className="m-0 font-display text-2xl font-bold text-ink">{title}</h1>
      <p className="text-[13.5px] text-ink-muted">{description}</p>
      <p className="mt-4 self-start text-left text-sm font-semibold text-ink">{question}</p>
      <div className="flex w-full flex-col gap-2.5">
        {options.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left text-[13.5px] font-semibold transition-colors ${
              value === option ? 'border-accent ring-1 ring-accent text-ink' : 'border-line text-ink hover:border-ink-muted'
            }`}
          >
            <input
              type="radio"
              checked={value === option}
              onChange={() => onChange(option)}
              className="accent-accent"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

/** Trang chúc mừng cuối wizard — hiện THẲNG trên trang (không alert/modal) rồi tự chuyển sang
 * Kênh Giảng viên sau vài giây, kèm nút bấm ngay cho ai không muốn chờ. */
function SuccessScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/instructor/courses'), 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-white px-4 text-center">
      <div className="success-circle flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
          <path
            className="success-check"
            d="M5 13l4 4L19 7"
            stroke="#16A34A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold text-ink">Bạn đã trở thành Giảng viên!</h1>
      <p className="max-w-sm text-[13.5px] text-ink-muted">
        Thông tin xác minh của bạn đã được ghi nhận. Đang chuyển đến Kênh Giảng viên để bạn bắt
        đầu tạo khóa học đầu tiên...
      </p>
      <button
        type="button"
        onClick={() => router.push('/instructor/courses')}
        className="rounded-full bg-accent px-6 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark"
      >
        Vào Kênh Giảng viên ngay
      </button>
    </div>
  );
}
