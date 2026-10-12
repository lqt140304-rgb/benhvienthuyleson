// Giao diện mới · Video ở hero (kế hoạch mục 4). Chỉ chạy khi trang có [data-video-hero] (tức public/video/ có tệp).
// - Ảnh bìa hiện ngay; video chỉ bắt đầu tải SAU KHI trang hiện xong (sự kiện load + lúc rảnh), rồi mờ dần đè lên ảnh bìa 640ms.
// - Không tải video khi: máy bật giảm chuyển động, người dùng tắt "Hiệu ứng trang trí", tiết kiệm dữ liệu, mạng 2G / chậm (navigator.connection).
// - Điện thoại (dưới 768px) dùng bản 480p. Nút tạm dừng bấm được bằng bàn phím; ý người dùng (đã bấm dừng) được giữ khi cuộn đi rồi quay lại.
// - Tự dừng khi video khuất màn hình hoặc đổi tab; quay lại thì chạy tiếp (trừ khi người dùng đã bấm dừng).
// - Giảm chuyển động / tắt hiệu ứng khi đang chạy: dừng và trả về ảnh bìa.
const goc = document.documentElement;
let khung = null, video = null, nut = null, daTai = false, nguoiDung = false, trongManHinh = true, quanSat = null, dangKhoiDong = false;

const itChuyenDong = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches && !goc.classList.contains('tt-chu-dong');
function tietKiem() {
  const c = navigator.connection;
  return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
}
const choPhep = () => !itChuyenDong() && !goc.classList.contains('tat-trang-tri') && !tietKiem();

function capNhatNut() {
  if (!nut) return;
  const dung = nguoiDung || (video && video.paused);
  nut.setAttribute('aria-pressed', String(!!dung));
  nut.setAttribute('aria-label', dung ? 'Phát video' : 'Tạm dừng video');
}

function chay() {
  if (!video || !daTai || nguoiDung || !trongManHinh || document.hidden || !choPhep()) return;
  const p = video.play();
  if (p && p.catch) p.catch(() => {});
}
function dung(traBia) {
  if (!video) return;
  video.pause();
  if (traBia) khung.classList.remove('dang-chay');
}

function taiVideo() {
  if (daTai || !choPhep()) return;
  daTai = true;
  const nho = window.matchMedia('(max-width: 767px)').matches;
  const ngu = (k) => video.getAttribute('data-' + k);
  const dsNguon = nho ? [[ngu('webm-nho') || ngu('webm'), 'video/webm'], [ngu('mp4-nho') || ngu('mp4'), 'video/mp4']] : [[ngu('webm'), 'video/webm'], [ngu('mp4'), 'video/mp4']];
  dsNguon.filter(([url]) => url).forEach(([url, kieu]) => { const s = document.createElement('source'); s.src = url; s.type = kieu; video.appendChild(s); });
  video.muted = true;
  video.addEventListener('playing', () => { khung.classList.add('dang-chay'); if (nut) nut.hidden = false; capNhatNut(); });
  video.addEventListener('pause', capNhatNut);
  video.addEventListener('play', capNhatNut);
  video.preload = 'auto';
  video.load();
  chay();
}

function khiDoiCaiDat() {
  if (!video) return;
  if (!choPhep()) dung(true);
  else if (!daTai) taiVideo();
  else chay();
}

function sauKhiTrangHien(f) {
  const lamViec = () => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 200));
  if (document.readyState === 'complete') lamViec(); else window.addEventListener('load', lamViec, { once: true });
}

export function khoiDong() {
  const moi = document.querySelector('[data-video-hero]');
  if (!moi || dangKhoiDong && moi === khung) return;
  dangKhoiDong = true;
  khung = moi; video = khung.querySelector('.hv-video'); nut = khung.closest('.hero').querySelector('.hv-dung');
  if (!video) return;
  if (nut) nut.addEventListener('click', () => {
    if (video.paused) { nguoiDung = false; chay(); } else { nguoiDung = true; video.pause(); }
    capNhatNut();
  });
  if ('IntersectionObserver' in window) {
    quanSat = new IntersectionObserver((m) => { trongManHinh = m[m.length - 1].isIntersecting; if (trongManHinh) chay(); else video.pause(); }, { threshold: 0.25 });
    quanSat.observe(khung);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else chay(); });
  // "Hiệu ứng trang trí" bật / tắt (ui.js đổi lớp trên <html>) và cài đặt giảm chuyển động đổi giữa chừng
  new MutationObserver(khiDoiCaiDat).observe(goc, { attributes: true, attributeFilter: ['class'] });
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.addEventListener) mq.addEventListener('change', khiDoiCaiDat);
  sauKhiTrangHien(() => { if (choPhep()) taiVideo(); });
}
