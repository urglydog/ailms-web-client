import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { PublicCertificate } from '@/types/domain';
import { CertificatesPanel } from './CertificatesPanel';

vi.mock('@/components/certificate/CertificatePreview', () => ({
  CertificatePreview: ({ certificate }: { certificate: { certificateCode: string } }) => (
    <div data-testid="preview">{certificate.certificateCode}</div>
  ),
}));

function cert(code: string, title: string, topic: string, issuedAt: string): PublicCertificate {
  return {
    certificateCode: code,
    courseTitle: title,
    studentName: 'A',
    courseHours: 1,
    instructorName: 'B',
    completedAt: issuedAt,
    verifyUrl: `https://x/verify/${code}`,
    courseCategoryName: topic,
    issuedAt,
    status: 'ACTIVE',
  } as PublicCertificate;
}

const LIST = [
  cert('A', 'Unity cơ bản', 'Lập trình', '2026-09-27T00:00:00'),
  cert('B', 'Tiếng Anh cho IT', 'Ngoại ngữ', '2026-10-15T00:00:00'),
];

const cardCodes = () => screen.getAllByTestId('preview').map((e) => e.textContent);

describe('CertificatesPanel', () => {
  it('chưa có chứng chỉ thì báo trống', () => {
    renderWithIntl(<CertificatesPanel certificates={[]} isOwnProfile={false} />);
    expect(screen.getByText('Chưa có chứng chỉ nào.')).toBeInTheDocument();
  });

  it('mặc định hiện mới nhất trước, kèm tên khóa và ngày cấp', () => {
    renderWithIntl(<CertificatesPanel certificates={LIST} isOwnProfile={false} />);
    expect(cardCodes()).toEqual(['B', 'A']);
    expect(screen.getByText('Unity cơ bản')).toBeInTheDocument();
    expect(screen.getByText(/Cấp ngày 27\/09\/2026/)).toBeInTheDocument();
  });

  it('chip chủ đề lọc danh sách, Tất cả bỏ lọc', () => {
    renderWithIntl(<CertificatesPanel certificates={LIST} isOwnProfile={false} />);
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Lập trình' }));
    expect(cardCodes()).toEqual(['A']);
    expect(screen.getByRole('button', { name: 'Lập trình' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
    expect(cardCodes()).toHaveLength(2);
  });

  it('đổi cách sắp xếp', () => {
    renderWithIntl(<CertificatesPanel certificates={LIST} isOwnProfile={false} />);
    fireEvent.change(screen.getByLabelText('Sắp xếp'), { target: { value: 'oldest' } });
    expect(cardCodes()).toEqual(['A', 'B']);
  });

  it('người khác xem: thẻ dẫn tới trang xác thực công khai và mở tab mới', () => {
    renderWithIntl(<CertificatesPanel certificates={[LIST[0]!]} isOwnProfile={false} />);
    const link = screen.getByRole('link', { name: /Unity cơ bản/ });
    expect(link).toHaveAttribute('href', '/verify/A');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('chính chủ: thẻ dẫn tới trang chi tiết chứng chỉ', () => {
    renderWithIntl(<CertificatesPanel certificates={[LIST[0]!]} isOwnProfile />);
    const link = screen.getByRole('link', { name: /Unity cơ bản/ });
    expect(link).toHaveAttribute('href', '/certificates/A');
    expect(link).not.toHaveAttribute('target');
  });
});
