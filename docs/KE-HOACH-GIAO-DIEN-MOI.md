# Bản thiết kế giao diện & hiệu ứng mới — BV thú y Lê Sơn

> Kế hoạch đã duyệt với chủ dự án ngày 12/10/2026 (bản gốc soạn trên claude.ai, chuyển vào repo để làm tiếp trong Claude Code).
> **Chưa làm code.** Khi bắt đầu: tạo nhánh mới `claude/giao-dien-moi-hieu-ung` từ `claude/vigilant-bell-at24ko`, làm theo mục 9, mỗi bước một commit.

## 1. Mục tiêu và nguyên tắc

Làm một bản giao diện mới riêng cho web Bệnh viện thú y Lê Sơn, mỗi khu có **một** hiệu ứng riêng, nhẹ, có lý do.

**Phạm vi:** nhánh mới tách từ `claude/vigilant-bell-at24ko` (bản R3.6). Không gộp `main`, không thay web đang chạy, không tạo PR.

**Giữ nguyên tuyệt đối:**

- Dữ liệu trong `src/data/*.json`, giá, logo `public/img/logo.jpg`, nhãn "Chờ xác nhận".
- Logic đặt lịch (`FormDatLich.astro`, `scripts/dat-lich.js`, `apps-script/`), công tắc `modeDatLich`.
- Route, `u()` trong `site.ts`, trang quản trị, sitemap, bộ kiểm thử `kiem-thu-astro/`.
- Không bịa nội dung: khu chưa có dữ liệu thật vẫn ghi "mẫu / chờ bổ sung".

**Nguyên tắc "nhìn không ra AI"** — tránh những dấu hiệu của web dựng theo khuôn:

| Tránh | Thay bằng |
| --- | --- |
| Mọi thứ cùng trồi lên khi cuộn | Mỗi khu một chuyển động riêng, phần lớn nội dung đứng yên |
| Lưới thẻ đều nhau, mỗi thẻ một icon tròn | Danh mục đánh số, bố cục lệch nhịp kiểu tạp chí |
| Nền gradient, kính mờ, bóng đổ dày | Nền giấy kem, đường kẻ mảnh 1px, một màu nhấn |
| Hero căn giữa + 2 nút | Tiêu đề lệch trái, video thật, thông tin giờ mở cửa thật |
| Số liệu đếm nhảy ("10.000+ khách") | Chỉ dùng số có thật trong dữ liệu |
| Biểu tượng emoji, chữ "Chào mừng bạn đến với…" | Câu ngắn, giọng người trong nghề |

Mọi hiệu ứng chỉ dùng `transform` và `opacity` (không dịch bố cục), tắt hết khi máy bật "giảm chuyển động" hoặc người dùng tắt "Hiệu ứng trang trí".

## 2. Hướng thị giác: "Sổ khám"

Một cuốn sổ khám bệnh được làm cẩn thận: nền giấy kem, chữ mực tím, nét bút cam đánh dấu chỗ quan trọng. Giữ ba màu thương hiệu, đổi cách dùng.

| Vai trò | Màu | Dùng ở đâu |
| --- | --- | --- |
| Nền chính | Kem `#FBF7F1` | Gần như toàn trang, thay cho trắng tinh |
| Mực | Tím `#5A1E5E` | Tiêu đề, nút chính, đường kẻ đậm |
| Nét bút | Cam `#EA7A24` | Chỉ để đánh dấu: gạch chân, khoanh tròn, chấm trạng thái. Tối đa 1 chỗ mỗi màn hình |
| Lâm sàng | Ngọc `#23706E` | Nhãn nhỏ, trạng thái "Đang mở cửa", liên kết phụ |
| Chữ | `#1E1B1F` / `#5C5861` | Nội dung / chú thích |
| Đường kẻ | `#E3DDD3` 1px | Phân cách khu, hàng bảng giá |

**Phông** (có tiếng Việt, tự chứa khi build):

- Tiêu đề: **Newsreader** (đã chốt). h1 56/60px, h2 36/40px, chữ nghiêng cho một từ nhấn.
- Nội dung, nút, bảng giá: **Be Vietnam Pro**, số dùng `tabular-nums` cho cột giá thẳng hàng.

**Lưới và nhịp:**

