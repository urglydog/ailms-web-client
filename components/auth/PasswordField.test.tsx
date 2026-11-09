import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('mặc định ẩn mật khẩu, nút mắt hiện rồi ẩn lại', () => {
    renderWithIntl(<PasswordField id="pw" label="Mật khẩu" value="abc" onChange={vi.fn()} />);
    const input = screen.getByLabelText('Mật khẩu');
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('gõ thì gọi onChange với giá trị mới', () => {
    const onChange = vi.fn();
    renderWithIntl(<PasswordField id="pw" label="Mật khẩu" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'x1' } });
    expect(onChange).toHaveBeenCalledWith('x1');
  });
});
