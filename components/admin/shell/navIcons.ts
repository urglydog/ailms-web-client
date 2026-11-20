import {
  Activity, BarChart, Bell, DollarSign, FileText, PieChart, LayoutDashboard, LifeBuoy, Megaphone, MessageSquareWarning, Mic, Settings, Shield, ShieldCheck, Star, Tags, Ticket, Users, Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { AdminNavId } from '@/lib/admin/nav';

export const ADMIN_NAV_ICONS: Record<AdminNavId, LucideIcon> = {
  overview: LayoutDashboard,
  users: Users,
  moderation: ShieldCheck,
  categories: Tags,
  reviews: Star,
  promotions: Megaphone,
  aianalytics: BarChart,
  aiqueue: Activity,
  voicemappings: Mic,
  tutorsecurity: Shield,
  transactions: DollarSign,
  disputes: MessageSquareWarning,
  payouts: Wallet,
  invoices: FileText,
  financereports: PieChart,
  coupons: Ticket,
  announcements: Bell,
  support: LifeBuoy,
  settings: Settings,
};
