import { useMemo, useState } from 'react';

interface Options<T> {
  /** Số dòng mỗi trang (mặc định 10). */
  pageSize?: number;
  /** Quy tắc khớp từ khóa tìm kiếm (đã chuẩn hóa chữ thường, bỏ khoảng trắng đầu/cuối); bỏ trống thì không có ô tìm kiếm. */
  match?: (item: T, query: string) => boolean;
  /** Bộ lọc phụ (trạng thái, loại...) — chạy trước khi tìm kiếm. */
  filter?: (item: T) => boolean;
}

export interface ListControls<T> {
  query: string;
  setQuery: (q: string) => void;
  page: number;
  setPage: (p: number) => void;
  /** Các mục của trang hiện tại, sau khi lọc và tìm kiếm. */
  pageItems: T[];
  /** Tổng số mục sau khi lọc và tìm kiếm. */
  total: number;
  totalPages: number;
}

/**
 * Tìm kiếm + lọc + phân trang PHÍA TRÌNH DUYỆT cho các danh sách nhỏ do chính người dùng/quản trị sở hữu (danh mục, giọng đọc, gói khóa học, mã giảm giá...).
 * Danh sách lớn dùng tìm kiếm/phân trang phía máy chủ thay vì hook này. Trang tự về 0 khi từ khóa hoặc bộ lọc đổi, và tự kẹp lại nếu danh sách ngắn đi.
 */
export function useListControls<T>(items: T[] | undefined, { pageSize = 10, match, filter }: Options<T> = {}): ListControls<T> {
  const [query, setQueryState] = useState('');
  const [rawPage, setRawPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((item) => (filter ? filter(item) : true) && (!q || !match || match(item, q)));
  }, [items, query, match, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(rawPage, totalPages - 1);
  const pageItems = useMemo(() => filtered.slice(page * pageSize, (page + 1) * pageSize), [filtered, page, pageSize]);

  return {
    query,
    setQuery: (q: string) => {
      setQueryState(q);
      setRawPage(0);
    },
    page,
    setPage: setRawPage,
    pageItems,
    total: filtered.length,
    totalPages,
  };
}
