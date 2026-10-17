import { describe, expect, it } from 'vitest';
import type { DubLanguage } from '@/types/domain';
import { filterLanguages, languageStatus, languageToUseWhenOriginalOff, sortLanguagesForMenu } from './dubbing';

function lang(code: string, available: boolean, label = code.toUpperCase()): DubLanguage {
  return { code, label, flag: '', available, subtitles: [] };
}

const LANGS = [lang('en', true, 'English'), lang('vi', true, 'Tiếng Việt'), lang('ja', false, '日本語'), lang('zh', false, '中文')];

describe('languageStatus', () => {
  const ctx = { sourceLanguage: 'en', processingCode: null as string | null };

  it('ngôn ngữ trùng ngôn ngữ gốc của bài là original-source', () => {
    expect(languageStatus(LANGS[0]!, ctx)).toBe('original-source');
  });

  it('đã có giọng thì ready, chưa có thì none', () => {
    expect(languageStatus(LANGS[1]!, ctx)).toBe('ready');
    expect(languageStatus(LANGS[2]!, ctx)).toBe('none');
  });

  it('ngôn ngữ đang chạy job thì processing, ưu tiên hơn none', () => {
    expect(languageStatus(LANGS[2]!, { ...ctx, processingCode: 'ja' })).toBe('processing');
    expect(languageStatus(LANGS[3]!, { ...ctx, processingCode: 'ja' })).toBe('none');
  });

  it('ngôn ngữ gốc vẫn là original-source dù trùng processingCode', () => {
    expect(languageStatus(LANGS[0]!, { ...ctx, processingCode: 'en' })).toBe('original-source');
  });
});

describe('languageToUseWhenOriginalOff', () => {
  it('dùng lại giọng đã chọn gần nhất nếu còn hợp lệ', () => {
    expect(languageToUseWhenOriginalOff(LANGS, 'en', 'ja')).toBe('ja');
  });

  it('không dùng lại ngôn ngữ gốc hoặc mã không tồn tại, lùi về giọng đã sẵn sàng đầu tiên', () => {
    expect(languageToUseWhenOriginalOff(LANGS, 'en', 'en')).toBe('vi');
    expect(languageToUseWhenOriginalOff(LANGS, 'en', 'xx')).toBe('vi');
    expect(languageToUseWhenOriginalOff(LANGS, 'en', null)).toBe('vi');
  });

  it('không có giọng nào sẵn sàng thì trả null', () => {
    expect(languageToUseWhenOriginalOff([lang('en', true), lang('ja', false)], 'en', null)).toBeNull();
    expect(languageToUseWhenOriginalOff([], null, null)).toBeNull();
  });
});

describe('sortLanguagesForMenu', () => {
  const ctx = { sourceLanguage: 'en', processingCode: null as string | null };

  it('đưa giọng đã sẵn sàng lên đầu, rồi đến chưa có, ngôn ngữ gốc xuống cuối', () => {
    const list = [lang('en', true), lang('ja', false), lang('vi', true), lang('zh', false), lang('fr', true)];
    expect(sortLanguagesForMenu(list, ctx).map((l) => l.code)).toEqual(['vi', 'fr', 'ja', 'zh', 'en']);
  });

  it('ngôn ngữ đang tạo đứng trước cả giọng đã sẵn sàng', () => {
    const list = [lang('vi', true), lang('ja', false), lang('zh', false)];
    expect(sortLanguagesForMenu(list, { ...ctx, processingCode: 'zh' }).map((l) => l.code)).toEqual(['zh', 'vi', 'ja']);
  });

  it('giữ nguyên thứ tự ban đầu trong cùng một nhóm và không đổi mảng gốc', () => {
    const list = [lang('b', false), lang('a', false), lang('c', false)];
    const copy = [...list];
    expect(sortLanguagesForMenu(list, ctx).map((l) => l.code)).toEqual(['b', 'a', 'c']);
    expect(list).toEqual(copy);
  });
});

describe('filterLanguages', () => {
  it('lọc theo tên hoặc mã, không phân biệt hoa thường', () => {
    expect(filterLanguages(LANGS, 'viet').map((l) => l.code)).toEqual(['vi']);
    expect(filterLanguages(LANGS, 'ZH').map((l) => l.code)).toEqual(['zh']);
  });

  it('chuỗi rỗng hoặc toàn khoảng trắng trả đủ danh sách', () => {
    expect(filterLanguages(LANGS, '')).toHaveLength(4);
    expect(filterLanguages(LANGS, '   ')).toHaveLength(4);
  });

  it('không khớp thì rỗng', () => {
    expect(filterLanguages(LANGS, 'khong-co')).toEqual([]);
  });
});