- Lưới 12 cột, khung 1200px, lề 32px (điện thoại 16px).
- Bố cục lệch nhịp: tiêu đề khu 4 cột trái, nội dung 8 cột phải. Điện thoại xếp dọc.
- Khoảng cách bậc 8px; giữa các khu 120px máy tính, 72px điện thoại.
- Bo góc: 6px nút và ô nhập, 12px khung ảnh, 24px khung video hero.
- Bóng đổ: bỏ gần hết, thay bằng đường kẻ 1px. Chỉ Bé Cam và menu điện thoại có bóng.

**Ảnh và hoạ tiết:**

- Ảnh thật cắt khung chữ nhật đứng, chú thích nhỏ bên dưới như ảnh báo. Chưa có ảnh → khung kẻ sọc mảnh + "Ảnh thực tế · sắp cập nhật".
- Hoạ tiết vẽ tay một nét (dấu chân, ống nghe, xương), nét 1.5px tím nhạt.
- Số thứ tự `01 02 03` bằng Newsreader thay cho icon tròn.

## 3. Hệ chuyển động chung

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--t-cham-tay` | 160ms | Rê chuột, bấm, đổi trạng thái nút |
| `--t-hien` | 360ms | Nội dung hiện ra khi cuộn tới |
| `--t-mo-dau` | 640ms | Chỉ dùng ở hero lần đầu vào trang |
| `--t-trang` | 240ms | Chuyển giữa các trang |
| `--cong-ra` | `cubic-bezier(.2, .7, .2, 1)` | Phần tử xuất hiện, mở ra |
| `--cong-vao` | `cubic-bezier(.4, 0, .2, 1)` | Phần tử đóng lại, biến mất |

**Giới hạn cứng:**

- Dịch chuyển tối đa 12px, phóng tối đa 1.02, không xoay (trừ icon nhỏ đã có).
- Mỗi khu hiện ra **một lần**; danh sách hiện nối tiếp 60ms, tối đa 5 mục.
- Chỉ ba thứ chạy lặp: 2 dải đánh giá (có nút tạm dừng), video ở hero (có nút tạm dừng), chớp mắt Bé Cam (mỗi 6 giây).
- Không chiếm cuộn, không parallax quá 12px, không con trỏ chuột tuỳ biến.
- Bảng giá, ô nhập, thông báo lỗi, số điện thoại **không bao giờ** chờ hiệu ứng mới hiện.

**Ba lớp tắt/mở:**

1. Không có JavaScript → mọi nội dung hiện sẵn (hiệu ứng chỉ bật khi `<html>` có lớp `co-hieu-ung`).
2. Máy bật "giảm chuyển động" → chỉ còn đổi độ mờ 160ms.
3. Nút "Hiệu ứng trang trí" (nhớ lựa chọn, đặt ở footer) → tắt hoạ tiết, video đứng ở ảnh bìa, dải đánh giá thành lưới tĩnh, Bé Cam đứng yên.

**Hiện khi cuộn:** `data-hien="<kiểu>"`, một `IntersectionObserver` chung. 4 kiểu: `mo` (mờ → rõ), `len` (mờ + lên 12px), `ve` (SVG vẽ dần), `mo-man` (khung mở từ trái bằng `clip-path`).

## 4. Header, Hero, Giới thiệu, chuyển trang

### Header (`ls/Header.astro`)

- Logo trái, menu 8 mục giữa, nút "Đặt lịch khám" phải. Nền kem, không bóng; đường kẻ 1px dưới đáy chỉ hiện khi đã cuộn quá 24px.
- Thu gọn khi cuộn: 76px → 60px, logo 44 → 36px, 240ms; chỉ dùng `transform`, không đổi `height`.
- Mục đang xem: **nét bút cam vẽ tay** dưới chữ (SVG `stroke-dashoffset`, 320ms).
- Menu điện thoại: tấm phủ trượt từ phải (280ms), mục hiện nối tiếp 40ms; số điện thoại + giờ mở cửa ở cuối menu.

### Hero (`ls/Hero.astro`) — theo bản vẽ tldraw, dùng video

Khối nội dung bên trái, **khung video** bên phải, mép trên và dưới video mờ dần.

- **Nội dung tinh gọn — chỉ 4 thứ:**
  1. **Tiêu đề** (đã chốt): "Xuất sắc trong chăm sóc – Tận tuỵ từ trái tim." Ngắt 2 dòng tại dấu gạch; nét bút cam vẽ dưới cụm "Tận tuỵ".
  2. **Một câu phụ** tối đa 12 từ (có thể bỏ).
  3. **Một nút chính** "Đặt lịch khám" + **một liên kết chữ** "Xem bảng giá →".
  4. **Một dòng nhỏ**: chấm "Đang mở cửa · 8:00–21:00" (tính theo giờ VN từ `gio_mo_cua`) + hotline bấm gọi được.
- **Bỏ khỏi hero:** nhãn nhỏ trên tiêu đề, dải 3 ô thông tin (địa chỉ xuống Liên hệ), thẻ "Chẩn đoán ngay tại viện", hoạ tiết, nút "Hiệu ứng trang trí" (xuống footer).
- **Bố cục:** nội dung ~45% bề rộng; khung video cao bằng hero (~640px), bo góc 24px, cạnh trái bo cong nối mềm vào khối nội dung.
- **Mờ dần:** `mask-image` ~12% ở mép trên và dưới khung video.
- **Video:** tắt tiếng, tự chạy, lặp, `playsinline`, không chữ trên video. 10–15 giây quay thật tại viện. Không dùng video stock.
- **Dung lượng:** 720p, không kênh tiếng, ≤ 3 MB; `public/video/hero.webm` + `hero.mp4` (H.264) + `hero-poster.jpg`. Điện thoại: bản 480p ≤ 1,5 MB (đã chốt dùng video bản nhẹ).
- **Tải:** ảnh bìa hiện ngay; video tải **sau khi trang hiện xong**, mờ dần đè lên ảnh bìa 640ms. Tiết kiệm dữ liệu / mạng chậm (`navigator.connection`) → chỉ ảnh bìa.
- **Dừng:** nút tạm dừng icon ở góc khung; tự dừng khi khuất màn hình hoặc đổi tab; giảm chuyển động / tắt hiệu ứng → ảnh bìa đứng yên.
- **Chưa có video (hiện tại):** khung nền kem đậm + icon máy quay nét mảnh + "Video thực tế · sắp cập nhật". Bệnh viện sẽ gửi video sau.
- **Lúc vào trang (~0,9s):** tiêu đề hiện từng dòng bằng mặt nạ (`clip-path`, cách 90ms) → nét bút cam → câu phụ, nút, dòng trạng thái. Khung video mở `mo-man` với ảnh bìa, rồi video chạy.
- **Điện thoại:** chữ + nút ở trên; video 16:9 bên dưới, bo 16px, mờ mép trên/dưới.
- **Nút chính:** rê chuột tím đậm hơn + mũi tên nhích 4px. Liên kết chữ: gạch chân vẽ ra.

### Giới thiệu (`ls/GioiThieu.astro`)

- Như trang đầu một bài báo: chữ cái đầu lớn Newsreader, cột chữ 36em; lưới không đối xứng (ảnh dọc + ảnh ngang).
- Ảnh/khung chờ mở `mo-man` khi cuộn tới; chú thích hiện sau 120ms.

### Chuyển trang (`layouts/Layout.astro`)

- `<ClientRouter />` của Astro: mờ đi / mờ hiện 240ms.
- `transition:persist` cho header và Bé Cam.
- h1 mỗi trang có `transition:name` theo tên trang.
- Không hỗ trợ / giảm chuyển động → đổi trang bình thường. Script form đặt lịch chạy lại ở `astro:page-load`.

## 5. Dịch vụ, Sản phẩm, Bảng giá, Đặt lịch

### Dịch vụ nổi bật (`ls/DichVuNoiBat.astro`)

- **Danh mục đánh số** thay lưới thẻ: `01` · tên (Newsreader) · một dòng mô tả · "từ …đ" · mũi tên; kẻ 1px giữa các hàng.
- Hiện khi cuộn: đường kẻ vẽ từ trái (`scaleX`, 360ms), chữ mờ hiện sau 80ms, nối tiếp 60ms.
- Rê chuột: nền kem đậm trượt từ trái, `01` sang cam, icon dịch vụ (`icon-dv.mjs`) chạy **một lần**, mũi tên nhích 4px.
- Điện thoại: chạm có nền đậm 120ms rồi mở trang.

### Sản phẩm nổi bật (`ls/SanPham.astro`)

- Giữ ghi chú "chờ bệnh viện xác nhận danh sách sản phẩm". Khi có danh sách: cột trái 30% dính (`position: sticky`), cột phải 70% dải thẻ cuộn ngang thường, **không** chiếm cuộn.

### Tóm tắt giá (`ls/GiaGon.astro`) và trang Bảng giá

- Trang chủ: 5 nhóm thành 5 dòng kiểu thực đơn: tên nhóm … dấu chấm dẫn … "từ …đ" (lấy qua `giaTu()`).
- Tab nhóm giá: gạch chân tím **trượt** giữa tab (240ms). Bảng mới mờ hiện 160ms, hàng **không** hiện nối tiếp.
- Mở thẳng nhóm (`#nhom-…`): hàng tiêu đề nhóm loé nền cam nhạt một lần 600ms.
- Hàng giá: `tabular-nums`, căn phải; nhãn "Chờ xác nhận" là chip viền ngọc, đứng yên. Tiêu đề nhóm dính khi cuộn.

