# Tiến trình hiện tại (để chuyển cho tài khoản/người khác tiếp tục)

- Dự án: website bệnh viện thú y Lê Sơn (Astro 7, trang tĩnh). Repo `lqt140304-rgb/benhvienthuyleson`, nhánh làm việc hiện tại **`claude/youthful-turing-b5olam`** (nối tiếp `claude/vigilant-bell-at24ko`).
- Người dùng không phải lập trình viên: trả lời tiếng Việt, đơn giản.
- **Trạng thái:** `modeDatLich = 'gia-lap'` (`src/lib/dat-lich.ts`). Chưa gộp `main`, chưa thay web chính, chưa triển khai Google cho web thật.

## Bản xem thử (đăng riêng tư trên claude.ai, chế độ giả lập: biểu mẫu KHÔNG gửi dữ liệu thật; chia sẻ bằng nút Share của trang)
- **Giao diện mới (đến bước 3):** https://claude.ai/artifact/397ZNXVUwWPcEg8BwUWHJS . Dựng lại: `node kiem-thu-astro/dung-giao-dien.cjs moi dist-moi` → `node kiem-thu-astro/dung-ban-xem-thu.cjs --dist=dist-moi --ra=xem-thu-moi "--tieu-de=Lê Sơn · giao diện mới (bản xem thử)"` → kiểm `kiem-thu-ban-xem-thu-moi.cjs` (16 ĐẠT) → đăng `xem-thu-moi/index.html` kèm các tệp trong `xem-thu-moi/danh-sach-tep.json` (bỏ `index.html`, bỏ `tep/r36.*.css` không dùng) lên đúng link trên.
- **Giao diện R3.6 (đang là mặc định của web):** https://claude.ai/artifact/DacogZFGCxReWgvqeV6qi4 (đăng 12/10/2026: có thiết kế R3.6 và chặn giờ đã qua; không cập nhật theo giao diện mới).

## Kế hoạch giao diện mới (12/10/2026)
- Kế hoạch giao diện + hiệu ứng mới đã duyệt với chủ dự án: **`docs/KE-HOACH-GIAO-DIEN-MOI.md`**. Đang làm trên nhánh **`claude/giao-dien-moi-hieu-ung`** (tách từ `claude/vigilant-bell-at24ko`, đã gộp `claude/youthful-turing-b5olam`). **Bước 1 (nền móng), bước 2 (Header, Hero, Giới thiệu, chuyển trang) và bước 3 (Dịch vụ, Sản phẩm, Tóm tắt giá, trang Bảng giá) xong 12/10/2026**; chi tiết ở mục "Tiến độ" cuối tệp kế hoạch. Công tắc `GIAO_DIEN` (`src/lib/site.ts`) vẫn là `'r36'`, web chưa đổi. Việc tiếp theo: bước 4 (Đặt lịch: chỉ đổi lớp vỏ, chạy lại kiểm thử form ngay). Bản vẽ tldraw bước 3 nằm trong phiên tldraw (không có link bền; vẽ lại nếu cần). Bản vẽ Header/Hero đã duyệt: https://claude.ai/artifact/1NVhg6VVqRQUJTgyGtiEFM. Chủ dự án chốt: không dùng số thứ tự / ô đánh dấu ở danh mục và menu; nét bút cam dưới mục menu giữ màu cam; chuyển trang dùng View Transitions (xem điều chỉnh ở kế hoạch).

## Mới nhất (12/10/2026)
- Hero: video phủ kín cả khu, mờ dần sang trái. Giới thiệu + Dịch vụ nổi bật gộp một khu (Tailwind v4, tiền tố `tw:`, không Preflight). Chi tiết: cuối `docs/KE-HOACH-GIAO-DIEN-MOI.md`. Chủ dự án dặn: khi xong luôn gửi bản xem thử + tài liệu + (lần này) mã nguồn.

