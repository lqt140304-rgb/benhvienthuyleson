# Hướng dẫn chuyển sang nhận lịch bằng biểu mẫu mới (ĐỀ XUẤT, chưa triển khai)

Nội dung này để **chủ dự án đọc và quyết định**. Chưa có gì trong tài liệu này được cài lên Google. Các bước tự làm khoảng 15 phút, và nên thử bằng một Sheet riêng trước.

## 1. Chọn nơi nhận yêu cầu đặt lịch

| Lựa chọn | Nhân viên thấy yêu cầu ở đâu | Cần gì |
|---|---|---|
| **A. Email** | Hộp thư của tài khoản Google triển khai script (kèm một dòng lưu trong trang tính để chống trùng). **Lưu ý:** nếu email lỗi (hết hạn mức…) yêu cầu vẫn được lưu nhưng nhân viên không nhận email. Cột "Email báo" ghi LỖI và dòng được tô màu cam; dùng `guiLaiEmailLoi()` hoặc đặt tự chạy bằng `taoLichGuiLaiEmail()` (mục 2 bước 7) | `GUI_EMAIL: true` |
| **B. Trang quản lý = Google Sheet** | Mở trang tính "Đặt lịch v2": mỗi yêu cầu một dòng, cột "Trạng thái" (Mới → Đã gọi…) | `GUI_EMAIL: false` |
| **C. Cả hai** (đề xuất mặc định) | Email báo + dòng trong trang tính | `GUI_EMAIL: true` |
| **D. Trang quản lý riêng trong website** | Trang đăng nhập có danh sách yêu cầu | **Chưa làm.** Cần thiết kế riêng (đăng nhập, lưu trữ); hiện website chỉ là trang tĩnh |

**Việc cần bạn trả lời:** chọn A, B, C hay D. Cho tới khi chốt, biểu mẫu mới chạy ở chế độ **giả lập**.

## 2. Cài đặt (làm một lần)

> Làm trên **một Google Sheet thử** trước. Khi chắc chắn mới làm trên Sheet thật.

1. Mở Google Sheet nhận lịch → **Tiện ích mở rộng → Apps Script**.
2. Tạo tệp mới (dấu **+** cạnh "Tệp"), đặt tên `Code.v2`, dán toàn bộ nội dung `apps-script/Code.v2.gs`. **Không xoá `Code.gs` đang chạy.** Chỉ một hàm `doPost` được dùng: nếu để cả hai tệp, đổi tên hàm `doPost` của tệp cũ thành `doPostCu` hoặc xoá tệp cũ khi đã chuyển hẳn.
3. Sửa `CAU_HINH` theo lựa chọn ở mục 1. Bấm **Lưu**.
4. Chọn hàm `thuNghiem` → **Chạy**. Lần đầu Google hỏi cấp quyền: bấm cho phép. Kiểm tra: trang tính "Đặt lịch v2" có một dòng thử và (nếu bật email) có email. Xoá dòng thử.
5. **Triển khai → Quản lý các bản triển khai → sửa (bút chì) → Phiên bản: Phiên bản mới → Triển khai.** Đường link `/exec` giữ nguyên. Cách thực thi: *Chính tôi*; người truy cập: *Bất kỳ ai*.
6. Mở link `/exec` trên trình duyệt: thấy `{"ok":true,"dich_vu":"dat-lich-v2"}` là chạy đúng.

7. (Khuyến nghị nếu email là kênh chính) chạy `taoLichGuiLaiEmail` một lần để tự gửi lại các email lỗi mỗi 15 phút (tối đa 5 lần mỗi dòng; cần cấp thêm quyền quản lý trigger). Nếu không đặt, nhân viên cần xem cột **Email báo** và chạy `guiLaiEmailLoi` khi thấy LỖI.

## 3. Bật nhận thật ở website

1. Trong `src/lib/dat-lich.ts` đổi dòng `export const modeDatLich: ModeDatLich = 'gia-lap';` thành `'that'`. **Đây là cách DUY NHẤT để đổi chế độ** (không có biến môi trường nào; workflow triển khai không đặt biến nào).
2. Dựng lại web: `npm run build` (nhật ký dựng có dòng `[dat-lich] modeDatLich = that`). **Kiểm tra bản dựng trước khi phát hành:** `npm run kiem-tra-che-do -- --mong=that`. Lệnh in "CHẾ ĐỘ BẢN XUẤT: …" và báo LỆCH (mã thoát 1) nếu chế độ không đúng hoặc thiếu địa chỉ nhận.
3. Mở `/dat-lich/`, gửi **một yêu cầu thử có tên "Thử nghiệm"** và kiểm tra:
   - màn hình hiện "Đã nhận yêu cầu đặt lịch…" cùng **mã yêu cầu**;
   - trang tính có đúng **một** dòng với mã đó; email (nếu bật) tới;
   - tắt mạng giữa chừng rồi gửi: hiện "Chưa nhận được xác nhận…", **không** báo thành công; bấm "Gửi lại" khi có mạng lại: vẫn chỉ **một** dòng.
4. Chỉ khi các bước trên đều đúng mới commit và đưa lên website thật.

## 4. Hợp đồng gửi / nhận

- Trình duyệt gửi `POST` tới địa chỉ `/exec`, `Content-Type: text/plain;charset=utf-8` (để không bị trình duyệt chặn bước kiểm tra trước), nội dung JSON: `ma_yeu_cau, ten_khach, dien_thoai, ten_thu_cung, loai, loai_khac, dich_vu, dich_vu_ma, ngay (yyyy-mm-dd), gio (HH:MM), ngay_don, ghi_chu, website (ô bẫy, luôn rỗng), nguon, gui_luc`.
- Mã yêu cầu dạng `LS-yymmdd-XXXXXX` (6 ký tự, được kiểm tra duy nhất trong trang tính).
- Máy chủ trả JSON: `{ ok: true, ma, trung }` khi đã lưu (`trung: true` nếu mã gửi đã có); `{ ok: false, loi }` khi dữ liệu sai.
- Web chỉ báo **đã nhận** khi đọc được `ok: true` và có `ma`. Mọi trường hợp khác (không đọc được, quá 15 giây, lỗi mạng) báo "chưa nhận được xác nhận".

## 5. Điều chưa xác minh được (cần bạn thử)

- Trình duyệt có đọc được phản hồi JSON của Apps Script khi gọi từ `github.io` không (cách làm này thường chạy được nhưng chưa thử trên địa chỉ thật của bạn).
- Email có tới; hạn mức gửi email của Google (chưa xác minh con số cụ thể).
- Cách gộp `Code.gs` cũ và `Code.v2.gs` trên Sheet đang chạy.

## 6. Quay lại

Đặt lại `export const modeDatLich: ModeDatLich = 'cu';` (biểu mẫu cũ), `npm run build`, `npm run kiem-tra-che-do -- --mong=cu`. `Code.v2.gs` nhận được biểu mẫu cũ (kể cả ngày đón dính trong tên dịch vụ, cân nặng, hoá đơn, tổng tạm tính) nên không phải đổi script. Vì biểu mẫu cũ không đọc được phản hồi, bản v2 **luôn lưu** lịch cũ và ghi cột "Cần kiểm tra" nếu có chỗ không đọc được.
