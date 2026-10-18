import {
  Activity, BarChart, Bell, DollarSign, LayoutDashboard, Mic, Settings, Shield, ShieldCheck, Star, Tags, Ticket, Users,
  type LucideIcon,
} from 'lucide-react';
import type { AdminNavId } from '@/lib/admin/nav';

export const ADMIN_NAV_ICONS: Record<AdminNavId, LucideIcon> = {
  overview: LayoutDashboard,
  users: Users,
  moderation: ShieldCheck,
  categories: Tags,
  reviews: Star,
  aianalytics: BarChart,
  aiqueue: Activity,
  voicemappings: Mic,
  tutorsecurity: Shield,
  transactions: DollarSign,
  coupons: Ticket,
  announcements: Bell,
  settings: Settings,
};
