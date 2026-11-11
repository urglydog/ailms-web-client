'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Mail, QrCode, Send, Share2, type LucideIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { buildShareUrl, canNativeShare, channelHref, type ShareChannel } from '@/lib/share';

interface ShareCourseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  slug: string;
  /** Mã giới thiệu riêng của chủ khóa — chỉ truyền khi người đang chia sẻ chính là giảng viên của khóa. */
  referralCode?: string | null;
}

// lucide-react bản đang dùng không còn icon thương hiệu (Facebook/Twitter/LinkedIn) — dùng icon liên kết ngoài + nhãn chữ.
const CHANNELS: { id: ShareChannel; label: string; icon: LucideIcon }[] = [
  { id: 'facebook', label: 'Facebook', icon: ExternalLink },
  { id: 'x', label: 'X', icon: ExternalLink },
  { id: 'linkedin', label: 'LinkedIn', icon: ExternalLink },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'email', label: 'Email', icon: Mail },
];

/**
 * Hộp chia sẻ khóa học (11/11/2026, Giai đoạn D). Có `referralCode` thì mọi link đều gắn `?ref=` (đơn mua qua link được tính
 * tỷ lệ giới thiệu cao hơn). Dùng Web Share API khi trình duyệt hỗ trợ (Safari iOS, Android Chrome), luôn có sao chép làm
 * phương án dự phòng; có mã QR (thư viện `qrcode.react`, vẽ hoàn toàn trên trình duyệt) để quét từ điện thoại hay đưa vào slide/poster.
 */
export function ShareCourseDialog({ open, onClose, title, slug, referralCode }: ShareCourseDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const plainUrl = buildShareUrl(origin, slug, { ref: referralCode });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Trình duyệt không cho sao chép tự động, hãy chọn và sao chép link thủ công.');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url: plainUrl });
    } catch {
      // người dùng đóng hộp chia sẻ của hệ điều hành — không phải lỗi
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chia sẻ khóa học" size="sm">
      <div className="flex flex-col gap-4">
        <p className="m-0 line-clamp-2 text-sm font-semibold text-ink">{title}</p>
        {referralCode && (
          <p className="m-0 rounded-lg bg-tint px-3 py-2 text-xs text-ink">
            Link này có mã giới thiệu riêng của bạn: học viên mua qua đây được tính đơn giới thiệu.
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={plainUrl}
            aria-label="Liên kết khóa học"
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink"
          />
          <button
            type="button"
            onClick={copy}
            title="Sao chép liên kết"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-bold text-white hover:bg-accent-dark"
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? 'Đã chép' : 'Sao chép'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
          title="Hiện mã QR để quét bằng điện thoại"
          className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-tint"
        >
          <QrCode className="h-4 w-4" aria-hidden /> {showQr ? 'Ẩn mã QR' : 'Mã QR'}
        </button>
        {showQr && (
          <div className="flex justify-center rounded-lg border border-line bg-surface p-4">
            {/* Nền trắng cố định + mức sửa lỗi cao: quét được cả khi giao diện tối hoặc in nhỏ. */}
            <QRCodeSVG value={plainUrl} size={176} level="M" bgColor="#ffffff" fgColor="#000000" marginSize={2} title={`Mã QR của ${title}`} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {canNativeShare() && (
            <button
              type="button"
              onClick={nativeShare}
              title="Chia sẻ qua ứng dụng trên thiết bị"
              className="col-span-3 flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-tint"
            >
              <Share2 className="h-4 w-4" aria-hidden /> Chia sẻ
            </button>
          )}
          {CHANNELS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={channelHref(id, buildShareUrl(origin, slug, { ref: referralCode, channel: id }), title)}
              target={id === 'email' ? undefined : '_blank'}
              rel="noopener noreferrer"
              title={`Chia sẻ qua ${label}`}
              className="flex flex-col items-center gap-1 rounded-lg border border-line px-2 py-2.5 text-xs font-semibold text-ink-muted no-underline hover:bg-tint hover:text-ink"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </a>
          ))}
        </div>
      </div>
    </Modal>
  );
}
