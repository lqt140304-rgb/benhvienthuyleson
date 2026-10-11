# Bật chế độ `'that'`: danh sách kiểm tra (chỉ bật sau khi thử trên Sheet riêng)

> Trạng thái hiện tại: `modeDatLich = 'gia-lap'`. **Chưa bật `'that'`, chưa triển khai Google, chưa gộp `main`.** Bản xem thử vẫn là giả lập.
> Tôi (trợ lý) **không gọi Google thật**. Các bước dưới đây do **bạn** làm trên một Google Sheet THỬ; mọi kết quả "đạt" chỉ có giá trị khi bạn tự xác nhận.

## Ba điều kiện bắt buộc (bạn kiểm tra trên Sheet THỬ)
| # | Điều kiện | Cách kiểm tra |
|---|---|---|
| 1 | **Lưu đúng MỘT dòng** cho mỗi yêu cầu | Sheet thử có đúng 1 dòng có mã `LS-…`, kể cả khi bấm gửi lại |
| 2 | **Email tới đúng hộp thư** | Hộp thư nhận (`EMAIL_NHAN`, nếu để trống là tài khoản Google đã triển khai script) có đúng 1 thư "Lịch mới LS-…" |
| 3 | **Gửi lại không trùng** | Gửi lại cùng mã: trả `"trung": true`, không thêm dòng, không thêm email; chạy `guiLaiEmailLoi` hai lần cũng không gửi thừa |

## Các bước
1. Tạo Google Sheet **MỚI** tên "Thử đặt lịch" (đừng dùng Sheet thật). *Apps Script → dán `apps-script/Code.v2.gs`* (xem `HUONG-DAN-NHAN-LICH.md` phần A).
2. (Nếu muốn thư tới hộp khác) sửa `CAU_HINH.EMAIL_NHAN` ở đầu script, ví dụ `'lichhen@benhvien.vn'`. Nhiều địa chỉ: cách nhau dấu phẩy.
3. Chạy hàm **`kiemTraTrenSheetRieng`** một lần (cấp quyền khi Google hỏi). Hàm tự ghi 1 yêu cầu thử, gửi lại cùng mã, giả lập lỗi email rồi gửi lại 2 lần, và ghi **ĐẠT / KHÔNG ĐẠT** vào trang **"Kết quả thử"**. Mọi mục phải ĐẠT.
   - Hàm không đọc được hộp thư: **bạn tự mở hộp thư** và xác nhận có đúng **2** thư "Lịch mới LS-…" (một lần đầu, một lần gửi lại sau lỗi giả lập) tới đúng địa chỉ in ở dòng cuối của "Kết quả thử".
4. Triển khai **Ứng dụng web** (Thực thi: Tôi; truy cập: Bất kỳ ai), lấy địa chỉ `/exec`.
5. Mở `apps-script/thu-nhan-lich.html` bằng trình duyệt, dán địa chỉ `/exec` của Sheet THỬ, tick xác nhận, bấm **Gửi 1 lịch thử** rồi **Gửi lại lần nữa**. Phải thấy: lần 1 `trung:false`, lần 2 cùng mã với `trung:true`; Sheet thử đúng **1 dòng**; hộp thư thêm đúng **1 thư**. Nếu trình duyệt báo không đọc được phản hồi dù Sheet có dòng thì **dừng**: biểu mẫu thật cũng sẽ báo "chưa nhận được xác nhận".
6. Thử trên Sheet thử đã có dữ liệu cũ: dán vài dòng theo kiểu trang "Đặt lịch" cũ (12 cột), đặt `TEN_TRANG: 'Đặt lịch'`, gửi 1 yêu cầu: tiêu đề và dòng cũ **không đổi**, cột mới nằm **bên phải**, dòng mới đúng cột.
7. Báo tôi: **"đã thử Sheet riêng, đạt cả 3 điều kiện, địa chỉ là …"** kèm ảnh chụp trang "Kết quả thử".

