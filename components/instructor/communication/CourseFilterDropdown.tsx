'use client';

import { useState } from 'react';
import { SearchIcon } from '@/components/instructor/SidebarIcons';
import type { InstructorCourseOption } from '@/lib/api/dashboard';

/** "Tất cả khóa học ▾" (19/09/2026) — giao diện tham khảo Udemy: bấm mở dropdown có ô tìm kiếm
 * bên trong để lọc nhanh khi giảng viên có nhiều khóa, thay vì chỉ cuộn 1 danh sách dài. */
export function CourseFilterDropdown({
  courses,
  value,
  onChange,
  allLabel = 'Tất cả khóa học',
  showAllOption = true,
  fullWidth = false,
}: {
  courses: InstructorCourseOption[];
  value: number | '';
  onChange: (courseId: number | '') => void;
  /** Nhãn của lựa chọn rỗng — "Tất cả khóa học" khi dùng để LỌC danh sách, hoặc
   * "Chọn khóa học..." khi dùng để CHỌN đúng 1 khóa (vd form tạo thông báo). */
  allLabel?: string;
  /** false khi bắt buộc phải chọn 1 khóa cụ thể (không cho chọn "tất cả"). */
  showAllOption?: boolean;
  /** true khi đặt trong 1 form dọc (thay cho `<select>` full-width trước đây). */
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = courses.find((c) => c.id === value);
  const filtered = courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-700 hover:border-gray-300 ${
          fullWidth ? 'w-full text-left' : ''
        }`}
      >
        {selected ? selected.title : allLabel} ▾
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute left-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ${fullWidth ? 'w-full' : 'w-64'}`}>
            <div className="flex items-center gap-1.5 border-b border-gray-100 px-2.5 py-2">
              <SearchIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm khóa học..."
                className="w-full text-[12.5px] outline-none"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {showAllOption && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                  className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-gray-50 ${value === '' ? 'font-bold text-cyan-700' : 'text-gray-700'}`}
                >
                  {allLabel}
                </button>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                  className={`block w-full truncate px-3 py-1.5 text-left text-[12.5px] hover:bg-gray-50 ${value === c.id ? 'font-bold text-cyan-700' : 'text-gray-700'}`}
                >
                  {c.title}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-[12px] text-gray-400">Không tìm thấy khóa học nào.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
