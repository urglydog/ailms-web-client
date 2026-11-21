import type { Metadata } from 'next';
import { CourseDetailClientRetry } from '@/components/course/CourseDetailClientRetry';
import { CourseDetailView } from '@/components/course/CourseDetailView';
import { ApiError } from '@/lib/api/client';
import { publicCoursesApi } from '@/lib/api/publicCourses';

/**
 * Chi tiết khoá học — dịch từ nhánh `isDetail` của design. UC10.
 *
 * Server Component: gọi thẳng API công khai (`publicCoursesApi.getBySlug`) phía
 * server, tốt cho SEO trang công khai. `ReviewsSection`/`CoursePreview` là Client
 * Component nhúng riêng vì cần state tương tác.
 *
 * (19/09/2026) — thân trang tách sang `CourseDetailView.tsx` để dùng chung với
 * `CourseDetailClientRetry.tsx`: fetch ẩn danh ở đây 404 với khóa "Riêng tư (mời)" ngay cả với
 * chính người được mời (Server Component không biết JWT của họ), nên 404 được thử lại 1 lần
 * phía client trước khi thật sự báo không tìm thấy — xem docblock của component đó.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Cắt mô tả thành đoạn ngắn cho thẻ xem trước khi chia sẻ (bỏ thẻ HTML/markdown đơn giản và khoảng trắng thừa). */
function summarize(text: string, max = 160): string {
  const plain = text.replace(/<[^>]*>/g, ' ').replace(/[#*_`>]/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length <= max ? plain : `${plain.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Thẻ xem trước khi chia sẻ link khóa học lên Facebook/Zalo/X... (11/11/2026, Giai đoạn D) — trước đây trang không có
 * OpenGraph nên link chia sẻ chỉ hiện tiêu đề chung. Khóa không xem được ẩn danh (riêng tư/chưa xuất bản) trả metadata
 * trung tính + noindex, không lộ gì về khóa đó. `getBySlug` gọi lại với cùng slug ở trang bên dưới được Next gộp request.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const course = await publicCoursesApi.getBySlug(slug);
    const description = summarize(course.description || course.title);
    const images = course.thumbnailUrl ? [{ url: course.thumbnailUrl }] : undefined;
    return {
      title: course.title,
      description,
      alternates: { canonical: `/courses/${slug}` },
      openGraph: { type: 'website', title: course.title, description, url: `/courses/${slug}`, images },
      twitter: {
        card: images ? 'summary_large_image' : 'summary',
        title: course.title,
        description,
        images: images?.map((i) => i.url),
      },
    };
  } catch {
    return { title: 'Khóa học', robots: { index: false, follow: false } };
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const course = await publicCoursesApi.getBySlug(slug);
    return <CourseDetailView course={course} />;
  } catch (err) {
    // 404 khi khóa không tồn tại HOẶC chưa PUBLISHED HOẶC "Riêng tư (mời)" mà khách ẩn danh
    // (BR-ROLE-03) — cùng 1 mã lỗi, không phân biệt để tránh lộ sự tồn tại của khóa đó. Thử lại
    // phía client (có JWT thật) trước khi kết luận thật sự không xem được.
    if (err instanceof ApiError && err.status === 404) {
      return <CourseDetailClientRetry slug={slug} />;
    }
    throw err;
  }
}
