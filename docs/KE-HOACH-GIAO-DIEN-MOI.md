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
- ~~Số thứ tự `01 02 03` bằng Newsreader thay cho icon tròn~~ **Bỏ (chủ dự án 12/10/2026: số trông không đẹp).** Không dùng số thứ tự hay ô đánh dấu ở danh mục, menu, danh sách; chỉ đường kẻ 1px và chữ.

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
- Menu điện thoại: tấm phủ trượt từ phải (280ms), mục hiện nối tiếp 40ms; số điện thoại + giờ mở cửa ở cuối menu. Mục là chữ Newsreader 25px kẻ 1px, **không số, không ô đánh dấu** (chủ dự án đã xem bản vẽ); mục đang xem tô nền kem đậm trải kín hàng.
- Nét bút cam dưới mục đang xem trên máy tính **giữ màu cam** (chủ dự án chọn 12/10/2026), dù trang chủ khi đó có 2 chỗ cam (nét menu + nét dưới "Tận tuỵ").

### Hero (`ls/Hero.astro`) — theo bản vẽ tldraw, dùng video

**Video phủ kín cả khu hero** (chủ dự án yêu cầu 12/10/2026), chữ nằm đè lên bên trái; video **mờ dần sang trái** (mặt nạ ngang: 0–36% trong suốt → rõ hoàn toàn ở 78%), mép trên và dưới cũng mờ dần.

- **Nội dung tinh gọn — chỉ 4 thứ:**
  1. **Tiêu đề** (đã chốt): "Xuất sắc trong chăm sóc – Tận tuỵ từ trái tim." Ngắt 2 dòng tại dấu gạch; nét bút cam vẽ dưới cụm "Tận tuỵ".
  2. **Một câu phụ** tối đa 12 từ (có thể bỏ).
  3. **Một nút chính** "Đặt lịch khám" + **một liên kết chữ** "Xem bảng giá →".
  4. **Một dòng nhỏ**: chấm "Đang mở cửa · 8:00–21:00" (tính theo giờ VN từ `gio_mo_cua`) + hotline bấm gọi được.
- **Bỏ khỏi hero:** nhãn nhỏ trên tiêu đề, dải 3 ô thông tin (địa chỉ xuống Liên hệ), thẻ "Chẩn đoán ngay tại viện", hoạ tiết, nút "Hiệu ứng trang trí" (xuống footer).
- **Bố cục:** khung video là nền của cả khu hero (rộng hết màn hình, cao bằng hero ~640px, không bo góc); nội dung ~45% bề rộng nằm trên; nút tạm dừng ở góc phải dưới.
- **Mờ dần:** `mask-image` hai lớp (ngang: trái → phải; dọc: ~12% mép trên/dưới), kết hợp `mask-composite: intersect`. Bên trái là nền kem nên chữ luôn dễ đọc.
- **Video:** tắt tiếng, tự chạy, lặp, `playsinline`, không chữ trên video. 10–15 giây quay thật tại viện. Không dùng video stock.
- **Dung lượng:** 720p, không kênh tiếng, ≤ 3 MB; `public/video/hero.webm` + `hero.mp4` (H.264) + `hero-poster.jpg`. Điện thoại: bản 480p ≤ 1,5 MB (đã chốt dùng video bản nhẹ).
- **Tải:** ảnh bìa hiện ngay; video tải **sau khi trang hiện xong**, mờ dần đè lên ảnh bìa 640ms. Tiết kiệm dữ liệu / mạng chậm (`navigator.connection`) → chỉ ảnh bìa.
- **Dừng:** nút tạm dừng icon ở góc khung; tự dừng khi khuất màn hình hoặc đổi tab; giảm chuyển động / tắt hiệu ứng → ảnh bìa đứng yên.
- **Chưa có video (hiện tại):** khung nền kem đậm + icon máy quay nét mảnh + "Video thực tế · sắp cập nhật". Bệnh viện sẽ gửi video sau.
- **Lúc vào trang (~0,9s):** tiêu đề hiện từng dòng bằng mặt nạ (`clip-path`, cách 90ms) → nét bút cam → câu phụ, nút, dòng trạng thái. Khung video mở `mo-man` với ảnh bìa, rồi video chạy.
- **Điện thoại:** chữ + nút ở trên; dải video 16:9 đầy bề ngang bên dưới, mờ dần ở mép trái, trên và dưới.
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

