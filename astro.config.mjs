// Cấu hình Astro cho web Bệnh viện thú y Lê Sơn.
// Khi có tên miền benhvienthuyleson.com: đổi site thành "https://benhvienthuyleson.com", base thành "/"
// và thêm file public/CNAME (xem HUONG-DAN.md).
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://lqt140304-rgb.github.io',
  base: '/benhvienthuyleson',
  trailingSlash: 'always',
  // Tailwind v4 chỉ dùng cho giao diện mới: không nạp Preflight, mọi lớp có tiền tố tw: và !important (xem src/styles/moi/tailwind.css)
  vite: { plugins: [tailwindcss()] },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/nhan-vien/') && !page.includes('/admin/') }),
  ],
});
