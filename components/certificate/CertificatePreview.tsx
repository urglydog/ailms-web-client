'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import type { CertificateVisual } from '@/types/domain';
import { certificatePlayfair, certificateWorkSans } from './certificateFonts';

const GOLD = '#B8892B';
const GOLD_TEXT = '#8C6D1F';
const NAVY = '#1B2A4A';
const SLATE = '#5B6472';
const CREAM = '#FBF8F0';
const LINE_GREY = '#D8CDA9';
/** Xanh dương thật của logo hệ thống (`tailwind.config.ts` — `accent: #2563EB`), khác bảng màu
 * vàng-navy còn lại của chứng chỉ — giữ nguyên màu logo gốc để đúng nhận diện thương hiệu. */
const ACCENT_BLUE = '#2563EB';

const PLAYFAIR = 'var(--font-certificate-playfair)';
const WORK_SANS = 'var(--font-certificate-worksans)';

/** Xem trước chứng chỉ trên web — transcribe lại đúng bố cục/màu/font của
 * `doc/feat/Main-html/Main.dc.html` (đặc tả mục 5), khác bản PDF thật (`CertificatePdfRenderer`
 * ở backend) chỉ ở chỗ: (1) đây là HTML/CSS nên bố cục flex tự nhiên, không cần quy đổi toạ độ
 * tuyệt đối như PDF; (2) mã QR ở đây vẫn là lưới ô trang trí (giống DUY NHẤT bản demo gốc) vì đây
 * chỉ là bản xem trước trên màn hình — mã QR THẬT (quét được) chỉ có trên PDF tải về, nơi mới cần
 * quét thật; link xác thực bên cạnh vẫn là link thật, bấm/copy được ngay tại đây; (3) logo dùng
 * đúng logo THẬT của hệ thống (ô xanh accent + chữ "L", giống `Header.tsx`) thay cho icon tam
 * giác "play" trang trí của bản demo gốc.
 *
 * Scale theo bề rộng khung chứa bằng {@link ResizeObserver} (thay vì CSS container query, chưa
 * cấu hình plugin cho Tailwind ở dự án này) — canvas gốc LUÔN vẽ đúng 1200×850px rồi scale nguyên
 * khối, giữ tỉ lệ chữ/khoảng cách chính xác ở mọi kích thước khung chứa.
 */