- **Danh mục kẻ hàng (không đánh số)** thay lưới thẻ: tên (Newsreader) · một dòng mô tả · "từ …đ" · mũi tên; kẻ 1px giữa các hàng.
- Hiện khi cuộn: đường kẻ vẽ từ trái (`scaleX`, 360ms), chữ mờ hiện sau 80ms, nối tiếp 60ms.
- Rê chuột: nền kem đậm trượt từ trái, tên dịch vụ sang tím, icon dịch vụ (`icon-dv.mjs`) chạy **một lần**, mũi tên nhích 4px.
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

1. **Nền móng:** `token.css`, `nen.css`, phông tự chứa, công tắc `GIAO_DIEN`, `hien.js`, tệp giảm chuyển động. **ĐÃ XONG (12/10/2026)**, xem "Tiến độ" cuối tệp.
2. **Header, Hero (khung video + khung chờ), Giới thiệu, chuyển trang** (mục 4). **ĐÃ XONG (12/10/2026)**, xem "Tiến độ" cuối tệp.
3. **Dịch vụ, Sản phẩm, Tóm tắt giá, trang Bảng giá** (mục 5). **ĐÃ XONG (12/10/2026)**, xem "Tiến độ" cuối tệp.
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

**Còn mở:** ~~chủ dự án cho bắt đầu bước 1~~ (đã cho bắt đầu 12/10/2026).

## Tiến độ

### Bước 1 · Nền móng (xong 12/10/2026, nhánh `claude/giao-dien-moi-hieu-ung`)

- Công tắc `GIAO_DIEN` trong `src/lib/site.ts`, **mặc định `'r36'`**: web vẫn như cũ cho tới bước 7. `Layout.astro` nạp CSS bằng `?url` nên chỉ MỘT bộ vào trang (`src/styles/r36.css` = `le-son.css` + `trang-phu.css`; hoặc `src/styles/moi/index.css`). Import thường sẽ gộp cả hai, đã thử.
- `src/styles/moi/`: `phong.css` (Newsreader 400/500/600 + nghiêng 500, Be Vietnam Pro 400/500/600; Latin + Việt, tệp `.woff2` trong `public/fonts/` kèm giấy phép OFL), `token.css`, `nen.css` (chữ, nút, ô nhập, lưới 12 cột, `.lech` 4/8, đường kẻ, khung chờ kẻ sọc, 4 kiểu `data-hien`), `giam-chuyen-dong.css` (nạp cuối).
- `src/scripts/hieu-ung/hien.js` + `index.js` (`khoiDong()` gọi lúc tải và ở `astro:page-load`). Giao diện mới: 582 byte JS nén. `ui.js` bỏ qua khối hiện-khi-cuộn cũ khi `<html data-giao-dien="moi">`.
- **Điều chỉnh so với mục 3:** kiểu `mo-man` che các phần tử **con** bằng `clip-path`, không che chính khung. Kiểm thử phát hiện IntersectionObserver coi phần tử bị `clip-path` che kín là không nhìn thấy, nên che chính khung thì nó không bao giờ hiện. Gắn `data-hien="mo-man"` lên khung bọc không có nền / viền riêng.
- **Giảm chuyển động** ở giao diện mới vẫn gắn `co-hieu-ung` (để còn đổi độ mờ 160ms theo mục 3); mọi dịch chuyển / mở màn / vẽ nét tắt hẳn.
- Kiểm thử mới `kiem-thu-astro/kiem-thu-giao-dien-moi.cjs` (tự dựng `dist-moi` bằng `dung-giao-dien.cjs`): 22 ĐẠT, 0 KHÔNG ĐẠT. `dung-ban-xem-thu.cjs` chép thêm `fonts/` và đổi `url(/benhvienthuyleson/…)` trong CSS thành đường dẫn tương đối.
- Mũi tên `→` (U+2192) không có trong tệp phông Latin của Newsreader / Be Vietnam Pro (dải ký tự của gói @fontsource): trình duyệt vẽ bằng phông hệ thống. Bước 2 dùng mũi tên SVG (`components/moi/Mui.astro`).

