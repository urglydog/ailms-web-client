import { describe, expect, it } from 'vitest';
import type { AudioTrackInfo } from '@/types/domain';
import { resolveAudio } from './resolveAudio';

function track(over: Partial<AudioTrackInfo> = {}): AudioTrackInfo {
  return {
    id: 1,
    language: 'vi-VN',
    status: 'PARTIAL',
    finalUrl: null,
    durationSec: 1200,
    chunks: [{ chunkIndex: 0, startSec: 0, endSec: 600, fileUrl: 'https://b2/chunk_0.mp3' }],
    ...over,
  };
}

describe('resolveAudio', () => {
  it('không chọn lồng tiếng -> tiếng gốc, không hiện nhãn chờ', () => {
    expect(resolveAudio(null, 30)).toEqual({ src: null, offsetSec: 0, pending: false });
  });

  it('đã ghép xong -> phát file cuối, offset 0', () => {
    expect(resolveAudio(track({ finalUrl: 'https://b2/final.mp3', status: 'COMPLETED' }), 700)).toEqual({
      src: 'https://b2/final.mp3', offsetSec: 0, pending: false,
    });
  });

  it('đang xem trong chunk đã xong -> phát chunk đó, offset = đầu chunk', () => {
    const t = track({
      chunks: [
        { chunkIndex: 0, startSec: 0, endSec: 600, fileUrl: 'c0' },
        { chunkIndex: 1, startSec: 600, endSec: 1200, fileUrl: 'c1' },
      ],
    });
    expect(resolveAudio(t, 650)).toEqual({ src: 'c1', offsetSec: 600, pending: false });
  });

  it('tua tới đoạn CHƯA lồng tiếng xong -> tiếng gốc + nhãn chờ (trước đây phát nhầm chunk 0 -> im lặng)', () => {
    expect(resolveAudio(track(), 700)).toEqual({ src: null, offsetSec: 0, pending: true });
  });

  it('job vừa bắt đầu, chưa có chunk nào -> tiếng gốc + nhãn chờ', () => {
    expect(resolveAudio(track({ chunks: [] }), 10)).toEqual({ src: null, offsetSec: 0, pending: true });
  });
});
