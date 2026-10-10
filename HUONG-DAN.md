# Hướng dẫn vận hành web Bệnh viện thú y Lê Sơn

Web tạm: https://lqt140304-rgb.github.io/benhvienthuyleson/
Trang quản trị: https://lqt140304-rgb.github.io/benhvienthuyleson/admin/

## 1. Chuyển GitHub Pages sang "GitHub Actions" (làm một lần)
Web dựng bằng Astro, GitHub tự dựng lại web mỗi khi nhánh `main` thay đổi.
1. Mở bằng trình duyệt (điện thoại: bật "trang web cho máy tính"): https://github.com/lqt140304-rgb/benhvienthuyleson/settings/pages
2. Mục **Build and deployment → Source**: chọn **GitHub Actions** (thay cho "Deploy from a branch"). Không cần bấm thêm gì.
3. Vào tab **Actions** của kho → chọn **Dựng và đưa web lên** → **Run workflow** (hoặc báo Claude chạy giúp).
4. Chờ 1–3 phút, dấu tích xanh là web đã lên.

## 2. Kết nối form đặt lịch với Google Sheet (làm một lần, ~10 phút)
1. Đăng nhập Google bằng tài khoản của bệnh viện, tạo một Google Sheet mới, đặt tên "Đặt lịch Lê Sơn".
2. Trong Sheet: **Tiện ích mở rộng → Apps Script**. Xoá hết mã có sẵn, dán toàn bộ nội dung file `apps-script/Code.gs`, bấm **Lưu**.
3. Chọn hàm **thuNghiem** ở thanh trên → **Chạy** → cấp quyền khi Google hỏi. Kiểm tra: Sheet có thêm trang "Đặt lịch" với một dòng thử, và có email báo về hộp thư. Xoá dòng thử.
4. **Triển khai → Tùy chọn triển khai mới** → loại **Ứng dụng web**. "Thực thi dưới dạng": **Tôi**. "Người có quyền truy cập": **Bất kỳ ai** → **Triển khai**.
5. Sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
6. Vào trang quản trị (mục 3) → **Thông tin & cài đặt → Thông tin bệnh viện** → dán URL vào ô "Địa chỉ nhận form đặt lịch" → **Lưu**.

Nếu đã dán mã trước ngày 10/10/2026: dán lại bản mới của `Code.gs`, rồi **Triển khai → Quản lý các bản triển khai → sửa (bút chì) → Phiên bản: Phiên bản mới → Triển khai** (đường link giữ nguyên).

Mỗi lượt đặt lịch: thêm một dòng vào Sheet (cột "Trạng thái" = Mới, nhân viên sửa thành "Đã gọi") và gửi email báo, kèm cân nặng và **hoá đơn tham khảo** khách đã xem.
Giờ ngoài 8:00–21:00 form không nhận; khách thấy số điện thoại và phụ phí ngoài giờ.

## 3. Đăng nhập trang quản trị
### Tạo mã truy cập GitHub (một lần)
1. Mở https://github.com/settings/personal-access-tokens/new
2. **Token name**: `Quan tri web Le Son`. **Expiration**: chọn 1 năm (hết hạn thì tạo mã mới).
3. **Repository access**: **Only select repositories** → chọn `benhvienthuyleson`.
4. **Permissions → Repository permissions → Contents**: **Read and write**.
5. Bấm **Generate token**, sao chép mã (bắt đầu bằng `github_pat_`). Giữ mã này như mật khẩu, không gửi cho ai.

### Đăng nhập
1. Mở https://lqt140304-rgb.github.io/benhvienthuyleson/admin/
2. Bấm **Đăng nhập bằng mã truy cập** (tiếng Anh: "Sign In Using Access Token"), dán mã, bấm **Đăng nhập**.
3. Trình duyệt sẽ nhớ đăng nhập.

## 4. Dùng trang quản trị
- **Bài tư vấn**: bấm **Tạo mới**, điền tiêu đề (nên đặt dạng câu hỏi), ngày, chuyên mục Chó/Mèo, mô tả ngắn, ảnh ngang, nội dung, các dấu hiệu cần đi khám ngay → **Lưu**. Bài lên web sau 1–3 phút.
  - Đánh dấu **Bài nổi bật** để bài hiện lớn ở đầu trang chủ.
  - Đánh dấu **Bài nháp** nếu chưa muốn bài hiện lên web.
- **Nhật ký ca bệnh**: tiêu đề, ngày, loài, ảnh bìa, nhiều ảnh (kèm chú thích), tóm tắt, bác sĩ phụ trách.
  - Ảnh phẫu thuật/vết thương: đánh dấu ô **Có ảnh phẫu thuật / vết thương** → ảnh hiện mờ, khách bấm mới xem.
  - Xin phép chủ nuôi trước khi đăng; không ghi tên, số điện thoại chủ nuôi.
- **Thông tin & cài đặt**:
  - *Thông tin bệnh viện*: điện thoại, Zalo, Facebook, phụ phí ngoài giờ, giới thiệu, số năm hoạt động, ảnh tập thể, địa chỉ nhận form.
  - *Dịch vụ và bảng giá*: mỗi nhóm có **bảng giá theo cân nặng** (các cột như "Chó lông ngắn", mỗi dòng một mức cân nặng, giá nhập đúng thứ tự cột, "–" là không có) và/hoặc **danh sách giá**. Giá viết như `120.000`, `từ 250.000`; để trống = "Đang cập nhật".
  - *Phụ phí tự động và ngày lễ*: giờ spa nhận lịch online (hiện 19:00), phụ phí tắm / cắt tỉa theo giờ hẹn, phí đi lại khám tại nhà, phụ phí khám ngoài giờ, **danh sách ngày lễ** (thêm ngày trước mỗi dịp lễ, tết). Form đặt lịch tự cộng các phí này vào **hoá đơn tham khảo** cho khách xem trước.
  - *Đội ngũ bác sĩ*: tên, chức vụ, ảnh vuông.
  - *Ảnh cơ sở vật chất*: phòng khám, phòng mổ, spa, nội trú, mặt tiền.
  - *Bé Cam*: sửa câu nói của bé Cam ở từng trang, hoặc tắt bé Cam.
- Ảnh tải lên được tự thu nhỏ và chuyển sang WebP để web nhanh.
- Lỡ sửa sai: mọi thay đổi đều có lịch sử trong GitHub, báo Claude để khôi phục.

## 5. Khi đã mua tên miền benhvienthuyleson.com
Báo Claude để cấu hình: đổi `site`/`base` trong `astro.config.mjs`, thêm file `public/CNAME`, sửa địa chỉ trong `public/admin/config.yml`; sau đó trỏ DNS (4 bản ghi A tới 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 và `www` CNAME `lqt140304-rgb.github.io`), vào Settings → Pages → Custom domain, bật **Enforce HTTPS**.
