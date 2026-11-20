import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useListControls } from './useListControls';

const names = Array.from({ length: 25 }, (_, i) => `Mục ${i + 1}`);
const match = (s: string, q: string) => s.toLowerCase().includes(q);

describe('useListControls', () => {
  it('phân trang theo pageSize và tính đúng tổng số trang', () => {
    const { result } = renderHook(() => useListControls(names, { pageSize: 10, match }));
    expect(result.current.pageItems).toHaveLength(10);
    expect(result.current.total).toBe(25);
    expect(result.current.totalPages).toBe(3);
    act(() => result.current.setPage(2));
    expect(result.current.pageItems).toEqual(['Mục 21', 'Mục 22', 'Mục 23', 'Mục 24', 'Mục 25']);
  });

  it('tìm kiếm không phân biệt hoa thường và đưa trang về đầu', () => {
    const { result } = renderHook(() => useListControls(names, { pageSize: 10, match }));
    act(() => result.current.setPage(2));
    act(() => result.current.setQuery('  MỤC 2 '));
    expect(result.current.page).toBe(0);
    expect(result.current.total).toBe(7); // Mục 2, 20–25
    expect(result.current.pageItems[0]).toBe('Mục 2');
  });

  it('bộ lọc phụ chạy trước tìm kiếm; danh sách rỗng vẫn có 1 trang', () => {
    const { result } = renderHook(() => useListControls(names, { pageSize: 10, match, filter: (s) => s.endsWith('5') }));
    expect(result.current.total).toBe(3);
    const empty = renderHook(() => useListControls<string>(undefined, { match }));
    expect(empty.result.current.totalPages).toBe(1);
    expect(empty.result.current.pageItems).toEqual([]);
  });

  it('kẹp trang khi danh sách ngắn đi', () => {
    const { result, rerender } = renderHook(({ items }) => useListControls(items, { pageSize: 10, match }), { initialProps: { items: names } });
    act(() => result.current.setPage(2));
    rerender({ items: names.slice(0, 5) });
    expect(result.current.page).toBe(0);
    expect(result.current.pageItems).toHaveLength(5);
  });
});
