// Giao diện mới · Điểm vào của các script hiệu ứng (chỉ nạp khi GIAO_DIEN = 'moi').
// Mọi phần khởi động gói trong khoiDong(), gọi lúc tải trang và lại ở mỗi astro:page-load (chuyển trang bằng ClientRouter, bước 2).
import { khoiDong as hienKhiCuon } from './hien.js';

function khoiDong() {
  hienKhiCuon();
}

khoiDong();
document.addEventListener('astro:page-load', khoiDong);
