# Nhật ký: từ lúc nối form Astro với Sheet thử đến nay

> Nhánh: `claude/vigilant-bell-at24ko`. **Chưa gộp `main`, chưa thay web chính, chưa triển khai Google thật cho web thật.** `modeDatLich` trong nhánh vẫn `'gia-lap'`; bản xem thử trên claude.ai vẫn là giả lập. Địa chỉ `/exec` của Sheet thử chỉ nằm trong bản dựng thử trên máy, không nằm trong git.

## 1. Việc đã làm, theo thứ tự

| # | Yêu cầu của bạn | Đã làm | Kiểm chứng |
|---|---|---|---|
| 1 | Nối form Astro với `/exec` của Sheet thử, bật `that` **riêng cho bản thử**; kiểm tra gửi thành công, lỗi mạng, gửi lại không trùng; giữ email + Sheet; bỏ hoá đơn và phụ phí tự động | `dung-che-do.cjs` nhận thêm địa chỉ (chỉ trong **bản sao tạm**); script mới `dung-ban-thu-that.cjs` dựng `ban-thu-that/` (git bỏ qua) kèm `README-THU.md`; tách `mo-phong-google.cjs` (Google giả dùng chung); `kiem-thu-that-dau-cuoi.cjs` chạy trình duyệt thật → `Code.v2.gs` thật → Trang tính giả | Đầu-cuối: gửi thành công = 1 dòng + 1 email; mất phản hồi rồi gửi lại = vẫn 1 + 1; lỗi mạng rồi gửi lại = 1 + 1; form không gửi hoá đơn / tổng tạm tính |
| 2 | (Bạn thử trên Google thật) "Gửi lại vẫn ra 2 dòng, 2 email" | Nguyên nhân: bấm **"Gửi yêu cầu khác"** rồi điền lại thì trình duyệt sinh mã gửi mới, máy chủ chỉ chống trùng theo mã → coi là 2 yêu cầu (đúng thiết kế cũ, không phải bạn làm sai). Thêm **chặn trùng theo nội dung**: cùng SĐT + tên thú cưng + dịch vụ + ngày + giờ trong 60 phút = một yêu cầu (`CAU_HINH.CHONG_TRUNG_PHUT`) | Bản cũ chạy cùng bộ thử tái hiện đúng lỗi (2 dòng, 2 email); bản mới 1 dòng, 1 email, cùng mã. Dòng cũ của trang "Đặt lịch" không bao giờ bị coi là trùng |
| 3 | Không nhận giờ đã qua trong hôm nay (đang 8:00 không đặt 6:00) | **Biểu mẫu** (`dat-lich.js`): chọn hôm nay thì tắt các giờ đã qua theo giờ Việt Nam, có dòng gợi ý, ép chọn vẫn báo lỗi và không gửi; sau 20:30 báo "đã hết giờ nhận lịch". **Máy chủ** (`kiemTra_`): từ chối giờ đã qua của hôm nay (biểu mẫu cũ không đọc được phản hồi nên vẫn lưu và gắn "Cần kiểm tra") | Apps Script (đồng hồ giả: 8:00, 14:00, 20:45, nửa đêm); trình duyệt với đồng hồ đặt 14:00 và 21:30 |
| 4 | Mỗi dịch vụ một màu khi vào Sheet; ẩn các cột mã, chỉ để phần chính | Bảng `MAU_DICH_VU` (tô cả dòng); `COT_AN` ẩn 6 cột: Mã gửi từ trình duyệt, Cân nặng, Hoá đơn tham khảo, Tổng tạm tính, Số lần gửi email, Nguồn; lỗi email chỉ tô ô "Email báo" cam đậm; hàm `apDungMauVaAnCot()` cho dữ liệu có từ trước + trang "Chú giải màu"; trang cũ không bị ẩn cột có sẵn | Apps Script mục 13 |

Mỗi lần bạn gửi địa chỉ `/exec` mới (sau khi triển khai lại), tôi dựng lại `ban-thu-that.zip` với địa chỉ đó và kiểm tra `kiem-tra-che-do --mong=that` (3 lần).

