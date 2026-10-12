# Danh sách việc đã hoàn thành (để chuyển cho người/AI khác tiếp tục)

- Dự án: website bệnh viện thú y Lê Sơn (Astro). Repo `lqt140304-rgb/benhvienthuyleson`, nhánh làm việc `claude/vigilant-bell-at24ko`.
- **Trạng thái:** công tắc `modeDatLich` trong `src/lib/dat-lich.ts` = **`'gia-lap'`**. **Chưa gộp `main`, chưa thay web chính, chưa triển khai Google cho web thật.**
- Mọi kết quả kiểm thử bên dưới chạy với đối tượng Google **GIẢ**. Phần Google thật chỉ chủ dự án xác nhận được.

## 1. Việc đã hoàn thành
1. **Biểu mẫu đặt lịch mới** (`src/components/ls/FormDatLich.astro`, `src/scripts/dat-lich.js`): tên khách, SĐT, tên thú cưng, loài (Chó/Mèo/Khác), dịch vụ, ngày, giờ (08:00–20:30 mỗi 30 phút), ngày đón cho nội trú, ghi chú, ô bẫy spam. Có các trạng thái đang gửi / đã nhận / lỗi / "chưa nhận được xác nhận" (quá 15 giây hoặc phản hồi không đọc được). Chỉ báo "Đã nhận yêu cầu đặt lịch" khi máy chủ trả JSON `{ok:true, ma}`. Gửi lại y nguyên thì dùng lại mã gửi (`ma_yeu_cau`). Ở `gia-lap`: 0 yêu cầu mạng.
2. **Nhận lịch bằng cả email và Google Sheet.** Đã **bỏ hoá đơn tham khảo và phụ phí tự động** trong biểu mẫu mới. Biểu mẫu cũ (`FormDatLichCu.astro`, chế độ `'cu'`) vẫn giữ để quay lại khi cần.
3. **`apps-script/Code.v2.gs`:** kiểm tra dữ liệu phía máy chủ; mã tra cứu `LS-yymmdd-XXXXXX` duy nhất; chặn công thức trong Sheet; khoá `LockService`; nhận cả dữ liệu biểu mẫu cũ (lưu và gắn "Cần kiểm tra"); theo dõi lỗi email (cột "Email báo", `guiLaiEmailLoi`, tối đa 5 lần); cấu hình `EMAIL_NHAN`.
4. **Sửa lỗi Sheet cũ lệch cột:** ghi theo **tên tiêu đề** (kể cả tên cũ của Code.gs), cột còn thiếu **thêm vào cuối**, không sửa/dời/xoá tiêu đề hay dòng cũ.
5. **Sửa lỗi gửi lại email đồng thời gây trùng:** dòng được "giữ chỗ" (`ĐANG GỬI <giờ>`) trong khoá trước khi gửi; kết quả ghi theo mã yêu cầu (không theo số dòng); dòng treo quá 5 phút được thử lại; hết 5 lượt thì chuyển LỖI.
6. **Chống trùng theo nội dung:** cùng SĐT + tên thú cưng + dịch vụ + ngày + giờ trong 60 phút (`CAU_HINH.CHONG_TRUNG_PHUT`) là một yêu cầu: không thêm dòng, không gửi thêm email, vẫn trả mã cũ. (Lỗi lộ ra khi thử thật: bấm "Gửi yêu cầu khác" rồi điền y hệt ra 2 dòng.)
7. **Không nhận giờ đã qua trong hôm nay** (giờ Việt Nam): biểu mẫu tắt các giờ đã qua và báo lỗi nếu ép chọn, sau 20:30 báo "đã hết giờ nhận lịch"; máy chủ cũng từ chối (riêng biểu mẫu cũ vẫn lưu và gắn "Cần kiểm tra" vì không đọc được phản hồi).
8. **Sheet có màu và gọn hơn:** mỗi dịch vụ một màu nền cả dòng (bảng `MAU_DICH_VU`); lỗi email chỉ tô ô "Email báo" cam đậm; ẩn 6 cột chỉ để máy dùng (`COT_AN`: Mã gửi từ trình duyệt, Cân nặng, Hoá đơn tham khảo, Tổng tạm tính, Số lần gửi email, Nguồn); hàm `apDungMauVaAnCot()` cho dữ liệu có sẵn + trang "Chú giải màu"; trang cũ không bị ẩn cột có sẵn.
9. **Bản thử chế độ `that`** nối với `/exec` của Sheet thử: dựng trong bản sao tạm (`kiem-thu-astro/dung-che-do.cjs`, `dung-ban-thu-that.cjs`) ra `ban-thu-that/` (git bỏ qua) kèm `README-THU.md`; công cụ `apps-script/thu-nhan-lich.html`; hàm `kiemTraTrenSheetRieng()` trong script. Chủ dự án đã thử trên Sheet thử và báo chạy ổn.
10. **Cổng an toàn:** `npm run kiem-tra-che-do -- --mong=that` từ chối nếu chưa đặt `DA_THU_SHEET_RIENG=co`.
11. **Sửa dữ liệu (chủ dự án cho phép):** trong `src/data/dich_vu.json`, ghi chú nhóm Grooming chỉ bỏ mệnh đề ", tự cộng vào hoá đơn tham khảo khi đặt lịch". Bộ kiểm thử ghi nhận đây là ngoại lệ duy nhất so với dữ liệu gốc.
12. **Tài liệu:** `docs/BAT-CHE-DO-THAT.md`, `docs/CHE-DO-DAT-LICH.md`, `docs/NHAT-KY-BAN-THU-THAT.md`, `HUONG-DAN-NHAN-LICH.md`, `docs/GIAO-DIEN-MOI-RA-SOAT.md`, `docs/DAT-LICH-DANH-GIA.md`; log kiểm thử trong `kiem-thu-astro/ket-qua/`.

