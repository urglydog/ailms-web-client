import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeCourse } from '@/test/fixtures';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CourseRowCard } from './CourseRowCard';

describe('CourseRowCard', () => {
  it('là liên kết tới trang khóa học, hiện tên, giảng viên, cấp độ, số bài và giá', () => {
    renderWithIntl(<CourseRowCard course={makeCourse(3, { title: 'React cơ bản', level: 'INTERMEDIATE', totalLessons: 12 })} />);
    const link = screen.getByRole('link', { name: /React cơ bản/ });
    expect(link).toHaveAttribute('href', '/courses/khoa-hoc-3');
    expect(screen.getByText(/Trần Thanh Hà/)).toBeInTheDocument();
    expect(screen.getByText('Trung cấp')).toBeInTheDocument();
    expect(screen.getByText(/12 bài/)).toBeInTheDocument();
    expect(screen.getByText('199.000đ')).toBeInTheDocument();
  });

  it('khóa miễn phí hiện Miễn phí', () => {
    renderWithIntl(<CourseRowCard course={makeCourse(4, { isFree: true, price: 0, finalPrice: 0 })} />);
    expect(screen.getByText('Miễn phí')).toBeInTheDocument();
  });

  it('có mã giảm giá thì hiện giá sau giảm kèm phần trăm', () => {
    renderWithIntl(<CourseRowCard course={makeCourse(5, { finalPrice: 99000, discountPercent: 50 })} />);
    expect(screen.getByText('99.000đ')).toBeInTheDocument();
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });
});