## 2. Màu theo dịch vụ
Khám = xanh dương nhạt · Xét nghiệm = tím nhạt · Tiêm phòng = xanh lá nhạt · Grooming/Spa = hồng nhạt · Triệt sản = vàng nhạt · Phẫu thuật = đỏ nhạt · Gửi nội trú = xanh ngọc nhạt · Cấp cứu = đỏ hồng · dịch vụ mới = một màu cố định theo tên. Ô "Email báo" lỗi = cam đậm.

## 3. Cột hiển thị trong Sheet
Hiện: Mã yêu cầu (để đối chiếu với email), Thời gian nhận, Tên khách hàng, Số điện thoại, Tên thú cưng, Loài, Dịch vụ, Ngày, Giờ, Ngày đón, Giờ đón, Ghi chú, Trạng thái, Cần kiểm tra, Email báo. Ẩn: 6 cột nêu ở dòng 4 bảng trên (bấm mũi tên giữa các cột để hiện lại).

## 4. Kết quả kiểm thử hiện tại (Google là bản GIẢ)
- Apps Script: **99 ĐẠT, 0 KHÔNG ĐẠT** (các bản trước khi sửa chạy cùng bộ thử đều có mục KHÔNG ĐẠT, log trong `kiem-thu-astro/ket-qua/ban-cu-chay-*.txt`).
- Bản thử `that` trong trình duyệt thật: **18 ĐẠT, 0 KHÔNG ĐẠT**.
- Bộ Astro đầy đủ (lần chạy cuối, trước bước màu/ẩn cột vì web không đổi): **89 ĐẠT, 0 KHÔNG ĐẠT**, 6 CHƯA CHẠY, 3 CHƯA XÁC MINH.

## 5. Quy trình mỗi khi `Code.v2.gs` đổi
1. Dán lại mã vào Apps Script.
2. **Triển khai → Quản lý bản triển khai → biểu tượng bút → Phiên bản: Mới → Triển khai** (không làm bước này thì `/exec` vẫn chạy mã cũ).
3. Với dữ liệu có từ trước, chạy `apDungMauVaAnCot` một lần.
4. Chạy lại bản thử theo `ban-thu-that/README-THU.md`.

## 6. Còn CHƯA XÁC MINH (chỉ Google thật / người dùng thật trả lời được)
- Email thật tới đúng hộp thư và số thư (kể cả hạn mức email của Google).
- Sheet thử lưu đúng 1 dòng ở mọi bước trên Google thật (đã thấy 2 dòng ở lần thử đầu; **đã sửa, chưa thấy kết quả thử lại**).
- Trình duyệt đọc được phản hồi từ `script.google.com`.
- Màu và cột ẩn hiển thị đúng trên Google Sheets thật.
- Khoá `LockService` của Google chạy đúng như bản giả.
- Giới hạn có chủ ý: nếu script chết đúng lúc gửi email, dòng "ĐANG GỬI" sau 5 phút được gửi lại và có thể tới 2 thư.
- Trình duyệt khác (Firefox, Safari, Edge), điện thoại thật, trình đọc màn hình.
- Trang xem thử claude.ai là bản dựng cũ, chưa có chặn giờ đã qua.

## 7. Còn chờ bạn
- Thử lại trên Google thật theo `README-THU.md` và báo: số dòng Sheet, số thư, màn hình hiện gì mỗi bước.
- Cho phép sửa ghi chú Grooming trong `src/data/dich_vu.json` (nói "hoá đơn tham khảo" nay không đúng).
- Thời điểm bật `'that'` cho web thật: cần script thật đã nâng lên `Code.v2.gs` (địa chỉ nhận trong `src/data/thong_tin.json` hiện vẫn là script cũ đang chạy thật); gộp `main` chỉ khi bạn đồng ý.
- Có xoá hẳn biểu mẫu cũ sau khi nhận thật ổn định không.
