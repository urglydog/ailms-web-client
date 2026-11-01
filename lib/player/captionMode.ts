export type OriginalCaptionMode = 'project' | 'youtube' | 'none';

/**
 * Nút "Gốc" điều khiển phụ đề nào: transcript do pipeline của project sinh (ưu tiên khi đã có), hoặc — chỉ với
 * video YouTube chưa có transcript — phụ đề CC sẵn có của YouTube. Video tải lên chưa có transcript thì không có gì để bật.
 */
export function resolveOriginalCaption({
  isYoutube,
  projectSubtitleCount,
}: {
  isYoutube: boolean;
  projectSubtitleCount: number;
}): OriginalCaptionMode {
  if (projectSubtitleCount > 0) return 'project';
  return isYoutube ? 'youtube' : 'none';
}
