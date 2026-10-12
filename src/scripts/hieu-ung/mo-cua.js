// Giao diện mới · Trạng thái "Đang mở cửa" theo giờ Việt Nam (Asia/Ho_Chi_Minh), tính từ chuỗi giờ mở cửa trong src/data/thong_tin.json (data-gio="8:00 – 21:00").
// Chưa có JavaScript thì trang chỉ hiện "Giờ mở cửa · 8:00–21:00". Tính lại mỗi phút. Không đoán khi không đọc được giờ: giữ nguyên chữ mặc định.
let hen = null;
const dinhDang = typeof Intl !== 'undefined' ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : null;

function phutHienTai() {
  if (!dinhDang) return null;
  const p = dinhDang.formatToParts(new Date());
  const gio = +(p.find((x) => x.type === 'hour') || {}).value, phut = +(p.find((x) => x.type === 'minute') || {}).value;
  return Number.isFinite(gio) && Number.isFinite(phut) ? gio * 60 + phut : null;
}

function capNhat() {
  const bay = phutHienTai();
  document.querySelectorAll('[data-mo-cua]').forEach((el) => {
    const m = /(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/.exec(el.getAttribute('data-gio') || '');
    if (!m || bay === null) return;
    const dau = +m[1] * 60 + +m[2], cuoi = +m[3] * 60 + +m[4], mo = bay >= dau && bay < cuoi;
    const chu = el.querySelector('.mc-chu'), gio = el.querySelector('.mc-gio');
    el.setAttribute('data-trang', mo ? 'mo' : 'dong');
    if (chu) chu.textContent = mo ? 'Đang mở cửa' : 'Đang đóng cửa';
    if (gio) gio.textContent = ` · ${m[1]}:${m[2]}–${m[3]}:${m[4]}`; // luôn nói rõ giờ mở cửa, đóng hay mở
  });
}

export function khoiDong() {
  if (!document.querySelector('[data-mo-cua]')) return;
  capNhat();
  if (!hen) hen = setInterval(capNhat, 60000);
}
