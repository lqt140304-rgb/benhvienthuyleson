# Hướng dẫn chuyển sang nhận lịch bằng biểu mẫu mới (ĐỀ XUẤT, chưa triển khai)

Nội dung này để **chủ dự án đọc và quyết định**. Chưa có gì trong tài liệu này được cài lên Google. Các bước tự làm khoảng 15 phút, và nên thử bằng một Sheet riêng trước.

## 1. Chọn nơi nhận yêu cầu đặt lịch

| Lựa chọn | Nhân viên thấy yêu cầu ở đâu | Cần gì |
|---|---|---|
| **A. Email** | Hộp thư của tài khoản Google triển khai script (kèm một dòng lưu trong trang tính để chống trùng) | Đã có trong `Code.v2.gs`: `GUI_EMAIL: true` |
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

## 3. Bật nhận thật ở website

1. Trong `src/lib/dat-lich.ts` đổi `modeDatLich` thành `'that'`.
2. Dựng lại web, mở `/dat-lich/`, gửi **một yêu cầu thử có tên "Thử nghiệm"** và kiểm tra:
   - màn hình hiện "Đã nhận yêu cầu đặt lịch…" cùng **mã yêu cầu**;
   - trang tính có đúng **một** dòng với mã đó; email (nếu bật) tới;
   - tắt mạng giữa chừng rồi gửi: hiện "Chưa nhận được xác nhận…", **không** báo thành công; bấm "Gửi lại" khi có mạng lại: vẫn chỉ **một** dòng.
3. Chỉ khi các bước trên đều đúng mới đưa lên website thật.

## 4. Hợp đồng gửi / nhận

- Trình duyệt gửi `POST` tới địa chỉ `/exec`, `Content-Type: text/plain;charset=utf-8` (để không bị trình duyệt chặn bước kiểm tra trước), nội dung JSON: `ma_yeu_cau, ten_khach, dien_thoai, ten_thu_cung, loai, loai_khac, dich_vu, dich_vu_ma, ngay (yyyy-mm-dd), gio (HH:MM), ngay_don, ghi_chu, website (ô bẫy, luôn rỗng), nguon, gui_luc`.
- Máy chủ trả JSON: `{ ok: true, ma, trung }` khi đã lưu (`trung: true` nếu mã gửi đã có); `{ ok: false, loi }` khi dữ liệu sai.
- Web chỉ báo **đã nhận** khi đọc được `ok: true` và có `ma`. Mọi trường hợp khác (không đọc được, quá 15 giây, lỗi mạng) báo "chưa nhận được xác nhận".

## 5. Điều chưa xác minh được (cần bạn thử)

- Trình duyệt có đọc được phản hồi JSON của Apps Script khi gọi từ `github.io` không (cách làm này thường chạy được nhưng chưa thử trên địa chỉ thật của bạn).
- Email có tới; hạn mức gửi email của Google.
- Cách gộp `Code.gs` cũ và `Code.v2.gs` trên Sheet đang chạy.

## 6. Quay lại

Đặt lại `modeDatLich = 'cu'` (biểu mẫu cũ) và dựng lại web. `Code.v2.gs` vẫn nhận được biểu mẫu cũ nên không phải đổi script.