export function CertificatePreview({
  certificate,
  interactive = true,
}: {
  certificate: CertificateVisual;
  /** {@code false} khi component này bị đặt LỒNG bên trong 1 thẻ {@code <a>} khác (thẻ chứng chỉ
   * ở trang hồ sơ công khai) — lúc đó link xác thực bên dưới phải là {@code <span>} thuần, tránh
   * lồng {@code <a>} trong {@code <a>} (HTML không hợp lệ, React cảnh báo + hành vi click không
   * nhất quán giữa các trình duyệt). */
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.offsetWidth;
      setScale(width / 1200);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const completionDate = format(new Date(certificate.completedAt), 'dd/MM/yyyy');
  const qrPattern = [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1];

  return (
    <div
      ref={containerRef}
      className={`${certificatePlayfair.variable} ${certificateWorkSans.variable} relative w-full overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(19,22,32,0.15)]`}
      style={{ aspectRatio: '1200 / 850', background: CREAM }}
    >
      <div
        style={{
          width: 1200,
          height: 850,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          visibility: scale > 0 ? 'visible' : 'hidden',
          background: CREAM,
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 26, border: `2px solid ${GOLD}` }} />
        <div style={{ position: 'absolute', inset: 38, border: `1px solid ${GOLD}`, opacity: 0.45 }} />

        <div
          style={{
            position: 'absolute',
            top: 66,
            left: 80,
            right: 80,
            bottom: 66,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'center',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Logo THẬT của hệ thống (ô nền xanh accent + chữ "L" trắng, đúng `Header.tsx`) —
                  thay cho icon tam giác "play" trang trí của bản demo gốc. */}
              <div style={{ width: 34, height: 34, borderRadius: 10, background: ACCENT_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: WORK_SANS, fontWeight: 600, fontSize: 18, color: CREAM }}>L</span>
              </div>
              <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 26, color: NAVY, letterSpacing: 0.3 }}>
                Lingua<span style={{ color: GOLD }}>Learn</span>
              </div>
            </div>
            {/* Mục 5.2 đặc tả — dòng này KHÔNG có font-weight riêng trong bản demo (chỉ kế thừa
                mặc định body Work Sans Regular 400), khác nhãn "CHỨNG NHẬN..." bên dưới có
                font-weight:600 tường minh. */}
            <div style={{ fontFamily: WORK_SANS, fontWeight: 400, fontSize: 11, letterSpacing: 3, color: GOLD_TEXT, textTransform: 'uppercase' }}>
              AI-Powered Learning Platform
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 240, marginTop: 6 }}>
              <div style={{ flexGrow: 1, height: 1, background: LINE_GREY }} />
              <div style={{ width: 7, height: 7, border: `1px solid ${GOLD}`, transform: 'rotate(45deg)', flexShrink: 0 }} />
              <div style={{ flexGrow: 1, height: 1, background: LINE_GREY }} />
            </div>
          </div>

          {/* Nội dung chính */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: WORK_SANS, fontWeight: 600, fontSize: 12, letterSpacing: 3, color: GOLD_TEXT, textTransform: 'uppercase' }}>
              Chứng Nhận Hoàn Thành Khóa Học
            </div>
            <div style={{ fontFamily: PLAYFAIR, fontStyle: 'italic', fontWeight: 500, fontSize: 15, color: SLATE, marginTop: 6 }}>
              Chứng chỉ này được trao cho
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontStyle: 'italic', fontSize: 50, color: NAVY, lineHeight: 1.1 }}>
                {certificate.studentName}
              </div>
              <div style={{ width: 220, height: 2, background: GOLD }} />
            </div>
            <div style={{ fontFamily: PLAYFAIR, fontStyle: 'italic', fontWeight: 500, fontSize: 15, color: SLATE, marginTop: 8 }}>
              đã hoàn thành xuất sắc khóa học
            </div>
            <div style={{ fontFamily: PLAYFAIR, fontWeight: 700, fontSize: 25, color: NAVY, maxWidth: 760, lineHeight: 1.35, marginTop: 2 }}>
              &ldquo;{certificate.courseTitle}&rdquo;
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>
                <span style={{ fontFamily: WORK_SANS, fontSize: 13, color: SLATE }}>Thời lượng: {formatHours(certificate.courseHours)} giờ học</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path></svg>
                <span style={{ fontFamily: WORK_SANS, fontSize: 13, color: SLATE }}>Ngày hoàn thành: {completionDate}</span>
              </div>
            </div>
          </div>

          {/* Chân trang */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(4,1fr)', gap: 2, flexShrink: 0 }}>
                {qrPattern.map((v, i) => (
                  <div key={i} style={{ width: '100%', height: '100%', background: v ? NAVY : 'transparent' }} />
                ))}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: WORK_SANS, fontWeight: 400, fontSize: 9, letterSpacing: 1.5, color: SLATE, textTransform: 'uppercase' }}>Mã chứng chỉ</div>
                <div style={{ fontFamily: WORK_SANS, fontWeight: 600, fontSize: 12, color: NAVY }}>{certificate.certificateCode}</div>
                {interactive ? (
                  <a
                    href={certificate.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: WORK_SANS, fontSize: 11, color: GOLD_TEXT, borderBottom: `1px dotted ${GOLD}`, textDecoration: 'none' }}
                  >
                    {certificate.verifyUrl.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <span style={{ fontFamily: WORK_SANS, fontSize: 11, color: GOLD_TEXT, borderBottom: `1px dotted ${GOLD}` }}>
                    {certificate.verifyUrl.replace(/^https?:\/\//, '')}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              {/* Huy hiệu thật (BR-CERT-08, doc/img/Badge.png đã cắt sát viền) — cùng ảnh dùng ở
                  PDF (`CertificatePdfRenderer`), width=70px khớp đúng đường kính vòng tròn ở bản
                  demo gốc, chiều cao suy theo tỉ lệ ảnh gốc (~627/500) nên dải ruy băng tự nhiên
                  thò xuống dưới. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh trong khối canvas
                  1200x850 tự scale bằng transform, không cần next/image tối ưu responsive. */}
              <img src="/certificate/badge-seal.png" alt="" width={70} height={88} style={{ width: 70, height: 88 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 34 }}>
              <SignatureBlock name={certificate.instructorName} label="Giảng viên phụ trách" />
              <SignatureBlock name="LinguaLearn" label="Đại diện nền tảng" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignatureBlock({ name, label }: { name: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontFamily: PLAYFAIR, fontStyle: 'italic', fontWeight: 500, fontSize: 19, color: NAVY }}>{name}</div>
      <div style={{ width: 140, borderTop: `1px solid ${SLATE}`, marginTop: 2 }} />
      <div style={{ fontFamily: WORK_SANS, fontWeight: 400, fontSize: 10, letterSpacing: 1, color: SLATE, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}
