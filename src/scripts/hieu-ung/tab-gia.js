// Giao diện mới · Trang Bảng giá: gạch chân tím TRƯỢT giữa các tab (transform, 240ms) và loé nền cam nhạt MỘT lần 600ms ở tiêu đề nhóm khi mở thẳng bằng #nhom-…
// Chọn tab, phím mũi tên / Home / End, mở nhóm theo hash: do src/scripts/ui.js lo (mã đã kiểm thử); file này chỉ theo dõi aria-selected để vẽ gạch chân.
let daGan = false;
const itChuyenDong = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// truot = true: đổi tab → gạch chân trượt (chuyển tiếp 240ms); false: đặt lần đầu / đổi cỡ / phông tải xong → nhảy tức thì, không trượt
function datGach(thanh, gach, truot) {
  const t = thanh.querySelector('[role="tab"][aria-selected="true"]');
  if (!t) return;
  gach.style.transform = `translateX(${t.offsetLeft}px) scaleX(${t.offsetWidth / 100})`;
  if (!truot) { gach.classList.remove('san'); void gach.offsetWidth; requestAnimationFrame(() => gach.classList.add('san')); }
  // tab đang chọn nằm trọn trong khung cuộn ngang (điện thoại)
  const trai = t.offsetLeft - 16, phai = t.offsetLeft + t.offsetWidth + 16;
  if (trai < thanh.scrollLeft) thanh.scrollTo({ left: trai, behavior: itChuyenDong() ? 'auto' : 'smooth' });
  else if (phai > thanh.scrollLeft + thanh.clientWidth) thanh.scrollTo({ left: phai - thanh.clientWidth, behavior: itChuyenDong() ? 'auto' : 'smooth' });
}

function loeTieuDe() {
  const m = /^#nhom-(.+)$/.exec(location.hash);
  const tab = m && document.getElementById('tab-' + m[1]);
  const panel = tab && document.getElementById(tab.getAttribute('aria-controls'));
  if (!panel) return;
  panel.classList.remove('loe'); void panel.offsetWidth; panel.classList.add('loe');
  setTimeout(() => panel.classList.remove('loe'), 700);
}

export function khoiDong() {
  const thanh = document.querySelector('.bg-tab');
  if (!thanh || thanh.querySelector('.bg-gach')) return;
  const gach = document.createElement('span');
  gach.className = 'bg-gach'; gach.setAttribute('aria-hidden', 'true');
  thanh.appendChild(gach);
  datGach(thanh, gach, false); // lần đặt đầu không trượt
  new MutationObserver(() => datGach(thanh, gach, true)).observe(thanh, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
  const dat = () => datGach(thanh, gach, false);
  window.addEventListener('resize', dat);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dat);
  if (!daGan) { daGan = true; window.addEventListener('hashchange', loeTieuDe); }
  loeTieuDe();
}