### Đặt lịch (`ls/DatLichKhu.astro`, `FormDatLich.astro`)

Không đụng logic và tên trường; chỉ đổi lớp vỏ.

- Form như **phiếu hẹn khám**, ô nhập dạng dòng kẻ dưới, 3 nhóm: Thú cưng · Dịch vụ & giờ · Liên hệ.
- Focus: dòng kẻ dưới chuyển tím 2px, vẽ từ giữa ra (160ms). Nhãn cố định phía trên.
- Chọn giờ: chip; chọn thì nền tím + dấu tích vẽ 200ms. Giờ đã qua mờ và gạch ngang (logic có sẵn).
- Lỗi: dòng đỏ trượt xuống 6px + mờ hiện; không rung ô.
- Gửi: nút thành vòng xoay; xong hiện **cuống phiếu** tóm tắt + nhãn "Chờ xác nhận". Chế độ `gia-lap` ghi "Bản thử · chưa gửi đi".
- Vào thẳng `/dat-lich/` thấy form ngay.

## 6. Đội ngũ, Cẩm nang, Câu chuyện điều trị

### Đội ngũ (`ls/DoiNgu.astro`)

- **Bỏ dải tự chạy (đã chốt).** Cuộn ngang tay (`scroll-snap`), thẻ ngoài cùng bị cắt để báo còn cuộn được, nút mũi tên Trước/Sau lớn, vạch tiến độ mảnh.
- Thẻ: ảnh chân dung đứng, tên Newsreader, chức vụ ngọc. Ảnh bạc màu 80% → màu thật khi rê/focus (240ms) + tên nhích 4px.
- Cả dải mờ hiện một lần. Thẻ "Bác sĩ mẫu · chờ bổ sung" giữ, khung kẻ sọc.

