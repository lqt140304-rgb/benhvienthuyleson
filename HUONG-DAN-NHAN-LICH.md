# Nhận lịch bằng biểu mẫu mới: việc cần làm (dành cho chủ dự án)

> **Đã chốt (11/10/2026):** nhận lịch bằng **cả email lẫn Google Sheet**; **bỏ** hoá đơn tham khảo và phụ phí tự động.
> Hiện biểu mẫu mới đang ở chế độ **xem trước (giả lập)**, chưa nhận lịch thật. Công tắc chế độ giải thích ở `docs/CHE-DO-DAT-LICH.md`.
> Chưa có gì trong tài liệu này được cài lên Google. Làm theo thứ tự, và **thử bằng một Google Sheet riêng trước**.

> **Làm thêm theo `docs/BAT-CHE-DO-THAT.md`:** chạy hàm `kiemTraTrenSheetRieng` và `apps-script/thu-nhan-lich.html` trên Sheet THỬ. Chế độ `'that'` chỉ được bật sau khi đạt 3 điều: lưu đúng 1 dòng, email tới đúng hộp thư, gửi lại không trùng.

> **Mỗi lần script thay đổi** (kể cả bản chống trùng theo nội dung): dán lại mã, rồi **Triển khai → Quản lý bản triển khai → biểu tượng bút → Phiên bản: Mới → Triển khai**. Không làm bước này thì địa chỉ `/exec` vẫn chạy mã cũ.

## A. Việc bạn làm (khoảng 15 phút)
1. Đăng nhập Google bằng tài khoản của bệnh viện, tạo một **Google Sheet thử**, đặt tên "Thử đặt lịch".
2. Trong Sheet: **Tiện ích mở rộng → Apps Script**.
3. Bấm dấu **+** cạnh "Tệp" → **Tập lệnh**, đặt tên `Code.v2`, dán toàn bộ nội dung file `apps-script/Code.v2.gs`. Bấm **Lưu**.
   - Nếu trong dự án có sẵn tệp `Code.gs` cũ: **xoá** tệp cũ khi làm trên Sheet thử (hai tệp cùng có hàm `doPost` sẽ lẫn).
4. Chọn hàm **`thuNghiem`** ở thanh trên → **Chạy** → cấp quyền khi Google hỏi.
   - Kiểm tra: Sheet có thêm trang **"Đặt lịch v2"** với một dòng "Thử nghiệm", và có **email báo** về hộp thư. Xoá dòng thử.
5. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web.** "Thực thi dưới dạng": **Tôi**. "Người có quyền truy cập": **Bất kỳ ai** → **Triển khai**.
6. Mở link `/exec` vừa có trên trình duyệt: thấy `{"ok":true,"dich_vu":"dat-lich-v2"}` là chạy đúng.
7. (Khuyến nghị, vì nhận cả email) chạy hàm **`taoLichGuiLaiEmail`** một lần: nếu email bị lỗi tạm thời, hệ thống tự gửi lại mỗi 15 phút (tối đa 5 lần mỗi lịch).
8. Báo tôi: **"đã triển khai, link là …"**. Tôi sẽ bật chế độ nhận thật **trên nhánh làm việc** và kiểm tra.

## B. Sau khi tôi bật chế độ nhận thật (bạn kiểm tra)
1. Mở trang Đặt lịch của bản xem thử, gửi **một lịch thử tên "Thử nghiệm"**.
2. Màn hình phải hiện **"Đã nhận yêu cầu đặt lịch, bệnh viện sẽ liên hệ xác nhận"** kèm **mã yêu cầu** (dạng `LS-261011-XXXXXX`).
3. Trang tính "Đặt lịch v2" có **đúng một dòng** với mã đó; email báo tới (cột "Email báo" ghi "đã gửi").
4. Thử tắt mạng rồi gửi: phải hiện "Chưa nhận được xác nhận…", **không** báo thành công. Bật mạng, bấm "Gửi lại": vẫn **chỉ một dòng**.
5. Đạt cả bốn mới tính tới bước đưa lên website thật (cần bạn đồng ý).

