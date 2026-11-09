import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/vi.json';

/** Render bọc next-intl với bản dịch tiếng Việt, để test tìm chữ theo đúng chuỗi người dùng thấy. */
export function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}
