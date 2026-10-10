// Lấy điểm sao, số lượt và tối đa 5 đánh giá trên Google Maps của bệnh viện (Google Places API bản mới),
// ghi ra src/data/danh_gia_google.json để trang chủ hiển thị. Chạy trong GitHub Actions trước khi dựng web.
// Mã khoá lấy từ biến môi trường GOOGLE_PLACES_KEY (mục bí mật của GitHub), không nằm trong code.
// Thiếu khoá, đã tắt, hoặc Google lỗi: chỉ in cảnh báo và thoát êm, web vẫn dựng như bình thường.
import { readFile, writeFile } from 'node:fs/promises';

const RA = new URL('../src/data/danh_gia_google.json', import.meta.url);
const CAI_DAT = new URL('../src/data/danh_gia.json', import.meta.url);
const KHOA = process.env.GOOGLE_PLACES_KEY || '';
const API = process.env.GOOGLE_PLACES_API || 'https://places.googleapis.com/v1';
const TIM_MAC_DINH = 'Bệnh viện thú y Lê Sơn, 101 Khuất Duy Tiến, Thanh Xuân, Hà Nội';

const bao = (s) => console.log(`[đánh giá Google] ${s}`);

async function goi(url, init) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`Google trả lỗi ${r.status}: ${t.slice(0, 300)}`);
  return JSON.parse(t);
}

async function chay() {
  const cd = JSON.parse(await readFile(CAI_DAT, 'utf8'));
  if (cd.tu_dong_google === false) return bao('đang tắt trong trang quản trị, bỏ qua.');
  if (!KHOA) return bao('chưa có GOOGLE_PLACES_KEY, bỏ qua (web dùng đánh giá nhập tay).');
  const dau = { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KHOA };

  let id = String(cd.google_place_id || '').trim();
  if (!id) {
    const tim = await goi(`${API}/places:searchText`, {
      method: 'POST',
      headers: { ...dau, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress' },
      body: JSON.stringify({ textQuery: TIM_MAC_DINH, languageCode: 'vi', regionCode: 'VN' }),
    });
    const p = tim.places?.[0];
    if (!p) return bao(`không tìm thấy địa điểm "${TIM_MAC_DINH}". Hãy nhập Place ID trong trang quản trị.`);
    id = p.id;
    bao(`tìm thấy: ${p.displayName?.text} · ${p.formattedAddress} · Place ID: ${id} (lưu Place ID này vào trang quản trị để lần sau khỏi phải tìm)`);
  }

  const d = await goi(`${API}/places/${encodeURIComponent(id)}?languageCode=vi&regionCode=VN`, {
    headers: { ...dau, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews' },
  });
  const ds = (d.reviews || []).map((r) => ({
    ten: r.authorAttribution?.displayName || 'Khách hàng Google',
    link_nguoi: r.authorAttribution?.uri || '',
    sao: Math.round(r.rating || 5),
    noi_dung: (r.text?.text || r.originalText?.text || '').trim(),
    thoi_gian: r.relativePublishTimeDescription || '',
    link: r.googleMapsUri || '',
  })).filter((r) => r.noi_dung);
  const ket = {
    place_id: id,
    diem: d.rating ? String(Math.round(d.rating * 10) / 10).replace('.', ',') : '',
    so: d.userRatingCount ? String(d.userRatingCount) : '',
    link: d.googleMapsUri || '',
    danh_sach: ds,
    cap_nhat: new Date().toISOString(),
  };
  await writeFile(RA, JSON.stringify(ket, null, 2) + '\n');
  bao(`xong: ${ket.diem || '?'} sao, ${ket.so || 0} lượt, lấy ${ds.length} đánh giá.`);
}

chay().catch((e) => { bao(`không lấy được (${e.message}). Web vẫn dựng với đánh giá nhập tay.`); });
