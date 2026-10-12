// Giao diện mới · Đầu trang: thu gọn khi cuộn quá 24px (CSS lo phần transform) và nét bút cam vẽ tay dưới mục menu đang xem (máy tính, từ 1280px).
// Mở / đóng menu điện thoại, theo dõi mục đang xem (aria-current), Esc, trả focus: do src/scripts/ui.js lo (cùng id #dau, #menu, #nut-menu).
// Nút đóng trong tấm phủ chỉ chuyển cú bấm sang #nut-menu để dùng chung đường đóng đó.
const NGUONG_CUON = 24;
let daGan = false, ds = null, svg = null, duong = null, daVe = null, dangCho = false;

function capNhatCuon() {
  dangCho = false;
  const dau = document.getElementById('dau');
  if (dau) dau.classList.toggle('da-cuon', window.scrollY > NGUONG_CUON);
}

// Nét bút: viewBox đúng bằng số px của mục (không co giãn nên nét luôn dày đều), vẽ dần bằng stroke-dashoffset 320ms mỗi khi mục đang xem đổi
function datNetBut(veLai) {
  if (!ds || !svg) return;
  const a = ds.querySelector('a[aria-current]');
  const desktop = window.matchMedia('(min-width: 1280px)').matches;
  if (!a || !desktop) { svg.style.opacity = '0'; daVe = null; return; }
  const w = Math.round(a.offsetWidth + 6), h = 8;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.style.width = w + 'px';
  svg.style.left = (a.offsetLeft - 3) + 'px';
  svg.style.top = (a.offsetTop + a.offsetHeight - 7) + 'px';
  duong.setAttribute('d', `M2 5.5 C ${w * .23} 2.5, ${w * .5} 2, ${w * .72} 3.8 S ${w * .93} 6.2, ${w - 2} 3`);
  svg.style.opacity = '1';
  if (veLai || a !== daVe) {
    svg.classList.remove('ve'); void svg.getBoundingClientRect(); svg.classList.add('ve');
  }
  daVe = a;
}

function dungNetBut(dau) {
  ds = dau.querySelector('.menu-ds');
  if (!ds || ds.querySelector('.net-menu')) return;
  svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'net-menu'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  duong = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  duong.setAttribute('class', 'net'); duong.setAttribute('pathLength', '1'); duong.setAttribute('fill', 'none'); duong.setAttribute('stroke', 'currentColor');
  duong.setAttribute('stroke-width', '2.2'); duong.setAttribute('stroke-linecap', 'round');
  svg.appendChild(duong); ds.appendChild(svg);
  new MutationObserver(() => datNetBut(false)).observe(ds, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  window.addEventListener('resize', () => datNetBut(false));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => datNetBut(false)); // phông đổi thì độ rộng chữ đổi
}

export function khoiDong() {
  const dau = document.getElementById('dau');
  if (!dau) return;
  if (!daGan) {
    daGan = true;
    window.addEventListener('scroll', () => { if (!dangCho) { dangCho = true; requestAnimationFrame(capNhatCuon); } }, { passive: true });
    const dong = dau.querySelector('[data-menu-dong]'), nut = document.getElementById('nut-menu');
    if (dong && nut) dong.addEventListener('click', () => nut.click());
  }
  capNhatCuon();
  dungNetBut(dau);
  datNetBut(true);
}
