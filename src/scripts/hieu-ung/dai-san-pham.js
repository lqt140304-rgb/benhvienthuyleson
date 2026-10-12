// Giao diện mới · Khu Sản phẩm nổi bật: nút Trước / Sau cuộn dải thẻ một thẻ, vạch tiến độ mảnh theo vị trí cuộn. Không tự trượt, không chiếm cuộn trang.
// Chưa có JavaScript thì nút và vạch ẩn (thuộc tính hidden), dải vẫn cuộn ngang bằng tay / phím.
const itChuyenDong = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function khoiDong() {
  const dai = document.querySelector('[data-sp2-dai]');
  const dk = document.querySelector('[data-sp2-dk]');
  if (!dai || !dk || dk.dataset.san) return;
  dk.dataset.san = '1';
  const truoc = dk.querySelector('[data-sp2-truoc]'), sau = dk.querySelector('[data-sp2-sau]'), vach = dk.querySelector('[data-sp2-vach]');
  const buoc = () => { const t = dai.querySelector('.sp2-the'); return t ? t.offsetWidth + (parseFloat(getComputedStyle(dai).columnGap) || 24) : dai.clientWidth; };
  function capNhat() {
    const tong = dai.scrollWidth, hien = dai.clientWidth, x = dai.scrollLeft, tran = tong - hien;
    if (tran <= 2) { dk.hidden = true; return; } // đủ chỗ hiện hết: không cần nút
    dk.hidden = false;
    truoc.setAttribute('aria-disabled', String(x <= 2)); sau.setAttribute('aria-disabled', String(x >= tran - 2));
    vach.style.setProperty('--pw', (hien / tong).toFixed(3)); vach.style.setProperty('--p0', (x / tong).toFixed(3));
  }
  const di = (h) => dai.scrollBy({ left: h * buoc(), behavior: itChuyenDong() ? 'auto' : 'smooth' });
  truoc.addEventListener('click', () => { if (truoc.getAttribute('aria-disabled') !== 'true') di(-1); });
  sau.addEventListener('click', () => { if (sau.getAttribute('aria-disabled') !== 'true') di(1); });
  let cho = false;
  dai.addEventListener('scroll', () => { if (!cho) { cho = true; requestAnimationFrame(() => { cho = false; capNhat(); }); } }, { passive: true });
  window.addEventListener('resize', capNhat);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(capNhat);
  capNhat();
}
