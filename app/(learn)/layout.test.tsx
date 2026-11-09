import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import LearnLayout from './layout';

describe('LearnLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('có logo dẫn về trang chủ và hiển thị nội dung con', () => {
    renderWithIntl(
      <LearnLayout>
        <p>nội dung bài học</p>
      </LearnLayout>,
    );
    expect(screen.getByRole('link', { name: /LinguaLearn/ })).toHaveAttribute('href', '/');
    expect(screen.getByText('nội dung bài học')).toBeInTheDocument();
  });

  it('đã đăng nhập thì có liên kết quay về Khóa học của tôi', () => {
    localStorage.setItem('accessToken', 'x');
    renderWithIntl(
      <LearnLayout>
        <p>nội dung</p>
      </LearnLayout>,
    );
    expect(screen.getByRole('link', { name: 'Khóa học của tôi' })).toHaveAttribute('href', '/my-courses');
  });

  it('khách chưa đăng nhập thì không có liên kết Khóa học của tôi', () => {
    renderWithIntl(
      <LearnLayout>
        <p>nội dung</p>
      </LearnLayout>,
    );
    expect(screen.queryByRole('link', { name: 'Khóa học của tôi' })).toBeNull();
  });
});
