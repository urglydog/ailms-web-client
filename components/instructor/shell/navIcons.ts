import { BarChartIcon, MessageCircleIcon, PackageIcon, PlayCircleIcon, WalletIcon, WrenchIcon } from '@/components/instructor/SidebarIcons';
import type { InstructorNavId } from '@/lib/instructor/nav';

export const NAV_ICONS: Record<InstructorNavId, (props: { className?: string }) => React.JSX.Element> = {
  courses: PlayCircleIcon,
  bundles: PackageIcon,
  communication: MessageCircleIcon,
  revenue: BarChartIcon,
  earnings: WalletIcon,
  tools: WrenchIcon,
};
