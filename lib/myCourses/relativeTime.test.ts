import { describe, expect, it } from 'vitest';
import { formatRelative } from './relativeTime';

const NOW = new Date('2026-10-17T12:00:00');

describe('formatRelative', () => {
  it('tiếng Việt: có hậu tố trước', () => {
    expect(formatRelative('2026-10-17T10:00:00', 'vi', NOW)).toContain('giờ trước');
  });

  it('tiếng Anh: có hậu tố ago', () => {
    expect(formatRelative('2026-10-14T12:00:00', 'en', NOW)).toContain('3 days ago');
  });

  it('ngôn ngữ lạ thì lùi về tiếng Việt', () => {
    expect(formatRelative('2026-10-17T10:00:00', 'xx', NOW)).toContain('giờ trước');
  });
});
