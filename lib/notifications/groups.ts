export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

export interface NotificationGroups {
  main: NotificationItem[];
  system: NotificationItem[];
  unread: NotificationItem[];
}

/** Chia thông báo thành 3 tab: tin chính, tin hệ thống (type `SYSTEM_*`, chỉ do SystemAnnouncementService sinh)
 * và mọi tin chưa đọc. */
export function groupNotifications(list: NotificationItem[]): NotificationGroups {
  const isSystem = (n: NotificationItem) => n.type?.startsWith('SYSTEM_') ?? false;
  return {
    main: list.filter((n) => !isSystem(n)),
    system: list.filter(isSystem),
    unread: list.filter((n) => !n.isRead),
  };
}
