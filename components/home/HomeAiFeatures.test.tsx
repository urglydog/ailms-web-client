import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { HomeAiFeatures } from './HomeAiFeatures';

describe('HomeAiFeatures', () => {
  it('giới thiệu 3 tính năng AI trên nền tối cố định', () => {
    renderWithIntl(<HomeAiFeatures />);
    const section = screen.getByRole('region', { name: 'Học cùng AI, theo cách của bạn' });
    expect(section).toHaveClass('bg-night');
    for (const name of ['Lồng tiếng AI', 'Gia sư AI', 'Lộ trình học AI']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
  });
});
