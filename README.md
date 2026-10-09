# Bệnh viện thú y Lê Sơn – website

Web tĩnh dựng bằng [Astro](https://astro.build), đặt trên GitHub Pages (tự dựng qua GitHub Actions: `.github/workflows/deploy.yml`).

- `src/pages/` – các trang (trang chủ, tư vấn, nhật ký ca bệnh, dịch vụ, giới thiệu, đặt lịch, liên hệ, khu nhân viên)
- `src/content/tu-van/`, `src/content/ca-benh/` – bài tư vấn và ca bệnh (Markdown)
- `src/data/` – thông tin bệnh viện, dịch vụ và bảng giá, bác sĩ, cơ sở vật chất, câu nói của bé Cam
- `src/components/Cam.astro` – bé Cam, nhân vật hướng dẫn
- `public/admin/` – trang quản trị Sveltia CMS
- `apps-script/Code.gs` – nhận form đặt lịch → Google Sheet + email

Chạy thử trên máy: `npm install && npm run dev`. Hướng dẫn vận hành: `HUONG-DAN.md`.
