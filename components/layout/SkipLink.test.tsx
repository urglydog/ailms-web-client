import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('là liên kết tới vùng nội dung chính', () => {
    renderWithIntl(<SkipLink />);
    expect(screen.getByRole('link', { name: 'Bỏ qua tới nội dung' })).toHaveAttribute('href', '#main-content');
  });
});
