# Project Context: Transfer File to Drive

## 📖 Giới Thiệu

Dự án này là một hệ thống **Backend tự động hóa** được xây dựng bằng **NestJS**, có nhiệm vụ chuyển đổi (transfer) các file video từ một Google Drive Folder nguồn sang một Google Drive đích.

Hệ thống được migrate từ một script Node.js đơn lẻ (`headless.js`) sang kiến trúc Microservices/Worker để đảm bảo tính ổn định và khả năng mở rộng.

## 🎯 Mục Tiêu Chính

1.  **Input**: Người dùng cung cấp URL của một Google Drive Folder (chứa các file video).
2.  **Process**:
    - Hệ thống tự động quét (scan) folder để lấy danh sách file.
    - Tải xuống từng file (sử dụng Playwright để bắt link stream & Curl để tải).
    - Ghép (merge) video và audio stream (sử dụng FFmpeg).
    - Upload file thành phẩm lên Drive đích (sử dụng Rclone).
3.  **Output**: File video hoàn chỉnh nằm trên Drive đích.

## 🏗️ Kiến Trúc Hệ Thống

### Tech Stack

- **Framework**: NestJS (Clean Architecture).
- **Database**: PostgreSQL (Prisma ORM).
- **Queue**: BullMQ (Redis) - để quản lý hàng đợi xử lý tuần tự.
- **Browser Automation**: Playwright (để login Google và bắt link tải).
- **Tools**:
  - `curl`: Tải file tốc độ cao.
  - `ffmpeg`: Ghép video/audio.
  - `rclone`: Upload file lên cloud.

### Luồng Hoạt Động (Workflows)

1.  **Job 1: Scan Folder (`folder-queue`)**
    - Worker: `TransferFolderProcessor`
    - Nhiệm vụ: Mở browser, cuộn trang, tìm tất cả file video trong folder nguồn, lưu thông tin vào bảng `TransferFile`.

2.  **Job 2: Process File (`file-queue`)**
    - Worker: `TransferFileProcessor`
    - Nhiệm vụ: Lấy từng file từ hàng đợi -> Login (nếu cần) -> Bắt link -> Download -> Merge -> Upload.
    - Cơ chế: Chạy tuần tự (`concurrency: 1`) để tránh bị Google block hoặc quá tải máy.
    - Retry: Tự động thử lại 3 lần nếu lỗi (Exponential Backoff).

## 📂 Cấu Trúc Source Code (`src/transfer-file`)

- `domain/entities`: Các thực thể `TransferFolder`, `TransferFile`.
- `application/use-cases`: Logic nghiệp vụ (`CreateTransferFolder`, `ProcessPendingFiles`).
- `infrastructure`:
  - `strategies/crawler.service.ts`: Core logic điều khiển Playwright/Curl/FFmpeg (được port từ `headless.js`).
  - `workers`: Các BullMQ processors.
  - `repositories`: Prisma implementations.
- `presentation`: API Controllers.

## 🚦 Trạng Thái Hiện Tại (Quan Trọng)

Dự án đã hoàn thành migration 95%. Các thành phần đã xong:

- [x] Database Schema & Migration.
- [x] API Endpoints.
- [x] Queue & Workers setup.
- [x] Core Crawler Logic.

**Vấn đề cần xử lý ngay (Next Steps):**
Hiện tại code đang gặp một số lỗi TypeScript (nhưng vẫn chạy được server dev):

1.  Lỗi **Visibility**: Các hàm `create`/`update` trong `PrismaBaseRepository` đang là `private/protected`, cần sửa thành `public` hoặc bọc lại để Worker gọi được.
2.  Lỗi **Type Inheritance**: `TransferFileEntity` đang conflict type với `BaseEntity`.

Vui lòng đọc file `HANDOVER.md` để biết chi tiết các lỗi này.

## 📄 Tài Liệu Kèm Theo

- `SETUP.md`: Hướng dẫn cài đặt Redis, Environment và cách chạy.
- `HANDOVER.md`: Báo cáo bàn giao chi tiết kỹ thuật và lỗi tồn đọng.