- Đặt lịch giao diện mới (nhánh `claude/dat-lich-moi`): xem `docs/DAT-LICH-MOI.md`. Chưa gộp, chờ chủ dự án duyệt bản xem thử.

## Quy tắc phải giữ
- **Khi kết thúc mỗi lượt làm việc (chủ dự án dặn 12/10/2026): luôn đưa (1) link bản xem thử mới nhất (dựng `xem-thu/` hoặc `xem-thu-moi/`, đăng / cập nhật artifact riêng tư ở chế độ giả lập) và (2) các tài liệu chủ dự án đã yêu cầu (gửi tệp, ghi đường dẫn).** Link hiện có: xem mục "Bản xem thử" ngay dưới.
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
- ~~Thêm test riêng~~ **ĐÃ XONG** (nhánh `claude/youthful-turing-b5olam`): `kiem-thu-astro/kiem-thu-r36.cjs`, kết quả `kiem-thu-astro/ket-qua/ket-qua-r36.txt` (21 ĐẠT, 0 KHÔNG ĐẠT, 1 CHƯA CHẠY, 2 CHƯA XÁC MINH) và `ket-qua-r36-khong-phong.txt`. Kiểm: h1/h2 Playfair, phần còn lại Be Vietnam Pro (cả khai báo CSS lẫn phông vẽ thật, đủ dấu tiếng Việt); giảm chuyển động từ đầu / đổi giữa chừng / tắt "Hiệu ứng trang trí"; hoạ tiết trôi ≤ 12px chỉ máy tính có chuột; không cuộn ngang 11 trang × 8 cỡ (lúc hiệu ứng chạy, xong, rê chuột); CLS < 0,1 và không tăng quá 0,01 so với commit 422c7a4.
  - Cách chạy: `npm pack @fontsource/playfair-display @fontsource/be-vietnam-pro`, giải nén mỗi gói vào `<thư mục>/fontsource-playfair-display/` và `<thư mục>/fontsource-be-vietnam-pro/`, rồi `PHONG_CUC_BO=<thư mục> NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-r36.cjs` (không có phông thì vẫn chạy, các mục phông thành CHƯA XÁC MINH).
  - **Lỗi test tìm ra và đã sửa:** hoạ tiết "cuộn len" (hệ số `--k` 1,5) trôi tới 18px, vượt 12px. Sửa `src/scripts/ui.js`: `--py` tối đa 8px (8 × 1,5 = 12px); tỉ lệ chiều sâu giữa ba hoạ tiết giữ nguyên. Bộ Astro đầy đủ chạy lại sau sửa: 91 ĐẠT, 0 KHÔNG ĐẠT, 6 CHƯA CHẠY, 3 CHƯA XÁC MINH.
- ~~Dựng lại bản xem thử giả lập~~ **ĐÃ XONG (12/10/2026):** `dung-ban-xem-thu.cjs` → `xem-thu/` (git bỏ qua), `kiem-thu-ban-xem-thu.cjs` 25 ĐẠT, 0 KHÔNG ĐẠT; có thiết kế R3.6 và chặn giờ đã qua. Chủ dự án đồng ý đăng **link mới, riêng tư**: https://claude.ai/artifact/DacogZFGCxReWgvqeV6qi4 (bản cũ nằm ở tài khoản khác, không cập nhật được). Đăng lại: dựng lại `xem-thu/` rồi đăng `xem-thu/index.html` kèm các tệp trong `xem-thu/danh-sach-tep.json` (bỏ `index.html`) lên đúng link trên.
- Cập nhật tài liệu về thiết kế mới; chụp ảnh trước/sau.
- Không thêm bộ đếm số liệu: web chưa có số liệu thật để đếm (tránh bịa).

## D. Còn chờ chủ dự án quyết định
- Bật `'that'` cho web thật: cần địa chỉ `/exec` của Sheet THẬT và quyền đổi `dia_chi_nhan_dat_lich` trong `src/data/thong_tin.json` (hiện vẫn là script cũ đang chạy thật).
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
