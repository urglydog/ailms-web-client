import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { CourseDubbingPanel } from './CourseDubbingPanel';

describe('CourseDubbingPanel', () => {
  it('nêu lợi ích học bằng ngôn ngữ của mình và liệt kê các ngôn ngữ đã có', () => {
    renderWithIntl(<CourseDubbingPanel languages={['Tiếng Việt', 'Español']} />);
    expect(screen.getByRole('heading', { name: 'Học bằng ngôn ngữ của bạn' })).toBeInTheDocument();
    expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('chưa có ngôn ngữ nào thì không vẽ gì', () => {
    const { container } = renderWithIntl(<CourseDubbingPanel languages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
