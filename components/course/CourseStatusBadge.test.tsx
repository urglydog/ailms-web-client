import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CourseStatusBadge } from './CourseStatusBadge';

describe('CourseStatusBadge', () => {
  it.each([
    ['DRAFT', 'Nháp'],
    ['PENDING', 'Chờ duyệt'],
    ['PUBLISHED', 'Đã xuất bản'],
    ['REJECTED', 'Bị từ chối'],
    ['ARCHIVED', 'Đã lưu trữ'],
  ] as const)('%s hiện nhãn %s', (status, label) => {
    renderWithIntl(<CourseStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
