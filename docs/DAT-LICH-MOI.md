# Đặt lịch giao diện mới (biểu mẫu 4 bước)

Nhánh: `claude/dat-lich-moi` (từ `claude/giao-dien-moi-hieu-ung`). Chưa gộp `main`, chưa triển khai thật.

## Đã làm
- Trang `/dat-lich/` (chỉ khi `GIAO_DIEN = 'moi'`; R3.6 và chế độ `'cu'` giữ nguyên): tiêu đề "Đặt lịch khám & chăm sóc", tiến trình 4 bước, biểu mẫu cột trái, **Tóm tắt đặt lịch** cột phải (sticky; trên điện thoại nằm dưới và thu gọn được), khối "Cần hỗ trợ".
- **Bước 1** loài (Chó / Mèo / Khác; chọn Khác → ô bắt buộc "Thú cưng của bạn là loài gì?"), tên (bắt buộc), giống, tuổi/ngày sinh, cân nặng, giới tính, tình trạng/yêu cầu đặc biệt (gợi ý GỌI NGAY khi có từ khoá khẩn cấp, không kết luận y khoa).
- **Bước 2** thẻ dịch vụ lấy từ `src/data/dich_vu.json` (7 dịch vụ có `dat_lich`; Cấp cứu chỉ có lối gọi điện). Danh sách "Tư vấn phẫu thuật", "Dịch vụ khác" trong bản vẽ KHÔNG có trong dữ liệu chính thức nên không thêm.
- **Bước 3** lịch chọn ngày (không chọn quá khứ, bàn phím mũi tên), giờ 08:00–20:30 chia Sáng / Chiều / Tối, giờ đã qua hôm nay bị vô hiệu, hết giờ hôm nay thì báo. Nội trú có thêm "Ngày đón dự kiến". **Không có dữ liệu lịch trống** nên không bịa chỗ trống: đây là giờ MONG MUỐN, nhân viên xác nhận.
- **Bước 4** họ tên, SĐT (định dạng Việt Nam), email, ghi chú; khối "Kiểm tra lại" có nút Sửa từng dòng; nút "Gửi yêu cầu đặt lịch".
- Chi phí tham khảo trong tóm tắt chỉ lấy từ dữ liệu giá (vd "Từ 85.000đ / ngày") hoặc lời dẫn ("Phí báo sau khám", "Liên hệ để được tư vấn"). Không có số bịa.
- Hiệu ứng: thẻ chọn 220ms, đổi bước 320ms (mờ + trượt 12px), lịch 180ms, tóm tắt chỉ nổi bật dòng vừa đổi 220ms, nút 200ms (mũi tên 4px, bấm 0,98), thành công 450ms; giảm chuyển động tắt các chuyển dịch.
- Không đăng nhập, không thanh toán, **không lưu dữ liệu khách ở máy** (không localStorage / cookie).

## Backend (đã có, dùng lại, không đổi)
`apps-script/Code.v2.gs` + chế độ `modeDatLich` (`gia-lap` / `that` / `cu`) trong `src/lib/dat-lich.ts`. Biểu mẫu mới gửi đúng hợp đồng cũ (`ten_khach, dien_thoai, ten_thu_cung, loai, loai_khac, dich_vu, dich_vu_ma, ngay, gio, ngay_don, ghi_chu, ma_yeu_cau, website`), có chống gửi trùng (mã yêu cầu dùng lại khi gửi lại), thời gian chờ 15 giây, thông báo lỗi / chưa xác nhận.
- Máy chủ hiện chỉ có cột **Ghi chú** cho thông tin thêm, nên **giống, tuổi, cân nặng, giới tính, email, tình trạng được gom vào Ghi chú** (tối đa 1000 ký tự) và đồng thời gửi riêng từng trường (máy chủ cũ bỏ qua). Không mất dữ liệu.
- Chỉ báo "Yêu cầu đặt lịch đã được tiếp nhận!" khi máy chủ trả `{ ok: true, ma }`. Bản xem thử (`gia-lap`) không gửi gì và ghi rõ "chưa gửi dữ liệu thật".

## Còn cần chủ dự án quyết định / cấu hình
1. Bật `'that'` cho web thật: cần địa chỉ `/exec` của Sheet THẬT và quyền đổi `dia_chi_nhan_dat_lich` (xem `docs/BAT-CHE-DO-THAT.md`). Trước đó web thật vẫn dùng biểu mẫu cũ.
2. (Tuỳ chọn) thêm cột Giống / Tuổi / Cân nặng / Giới tính / Email / Tình trạng vào Sheet và sửa `Code.v2.gs` để đọc các trường riêng.
3. Lịch trống thật theo giờ: cần hệ thống quản lý lịch của bệnh viện; hiện chỉ nhận "giờ mong muốn".
4. Ảnh minh hoạ trong bản vẽ (chó, mèo, thỏ) chưa có ảnh thật nên dùng icon; trang chủ (khu "Đặt lịch" cũ) giữ nguyên theo yêu cầu.

## Kiểm thử
`node kiem-thu-astro/kiem-thu-dat-lich-moi.cjs` (54 ĐẠT, 0 KHÔNG ĐẠT, 1 CHƯA XÁC MINH): 12 tình huống yêu cầu, 3 cỡ màn, hiệu ứng, bàn phím, giảm chuyển động, gửi qua `Code.v2.gs` thật với Trang tính giả. Kết quả: `kiem-thu-astro/ket-qua/ket-qua-dat-lich-moi.txt`.
