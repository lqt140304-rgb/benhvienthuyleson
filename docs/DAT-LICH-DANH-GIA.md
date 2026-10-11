# Đánh giá biểu mẫu đặt lịch (trước khi thiết kế lại)

> Phạm vi: chỉ ĐỌC mã và dữ liệu của website thật. **Không gọi vào Google Apps Script, không gửi dữ liệu thử vào hệ thống của bệnh viện.**

## 1. Biểu mẫu cũ làm gì (theo mã nguồn)

| Phần | Thật hay mô phỏng | Chi tiết |
|---|---|---|
| Biểu mẫu `src/pages/dat-lich.astro` (bản cũ, nay là `components/ls/FormDatLichCu.astro`) | **Thật theo mã** | Kiểm tra dữ liệu trên trình duyệt, tính "hoá đơn tham khảo" và phụ phí tự động, rồi gửi `POST` tới địa chỉ trong `src/data/thong_tin.json` (khoá `dia_chi_nhan_dat_lich`) |
| Cách gửi | Thật, nhưng **mù** | `fetch(..., { mode: 'no-cors' })`, dạng form-urlencoded. Chế độ này **không cho trình duyệt đọc phản hồi** |
| Máy chủ nhận `apps-script/Code.gs` | **Thật theo mã** | Kiểm tra lại dữ liệu; chặn ô bẫy spam; ghi một dòng vào trang tính "Đặt lịch"; gửi email cho chủ tài khoản Google đã triển khai; trả chữ `ok` / `loi` / `ngoai-gio` |
| Thông báo "Đã gửi yêu cầu đặt lịch" | **Chỉ là dấu hiệu "không có lỗi mạng"** | Hiện ngay khi `fetch` không ném lỗi. Không chứng minh máy chủ đã nhận, đã ghi vào trang tính hay đã gửi email |

## 2. Không kiểm chứng được từ đây (CHƯA XÁC MINH)

- Địa chỉ nhận trong `thong_tin.json` còn sống và đang chạy đúng phiên bản `Code.gs` hiện tại không.
- Email có tới hộp thư của chủ tài khoản không; trang tính có dòng mới không.
- Đã có lượt đặt lịch thật nào qua biểu mẫu chưa.

Các điều trên chỉ chủ dự án kiểm được bằng cách tự thử trong môi trường của họ.

## 3. Điểm yếu

1. **"Đã gửi" ≠ "Đã nhận".** Địa chỉ nhận sai, script bị gỡ, hết quyền… biểu mẫu vẫn báo thành công. Khách tin là đã đặt lịch.
2. **Không có mã yêu cầu**, nên khách và nhân viên không có gì để đối chiếu.
3. **Chống gửi trùng chỉ bằng khoá nút**: tải lại trang hoặc gửi lại sau lỗi mạng có thể tạo hai dòng.
4. **Không có trạng thái "thất bại có thể thử lại" tách bạch**: chỉ có lỗi mạng chung, và lúc đó dữ liệu vẫn nằm trong form nhưng không giải thích rõ có thể đã gửi hay chưa.
5. Chưa có ô **tên thú cưng**.
6. Ngày đón nội trú: kiểm tra ngày giờ đón sau lúc gửi nhưng giao diện khác với bản đã duyệt.

## 4. Biểu mẫu mới (giai đoạn 3)

| Yêu cầu | Đã làm |
|---|---|
| Trường | Tên khách hàng, số điện thoại, **tên thú cưng**, loài (chọn "Khác" thì hiện ô nhập loài), dịch vụ, ngày và giờ mong muốn, **dịch vụ nội trú thì thêm ngày đón dự kiến (không trước ngày gửi)**, ghi chú không bắt buộc, ô bẫy spam |
| Phân biệt 3 trạng thái | **Đang gửi** (khoá ô nhập và nút, "Đang gửi…"), **Đã nhận** (chỉ khi máy chủ trả `{ ok: true, ma }` đọc được), **Thất bại** (máy chủ báo lỗi, hoặc **chưa nhận được xác nhận** do quá thời gian / phản hồi không đọc được) |
| Giữ dữ liệu khi lỗi | Không xoá gì; nút đổi thành "Gửi lại" |
| Chống gửi trùng | Khoá nút và chặn gửi khi đang gửi; **mã yêu cầu** `ma_yeu_cau` sinh một lần cho một nội dung và tái dùng khi gửi lại; máy chủ (v2) bỏ qua mã đã có |
| Câu "Đã nhận yêu cầu đặt lịch, bệnh viện sẽ liên hệ xác nhận" | Chỉ hiện sau khi máy chủ thật sự đã nhận. **Không bao giờ nói "lịch đã được xác nhận"** |
| Mặc định | **Giả lập: không gửi gì** (hằng số `modeDatLich = 'gia-lap'` trong `src/lib/dat-lich.ts`, cách duy nhất để đổi chế độ), có dòng "Bản xem trước · chưa gửi dữ liệu thật" |
| Nhận thật | Đề xuất `apps-script/Code.v2.gs` + `HUONG-DAN-NHAN-LICH.md`; **chưa triển khai**, không đổi địa chỉ nhận hiện có |

### Không đưa sang biểu mẫu mới (CHỦ DỰ ÁN CHƯA QUYẾT ĐỊNH)
Hoá đơn tham khảo và phụ phí tự động, chọn cân nặng theo dịch vụ, giảm giá gửi dài ngày: bản thiết kế prototype R3.x không có các tính năng này, nên biểu mẫu mới (một ô chọn dịch vụ) cũng không có. **Chủ dự án chưa quyết định giữ hay bỏ**; việc bỏ chưa được duyệt. Giá vẫn xem ở trang Bảng giá. Muốn giữ tính năng hoá đơn: đặt `modeDatLich = 'cu'` (quay lại biểu mẫu cũ) hoặc yêu cầu bổ sung vào biểu mẫu mới.

## 5. CẢNH BÁO khi gộp vào `main`

Website đang chạy thật dùng biểu mẫu cũ. Nếu gộp nhánh này vào `main` khi `modeDatLich = 'gia-lap'` (mặc định hiện tại), **trang web ngừng nhận lịch qua biểu mẫu** (khách chỉ còn gọi điện / Zalo, và biểu mẫu nói rõ "chưa gửi dữ liệu thật"). Trước khi gộp, chủ dự án chọn một trong ba (sửa hằng số `modeDatLich`, dựng lại, rồi chạy `npm run kiem-tra-che-do -- --mong=<chế độ>` để chắc bản dựng đúng chế độ):
1. `'cu'`: giữ nguyên biểu mẫu cũ đang chạy (không có biểu mẫu mới);
2. `'gia-lap'`: chỉ xem trước (không nhận lịch qua web);
3. `'that'`: biểu mẫu mới nhận thật, **sau khi** triển khai `Code.v2.gs` và thử nhận thật thành công.
