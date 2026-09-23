'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { CourseStatusBadge } from '@/components/course/CourseStatusBadge';
import { ChevronDownIcon } from '@/components/instructor/CurriculumIcons';
import { CourseReferralSection } from '@/components/instructor/edit/CourseReferralSection';
import { CourseVisibilitySection } from '@/components/instructor/edit/CourseVisibilitySection';
import { ArrowLeftIcon, EyeIcon, SettingsIcon } from '@/components/instructor/SidebarIcons';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useDeleteCourse, useMyCourseDetail, useReactivateCourse, useSubmitCourse } from '@/hooks/useCourses';
import { ApiError } from '@/lib/api/client';

interface NavItem {
  key: string;
  label: string;
  href: (courseId: number) => string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

/** Cấu trúc mini-sidebar tham khảo Udemy ("Lên kế hoạch/Tạo nội dung/Đăng tải khóa học của
 * bạn") — rút gọn lại đúng những gì dự án THẬT SỰ có, không bịa thêm mục Udemy có mà project
 * chưa hỗ trợ (VD: "Người học dự định", "Chú thích", "Khả năng tiếp cận"). */
const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Nội dung khóa học',
    items: [
      { key: 'curriculum', label: 'Chương trình giảng dạy', href: (id) => `/instructor/courses/${id}/edit/curriculum` },
      { key: 'materials', label: 'Học liệu & Quiz thi cử', href: (id) => `/instructor/courses/${id}/edit/materials` },
      { key: 'resources', label: 'Tài nguyên tĩnh', href: (id) => `/instructor/courses/${id}/edit/resources` },
    ],
  },
  {
    heading: 'Đăng tải khóa học',
    items: [
      { key: 'basics', label: 'Thông tin cơ bản', href: (id) => `/instructor/courses/${id}/edit/basics` },
      { key: 'pricing', label: 'Giá cả', href: (id) => `/instructor/courses/${id}/edit/pricing` },
      { key: 'promotions', label: 'Khuyến mãi', href: (id) => `/instructor/courses/${id}/edit/promotions` },
    ],
  },
];

/**
 * Khung chung cho các trang chỉnh sửa khóa học (19/09/2026, redesign toàn diện — giao diện tham
 * khảo Udemy):
 *
 * 1. Giờ là 1 trang TOÀN MÀN HÌNH riêng biệt, không còn nằm trong sidebar quản lý to của
 *    `app/instructor/layout.tsx` (route này được layout đó bỏ qua hoàn toàn) — chỉ bấm "Quay lại
 *    các khóa học" mới rời khỏi đây, đúng hành vi Udemy thật.
 * 2. Nút "Gửi duyệt" dời XUỐNG DƯỚI CÙNG mini-nav (dưới "Khuyến mãi"), không còn ở thanh trên.
 * 3. Thanh trên góc phải thêm "Xem trước ▾" (Với tư cách Giảng viên/Học viên) và nút Cài đặt
 *    (bánh răng) — hiện "Cài đặt" NGAY TRONG khung nội dung chính (thay `children`, mini-nav bên
 *    trái vẫn giữ nguyên), KHÔNG phải cửa sổ nhỏ nổi lên (19/09/2026, sửa theo phản hồi — trước
 *    đây là modal `fixed inset-0`, không đúng cảm giác "1 trang cài đặt" như ảnh Udemy tham khảo).
 *    Bấm 1 mục bất kỳ ở mini-nav bên trái sẽ tự thoát Cài đặt để về đúng trang đó.
 */
