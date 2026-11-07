export type CategoryIcon = 'code' | 'chart' | 'brain' | 'design' | 'language' | 'game' | 'mobile' | 'cloud' | 'shield' | 'wallet' | 'sheet' | 'users' | 'folder';

export interface CategoryVisual {
  icon: CategoryIcon;
  /** Lớp Tailwind gradient (chỉ dùng token màu của dự án). */
  gradient: string;
  /** Ảnh minh họa (Unsplash, dùng tự do); null thì chỉ hiện gradient + biểu tượng. */
  image: string | null;
}

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=640&h=480&q=70`;

const KNOWN: Record<string, CategoryVisual> = {
  'lap-trinh-web': { icon: 'code', gradient: 'from-accent to-ink', image: photo('1461749280684-dccba630e2f6') },
  'khoa-hoc-du-lieu': { icon: 'chart', gradient: 'from-success to-accent-dark', image: photo('1551288049-bebda4e38f71') },
  'tri-tue-nhan-tao': { icon: 'brain', gradient: 'from-ink to-accent', image: photo('1677442136019-21780ecad995') },
  'thiet-ke-ui-ux': { icon: 'design', gradient: 'from-accent-dark to-success', image: photo('1561070791-2526d30994b5') },
  'ngoai-ngu-chuyen-nganh': { icon: 'language', gradient: 'from-accent to-accent-dark', image: photo('1456513080510-7bf3a84b82f8') },
  'nen-tang-lap-trinh': { icon: 'code', gradient: 'from-accent-dark to-ink', image: photo('1542831371-29b0f74f9713') },
  'do-hoa-dung-phim': { icon: 'design', gradient: 'from-ink to-accent', image: photo('1626785774573-4b799315345d') },
  'lap-trinh-di-dong': { icon: 'mobile', gradient: 'from-accent to-accent-dark', image: photo('1551650975-87deedd944c3') },
  'devops-dam-may': { icon: 'cloud', gradient: 'from-ink to-accent-dark', image: photo('1558494949-ef010cbdcc31') },
  'an-toan-thong-tin': { icon: 'shield', gradient: 'from-ink to-success', image: photo('1614064641938-3bbee52942c7') },
  'kinh-doanh-tai-chinh': { icon: 'wallet', gradient: 'from-success to-ink', image: photo('1579621970563-ebec7560ff3e') },
  'tin-hoc-van-phong': { icon: 'sheet', gradient: 'from-accent to-success', image: photo('1460925895917-afdab827c52f') },
  'ky-nang-mem': { icon: 'users', gradient: 'from-accent-dark to-success', image: photo('1552664730-d307ca884978') },
  'giao-tiep-thuyet-trinh': { icon: 'users', gradient: 'from-accent to-accent-dark', image: photo('1475721027785-f74eccf877e2') },
  'lanh-dao-quan-ly': { icon: 'users', gradient: 'from-ink to-accent-dark', image: photo('1552664730-d307ca884978') },
  'phat-trien-ban-than': { icon: 'brain', gradient: 'from-success to-accent', image: photo('1506784983877-45594efa4cbe') },
  'phat-trien-game': { icon: 'game', gradient: 'from-ink to-success', image: photo('1542751371-adc38448a05e') },
};

const FALLBACK_GRADIENTS = ['from-accent to-ink', 'from-success to-accent-dark', 'from-ink to-accent', 'from-accent-dark to-success'];

/** Hình minh họa của một chủ đề: ô gradient + biểu tượng, không phụ thuộc ảnh bên ngoài. */
export function categoryVisual(slug: string, id: number): CategoryVisual {
  return KNOWN[slug] ?? { icon: 'folder', gradient: FALLBACK_GRADIENTS[Math.abs(id) % FALLBACK_GRADIENTS.length]!, image: null };
}
