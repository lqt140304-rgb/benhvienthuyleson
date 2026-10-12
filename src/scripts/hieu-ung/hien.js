// Giao diện mới · Hiện khi cuộn: MỘT IntersectionObserver chung cho mọi phần tử [data-hien="mo|len|ve|mo-man"] (kế hoạch mục 3).
// - Chỉ chạy khi <html> có lớp co-hieu-ung (gắn ở <head> khi có IntersectionObserver); thiếu lớp này thì nội dung hiện sẵn.
// - Mỗi phần tử hiện MỘT lần. Các phần tử vào màn hình cùng lúc hiện nối tiếp 60ms, tối đa 5 mục (mục thứ 6 trở đi cùng lúc mục 5).
// - Focus bằng bàn phím vào trong phần tử → hiện ngay. In trang → hiện hết.
// - khoiDong() gọi được nhiều lần (lần đầu tải trang và mỗi astro:page-load khi có chuyển trang): phần tử đã theo dõi không bị theo dõi lại.
const NOI_TIEP = 60, TOI_DA = 5, THOI_GIAN = 640;
let quanSat = null;
const daTheoDoi = new WeakSet();

function hien(el, tre) {
  if (el.classList.contains('da-hien')) return;
  if (tre) el.style.setProperty('--tre', tre + 'ms');
  el.classList.add('da-hien');
  if (quanSat) quanSat.unobserve(el);
  // Xong hiệu ứng: bỏ độ trễ để rê chuột / đổi trạng thái về sau không bị chậm
  setTimeout(() => el.style.removeProperty('--tre'), tre + THOI_GIAN);
}

export function hienNgay(ds) {
  for (const el of ds) { if (!el.classList.contains('da-hien')) { el.classList.add('hien-ngay'); hien(el, 0); } }
}

export function khoiDong() {
  const goc = document.documentElement;
  if (!goc.classList.contains('co-hieu-ung') || !('IntersectionObserver' in window)) return;
  window.__hienTatCa = () => hienNgay(document.querySelectorAll('[data-hien]')); // dùng cho kiểm thử / chụp ảnh toàn trang
  window.__hieuUngSan = true; // báo cho script ở <head>: hiệu ứng đã sẵn sàng, không cần tự gỡ co-hieu-ung
  if (!quanSat) {
    quanSat = new IntersectionObserver((muc) => {
      const vao = muc.filter((m) => m.isIntersecting).map((m) => m.target);
      vao.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      vao.forEach((el, i) => hien(el, Math.min(i, TOI_DA - 1) * NOI_TIEP));
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    document.addEventListener('focusin', (e) => { const el = e.target.closest && e.target.closest('[data-hien]'); if (el) hienNgay([el]); });
    window.addEventListener('beforeprint', () => hienNgay(document.querySelectorAll('[data-hien]')));
  }
  document.querySelectorAll('[data-hien]').forEach((el) => {
    if (daTheoDoi.has(el) || el.classList.contains('da-hien')) return;
    daTheoDoi.add(el); quanSat.observe(el);
  });
}