### Cẩm nang (`ls/CamNang.astro`, trang `tu-van/`)

- Bố cục tạp chí: 1 bài nổi bật ảnh lớn trái, 3–4 bài dạng chữ phải. **Bỏ tự trượt (đã chốt).**
- Rê chuột: gạch chân tiêu đề vẽ từ trái, ảnh nổi bật phóng 1.02.
- Lọc Chó/Mèo: sắp lại bằng View Transitions trong trang.
- Giữ thẻ "Bài viết mẫu · chờ bổ sung".

### Câu chuyện điều trị (`ls/CauChuyen.astro`, trang `nhat-ky-ca-benh/`)

- Đường thời gian dọc: vào viện → chẩn đoán → điều trị → xuất viện (từ nội dung thật; chưa có giữ "Chờ bổ sung").
- Đường vẽ dần theo cuộn (`animation-timeline: view()` + `@supports`); chấm tím → cam khi tới lượt.
- Ảnh nhạy cảm mờ sẵn + nút "Bấm để xem ảnh". Trang chủ không hiện ảnh nhạy cảm.

## 7. Đánh giá, Liên hệ, Footer, Bé Cam

### Đánh giá (`ls/DanhGia.astro`)

- **2 dải chạy ngang ngược chiều (đã chốt):** dải trên sang trái, dải dưới sang phải. Thẻ rộng hẹp theo độ dài lời đánh giá; ngoặc kép lớn Newsreader tím nhạt, tên + nguồn ở chân thẻ.
- Chậm: ~60 giây một vòng. `transform: translateX` trên danh sách nhân đôi; bản sao `aria-hidden`, không Tab vào.
- `mask-image` mờ ~10% mép trái/phải.
- Dừng khi rê chuột/focus (dừng cả 2 dải), khuất màn hình, đổi tab; nút tạm dừng icon. Giảm chuyển động / tắt hiệu ứng → lưới tĩnh 2–3 cột.
- Dưới 6 đánh giá thật → chỉ 1 dải. Đánh giá mẫu giữ nhãn "Đánh giá mẫu". Sao tĩnh, chỉ khi có số sao.
- Điện thoại: 1 dải, thẻ ~80% màn hình, vuốt được khi đã dừng.