## Sau đó (tôi làm, trên nhánh làm việc, chỉ khi bạn báo đạt)
- Sửa `modeDatLich` thành `'that'`, `npm run build`. **Lưu ý địa chỉ nhận:** biểu mẫu lấy địa chỉ từ `dia_chi_nhan_dat_lich` trong `src/data/thong_tin.json`, hiện là địa chỉ script **cũ đang chạy thật**. Script cũ không hiểu dữ liệu của biểu mẫu mới, nên chỉ bật `'that'` cho web thật **sau khi** script thật đã được nâng lên `Code.v2.gs` (hoặc địa chỉ được đổi sang script mới). Tôi **không sửa `src/data/*` khi chưa được bạn cho phép**; để thử bản `'that'` tôi dựng ở thư mục tạm, không sửa repo.
- Chạy `DA_THU_SHEET_RIENG=co npm run kiem-tra-che-do -- --mong=that`. **Không đặt biến `DA_THU_SHEET_RIENG=co` thì lệnh từ chối** (mã thoát 1, chữ "CHƯA ĐƯỢC BẬT"), nên không ai bật nhầm khi chưa thử.
- Bản xem thử vẫn để `gia-lap` cho tới khi bạn yêu cầu khác. **Gộp `main` và triển khai Google thật chỉ làm khi bạn đồng ý bằng lời.**

## Điều đã kiểm thử bằng máy (đối tượng GIẢ của Google, không phải Google thật)
- Trang cũ 12 cột của Code.gs, bố cục nháp 14 cột, cột bị sắp xếp lại/thêm cột riêng/tiêu đề lệch hoa thường: dòng mới đúng cột theo tên, tiêu đề và dòng cũ giữ nguyên, cột thiếu thêm vào cuối.
- Hai lần gửi lại email chạy chồng nhau: chỉ 1 email; dòng "ĐANG GỬI" còn mới không bị gửi lại; dòng treo quá 5 phút được gửi lại 1 lần; nhân viên chèn dòng không làm ghi nhầm.
- Bản cũ (trước khi sửa) chạy cùng bộ thử này: **17 mục KHÔNG ĐẠT** (`kiem-thu-astro/ket-qua/ban-cu-chay-bo-thu-moi.txt`); bản mới: tất cả ĐẠT.
## Chưa xác minh (chỉ Google thật mới trả lời được)
Quyền khi cấp lần đầu, email thực sự tới, hạn mức email/ngày, trình duyệt đọc được phản hồi từ `github.io`, khoá `LockService` của Google chạy đúng như bản giả. Một giới hạn có chủ ý: nếu script chết đúng giữa lúc gửi email, dòng "ĐANG GỬI" sau 5 phút sẽ được gửi lại và có thể tới **hai** thư (ưu tiên không mất thông báo hơn là không trùng trong tình huống hiếm này).

## Bản THỬ `that` chạy trên máy bạn (nối Sheet thử)
- Dựng: `node kiem-thu-astro/dung-ban-thu-that.cjs <địa chỉ /exec của Sheet thử>` → thư mục `ban-thu-that/` (**git bỏ qua**, địa chỉ chỉ nằm trong bản dựng thử; `src/data/thong_tin.json` và `modeDatLich` của nhánh **không đổi**). Hướng dẫn chạy cho người không lập trình: `ban-thu-that/README-THU.md`.
- Kiểm thử bằng máy (trình duyệt thật + `Code.v2.gs` + Trang tính **giả**, không gọi Google): `node kiem-thu-astro/kiem-thu-that-dau-cuoi.cjs` → `kiem-thu-astro/ket-qua/ket-qua-that-dau-cuoi.txt` (gửi thành công; mất phản hồi sau khi đã lưu rồi gửi lại; lỗi mạng rồi gửi lại; hai yêu cầu khác nhau; không có hoá đơn / tổng tạm tính).
- Phần Google thật (email tới đúng hộp thư, Sheet thử đúng 1 dòng, trình duyệt đọc được phản hồi từ `script.google.com`) **chỉ bạn xác nhận được** bằng README-THU.md.