### Bước 2 · Header, Hero, Giới thiệu, chuyển trang (xong 12/10/2026, nhánh `claude/giao-dien-moi-hieu-ung`)

Làm đúng bản vẽ đã duyệt trên claude.ai (https://claude.ai/artifact/1NVhg6VVqRQUJTgyGtiEFM). Công tắc `GIAO_DIEN` vẫn `'r36'`: web chưa đổi.

- **Thành phần mới** `src/components/moi/`: `Header.astro`, `Hero.astro`, `GioiThieu.astro`, `NetBut.astro` (nét bút cam SVG dùng lại), `Mui.astro` (mũi tên SVG). `Layout.astro` và `pages/index.astro` chọn thành phần theo `GIAO_DIEN`. **Không sửa `components/ls/`** để giao diện R3.6 chạy song song, không đổi một byte. (Kế hoạch mục 8 ghi "đổi `components/ls/*`": đã đổi cách làm vì hai bản phải sống chung tới bước 7.)
- **CSS** `src/styles/moi/`: `khu-dau.css`, `khu-hero.css`, `khu-gioi-thieu.css`; trạng thái mở cửa và nét bút dùng chung trong `nen.css`.
- **Script** `src/scripts/hieu-ung/`: `header.js` (thu gọn khi cuộn quá 24px, nét bút cam dưới mục đang xem), `mo-cua.js` ("Đang mở cửa" theo giờ Việt Nam, tính lại mỗi phút; không JavaScript thì chỉ hiện "Giờ mở cửa · 8:00–21:00"), `video-hero.js`.
- **Header:** khung giữ 76px, chỉ dải nền thu 76 → 60px bằng `transform` (logo 44 → 36px) nên không dịch bố cục (CLS 0). Giữ id `#dau #menu #nut-menu` để `ui.js` vẫn lo mở / đóng menu, Esc, trả focus, theo dõi mục đang xem. Dưới 1280px menu thành tấm phủ trượt từ phải 280ms, mục nối tiếp 40ms, chữ Newsreader, **không số, không ô đánh dấu**, mục đang xem tô nền kem đậm trải kín hàng.
- **Hero:** tiêu đề "Xuất sắc trong chăm sóc – *Tận tuỵ* từ trái tim." (nét bút cam dưới "Tận tuỵ"), câu phụ 12 từ ghép từ địa chỉ thật trong dữ liệu, một nút + một liên kết chữ, một dòng "Đang mở cửa · 8:00–21:00" + hotline. Lúc vào trang ~0,9s (mặt nạ từng dòng cách 90ms → nét bút → câu phụ, nút, trạng thái). Khung video bên phải: chưa có video thì khung chờ "Video thực tế · sắp cập nhật".
- **Video:** bệnh viện chỉ cần chép tệp vào `public/video/` (`hero.webm`, `hero.mp4`, `hero-480.webm`, `hero-480.mp4`, `hero-poster.jpg`; xem `public/video/README.md`), dựng lại web là hero tự dùng. Ảnh bìa hiện ngay, video tải sau khi trang tải xong; điện thoại dùng bản 480p; không tải khi giảm chuyển động / tắt "Hiệu ứng trang trí" / tiết kiệm dữ liệu / mạng 2G; tự dừng khi khuất màn hình hoặc đổi tab; nút tạm dừng bấm được bằng bàn phím, ý người dùng được giữ. Chỉ thử với video do ffmpeg tạo, chưa có video thật.
- **Giới thiệu:** như trang đầu bài báo: chữ cái đầu lớn Newsreader, cột chữ 36em, hàng ảnh bất đối xứng (ảnh dọc 4 cột + ảnh ngang 8 cột, chung đáy, lệch đỉnh), `mo-man` khi cuộn tới, chú thích hiện sau 120ms (`data-tre`). Ba điểm nổi bật là ba hàng kẻ 1px, **không đánh số** (theo ý chủ dự án về số). Có ảnh thật (`anh_tap_the`) thì chỉ hiện một ảnh ngang.
- **Điều chỉnh so với kế hoạch (mục 4):** chuyển trang dùng **View Transitions giữa các trang** (CSS `@view-transition`, mờ 240ms, header có `view-transition-name: dau-trang`, Bé Cam `be-cam`) thay vì `<ClientRouter />`. Lý do: `ui.js` (480 dòng) và `dat-lich.js` gắn sự kiện một lần lúc tải trang; ClientRouter đổi thân trang nên phải viết lại chúng thành `khoiDong()` chạy lại được, rủi ro cao cho cả giao diện R3.6. Hệ quả: không có `transition:persist` thật (header trông đứng yên nhờ nhóm chuyển riêng; trạng thái Bé Cam không giữ qua trang). Tách `ui.js` / `dat-lich.js` ở bước 6 rồi mới cân nhắc ClientRouter. Trình duyệt không hỗ trợ / giảm chuyển động: đổi trang bình thường. Trong Chromium chạy không giao diện hoạt cảnh thỉnh thoảng không kích hoạt lần đầu (3/8 lần, cả ở R3.6), nên kiểm thử thử tối đa 4 lần.
- **Lỗi kiểm thử bắt được và đã sửa:** tấm phủ menu lúc đóng (`translateX(100%)`) làm trang rộng gấp đôi trên điện thoại (cuộn ngang). Sửa bằng `overflow-x: clip` trên `.dau`. Dùng `position: absolute` (không `fixed`) cho tấm phủ vì phần tử có `view-transition-name` thành khối chứa của phần tử `fixed` bên trong. `hien.js` thêm `data-tre` (độ trễ cố định, không nối tiếp).
- **Kiểm thử:** `kiem-thu-giao-dien-moi-b2.cjs`: 56 ĐẠT, 0 KHÔNG ĐẠT, 4 CHƯA XÁC MINH (kết quả `ket-qua/ket-qua-giao-dien-moi-b2.txt`); `kiem-thu-giao-dien-moi.cjs` (bước 1) 22 ĐẠT. `dung-giao-dien.cjs` nhận thêm `tepThem` (chép video thử vào bản sao tạm). Bài đo JavaScript hiệu ứng nay tìm theo dấu `astro:page-load` (gói đủ lớn nên Astro tách thành tệp riêng; `ui.js` của R3.6 cũng có chữ `da-hien`).
- **Chưa làm / chưa xác minh:** các khu còn lại của trang chủ chưa làm lại (bước 4–7) nên giao diện `moi` còn thô ở dưới tóm tắt giá; Firefox / Safari / Edge / điện thoại thật; video thật; cảm nhận chuyển trang bằng mắt.

### Bước 3 · Dịch vụ, Sản phẩm, Tóm tắt giá, trang Bảng giá (xong 12/10/2026, nhánh `claude/giao-dien-moi-hieu-ung`)

Bản vẽ tldraw (6 khung: ba khu trang chủ máy tính, trang Bảng giá máy tính, Dịch vụ và Bảng giá điện thoại) vẽ trước khi viết mã. Công tắc `GIAO_DIEN` vẫn `'r36'`.

- **Thành phần mới** `src/components/moi/`: `DichVuNoiBat.astro`, `SanPham.astro`, `GiaGon.astro`. `pages/index.astro` chọn theo `GIAO_DIEN`. **Trang Bảng giá dùng nguyên markup hiện có** (`pages/bang-gia.astro`, `ls/BangGiaNhom.astro`): giao diện mới chỉ đổi CSS (`khu-gia.css`, `trang-con.css`), nên giá và chữ không thể lệch. `ls/*` không đổi.
- **Dịch vụ nổi bật:** danh mục kẻ hàng, không số, không thẻ / bóng / icon tròn: icon dịch vụ nét mảnh 40px · tên Newsreader · mô tả (câu đầu, một dòng) · giá hoặc lời dẫn · mũi tên. Hiện khi cuộn: đường kẻ vẽ từ trái 360ms, chữ hiện sau 80ms, hàng nối tiếp 60ms (kiểu mới `data-hien="ke"` trong `nen.css`). Rê chuột / focus: nền kem đậm trượt từ trái 160ms, tên → tím, mũi tên nhích 4px, icon chạy MỘT lượt (`icon-dv.css`, chỉ khi rê chuột / focus, không chạy lúc cuộn tới). Điện thoại: giá xuống dưới mô tả, chạm có nền đậm 120ms. Hàng Khám ghi "Phí báo sau khám" (chữ có sẵn ở khu tóm tắt giá) thay "Xem bảng giá khám", chỉ lấy câu đầu của mô tả.
- **Sản phẩm nổi bật:** cột trái 30% dính (nhãn, tiêu đề, ghi chú "chờ bệnh viện xác nhận", nút Liên hệ tư vấn, nút Trước / Sau, vạch tiến độ) + cột phải 70% dải thẻ cuộn ngang tay (scroll-snap), thẻ ngoài cùng bị cắt để báo còn cuộn. Không tự trượt, không chiếm cuộn trang. `dai-san-pham.js`. **Đổi id khu thành `sp-noi-bat`** vì `ui.js` tự gắn mã khu Sản phẩm cũ vào mọi phần tử `#san-pham` (lỗi bắt được lúc chụp thử). Dải chỉ có 3 thẻ nên chỉ cuộn được ~185px: một lần bấm "Sau" tới cuối, nút tự vô hiệu hoá.
- **Tóm tắt giá:** 5 dòng kiểu thực đơn "tên nhóm ········ giá" (chấm dẫn bằng `radial-gradient`), chú thích nhỏ dưới tên, giá / "Xem giá" căn phải cùng mép; giá lấy nguyên từ dữ liệu (`lib/ls.ts`).
- **Trang Bảng giá:** thanh tab chữ + đường kẻ mảnh, gạch chân tím trượt 240ms (`tab-gia.js`, chỉ transform; đặt lần đầu / đổi cỡ thì nhảy tức thì), 8 tab vừa một hàng ở 1440px, điện thoại cuộn ngang và tự cuộn tab đang chọn vào khung. Panel mới chỉ mờ hiện 160ms, hàng giá không hiện nối tiếp. Tiêu đề nhóm Newsreader dính dưới header đã thu (`.bg-dau` thành `display: contents` để h3 dính suốt panel). Mở thẳng `#nhom-…`: tiêu đề loé nền cam nhạt một lần 600ms. Chip "Chờ xác nhận" viền ngọc đứng yên; tab nhóm chờ xác nhận có chấm viền ngọc. Giá căn phải, `tabular-nums`, cột thẳng hàng. Điện thoại: bảng cân nặng thành từng mức mở ra được (giữ như R3.6).
- **Kiểm thử:** `kiem-thu-giao-dien-moi-b3.cjs`: 45 ĐẠT, 0 KHÔNG ĐẠT, 4 CHƯA XÁC MINH. So với trang R3.6 đang chạy: chữ, giá, liên kết ở trang chủ và **toàn bộ 292 ô giá của 8 nhóm Bảng giá giống hệt**.
- **Lỗi bắt được và đã sửa:** (1) id `san-pham` gây lỗi JavaScript ở `ui.js`; (2) gạch chân tab nhảy tức thì thay vì trượt (đảo điều kiện); (3) hàng danh mục chưa có mũi tên nhích 4px; (4) 8 tab tràn một hàng ở 1440px.
- **Chưa làm / chưa xác minh:** trang "Dịch vụ & bảng giá" (`/dich-vu/`) dùng chung kiểu bảng nên đã đẹp hơn nhưng chưa rà từng chỗ (bước 5–6); Firefox / Safari / Edge / điện thoại thật; ảnh và danh sách sản phẩm thật (đang dùng ảnh minh hoạ có sẵn).

## Gộp Giới thiệu + Dịch vụ nổi bật, thêm Tailwind CSS (12/10/2026)

**Kết luận khả thi: CÓ.** Astro 7.3.5 + Vite 8.3.4 + Node 22; `@tailwindcss/vite` 4.3.3 hỗ trợ Vite 8. Tích hợp bằng plugin Vite (không dùng CDN), chỉ nạp cho giao diện mới.
- **Cách tích hợp:** `src/styles/moi/tailwind.css` nạp riêng (tệp CSS thứ hai, ~7 KB) sau `index.css`. Không nạp Preflight (không reset lại CSS cũ), mọi lớp có tiền tố `tw:`, lớp tiện ích `!important` để thắng các quy tắc `h2/p/a` cũ không nằm trong layer. Màu, phông, bo góc dùng biến CSS của `token.css` (`tw:bg-(--kem)`), không khai báo lại. Chỉ quét `GioiThieuDichVu.astro` (`@source`). Giao diện R3.6 (đang chạy) không nạp Tailwind.
- **Khu mới** `src/components/moi/GioiThieuDichVu.astro`: máy tính ảnh 60% / nội dung 40%; điện thoại ảnh trên, nội dung dưới. Tiêu đề Newsreader 34–56px trắng đè lên ảnh, lớp tím sẫm dần. Bỏ chữ cái đầu lớn. Chữ đoạn giới thiệu 18–21px, ba điểm nổi bật có icon (đã bỏ dòng nhãn nhỏ "Giới thiệu và dịch vụ nổi bật" theo yêu cầu 12/10), kèm "Tìm hiểu thêm về bệnh viện →" và "Xem tất cả dịch vụ →". Chưa có ảnh thật nên giữ khung chờ "Ảnh thực tế · sắp cập nhật" (không bịa ảnh; ảnh chú chó trong bản mẫu chỉ là minh hoạ bố cục).
- **Id / menu:** `#gioi-thieu` là cả khu, `#dich-vu` nằm ở danh sách ba điểm (menu "Dịch vụ" cuộn tới đây); khi cuộn qua khu, mục "Dịch vụ" sáng (sửa nhỏ ở `ui.js`, chỉ cho giao diện mới).
- **Phông:** yêu cầu nhắc "Playfair Display"; giao diện mới đang dùng **Newsreader** (đã chốt từ bước 1), nên giữ Newsreader cho đồng bộ cả trang.
- **Đã bỏ khỏi trang chủ (giao diện mới):** danh sách 5 hàng "Dịch vụ nổi bật" kèm giá. Dữ liệu giá không đổi; giá vẫn hiện ở "Tóm tắt giá" trang chủ và trang Bảng giá / Dịch vụ. Tệp cũ `DichVuNoiBat.astro` / `GioiThieu.astro` (moi) còn trong thư mục, không dùng.
- Ảnh trước / sau: `docs/anh-doi-chieu/`.

## Rà khoảng trống và cỡ chữ tiêu đề (12/10/2026)
- Tiêu đề h1: 56px → 48–66px (66px ở màn 1440); h2: 36px → 38–52px (52px ở 1440; điện thoại 32px); h3 20 → 22px. Câu phụ hero 19 → 21px.
- Khung nội dung 1200 → 1280px (đỡ khoảng trống hai bên); khoảng giữa các khu 120 → 104px.
- Ảnh Giới thiệu: tỉ lệ 7/5 thay vì 3/2, cao tối thiểu 720px (trước 600px); tiêu đề trên ảnh tới 68px; chữ bên phải 19–23px, tiêu đề điểm 21–25px.
- Còn thấy (chưa làm, thuộc bước sau): mục Đội ngũ ở trang chủ rất dài (~15.000px, thiết kế cũ R3.6, bước 5); cột trái mục Sản phẩm và Bảng giá còn trống phía dưới.

## Hero phương án 2 "Warm Companionship" (13/10/2026)
- Chủ dự án chốt mẫu 02. Chữ: tiêu đề "Sức khỏe hôm nay, hạnh phúc về sau." (nét bút cam dưới "hạnh phúc"), câu phụ "Thú cưng không chỉ là vật nuôi, mà là thành viên trong gia đình. Lê Sơn luôn ở bên để chăm sóc chúng thật trọn vẹn.", nút "Đặt lịch khám" + "Xem bảng giá", bốn thẻ dịch vụ nhỏ ở chân hero (Khám & Điều trị toàn diện · Chăm sóc sức khỏe định kỳ · Grooming & Spa thư giãn · Tư vấn dinh dưỡng và hành vi; ba thẻ đầu dẫn tới nhóm giá, thẻ cuối tới Cẩm nang). Giữ dòng giờ mở cửa + hotline thật.
- Ảnh / video phủ kín bên phải, mờ dần sang trái (như cũ). **Chưa có ảnh thật** nên là khung chờ ấm màu "Ảnh · video thực tế sắp cập nhật" (không dùng ảnh minh hoạ chó mèo giả). Chép `public/video/hero-poster.jpg` là có ảnh tĩnh, thêm `hero.webm/mp4` là có video.
- Điện thoại: giữ tinh thần như máy tính, sắp lại thứ tự tiêu đề → câu phụ → ảnh (4:3) → nút (cao 56px) → giờ mở cửa → 4 thẻ 2×2.
- File: `src/components/moi/Hero.astro`, `src/styles/moi/khu-hero.css`, `public/video/README.md`, kiểm thử `kiem-thu-giao-dien-moi-b2.cjs`.

### Hero điện thoại: ảnh / video lồng vào chữ (13/10/2026)
- Chỉ ở điện thoại (< 768px) và chỉ khi có `public/video/hero-poster.jpg` hoặc video thật. Tiêu đề trở thành "chữ khoét": nền kem, chữ đen, `mix-blend-mode: lighten` nên hình (video / ảnh bìa) hiện bên trong nét chữ; lớp phủ tím nhạt giữ chữ đủ đậm. Chữ đậm 600.
- Chưa có hình, hoặc giảm chuyển động / tiết kiệm dữ liệu mà không có ảnh bìa → tiêu đề tím như thường (không bao giờ ra chữ nhạt khó đọc). Máy tính / máy tính bảng không đổi.
- Nút tạm dừng nằm dưới chữ (trong khung tiêu đề). Ảnh `hero-chu-video-dien-thoai-thu.png` là hình thử bằng video mẫu tạo bằng máy (hoạ tiết màu), KHÔNG phải nội dung thật.

### Bảng giá: ẩn Gói khám tổng quát, gộp Siêu âm (13/10/2026)
- Theo yêu cầu: ở trang Bảng giá GIAO DIỆN MỚI, hạng mục "Gói khám sức khoẻ tổng quát" (300.000đ) được ẨN, và ba mục "Siêu âm ổ bụng / tim / thai" gộp thành MỘT accordion "Siêu âm" (mở ra thấy từng loại + giá, như Grooming / Nội trú).
- Cấu hình ở `src/lib/bang-gia-trinh-bay.ts` (`HANG_MUC_AN`, `TIEN_TO_GOP`). Dữ liệu `src/data/dich_vu.json` KHÔNG đổi; bản R3.6 vẫn hiện đủ. Muốn hiện lại gói khám: xoá tên khỏi `HANG_MUC_AN`.
