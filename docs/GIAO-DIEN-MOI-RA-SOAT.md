# Rà soát repo và tích hợp giao diện mới (giai đoạn 2)

> Nhánh làm việc: `claude/vigilant-bell-at24ko`. **Chưa đưa vào `main`, chưa triển khai.** Triển khai GitHub Pages chỉ chạy khi có push vào `main` (`.github/workflows/deploy.yml`, không sửa).

## 1. Đã đọc gì, thấy gì (trước khi sửa)

| Hạng mục | Thực tế |
|---|---|
| Công nghệ | Astro 7, trang tĩnh, `site: https://lqt140304-rgb.github.io`, `base: /benhvienthuyleson`, `trailingSlash: always`. Chỉ có 3 gói: `astro`, `@astrojs/sitemap`, `marked`. Không có test, không có lint |
| Dựng trước khi sửa | `npm ci && npm run build`: 11 trang, 0 lỗi. 2 cảnh báo có sẵn: thư mục `src/content/tu-van` và `ca-benh` đang rỗng |
| Trang | `index`, `dat-lich`, `dich-vu`, `gioi-thieu`, `lien-he`, `nhan-vien`, `404`, `tu-van/*`, `nhat-ky-ca-benh/*`. **Chưa có** trang `bang-gia` (bảng giá nằm trong `dich-vu`) |
| Giao diện cũ | `Layout.astro` (đầu trang, chân trang, thanh nút điện thoại, SEO), `global.css` (553 dòng, kiểu "ấm áp bo tròn"), hero và các khu viết thẳng trong `index.astro`, các component `Cam`, `CaseCard`, `Icon`, `IconMau`, `PostCard`, `TrangTri`, `TuVanList` |
| Dữ liệu | `src/data/*.json` sửa qua trang quản trị `public/admin` (Sveltia CMS). Link nội bộ qua `u()` trong `src/lib/site.ts` |
| Form đặt lịch | `dat-lich.astro` 461 dòng: gửi `no-cors` tới Google Apps Script (địa chỉ trong `thong_tin.json`). **Xem `docs/DAT-LICH-DANH-GIA.md` (giai đoạn 3)** |

## 2. Quyết định: giữ gì, thay gì

**Giữ nguyên (không viết lại):** cấu hình Astro, route, `site.ts` (`u()`, `dsDichVu()`, `giaTu()`, `gia()`), content collections (`tuVan`, `caBenh`), sitemap, trang quản trị, workflow, **toàn bộ `src/data/*.json`**, **`public/img/logo.jpg`** và các ảnh trong `public/img`, `cam.json`, `HUONG-DAN.md`, `apps-script/Code.gs`, logic và script của form đặt lịch.

**Thay lớp giao diện:** `global.css` → `src/styles/le-son.css` (giao diện đã duyệt ở prototype VET-002) + `src/styles/trang-phu.css` (các trang phụ). Hai hệ CSS có 18 tên lớp trùng nhau (`hero`, `cam`, `gia`, `ban-do`…), nên **không nạp song song**: các trang cũ được chuyển sang lớp mới, `global.css` đã bị bỏ. Kiểu dáng của form đặt lịch hiện tại được chuyển sang giao diện mới và gói trong `.dl-cu` (chỉ ở trang đặt lịch).

## 3. Bảng ánh xạ prototype → Astro

| Phần của prototype | Component / tệp Astro |
|---|---|
| Header + menu | `components/ls/Header.astro` (+ `lib/menu.ts`) |
| Footer | `components/ls/Footer.astro` |
| Thanh liên hệ nhanh điện thoại | `components/ls/ThanhDuoi.astro` |
| Bé Cam | `components/Cam.astro` + `BeCamHinh.astro` (câu chào đọc từ `cam.json`) |
| Hero | `components/ls/Hero.astro` |
| Giới thiệu | `components/ls/GioiThieu.astro` |
| Dịch vụ nổi bật | `components/ls/DichVuNoiBat.astro` |
| **Sản phẩm nổi bật** (ngay dưới Dịch vụ nổi bật) | `components/ls/SanPham.astro` |
| Tóm tắt giá | `components/ls/GiaGon.astro` |
| Đặt lịch (trang chủ + `/dat-lich/`) | `components/ls/DatLichKhu.astro` + `FormDatLich.astro` + `scripts/dat-lich.js` (giai đoạn 3); biểu mẫu cũ còn lại ở `FormDatLichCu.astro` |
| Đội ngũ | `components/ls/DoiNgu.astro` + `DaiNut.astro` |
| Cẩm nang | `components/ls/CamNang.astro` |
| Câu chuyện điều trị | `components/ls/CauChuyen.astro` |
| Đánh giá | `components/ls/DanhGia.astro` |
| Liên hệ | `components/ls/LienHe.astro` |
| Bảng giá (trang riêng) | `pages/bang-gia.astro` + `BangGiaNhom.astro` + `Gia.astro` (tab theo nhóm, mở bằng `#nhom-<mã>`) |
| Icon, hoạ tiết | `Icon.astro`, `IconDv.astro`, `OIc.astro`, `HoaTiet.astro`, `Cong.astro`, `VetChan.astro`, `AnhCho.astro`; dữ liệu SVG ở `lib/ls-icons.ts`, `lib/icon-dv.mjs` |
| Script (menu, tab giá, Bé Cam, hai dải thẻ, khu sản phẩm, hiệu ứng, giảm chuyển động) | `scripts/ui.js` (một tệp, Astro đóng gói; không thêm thư viện) |

## 4. Dữ liệu thật và nội dung mẫu

Khu nào đã có dữ liệu thật thì dùng dữ liệu thật; chưa có thì giữ khung **ghi rõ "mẫu / chờ bổ sung"** (không bịa).

