import type { PublicCertificate } from '@/types/domain';

/** Tab của hồ sơ công khai: Chứng chỉ đứng đầu và là tab mặc định (spec mục 8). */
export type ProfileTab = 'certificates' | 'courses' | 'wishlist';

export function resolveProfileTab(param: string | null): ProfileTab {
  return param === 'courses' || param === 'wishlist' || param === 'certificates' ? param : 'certificates';
}

export type CertificateSortBy = 'newest' | 'oldest' | 'topic' | 'title';

const time = (iso: string) => new Date(iso).getTime();

/** Sắp xếp chứng chỉ; không đổi mảng gốc. Chủ đề và tên khóa so sánh theo tiếng Việt. */
export function sortCertificates(certificates: PublicCertificate[], sortBy: CertificateSortBy): PublicCertificate[] {
  const sorted = [...certificates];
  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => time(a.issuedAt) - time(b.issuedAt));
    case 'topic':
      return sorted.sort((a, b) => a.courseCategoryName.localeCompare(b.courseCategoryName, 'vi'));
    case 'title':
      return sorted.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle, 'vi'));
    case 'newest':
      return sorted.sort((a, b) => time(b.issuedAt) - time(a.issuedAt));
  }
}

/** Các chủ đề khác nhau có trong danh sách chứng chỉ, theo thứ tự chữ cái, để làm chip lọc. */
export function certificateTopics(certificates: PublicCertificate[]): string[] {
  return Array.from(new Set(certificates.map((c) => c.courseCategoryName))).sort((a, b) => a.localeCompare(b, 'vi'));
}

/** Lọc theo chủ đề; `null` nghĩa là tất cả. */
export function filterByTopic(certificates: PublicCertificate[], topic: string | null): PublicCertificate[] {
  return topic === null ? certificates : certificates.filter((c) => c.courseCategoryName === topic);
}