### Liên hệ (`ls/LienHe.astro`, trang `lien-he/`)

- Số điện thoại lớn Newsreader; máy tính có nút "Chép số" + thông báo "Đã chép số" 2 giây.
- **Bản đồ (đã chốt):** khung địa chỉ + nút "Mở bản đồ" tới link `ban_do`, không nhúng sẵn.
- Dùng lại trạng thái "Đang mở cửa". Zalo, Facebook là nút chữ, mũi tên nhích 4px.

### Footer (`ls/Footer.astro`)

- Chữ "Lê Sơn" lớn Newsreader gần hết bề rộng; 3 cột: liên kết · liên hệ · giờ mở cửa.
- Khi cuộn tới, "Lê Sơn" mở bằng mặt nạ từ dưới lên.
- Hàng cuối: nút "Hiệu ứng trang trí", "Về đầu trang".

### Bé Cam (`Cam.astro`, `BeCamHinh.astro`)

- **Vẽ lại nét mảnh (đã chốt):** một nét tím, má cam.
- Xuất hiện sau 4 giây ở trang, trượt lên 12px + mờ hiện. Chớp mắt mỗi 6 giây.
- Khung chat mở từ vị trí Bé Cam (phóng 0.96 → 1, 180ms). Câu chào từ `cam.json`.
- Điện thoại: thu nhỏ vào góc khi đang nhập form. Đổi trang không xuất hiện lại từ đầu.

## 8. Cách làm trên Astro

Không thêm thư viện (không GSAP, Lottie, Framer). CSS + JavaScript thuần.

| Tệp | Việc |
| --- | --- |
| `src/styles/moi/token.css` | Màu, phông, khoảng cách, token chuyển động |
| `src/styles/moi/nen.css` | Chữ, nút, ô nhập, lưới, đường kẻ dùng chung |
| `src/styles/moi/khu-*.css` | Mỗi khu một tệp nhỏ |
| `src/styles/moi/giam-chuyen-dong.css` | Toàn bộ quy tắc tắt hiệu ứng |
| `src/scripts/hieu-ung/hien.js` | Một `IntersectionObserver` cho mọi `data-hien` |
| `src/scripts/hieu-ung/header.js` | Thu gọn header, nét bút mục đang xem, menu điện thoại |
| `src/scripts/hieu-ung/video-hero.js` | Tải video sau, kiểm tra mạng, tạm dừng, dừng khi khuất |
| `src/scripts/hieu-ung/dai-chay.js` | 2 dải đánh giá: chạy, dừng, nút tạm dừng |
| `src/scripts/hieu-ung/tab-gia.js` | Gạch chân trượt tab bảng giá |
| `src/scripts/hieu-ung/mo-cua.js` | Trạng thái "Đang mở cửa" theo giờ Việt Nam |
| `src/scripts/hieu-ung/cam.js` | Bé Cam: xuất hiện, chớp mắt, tự né bàn phím |
| `src/components/moi/NetBut.astro` | SVG nét bút cam dùng lại |
| `src/layouts/Layout.astro` | Nạp CSS mới, `<ClientRouter />`, `transition:persist` |
| `src/components/ls/*.astro` | Đổi lớp HTML + `data-hien`; giữ props và dữ liệu |

- CSS mới **không** nạp chung với `le-son.css`. Hằng số `GIAO_DIEN = 'moi' | 'r36'` trong `src/lib/site.ts` để chuyển qua lại.
- Script hiệu ứng gói trong `khoiDong()` gọi ở `astro:page-load`, kể cả `dat-lich.js`.
- Phông `.woff2` trong `public/fonts/` (Latin + Việt, 3 độ đậm), `font-display: swap`, `preload` tiêu đề.
- JavaScript hiệu ứng < 8 KB nén; CLS = 0.

## 8b. Chắt lọc từ file "Kế hoạch xây dựng website thú y cao cấp"

