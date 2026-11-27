import { screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { CourseDetail } from '@/types/domain';

let token: string | null = 'tok';
const getViewerFlags = vi.fn();

vi.mock('@/lib/auth/token', () => ({ getAccessToken: () => token }));
vi.mock('@/lib/api/publicCourses', () => ({ publicCoursesApi: { getViewerFlags: (...a: unknown[]) => getViewerFlags(...a) } }));
vi.mock('@/components/course/EnrollButton', () => ({ EnrollButton: () => <button type="button">Thêm vào giỏ hàng</button> }));
vi.mock('@/components/course/detail/PurchaseExtras', () => ({ PromoCountdown: () => null, ShareGiftButtons: () => <button type="button">Tặng khóa học</button> }));
vi.mock('@/components/course/CoursePreview', () => ({ CoursePreview: () => null }));
vi.mock('@/components/course/ReviewsSection', () => ({ ReviewsSection: () => null }));
vi.mock('@/components/course/ReferralCapture', () => ({ ReferralCapture: () => null }));
vi.mock('@/components/course/detail/CourseDubbingPanel', () => ({ CourseDubbingPanel: () => null }));
vi.mock('@/components/course/detail/CourseHero', () => ({ CourseHero: () => null }));
vi.mock('@/components/course/detail/RelatedCourses', () => ({ RelatedCourses: () => null }));
vi.mock('@/components/bundles/BundleUpsellWidget', () => ({ BundleUpsellWidget: () => null }));
vi.mock('@/components/live/CourseLiveBanner', () => ({ CourseLiveBanner: () => null }));

import { CourseDetailView } from './CourseDetailView';

const course = {
  id: 160, slug: 'py', title: 'Python', description: 'Mô tả', instructorName: 'GV', instructorAvatarUrl: null,
  thumbnailUrl: null, price: 249000, finalPrice: 174300, discountPercent: 30, isFree: false, enrolled: false,
  requiresPassword: false, dubbedLanguages: [], learningOutcomes: [], requirements: [], targetAudience: [],
  avgRating: 4.5, reviewCount: 0, learnerCount: 0, updatedAt: '2026-11-27T00:00:00', sourceLanguage: null,
  categorySlug: 'it', categoryName: 'IT', chapters: [{ id: 1, title: 'C1', lessons: [{ id: 3466, title: 'B1', durationSec: 60, isPreview: true }] }],
} as unknown as CourseDetail;

function renderView() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithIntl(<QueryClientProvider client={qc}><CourseDetailView course={course} /></QueryClientProvider>);
}

describe('CourseDetailView — giảng viên xem khoá của chính mình', () => {
  beforeEach(() => { token = 'tok'; getViewerFlags.mockReset(); });

  it('chủ khoá thấy "Chỉnh sửa khoá học" + "Vào học", không thấy giỏ hàng/tặng', async () => {
    getViewerFlags.mockResolvedValue({ viewerIsOwner: true });
    renderView();
    const edits = await screen.findAllByRole('link', { name: 'Chỉnh sửa khoá học' });
    expect(edits.length).toBe(2); // thẻ mua + thanh dính đáy mobile
    expect(edits[0]).toHaveAttribute('href', '/instructor/courses/160/edit');
    expect(screen.getByRole('link', { name: /Vào học/ })).toHaveAttribute('href', '/learn/3466');
    expect(screen.queryByRole('button', { name: 'Thêm vào giỏ hàng' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tặng khóa học' })).toBeNull();
  });

  it('người xem khác vẫn thấy nút mua', async () => {
    getViewerFlags.mockResolvedValue({ viewerIsOwner: false });
    renderView();
    expect(await screen.findByRole('button', { name: 'Thêm vào giỏ hàng' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Chỉnh sửa khoá học' })).toBeNull();
  });

  it('khách chưa đăng nhập không gọi API cờ người xem', () => {
    token = null;
    renderView();
    expect(getViewerFlags).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' })).toBeInTheDocument();
  });
});
