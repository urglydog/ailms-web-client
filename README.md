# ailms-web-client — Frontend

Giao diện web của **AI-Powered LMS**. Next.js 15 (App Router) · TypeScript strict ·
TailwindCSS · React Query · Zustand.

> **Chạy hệ thống:** xem **`../be/RUNNING.md`** (docker-compose nằm ở repo `be`).
> Chạy riêng frontend: `npm install && npm run dev` → http://localhost:3000

## Trạng thái hiện tại — Giai đoạn 0

4 màn hình đã dựng xong theo design, **dùng dữ liệu mock**:

| Đường dẫn | Màn hình | Use case |
| --- | --- | --- |
| `/` | Trang chủ | — |
| `/courses` | Danh sách + 4 nhóm bộ lọc + trạng thái rỗng | UC09 |
| `/courses/[slug]` | Chi tiết, accordion chương/bài, đánh giá | UC10, UC11 |
| `/learn/[lessonId]` | Dual Player, chọn ngôn ngữ, kích hoạt lồng tiếng, tiến độ pipeline | UC16, UC17, UC18, UC20 |

Toàn bộ mock nằm trong **`lib/mock/courses.ts`**. Các giai đoạn sau chỉ cần thay hàm
trong file đó bằng React Query gọi API thật — **không phải sửa component nào**.

## Cấu trúc

```
app/
├─ layout.tsx          font (next/font), metadata
├─ providers.tsx       QueryClientProvider
├─ globals.css         @layer base/components: .shell .card .pill .skeleton
├─ (public)/           layout có Header/Footer
│  ├─ page.tsx                    Trang chủ
│  └─ courses/
│     ├─ page.tsx                 Danh sách (Client Component vì có bộ lọc)
│     └─ [slug]/page.tsx          Chi tiết (Server Component)
└─ (student)/learn/[lessonId]/    Dual Player
components/
├─ ui/        Button, Pill, Badge, Spinner, Skeleton, StarRating
├─ layout/    Header, Footer
├─ course/    CourseCard, CourseFilters, ChapterAccordion
└─ player/    DualPlayer, LanguageSwitcher, DubbingActivatePanel, PipelineProgress
hooks/        useDualPlayerSync
lib/api/      client.ts (fetch wrapper, parse ProblemDetail thành ApiError)
types/        domain.ts (khớp 31 entity backend)
```

## Design system

Token trong `tailwind.config.ts`, trích từ Claude Design project *LinguaLearn
Interactive Prototype*. Bảng màu và font là **quyết định có chủ đích**:

- Accent cyan/teal đơn sắc `#0891B2` — cố tình tránh "AI purple" và tông beige/đồng.
- Font **Outfit** (tiêu đề) + **Plus Jakarta Sans** (nội dung) — cố tình tránh Inter.
- Animation `ai-pulse` / `ai-glow` / `ai-spin` là tín hiệu riêng cho trạng thái
  "AI đang xử lý", **chỉ dùng cho hành động AI**, không dùng tràn lan.

## Hai quy ước quan trọng

**1. State ở đâu** (`lms-frontend-rules` mục 5):

| Loại | Dùng gì |
| --- | --- |
| UI tạm (drawer mở/đóng, input) | `useState` |
| Client-only, chia sẻ nhiều nơi (transport Dual Player) | Zustand |
| **Mọi dữ liệu từ backend** | React Query |

**Không bao giờ copy dữ liệu server vào Zustand** — đó là cách UI âm thầm hiển thị
dữ liệu cũ.

**2. Hai base URL khác nhau** (`lib/api/client.ts`):

| Nơi chạy | Biến | Giá trị |
| --- | --- | --- |
| Browser | `NEXT_PUBLIC_API_URL` | `http://localhost:8080` |
| Server Component (trong container) | `INTERNAL_API_URL` | `http://backend:8080` |

Dùng sai một trong hai gây lỗi "connection refused" rất khó đoán.

## Kiểm tra chất lượng

```bash
npm run typecheck   # tsc --noEmit — zero any, strict tuyệt đối
npm run lint
npm run build
```

## Đặc tả nghiệp vụ

| Cần gì | Đọc |
| --- | --- |
| Chức năng nào chạm dữ liệu/rule nào | `Skills/CodeSkills/05_AIPoweredLMS/skills/lms-usecase-map/` |
| Đồng bộ Dual Player, tiến độ học tập | `.../skills/lms-realtime-sync/` |
| Quy chuẩn code frontend | `Skills/CodeSkills/04_TechStack/rules/lms/lms-frontend-dualplayer.md` |

Kế hoạch 11 giai đoạn: `doc/DEVELOPMENT_PLAN.md`.
