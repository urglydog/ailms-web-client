import { FileText, Presentation, FileArchive, File as FileIcon } from 'lucide-react';

/** (20/09/2026, tách dùng chung) — icon + màu theo đúng 8 MIME type backend cho phép
 * (`InstructorResourceController.ALLOWED_MIME_TYPES`), dùng chung bởi `CourseResourcesTab.tsx`
 * (tab "Tài nguyên") và `LessonSidebar.tsx` (dropdown "Tài nguyên" theo từng bài). */
export function getFileVisual(fileType: string): { Icon: typeof FileText; bg: string; text: string; label: string } {
  if (fileType.includes('pdf')) return { Icon: FileText, bg: 'bg-danger/10', text: 'text-danger', label: 'PDF' };
  if (fileType.includes('word') || fileType.includes('document')) return { Icon: FileText, bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Word' };
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return { Icon: Presentation, bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'PowerPoint' };
  if (fileType.includes('zip') || fileType.includes('rar')) return { Icon: FileArchive, bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'Nén' };
  return { Icon: FileIcon, bg: 'bg-surface-hover', text: 'text-ink-muted', label: fileType.split('/')[1] || fileType };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
