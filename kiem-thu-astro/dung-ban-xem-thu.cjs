// Dựng BẢN XEM THỬ từ bản dựng Astro (thư mục dist) để đưa lên một địa chỉ xem thử KHÔNG nằm dưới /benhvienthuyleson/ (ví dụ trang riêng tư trên claude.ai).
// Cấu hình thật của web KHÔNG đổi (astro.config.mjs vẫn site=github.io, base=/benhvienthuyleson cho GitHub Pages). Bản xem thử chỉ là bản sao đã đổi MỌI đường dẫn nội bộ
// "/benhvienthuyleson/…" thành đường dẫn TƯƠNG ĐỐI (./, ../), liên kết trang trỏ thẳng tới tệp index.html, nên chạy đúng dù đặt ở thư mục nào.
// Dùng: node kiem-thu-astro/dung-ban-xem-thu.cjs [--dist=dist] [--ra=xem-thu]
//   → <ra>/index.html (bản "mảnh" để bọc khung: trang chính của artifact), <ra>/home/index.html (cùng trang chủ, tài liệu đầy đủ), các trang con, tep/ (= _astro/ của bản dựng), img/
//   → <ra>/danh-sach-tep.json  { "đường/dẫn/đăng": "đường/dẫn/nguồn" } cho tham số `files` của công cụ Artifact
// Chế độ biểu mẫu không đổi: bản xem thử lấy đúng chế độ của dist (mặc định giả lập: không gửi dữ liệu).
const fs = require('fs'), path = require('path');
const arg = (k, mac) => ((process.argv.find((a) => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=')) || mac;
const GOC = path.resolve(__dirname, '..'), DIST = path.resolve(GOC, arg('dist', 'dist')), RA = path.resolve(GOC, arg('ra', 'xem-thu')), BASE = '/benhvienthuyleson/';
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('Không thấy dist/index.html: chạy `npm run build` trước.'); process.exit(2); }
fs.rmSync(RA, { recursive: true, force: true });

const trangHtml = []; // { nguon: đường dẫn trong dist, dich: đường dẫn đăng }
(function quet(d, tuongDoi = '') { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const r = path.posix.join(tuongDoi, e.name);
  if (e.isDirectory()) { if (['admin', 'uploads', '_astro', 'img', 'fonts'].includes(r)) continue; quet(path.join(d, e.name), r); }
  else if (e.name === 'index.html') trangHtml.push({ nguon: r, dich: r === 'index.html' ? 'home/index.html' : r });
} })(DIST);
trangHtml.push({ nguon: 'index.html', dich: 'index.html', manh: true }); // trang chính (bản mảnh)

// "/benhvienthuyleson/<đường dẫn>" → đường dẫn tương đối từ thư mục của trang hiện tại. Đường dẫn kết thúc bằng "/" là trang → …/index.html (trang chủ → home/index.html).
function tuongDoi(curDir, v) {
  const m = /^([^#?]*)([#?][\s\S]*)?$/.exec(v), p = m[1], duoi = m[2] || '';
  let dich = p === '' ? 'home/index.html' : p.endsWith('/') ? p + 'index.html' : p;
  dich = dich.replace(/^_astro\//, 'tep/'); // dịch vụ xem thử không cho đường dẫn bắt đầu bằng "_": thư mục _astro được đăng với tên tep/
  let rel = path.posix.relative(curDir, dich); if (!rel.startsWith('.')) rel = './' + rel;
  return rel + duoi;
}
function doi(html, curDir) {
  return html
    .replace(/<link rel="sitemap"[^>]*>\s*/g, '').replace(/<link rel="canonical"[^>]*>\s*/g, '')
    .replace(/(["'])\/benhvienthuyleson\/([^"'\s]*)\1/g, (_, q, v) => q + tuongDoi(curDir, v) + q);
}
const manh = (h) => h.replace(/^<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, '').replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '').replace(/<\/head>\s*<body[^>]*>/i, '').replace(/<\/body>\s*<\/html>\s*$/i, '');
const dau = (h) => h.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex">');

const danhSach = {}; // đăng → nguồn
for (const t of trangHtml) {
  let h = fs.readFileSync(path.join(DIST, t.nguon), 'utf8');
  h = doi(h, path.posix.dirname(t.dich));
  if (t.manh) h = manh(dau(h)).replace(/<title>[^<]*<\/title>/, '<title>Website Lê Sơn</title>'); else h = dau(h);
  const ra = path.join(RA, t.dich); fs.mkdirSync(path.dirname(ra), { recursive: true }); fs.writeFileSync(ra, h); danhSach[t.dich] = path.relative(GOC, ra);
}
// Tệp tĩnh: _astro/* (đăng là tep/), img/*, fonts/* (phông tự chứa của giao diện mới; thư mục không có thì bỏ qua)
// CSS: url(/benhvienthuyleson/…) do Vite ghi sẵn (vd phông) được đổi thành đường dẫn tương đối tính từ thư mục tep/
for (const thuMuc of ['_astro', 'img', 'fonts']) if (fs.existsSync(path.join(DIST, thuMuc))) (function chep(tuongDoiThuMuc) { for (const e of fs.readdirSync(path.join(DIST, tuongDoiThuMuc), { withFileTypes: true })) {
  const r = path.posix.join(tuongDoiThuMuc, e.name);
  if (e.isDirectory()) { chep(r); continue; }
  const dang = r.replace(/^_astro\//, 'tep/'), dich = path.join(RA, dang); fs.mkdirSync(path.dirname(dich), { recursive: true });
  if (dang.endsWith('.css')) fs.writeFileSync(dich, fs.readFileSync(path.join(DIST, r), 'utf8').replace(/url\((["']?)\/benhvienthuyleson\/([^"')]*)\1\)/g, (_, q, v) => `url(${q}${tuongDoi(path.posix.dirname(dang), v)}${q})`));
  else fs.copyFileSync(path.join(DIST, r), dich);
  danhSach[dang] = path.relative(GOC, dich);
} })(thuMuc);
fs.writeFileSync(path.join(RA, 'danh-sach-tep.json'), JSON.stringify(danhSach, null, 1));
const conDu = Object.values(danhSach).filter((f) => /\.(html|js|css)$/.test(f)).filter((f) => /["'(]\/benhvienthuyleson\//.test(fs.readFileSync(path.join(GOC, f), 'utf8')));
console.log(`Bản xem thử: ${Object.keys(danhSach).length} tệp trong ${path.relative(GOC, RA)}/ (${trangHtml.length} trang). Tệp còn đường dẫn tuyệt đối "/benhvienthuyleson/": ${conDu.length ? conDu.join(', ') : 'không có'}`);
if (conDu.length) process.exit(1);