## C. Nhân viên xem lịch ở đâu và cần lưu ý gì
- Mỗi yêu cầu là một dòng ở trang **"Đặt lịch v2"** (cột "Trạng thái": Mới → Đã gọi…). Đây là trang quản lý.
- **Cột "Email báo":** "đã gửi", "không dùng", hoặc **LỖI** (dòng được tô màu cam). Dòng LỖI nghĩa là yêu cầu **vẫn được lưu** nhưng email chưa tới: xem Sheet, và nếu đã đặt bước A7 thì hệ thống tự gửi lại.
- **Cột "Cần kiểm tra"** có chữ: lịch đến từ biểu mẫu cũ và có chỗ hệ thống không đọc được (ví dụ ngày đón): nhân viên xem lại khi gọi khách.
- Script bản 2 mặc định ghi vào trang **"Đặt lịch v2"**, **khác trang "Đặt lịch" cũ**: đổi thói quen xem sang trang mới. Nếu muốn dùng lại trang "Đặt lịch" cũ, đặt `TEN_TRANG: 'Đặt lịch'`: bản 2 **không đụng dòng và tiêu đề cũ**, chỉ thêm cột mới vào bên phải và ghi dòng mới đúng cột theo tên.
- Cột **"Email báo"** có thể ghi **ĐANG GỬI …** trong vài giây (hệ thống đang gửi). Nếu ghi mãi quá 5 phút thì lần gửi lại tự động sẽ xử lý.
- Muốn email tới hộp thư khác chủ tài khoản: điền `EMAIL_NHAN` ở đầu script.
- Biểu mẫu cũ đang chạy trên web vẫn hoạt động nếu bạn nâng cấp script cũ lên bản 2 (bản 2 vẫn nhận được dữ liệu của biểu mẫu cũ), nhưng lịch từ biểu mẫu cũ cũng nằm ở trang "Đặt lịch v2".

## D. Quay lại khi cần
Báo tôi "quay lại biểu mẫu cũ": tôi đặt lại chế độ `'cu'`, dựng lại và kiểm tra. Script bản 2 không phải đổi.

## E. Điều chưa xác minh được (cần bạn thử, tôi không gọi Google)
- Email có tới; hạn mức gửi email của Google (chưa xác minh con số cụ thể).
- Trình duyệt từ trang `github.io` đọc được phản hồi của Apps Script (cách làm này thường chạy được nhưng chưa thử trên địa chỉ thật của bạn). Nếu không đọc được, biểu mẫu sẽ báo "Chưa nhận được xác nhận" thay vì báo thành công: an toàn nhưng cần tôi xử lý tiếp.

## Phụ lục: ghi chú kỹ thuật (cho người triển khai)
- Đổi chế độ: chỉ **một cách**, sửa hằng số `modeDatLich` trong `src/lib/dat-lich.ts` (`'gia-lap'` / `'that'` / `'cu'`), `npm run build`, `npm run kiem-tra-che-do -- --mong=<chế độ>`, commit.
- Hợp đồng gửi / nhận: trình duyệt `POST` JSON dạng `text/plain;charset=utf-8` tới địa chỉ `/exec` (`ma_yeu_cau, ten_khach, dien_thoai, ten_thu_cung, loai, loai_khac, dich_vu, dich_vu_ma, ngay (yyyy-mm-dd), gio (HH:MM), ngay_don, ghi_chu, website (ô bẫy), nguon, gui_luc`). Máy chủ trả `{ ok: true, ma, trung }` khi đã lưu hoặc `{ ok: false, loi }`. Web chỉ báo "đã nhận" khi đọc được `ok: true` và có `ma`; mọi trường hợp khác (quá 15 giây, lỗi mạng, không đọc được) báo "chưa nhận được xác nhận". Mã dạng `LS-yymmdd-XXXXXX`, duy nhất trong trang tính.
