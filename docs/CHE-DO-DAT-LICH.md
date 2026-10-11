# Công tắc `modeDatLich` giải thích bằng lời thường

Hãy hình dung biểu mẫu đặt lịch là một **quầy tiếp nhận**. `modeDatLich` là công tắc **3 vị trí** quyết định quầy này làm gì. Nó chỉ là **một dòng** trong file `src/lib/dat-lich.ts`. **Bạn không cần tự sửa**: chỉ cần nói "bật nhận thật" hoặc "quay lại biểu mẫu cũ", tôi sẽ sửa, dựng lại và kiểm tra.

| Vị trí | Quầy làm gì | Khi nào dùng |
|---|---|---|
| **`'gia-lap'`** (đang đặt) | Người trực chỉ **diễn tập**. Khách điền và bấm gửi, màn hình báo "Hoàn tất giả lập, chưa gửi đi đâu". **Không có gì được gửi**, nhân viên không nhận được gì. | Xem thử và duyệt giao diện |
| **`'that'`** | Bấm gửi thì dữ liệu đi tới **Google Sheet và email** (bạn đã chọn cả hai). Chỉ báo **"Đã nhận yêu cầu"** khi trang tính đã lưu thật. | Khi chạy thật, **sau khi** bạn đã dán script `Code.v2.gs` vào Google Sheet và thử thành công |
| **`'cu'`** | Quay lại **biểu mẫu cũ** đang chạy trên website hôm nay (có hoá đơn tham khảo). | Chỉ còn để **cứu hộ**, vì bạn đã quyết định bỏ hoá đơn |

## Vì sao quan trọng
Website thật **hôm nay đang chạy biểu mẫu cũ**. Nếu đưa bản mới lên khi công tắc còn ở `'gia-lap'`, khách điền xong nhưng **không ai nhận được lịch**. Vì vậy:
- Khi công tắc ở `'gia-lap'`: **không đưa lên website thật**.
- Chỉ đưa lên khi ở `'that'` **và đã thử nhận thành công**.

## Lộ trình an toàn
1. Bạn làm theo `HUONG-DAN-NHAN-LICH.md` phần A và `docs/BAT-CHE-DO-THAT.md` (Google Sheet **thử riêng**, dán script, chạy `kiemTraTrenSheetRieng`).
2. Bạn báo "đã triển khai, link là …" → tôi bật `'that'` **trên nhánh làm việc** và chạy `DA_THU_SHEET_RIENG=co npm run kiem-tra-che-do -- --mong=that` (thiếu biến này lệnh từ chối: không bật nhầm khi chưa thử trên Sheet riêng).
3. Bạn gửi một lịch thử và kiểm tra Sheet + email (phần B của hướng dẫn).
4. Đạt cả bốn kiểm tra thì tôi mới đề nghị đưa lên website thật, và **chỉ làm khi bạn đồng ý**.

## Hai điều cần biết khi nâng cấp script
- **Biểu mẫu cũ không bị hỏng:** script bản 2 vẫn nhận được dữ liệu của biểu mẫu cũ (đã kiểm thử bằng dữ liệu do biểu mẫu cũ thật gửi).
- **Nhân viên phải xem trang tính mới:** bản 2 ghi vào trang **"Đặt lịch v2"**, không phải trang "Đặt lịch" cũ (hoặc đặt `TEN_TRANG` về "Đặt lịch": dữ liệu cũ giữ nguyên, cột mới thêm bên phải).

## Tôi đã làm gì để tránh nhầm chế độ
- Lệnh `npm run kiem-tra-che-do -- --mong=that` (hoặc `gia-lap`, `cu`) đọc bản dựng và **báo LỆCH** nếu chế độ thật khác chế độ mong muốn, để không phát hành nhầm.
- Nhật ký dựng web luôn in dòng `[dat-lich] modeDatLich = …`.