export function EditCourseLayout({ courseId, children }: { courseId: number; children: ReactNode }) {
  const pathname = usePathname();
  const { data: course, isLoading } = useMyCourseDetail(courseId);
  const submitCourse = useSubmitCourse(courseId);
  const deleteCourse = useDeleteCourse();
  const reactivateCourse = useReactivateCourse();

  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // Rời trang qua 1 mục mini-nav khác (curriculum/basics/...) thì tự thoát Cài đặt.
  useEffect(() => {
    setShowSettings(false);
  }, [pathname]);

  if (isLoading || !course) {
    return <div className="p-10 text-center text-sm text-gray-500">Đang tải khóa học...</div>;
  }

  const isLocked = course.status === 'PENDING';
  const firstLessonId = course.chapters.flatMap((c) => c.lessons)[0]?.id;

  const handleConfirmArchive = () => {
    setConfirmArchive(false);
    deleteCourse.mutate(courseId);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 text-gray-900 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F1B2B] px-6 py-3.5">
        <div className="flex items-center gap-4">
          <Link
            href="/instructor/courses"
            className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-300 no-underline hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Quay lại các khóa học
          </Link>
          <span className="h-4 w-px bg-white/15" />
          <h1 className="m-0 max-w-[280px] truncate font-display text-[15px] font-bold text-white">{course.title}</h1>
          <CourseStatusBadge status={course.status} />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPreviewMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-white/10"
            >
              <EyeIcon /> Xem trước <ChevronDownIcon className="h-3.5 w-3.5" expanded={showPreviewMenu} />
            </button>
            {showPreviewMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPreviewMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    disabled={!firstLessonId}
                    onClick={() => {
                      setShowPreviewMenu(false);
                      if (firstLessonId) window.open(`/learn/${firstLessonId}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="block w-full px-3.5 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    Với tư cách là Giảng viên
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreviewMenu(false);
                      window.open(`/courses/${course.slug}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="block w-full px-3.5 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    Với tư cách là học viên
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            title="Cài đặt"
            className={`flex items-center justify-center rounded-lg border p-2 hover:bg-white/10 ${
              showSettings ? 'border-white/40 bg-white/10 text-white' : 'border-white/15 text-white'
            }`}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-8 py-7">
        {!showSettings && course.status === 'REJECTED' && course.rejectReason && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
            <span className="font-bold">Lý do bị từ chối: </span>
            {course.rejectReason}
            {course.resubmitCount > 0 && (
              <span className="ml-2 text-red-500">(đã gửi lại {course.resubmitCount}/5 lần)</span>
            )}
          </div>
        )}

        {!showSettings && course.status === 'PUBLISHED' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800">
            Khóa học đã xuất bản — sửa tiêu đề/mô tả/giá/chương/bài học/video được áp dụng{' '}
            <span className="font-bold">ngay lập tức, không cần Admin duyệt lại</span>.
          </div>
        )}

        {!showSettings && isLocked && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-[13px] text-blue-800">
            Khóa học đang được phê duyệt. Bạn không thể chỉnh sửa nội dung trong thời gian này.
          </div>
        )}

        {!showSettings && submitCourse.error instanceof ApiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
            {submitCourse.error.message}
          </div>
        )}

        <div className="grid grid-cols-[220px_1fr] gap-6">
          <nav className="flex flex-col gap-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.heading} className="flex flex-col gap-1">
                <span className="px-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {section.heading}
                </span>
                {section.items.map((item) => {
                  const href = item.href(courseId);
                  const isActive = !showSettings && (pathname === href || pathname.startsWith(`${href}/`));
                  return (
                    <Link
                      key={item.key}
                      href={href}
                      className={`rounded-lg px-3 py-2 text-[13px] font-semibold no-underline transition-colors ${
                        isActive ? 'bg-cyan-50 text-cyan-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* (19/09/2026) — dời từ thanh trên xuống đây, đúng vị trí Udemy thật ("Gửi để xem
                xét" nằm cuối mini-nav, dưới "Thông điệp khóa học"). */}
            {(course.status === 'DRAFT' || course.status === 'REJECTED') && (
              <button
                type="button"
                disabled={!course.canSubmit || submitCourse.isPending}
                onClick={() => submitCourse.mutate()}
                title={course.canSubmit ? undefined : course.missingConditions.join('; ')}
                className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {course.status === 'REJECTED' ? 'Gửi duyệt lại' : 'Gửi duyệt'}
              </button>
            )}
          </nav>

          {showSettings ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="m-0 font-display text-[17px] font-bold text-gray-900">Cài đặt</h2>
              </div>

              <div className="flex flex-col gap-2 border-b border-gray-100 p-6">
                <h3 className="m-0 text-[14px] font-bold text-gray-900">Trạng thái khóa học</h3>
                <p className="text-[12.5px] text-gray-500">
                  {course.status === 'DRAFT'
                    ? 'Khóa học đang ở dạng nháp, chưa từng gửi duyệt.'
                    : course.status === 'PUBLISHED'
                      ? 'Khóa học đang được đăng tải công khai.'
                      : course.status === 'ARCHIVED'
                        ? 'Khóa học đã được gỡ khỏi tìm kiếm — học viên đã ghi danh vẫn truy cập được bình thường.'
                        : 'Khóa học chưa được đăng tải công khai.'}
                </p>

                {course.status === 'ARCHIVED' ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={reactivateCourse.isPending}
                      onClick={() => reactivateCourse.mutate(courseId)}
                      className="rounded-lg bg-cyan-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {reactivateCourse.isPending ? 'Đang kích hoạt...' : 'Kích hoạt lại'}
                    </button>
                    <p className="mt-1.5 max-w-md text-[11.5px] text-gray-500">
                      Khôi phục khóa học về đúng trạng thái trước khi lưu trữ, học viên mới có thể tìm và ghi danh lại như bình thường.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={deleteCourse.isPending}
                      onClick={() => setConfirmArchive(true)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Gỡ bỏ khóa học
                    </button>
                    <p className="mt-1.5 max-w-md text-[11.5px] text-gray-500">
                      Học viên mới sẽ không tìm và ghi danh được khóa học này nữa, nhưng học viên đã ghi
                      danh vẫn giữ nguyên quyền truy cập. Đây KHÔNG phải xóa vĩnh viễn — bạn có thể &quot;Kích
                      hoạt lại&quot; bất cứ lúc nào.
                    </p>
                  </div>
                )}
              </div>

              <CourseVisibilitySection courseId={courseId} course={course} />

              <CourseReferralSection course={course} />

              <div className="p-6 text-[12.5px] text-gray-400">
                Quản lý đồng giảng viên đang được phát triển, sẽ bổ sung ở bản cập nhật sau.
              </div>
            </div>
          ) : (
            <div className={isLocked ? 'pointer-events-none opacity-70' : ''}>{children}</div>
          )}
        </div>
      </div>

      {confirmArchive && (
        <ConfirmModal
          title="Gỡ bỏ khóa học"
          message='Học viên mới sẽ không còn tìm và ghi danh được khóa học này qua tìm kiếm nữa, nhưng học viên đã ghi danh vẫn giữ nguyên quyền truy cập. Đây không phải xóa vĩnh viễn — bạn có thể "Kích hoạt lại" bất cứ lúc nào. Bạn có chắc chắn muốn tiếp tục?'
          confirmLabel="Gỡ bỏ"
          onCancel={() => setConfirmArchive(false)}
          onConfirm={handleConfirmArchive}
        />
      )}
    </div>
  );
}
