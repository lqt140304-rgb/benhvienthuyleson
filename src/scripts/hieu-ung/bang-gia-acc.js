// Giao diện mới · Trang Bảng giá: accordion (nút aria-expanded + aria-controls, Enter / Space có sẵn của <button>). Mỗi lần mở một mục trong cùng nhóm thì các mục khác đóng
// (giữ trang gọn); đổi tab thì mục cũ đóng lại. Trạng thái thu gọn ban đầu do CSS (lớp co-hieu-ung) lo để không nhảy bố cục; file này chỉ đổi lớp .mo + aria + inert.
const dat = (li, mo) => {
  const nut = li.querySelector(':scope > .bga-hang'), vung = li.querySelector(':scope > .bga-tt');
  if (!nut || !vung) return;
  nut.setAttribute('aria-expanded', String(mo)); li.classList.toggle('mo', mo); vung.inert = !mo; // phần đóng không nhận Tab / trình đọc màn hình
};
const datLai = () => document.querySelectorAll('.bga-co-acc').forEach((li) => dat(li, li.dataset.moSan === '1')); // trạng thái gốc: chỉ mục có data-mo-san (Gửi nội trú) mở sẵn

export function khoiDong() {
  const goc = document.querySelector('.bg-noi');
  if (!goc || goc.dataset.bga) return;
  goc.dataset.bga = '1';
  datLai(); // đồng bộ aria / inert với trạng thái hiển thị ban đầu
  goc.addEventListener('click', (e) => {
    const nut = e.target.closest('.bga-co-acc > .bga-hang'); if (!nut) return;
    const li = nut.parentElement, mo = nut.getAttribute('aria-expanded') !== 'true', pa = li.closest('.bg-panel');
    if (mo) pa.querySelectorAll('.bga-co-acc').forEach((x) => { if (x !== li) dat(x, false); });
    dat(li, mo);
  });
  const tab = document.querySelector('.bg-tab');
  if (tab) new MutationObserver(datLai).observe(tab, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
}
