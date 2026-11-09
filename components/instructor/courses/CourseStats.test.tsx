import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CourseStats } from './CourseStats';

describe('CourseStats', () => {
  it('hiện 4 chỉ số: tổng, đã xuất bản, chờ duyệt, cần xử lý', () => {
    renderWithIntl(<CourseStats counts={{ ALL: 12, DRAFT: 2, PENDING: 3, PUBLISHED: 6, REJECTED: 1, ARCHIVED: 0, attention: 3 }} />);
    const get = (label: string) => screen.getByText(label).parentElement!;
    expect(get('Tổng số khóa')).toHaveTextContent('12');
    expect(get('Đã xuất bản')).toHaveTextContent('6');
    expect(get('Chờ duyệt')).toHaveTextContent('3');
    expect(get('Cần xử lý')).toHaveTextContent('3');
  });
});