## 2. Kết quả kiểm thử cuối (Google GIẢ)
| Bộ kiểm thử | Lệnh | Kết quả |
|---|---|---|
| Astro đầy đủ (~12 phút, chạy lại sau sửa hoạ tiết trôi) | `node kiem-thu-astro/kiem-thu-astro.cjs` | 91 ĐẠT, 0 KHÔNG ĐẠT, 6 CHƯA CHẠY, 3 CHƯA XÁC MINH |
| Apps Script | `node kiem-thu-astro/kiem-thu-apps-script.cjs` | 99 ĐẠT, 0 KHÔNG ĐẠT |
| Bản thử `that` trong trình duyệt thật | `node kiem-thu-astro/kiem-thu-that-dau-cuoi.cjs` | 18 ĐẠT, 0 KHÔNG ĐẠT |
| Thiết kế R3.6 (~6 phút; phông cục bộ qua `PHONG_CUC_BO`) | `node kiem-thu-astro/kiem-thu-r36.cjs` | 21 ĐẠT, 0 KHÔNG ĐẠT, 1 CHƯA CHẠY, 2 CHƯA XÁC MINH (không có phông cục bộ: 19 ĐẠT, 4 CHƯA XÁC MINH) |

Bản cũ chạy cùng bộ thử đều có mục KHÔNG ĐẠT (log `kiem-thu-astro/ket-qua/ban-cu-chay-*.txt`), tức bộ thử bắt đúng các lỗi đã sửa.

## 3. Chưa làm
- Chưa bật `'that'` cho web thật; chưa gộp `main`.
- Địa chỉ nhận trong `src/data/thong_tin.json` (`dia_chi_nhan_dat_lich`) vẫn là script **cũ đang chạy thật**, chưa nâng lên `Code.v2.gs`.
- Trang xem thử trên claude.ai là bản dựng cũ (chưa có chặn giờ đã qua).

## 4. Chưa xác minh (chỉ Google thật / người dùng thật trả lời được)
- Email thật tới đủ, đúng số thư, hạn mức email.
- Màu và cột ẩn hiển thị đúng trên Google Sheets thật.
- Khoá `LockService` của Google chạy đúng như bản giả.
- Trình duyệt Firefox, Safari, Edge; điện thoại thật; trình đọc màn hình.
- Giới hạn có chủ ý: nếu script chết đúng lúc đang gửi email, dòng "ĐANG GỬI" sau 5 phút được gửi lại và có thể tới **hai** thư.

## 5. Việc còn chờ chủ dự án quyết định
- Bật `'that'` cho web thật (cần địa chỉ `/exec` của Sheet thật, quyền đổi `dia_chi_nhan_dat_lich` trong `src/data/thong_tin.json`).
- Có cập nhật trang xem thử claude.ai không.
- Có xoá hẳn biểu mẫu cũ sau khi nhận thật ổn định không.

## 6. Quy trình mỗi khi `Code.v2.gs` đổi
1. Dán lại mã vào Apps Script (dán đủ tệp, khoảng 418+ dòng; chỉ giữ MỘT tệp mã trong dự án).
2. **Triển khai → Quản lý bản triển khai → biểu tượng bút → Phiên bản: Mới → Triển khai** (không làm bước này thì `/exec` vẫn chạy mã cũ).
3. Có dữ liệu cũ thì chạy `apDungMauVaAnCot` một lần.
4. Thử lại theo `ban-thu-that/README-THU.md`.

## 7. Quy tắc phải giữ
- Không gộp `main`, không thay web chính, không triển khai Google thật khi chưa được chủ dự án cho phép.
- Không sửa `src/data/*` khi chưa được phép (đã được phép riêng cho ghi chú Grooming).
- Không bịa nội dung; giữ logo, dữ liệu giá và nhãn "Chờ xác nhận"; phân biệt rõ ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH.
- Không commit khi bộ kiểm thử đang chạy; không đưa địa chỉ `/exec` hay khoá vào git.