**Lấy:** giới thiệu lưới không đối xứng; bác sĩ bạc màu → màu khi rê chuột, thẻ ngoài cùng bị cắt; sản phẩm cột trái dính + dải phải (không chiếm cuộn); đánh giá 2 dải ngược chiều (đã chốt); quy trình kiểm duyệt (gộp vào mục 9); danh sách ảnh/video/chữ cần chuẩn bị.

**Sửa:** video nền hero → bản nhẹ, tải sau, có ảnh bìa; Bento grid → danh mục đánh số; count-up → chỉ khi có số thật; bản đồ tối → nút "Mở bản đồ"; SĐT cấp cứu, năm kinh nghiệm → giữ nhãn/khung chờ.

**Bỏ:** nút nhấp nháy, nghiêng 3D, nút "từ tính", kính mờ; GSAP, Lottie; thẻ "4.9/5" và logo đối tác chưa có thật; nút "Thêm vào giỏ"; màu Navy + phông Inter/Plus Jakarta; Figma prototype.

## 9. Kế hoạch từng bước và nghiệm thu

Nhánh mới `claude/giao-dien-moi-hieu-ung`, mỗi bước một commit, chụp ảnh máy tính + điện thoại sau mỗi bước.

1. **Nền móng:** `token.css`, `nen.css`, phông tự chứa, công tắc `GIAO_DIEN`, `hien.js`, tệp giảm chuyển động.
2. **Header, Hero (khung video + khung chờ), Giới thiệu, chuyển trang** (mục 4).
3. **Dịch vụ, Sản phẩm, Tóm tắt giá, trang Bảng giá** (mục 5).
4. **Đặt lịch:** chỉ lớp vỏ; chạy lại kiểm thử form ngay.
5. **Đội ngũ, Cẩm nang, Câu chuyện điều trị** + trang con (mục 6).
6. **Đánh giá, Liên hệ, Footer, Bé Cam** + trang 404 (mục 7).
7. **Rà soát cuối:** chạy toàn bộ kiểm thử, dựng bản xem thử chế độ `gia-lap`, đẩy nhánh, gửi link.

**Tiêu chí nghiệm thu:**

- [ ] `kiem-thu-astro.cjs` và `kiem-thu-apps-script.cjs` vẫn 0 KHÔNG ĐẠT.
- [ ] `src/data/*.json`, giá, logo, nhãn "Chờ xác nhận" không đổi.
- [ ] Không cuộn ngang ở 360, 390, 768, 1024, 1280, 1440, 1920px.
- [ ] Giảm chuyển động: không còn dịch chuyển; video và dải đánh giá đứng yên.
- [ ] Tắt JavaScript: mọi nội dung hiện đủ.
- [ ] Bảng giá, form, số điện thoại hiện ngay.
- [ ] Chuyển trang: header và Bé Cam không chớp; form vẫn gửi được.
- [ ] CLS = 0, JS hiệu ứng < 8 KB nén; video hero không làm chậm lần hiện đầu.
- [ ] Bàn phím đi hết trang, thấy rõ focus; nút tạm dừng video và dải đánh giá bấm được bằng bàn phím.
- [ ] Thiếu ảnh / chữ dài / đang tải: hiển thị vẫn gọn.
- [ ] Chủ dự án xem trên điện thoại thật và thấy "không giống web AI".

## 10. Quyết định đã chốt (12/10/2026)

| Câu hỏi | Đã chốt |
| --- | --- |
| Tiêu đề hero | "Xuất sắc trong chăm sóc – Tận tuỵ từ trái tim." |
| Hero | Khung video thay tường ảnh; nội dung chỉ 4 thứ |
| Video hero | Bệnh viện quay, gửi sau; lúc chờ hiện "Video thực tế · sắp cập nhật" |
| Hero trên điện thoại | Video bản nhẹ 480p, tự tắt khi mạng chậm / tiết kiệm dữ liệu |
| Khu Đánh giá | 2 dải chạy ngược chiều, có nút dừng, mờ 2 mép |
| Đội ngũ, Cẩm nang | Bỏ tự trượt, cuộn tay + nút mũi tên |
| Phông tiêu đề | Newsreader |
| Bé Cam | Vẽ lại nét mảnh |
| Bản đồ | Nút "Mở bản đồ", không nhúng sẵn |
| Ảnh bác sĩ, cơ sở vật chất, video | Chủ dự án gửi sau một thời gian; trong lúc chờ giữ khung chờ |

**Còn mở:** chủ dự án cho bắt đầu bước 1 (mục 9) thì mới làm.
