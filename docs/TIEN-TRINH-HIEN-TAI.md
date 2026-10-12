# Tiến trình hiện tại (để chuyển cho tài khoản/người khác tiếp tục)

- Dự án: website bệnh viện thú y Lê Sơn (Astro 7, trang tĩnh). Repo `lqt140304-rgb/benhvienthuyleson`, nhánh làm việc **`claude/vigilant-bell-at24ko`** (đã push, không còn thay đổi chưa lưu).
- Người dùng không phải lập trình viên: trả lời tiếng Việt, đơn giản.
- **Trạng thái:** `modeDatLich = 'gia-lap'` (`src/lib/dat-lich.ts`). Chưa gộp `main`, chưa thay web chính, chưa triển khai Google cho web thật.

## Quy tắc phải giữ
- Không gộp `main`, không thay web chính, không triển khai Google thật khi chưa được chủ dự án cho phép; không tạo PR.
- Không sửa `src/data/*` khi chưa được phép (đã được phép một lần: ghi chú Grooming trong `dich_vu.json`, đã sửa xong).
- Không bịa nội dung; giữ logo, dữ liệu giá, nhãn "Chờ xác nhận".
- Tách rõ ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH; không báo "đạt" khi chưa có bằng chứng.
- Không commit khi bộ kiểm thử đang chạy (nó ghi tệp kết quả). Không đưa địa chỉ `/exec` hay khoá vào git.
- Commit kèm `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` và `Claude-Session: https://claude.ai/code/session_01HFoKr5y9dTAQ5qqiSXcP9p`; push đúng nhánh trên.

## A. Đã hoàn thành (đã push)
1. **Biểu mẫu đặt lịch mới** (`FormDatLich.astro`, `src/scripts/dat-lich.js`): chế độ `gia-lap` / `that` / `cu`; nhận lịch bằng cả email và Google Sheet; đã bỏ hoá đơn tham khảo và phụ phí tự động.
2. **`apps-script/Code.v2.gs`:** ghi theo tên cột (Sheet cũ không lệch); chống gửi email trùng khi chạy chồng; chống trùng theo nội dung (cùng SĐT + thú cưng + dịch vụ + ngày + giờ trong 60 phút); không nhận giờ đã qua trong hôm nay (cả biểu mẫu và máy chủ); màu theo dịch vụ + ẩn 6 cột chỉ để máy dùng; hàm `apDungMauVaAnCot`, `kiemTraTrenSheetRieng`.
3. **Bản thử `that`:** `kiem-thu-astro/dung-ban-thu-that.cjs` dựng `ban-thu-that/` (git bỏ qua) nối Sheet thử. Chủ dự án đã thử trên Sheet thử, báo chạy ổn.
4. **Dữ liệu:** ghi chú Grooming trong `src/data/dich_vu.json` đã bỏ mệnh đề "tự cộng vào hoá đơn tham khảo".
5. **Thiết kế R3.6** (commit mới nhất): tiêu đề h1/h2 dùng **Playfair Display**, h3/h4/nhãn/nút/nội dung giữ Be Vietnam Pro; chữ co giãn; hero hiện nối tiếp; gạch cam đầu khu vẽ ra; nút chính có ánh lướt; thẻ "Chẩn đoán" lơ lửng nhẹ; ảnh phóng nhẹ khi rê chuột; hoạ tiết hero trôi theo cuộn tối đa 12px (chỉ máy tính có chuột; tắt khi giảm chuyển động hoặc tắt "Hiệu ứng trang trí"). Tệp đổi: `src/layouts/Layout.astro`, `src/styles/le-son.css` (khối R3.6 ở cuối), `src/scripts/ui.js`.
6. **Tài liệu:** `docs/DANH-SACH-VIEC-DA-HOAN-THANH.md`, `docs/NHAT-KY-BAN-THU-THAT.md`, `docs/BAT-CHE-DO-THAT.md`, `docs/CHE-DO-DAT-LICH.md`, `HUONG-DAN-NHAN-LICH.md`.

## B. Kết quả kiểm thử gần nhất (Google là bản GIẢ)
| Bộ kiểm thử | Lệnh | Kết quả |
|---|---|---|
| Astro đầy đủ (~12 phút, chạy sau thiết kế R3.6) | `node kiem-thu-astro/kiem-thu-astro.cjs` | 91 ĐẠT, 0 KHÔNG ĐẠT, 6 CHƯA CHẠY, 3 CHƯA XÁC MINH |
| Apps Script | `node kiem-thu-astro/kiem-thu-apps-script.cjs` | 99 ĐẠT, 0 KHÔNG ĐẠT |
| Bản thử `that` trong trình duyệt | `node kiem-thu-astro/kiem-thu-that-dau-cuoi.cjs` (cần `dung-ban-thu-that.cjs` trước) | 18 ĐẠT, 0 KHÔNG ĐẠT |

Ảnh chụp tự kiểm của thiết kế mới (phông nạp cục bộ vì sandbox chặn Google Fonts) cho thấy trang chủ, bảng giá, đặt lịch ổn trên máy tính và điện thoại.

## C. Việc còn dở của thiết kế R3.6
- Thêm test riêng: h1/h2 dùng Playfair còn h3 giữ Be Vietnam; giảm chuyển động tắt animation mới; hoạ tiết trôi tối đa 12px; không cuộn ngang ở 7 cỡ; không tăng dịch bố cục (CLS).
- Dựng lại bản xem thử **giả lập** (`kiem-thu-astro/dung-ban-xem-thu.cjs`) và **hỏi chủ dự án** trước khi đăng lại lên claude.ai (bản đang đăng là bản cũ: chưa có chặn giờ đã qua, chưa có thiết kế mới).
- Cập nhật tài liệu về thiết kế mới; chụp ảnh trước/sau.
- Không thêm bộ đếm số liệu: web chưa có số liệu thật để đếm (tránh bịa).

## D. Còn chờ chủ dự án quyết định
- Bật `'that'` cho web thật: cần địa chỉ `/exec` của Sheet THẬT và quyền đổi `dia_chi_nhan_dat_lich` trong `src/data/thong_tin.json` (hiện vẫn là script cũ đang chạy thật).
- Có đăng lại bản xem thử claude.ai không.
- Có xoá hẳn biểu mẫu cũ sau khi nhận thật ổn định không.

## E. Chưa xác minh (chỉ Google thật / người dùng thật trả lời được)
- Email thật tới đủ và đúng số thư, hạn mức email.
- Màu và cột ẩn hiển thị đúng trên Google Sheets thật.
- Khoá `LockService` của Google chạy đúng như bản giả.
- Firefox, Safari, Edge; điện thoại thật; trình đọc màn hình.
- Giới hạn có chủ ý: nếu script chết đúng lúc gửi email, dòng "ĐANG GỬI" sau 5 phút được gửi lại và có thể tới 2 thư.

## F. Quy trình mỗi khi `Code.v2.gs` đổi
1. Dán lại **đủ** tệp vào Apps Script (hơn 400 dòng; chỉ giữ MỘT tệp mã; lỗi "Unexpected end of input" thường do dán thiếu).
2. Triển khai → Quản lý bản triển khai → biểu tượng bút → Phiên bản: Mới → Triển khai.
3. Có dữ liệu cũ thì chạy `apDungMauVaAnCot` một lần.
4. Thử lại theo `ban-thu-that/README-THU.md`.
