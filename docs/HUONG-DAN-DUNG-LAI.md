# Dựng lại và kiểm thử từ mã nguồn

Cần Node.js ≥ 22 (Astro 7). Mọi lệnh chạy ở thư mục gốc của repo (nơi có `package.json`).

```bash
npm ci
npm run build                                   # dựng web vào dist/ (nhật ký có dòng "[dat-lich] modeDatLich = gia-lap")
npm run kiem-tra-che-do -- --mong=gia-lap       # kiểm tra bản dựng đúng chế độ biểu mẫu (mã thoát 0 = đúng)
```

## Chạy kiểm thử (cần Playwright, KHÔNG nằm trong package.json của website)
```bash
npm i -g playwright@1.56.1 && npx playwright install chromium     # hoặc cài ở thư mục khác, rồi đặt NODE_PATH
NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-astro.cjs          # bộ kiểm thử Astro (trình duyệt, máy chủ giả, đối chiếu dữ liệu, kiểm tra chế độ); ~12 phút
node kiem-thu-astro/kiem-thu-apps-script.cjs                              # logic Apps Script v2 bằng đối tượng giả của Google (không gọi Google)
NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-ban-xem-thu.cjs     # sau khi chạy dung-ban-xem-thu.cjs: kiểm tra bản xem thử đặt ở thư mục lạ
```
- Kết quả: `kiem-thu-astro/ket-qua/`. Bốn trạng thái: ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH; chỉ ĐẠT mới tính là đạt. Chỉ Chromium được chạy.
- Bộ Astro tự dựng thêm hai bản (`dist-that`, `dist-cu`) bằng `kiem-thu-astro/dung-che-do.cjs` (ghi tạm hằng số trong `src/lib/dat-lich.ts` rồi khôi phục). Nếu bị ngắt giữa chừng và `git diff` thấy `dat-lich.ts` bị sửa, chạy `git checkout src/lib/dat-lich.ts`.
- Đối chiếu dữ liệu / logo dùng bảng `kiem-thu-astro/du-lieu-goc.sha256` (có sẵn kể cả khi không có thư mục `.git`); khi có `.git` còn đối chiếu chéo với commit gốc `24d5057`.
- Không có kiểm thử nào gọi tới Google hay gửi dữ liệu thật: mọi địa chỉ ngoài máy chủ cục bộ bị chặn.

## Xem thử trên máy
```bash
node kiem-thu-astro/may-chu.cjs 4321        # sau npm run build; mở http://localhost:4321/benhvienthuyleson/ (trả trang 404 thật cho đường dẫn không có)
```

## Bản xem thử đặt ở địa chỉ khác (không nằm dưới /benhvienthuyleson/)
```bash
node kiem-thu-astro/dung-ban-xem-thu.cjs            # tạo xem-thu/: mọi đường dẫn nội bộ đổi thành tương đối, liên kết trang trỏ tới …/index.html
```
Cấu hình thật (`astro.config.mjs`: `site: https://lqt140304-rgb.github.io`, `base: /benhvienthuyleson`, `trailingSlash: 'always'`) **không đổi**; chỉ bản sao xem thử đổi đường dẫn.

## Đổi chế độ biểu mẫu đặt lịch
Chỉ có MỘT cách: sửa hằng số `modeDatLich` trong `src/lib/dat-lich.ts` (`'gia-lap'` / `'that'` / `'cu'`), `npm run build`, `npm run kiem-tra-che-do -- --mong=<chế độ>`, commit. Chi tiết: `HUONG-DAN-NHAN-LICH.md`, `docs/DAT-LICH-DANH-GIA.md`.