| Khu | Có dữ liệu thật thì | Hiện chưa có nên |
|---|---|---|
| Đội ngũ | thẻ từ `bac_si.json` (họ tên, chức vụ, ảnh) | 6 thẻ "Bác sĩ mẫu · chờ bổ sung thông tin" |
| Cẩm nang | 2 chuyên mục + bài thật (bài nổi bật đứng đầu) | bù thẻ "Bài viết mẫu · chờ bổ sung" cho đủ dải |
| Câu chuyện điều trị | ca bệnh mới nhất + tối đa 2 ca phụ (ca nhạy cảm không hiện ảnh ở trang chủ) | khung "Chờ bổ sung" |
| Đánh giá | đánh giá nhập tay trong `danh_gia.json` | 4 thẻ "Đánh giá mẫu" |
| Sản phẩm nổi bật | (chưa có nguồn dữ liệu) | 3 nhóm **ảnh minh hoạ** cắt từ ảnh mẫu, không nhãn hiệu / giá / tồn kho / công dụng / số bán, ghi "chờ bệnh viện xác nhận danh sách sản phẩm" |
| Ảnh hero, ảnh giới thiệu, ảnh tập thể | `anh_tap_the` nếu có | khung "Ảnh thực tế · sắp cập nhật" |

Giữ nhãn "Chờ xác nhận" của prototype (`src/lib/xac-minh.json`): nhóm Cấp cứu 24/24, ngày lễ / Tết, link đánh giá. Khi chủ dự án xác nhận, đổi `trang_thai` thành `da-xac-nhan`.

## 5. Khác với prototype (có chủ ý)

| Prototype | Bản Astro | Lý do |
|---|---|---|
| Form giả lập ngay trong khu Đặt lịch của trang chủ | Giai đoạn 2: nút mở form thật `/dat-lich/`. **Giai đoạn 3: biểu mẫu mới nằm ngay trong khu Đặt lịch** (và ở `/dat-lich/`), mặc định vẫn giả lập | Xem `docs/DAT-LICH-DANH-GIA.md` |
| Menu "Đặt lịch" / "Liên hệ" cuộn trong trang | "Đặt lịch": ở trang chủ cuộn tới khu Đặt lịch, ở trang khác dẫn tới `/dat-lich/`. "Liên hệ": dẫn tới `/lien-he/` | Trang riêng đã có |
| Link Cẩm nang, Ca bệnh, Giới thiệu, Liên hệ, "Xem tất cả dịch vụ" trỏ về website cũ `https://lqt140304-rgb.github.io/benhvienthuyleson/...` | Đều qua `u()` thành `/benhvienthuyleson/...` | Cùng một website, không nhảy qua site khác |
| Bảng giá: `bang-gia.html#nhom-…` | `/bang-gia/#nhom-…` | Route Astro, giữ `trailingSlash` |
| Hero luôn là chữ tĩnh | Hero tĩnh; bài nổi bật (nếu có) đứng đầu dải Cẩm nang | Giao diện đã duyệt không có chỗ cho bài nổi bật ở hero |
| Bé Cam không có nút tắt | Không có nút "Tắt bé Cam" / "Gọi bé Cam" nữa; muốn tắt hẳn: `cam.json` → `bat = false` | Giao diện đã duyệt. Câu chào theo từng trang vẫn lấy từ `cam.json` (sửa trong trang quản trị) |
| Link Google Maps / Facebook ở ô đánh giá "chờ bổ sung link" | Dùng link nhập trong trang quản trị; nếu để trống thì dùng link bản đồ và Facebook của bệnh viện như website cũ | Giữ chức năng cũ đang chạy |
| Menu: Dịch vụ, Bảng giá, Đặt lịch, Cẩm nang, Ca bệnh, Giới thiệu, Liên hệ (8 mục) | Như prototype (website cũ có 6 mục) | Thứ tự đã duyệt |
| Nút Tạm dừng ghi chữ | Chỉ icon tròn (nhãn đọc cho trình đọc màn hình + gợi ý khi rê chuột) | Theo yêu cầu "làm gọn lại" |

## 6. Kiểm tra liên kết

Script `kiem-thu-astro/kiem-thu-astro.cjs` quét mọi `href`, `src`, `url()` trong `dist/**/*.html`: có tệp đích, tiền tố `/benhvienthuyleson`, hash có id ở trang đích (`#nhom-…` ↔ `id="tab-…"`), không còn link tuyệt đối tới website cũ. Kết quả ở `kiem-thu-astro/ket-qua/`.

## 7. Cảnh báo cho chủ dự án

1. **Gộp nhánh vào `main` sẽ tự triển khai** toàn bộ giao diện mới lên website thật. Cần xem bản xem thử và duyệt trước.
2. **Biểu mẫu đặt lịch mới mặc định ở chế độ giả lập (không gửi dữ liệu).** Website đang chạy thật dùng biểu mẫu cũ: gộp vào `main` khi để mặc định thì web ngừng nhận lịch qua biểu mẫu. Chủ dự án chọn `modeDatLich` (`'cu'` / `'gia-lap'` / `'that'`) bằng cách sửa hằng số trong `src/lib/dat-lich.ts` (cách duy nhất) và kiểm tra bằng `npm run kiem-tra-che-do -- --mong=<chế độ>` trước khi gộp. Chi tiết và cách chuyển: `docs/DAT-LICH-DANH-GIA.md`, `HUONG-DAN-NHAN-LICH.md`.
3. `src/content/tu-van` và `ca-benh` đang rỗng: giao diện bài viết / ca bệnh chưa duyệt bằng nội dung thật.
