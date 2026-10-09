# Hướng dẫn vận hành web Bệnh viện thú y Lê Sơn

Web tạm: https://lqt140304-rgb.github.io/benhvienthuyleson/

## 1. Bật GitHub Pages (làm một lần)
1. Vào kho `benhvienthuyleson` trên GitHub → **Settings** → **Pages**.
2. Mục **Source** chọn **Deploy from a branch**, nhánh **main**, thư mục **/ (root)** → **Save**.
3. Chờ 1–2 phút, web lên ở địa chỉ trên.

## 2. Kết nối form đặt lịch với Google Sheet (làm một lần, ~5 phút)
1. Đăng nhập Google bằng lqt140304@gmail.com, tạo một Google Sheet mới, đặt tên "Đặt lịch Lê Sơn".
2. Trong Sheet: **Tiện ích mở rộng → Apps Script**. Xoá hết mã có sẵn, dán toàn bộ nội dung file `apps-script/Code.gs`, bấm **Lưu**.
3. Chọn hàm **thuNghiem** ở thanh trên → **Chạy** → cấp quyền khi Google hỏi. Kiểm tra: Sheet có thêm trang "Đặt lịch" với một dòng thử, và email báo về hộp thư. Xoá dòng thử.
4. **Triển khai → Tùy chọn triển khai mới** → loại **Ứng dụng web**. "Thực thi dưới dạng": **Tôi**. "Người có quyền truy cập": **Bất kỳ ai** → **Triển khai**.
5. Sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
6. Mở Pages CMS (mục 3) → **Thông tin bệnh viện** → dán URL vào ô "Địa chỉ nhận form đặt lịch" → **Save**.

Mỗi lượt đặt lịch: thêm một dòng vào Sheet (cột "Trạng thái" = Mới, nhân viên sửa thành "Đã gọi") và gửi email báo.

## 3. Đăng bài và sửa thông tin bằng Pages CMS
1. Vào https://app.pagescms.org → **Sign in with GitHub** → chọn kho `benhvienthuyleson`.
2. Menu bên trái:
   - **Bài tư vấn**: bấm **Add an entry**, điền tiêu đề, ngày, chuyên mục Chó/Mèo, ảnh, nội dung → **Save**. Khoảng 1–2 phút sau bài lên web.
   - **Thông tin bệnh viện**: số điện thoại, link Zalo, Facebook, phụ phí ngoài giờ, đoạn giới thiệu, ảnh trang chủ.
   - **Dịch vụ và bảng giá**: điền giá từng hạng mục (để trống = "Đang cập nhật").
   - **Đội ngũ bác sĩ**: thêm tên, chức vụ, ảnh từng bác sĩ.
3. Ảnh nên chụp ngang, dưới 1 MB (nén bằng https://squoosh.app nếu ảnh nặng).

## 4. Khi đã mua tên miền benhvienthuyleson.com
Báo lại để cấu hình (đổi `url`/`baseurl` trong `_config.yml`, thêm tên miền ở Settings → Pages, trỏ DNS).
