export type OriginalCaptionMode = 'project' | 'youtube' | 'none';

/**
 * Nút "Gốc" điều khiển phụ đề nào: transcript do pipeline của project sinh (ưu tiên khi đã có), hoặc — chỉ với
 * video YouTube chưa có transcript và KHÔNG đang lồng tiếng — phụ đề CC sẵn có của YouTube. Đang lồng tiếng thì chỉ
 * dùng script của hệ thống, không bao giờ dùng CC của YouTube. Video tải lên chưa có transcript thì không có gì để bật.
 */
export function resolveOriginalCaption({
  isYoutube,
  projectSubtitleCount,
  dubActive = false,
}: {
  isYoutube: boolean;
  projectSubtitleCount: number;
  dubActive?: boolean;
}): OriginalCaptionMode {
  if (projectSubtitleCount > 0) return 'project';
  return isYoutube && !dubActive ? 'youtube' : 'none';
}
