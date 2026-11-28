# Kiểm thử frontend (28/11/2026)

## Tự động
- `npx tsc --noEmit`: sạch (bỏ qua file sinh trong `.next/`).
- `npx eslint app components lib hooks`: 0 lỗi, 1 cảnh báo cũ ở `hooks/useLessonProgress.ts`.
- `npx vitest run`: **148 file, 709/709 test đạt**. Có kèm test kiểm tra 4 file ngôn ngữ có cùng bộ khóa.
- Test mới:
  - `orderPricing` (khuyến mãi và mã giảm giá);
  - `Modal` không nuốt cú bấm khi đang đóng;
  - `canUseLearnerFeatures`;
  - nhãn a11y của giỏ hàng và `CouponPicker`.
- `Modal`, `ConfirmDialog`, `LiveChatPanel` giờ render qua `renderWithIntl`.

## Kiểm tra lượng tiếng Việt còn sót
Script quét (bỏ qua comment, test, log) báo còn 40 file / 71 dòng, đều là phần giữ cố ý (xem `../feat/TINH_NANG_FE_20261126-28.md`).

## Kiểm tra trên trình duyệt (web local cổng 3005, API qua proxy cổng 8090)
| Hạng mục | Kết quả |
| --- | --- |
| Đổi ngôn ngữ sang `ja` | Chỉ tải chunk `ja`, `<html lang="ja">`, không tràn ngang |
| Vào học tiếp đúng chỗ (YouTube) | Tải lại rồi bấm phát thì nhảy tới khoảng 0:40 (server lưu 38 giây) |
| Hỏi đáp realtime giữa 2 tab | Đạt |
| Luồng đầy đủ: đăng ký, giỏ hàng, học, quiz, chứng chỉ, tạo khóa, duyệt khóa | Đạt (chi tiết ở `be/docs/test/KIEM_THU_PhienUI_20261128.md`) |

## Lỗi đã biết, chưa sửa
- Tab "Học liệu" không hiện quiz chính thức; `/exam/{id}` dùng hai loại id lệch nhau.
- Phiên hết hạn thì báo lỗi thay vì tự gia hạn; khi token hết hạn, tab vẫn gọi `/ws/info` liên tục.
- Trang khóa ghi "có lồng tiếng AI" dù chưa có bản lồng tiếng.
- Nút "Đăng ký" không đổi trạng thái sau khi ghi danh.
- Khách chưa đăng nhập không xem được lịch sử Hỏi đáp.
