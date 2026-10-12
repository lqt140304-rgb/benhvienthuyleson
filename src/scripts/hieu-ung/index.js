// Giao diện mới · Điểm vào của các script hiệu ứng (chỉ nạp khi GIAO_DIEN = 'moi').
// Mọi phần khởi động gói trong khoiDong(), gọi lúc tải trang và lại ở mỗi astro:page-load (nếu sau này dùng ClientRouter).
// Chuyển trang hiện tại là View Transitions giữa các trang (CSS), không phải ClientRouter: ui.js và dat-lich.js gắn sự kiện một lần lúc tải trang.
import { khoiDong as hienKhiCuon } from './hien.js';
import { khoiDong as dauTrang } from './header.js';
import { khoiDong as moCua } from './mo-cua.js';
import { khoiDong as videoHero } from './video-hero.js';

function khoiDong() {
  hienKhiCuon();
  dauTrang();
  moCua();
  videoHero();
}

khoiDong();
document.addEventListener('astro:page-load', khoiDong);
