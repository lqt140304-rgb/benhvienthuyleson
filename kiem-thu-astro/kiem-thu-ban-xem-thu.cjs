// Kiểm tra BẢN XEM THỬ (thư mục xem-thu/ do dung-ban-xem-thu.cjs tạo) chạy đúng khi đặt ở một thư mục LẠ, không phải /benhvienthuyleson/:
// ảnh, CSS, JavaScript, menu, các trang, tab bảng giá, Bé Cam. Mô phỏng khung xem thử: trang chính được bọc khung (không có <head> riêng), mọi địa chỉ ngoài
// (trừ phông chữ Google) bị chặn, tệp không có thì 404, không tự mở index.html cho thư mục.
// Chạy: NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-ban-xem-thu.cjs [thư mục=xem-thu]
// KHÔNG chứng minh được điều gì về máy chủ xem thử THẬT (claude.ai): chỉ chứng minh đường dẫn của bản xem thử không phụ thuộc thư mục đặt nó.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const GOC = path.resolve(__dirname, '..'), RA = path.resolve(GOC, process.argv[2] || 'xem-thu'), CONG = 4396, TIEN_TO = '/mot/thu-muc/la/ban-xem-thu';
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });
const kq = []; const ok = (ten, dk, ct = '') => kq.push({ tt: dk ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 300) });
const KIEU = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
// Khung bọc giống khung xem thử: doctype + meta + một lớp đặt lại tối thiểu; nội dung trang chính nằm trong <body>
const boc = (m) => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${m}</body></html>`;
const yeuCau404 = [];
const may = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (!u.startsWith(TIEN_TO + '/')) { yeuCau404.push(req.url); res.writeHead(404); return res.end('khong co'); }
  let rel = u.slice(TIEN_TO.length + 1);
  if (rel === '') { res.writeHead(200, { 'Content-Type': KIEU['.html'] }); return res.end(boc(fs.readFileSync(path.join(RA, 'index.html'), 'utf8'))); } // trang chính (bọc khung)
  const f = path.join(RA, rel);
  if (!f.startsWith(RA) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { yeuCau404.push(req.url); res.writeHead(404); return res.end('khong co'); } // không tự mở index.html cho thư mục
  res.writeHead(200, { 'Content-Type': KIEU[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(CONG);
const goc = `http://localhost:${CONG}${TIEN_TO}/`;

(async () => {
  const b = await chromium.launch(), ngoai = new Set();
  const ctxMoi = (vp, mobile) => b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, locale: 'vi-VN' }).then(async (ctx) => { await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(`http://localhost:${CONG}`)) return r.continue(); ngoai.add(new URL(u).host); return r.abort(); }); return ctx; });
  const TRANG = [['Dịch vụ', 'dich-vu'], ['Bảng giá', 'bang-gia'], ['Đặt lịch', 'dat-lich'], ['Cẩm nang thú cưng', 'tu-van'], ['Ca bệnh', 'nhat-ky-ca-benh'], ['Giới thiệu', 'gioi-thieu'], ['Liên hệ', 'lien-he']];
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const tag = `${w}x${h}`, ctx = await ctxMoi({ width: w, height: h }, mobile), p = await ctx.newPage(), loi = [];
    p.on('pageerror', (e) => loi.push(e.message)); p.on('requestfailed', (r) => { if (r.url().startsWith(`http://localhost:${CONG}`) && !/ERR_ABORTED/.test((r.failure() || {}).errorText || '')) loi.push('hỏng: ' + r.url()); }); // yêu cầu bị huỷ do chuyển trang (ảnh tải lười dở dang) không phải tệp hỏng; tệp thiếu vẫn bị bắt ở mục 404
    await p.goto(goc, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const x = await p.evaluate(async () => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }); await new Promise((r) => setTimeout(r, 700)); const cs = getComputedStyle(document.documentElement);
      return { tim: cs.getPropertyValue('--tim').trim(), dau: getComputedStyle(document.getElementById('dau')).position, anh: [...document.images].map((i) => [i.getAttribute('src'), i.complete && i.naturalWidth > 0]), moduleJs: !!window.__dai, so: document.querySelectorAll('main > section').length, canon: !!document.querySelector('link[rel=canonical]') }; });
    ok(`[${tag}] Trang chính (bọc khung, đặt ở thư mục lạ): CSS áp dụng (biến màu --tim, header cố định), JavaScript chạy (hai dải thẻ khởi tạo), đủ 11 khu`, x.tim.toLowerCase() === '#5a1e5e' && /sticky|fixed/.test(x.dau) && x.moduleJs && x.so === 11, JSON.stringify({ tim: x.tim, dau: x.dau, js: x.moduleJs, so: x.so }));
    ok(`[${tag}] Mọi ảnh trên trang chính tải được (logo, ảnh sản phẩm minh hoạ…): ${x.anh.length} ảnh`, x.anh.length >= 8 && x.anh.every(([, t]) => t), JSON.stringify(x.anh.filter(([, t]) => !t)));
    ok(`[${tag}] Không có canonical trỏ về địa chỉ thật; có noindex`, !x.canon && (await p.evaluate(() => !!document.querySelector('meta[name=robots][content*=noindex]'))), '');
    // Menu: bấm từng mục, đến đúng trang, trang có CSS, có menu, ảnh logo tải được, về trang chủ bằng logo
    const sai = [];
    for (const [ten, tep] of TRANG) {
      await p.goto(goc + 'lien-he/index.html', { waitUntil: 'load' }); // từ trang con (ở trang chủ, "Dịch vụ" và "Đặt lịch" là liên kết cuộn trong trang)
      if (mobile) await p.click('#nut-menu');
      await p.click(`#menu a:has-text("${ten}") >> nth=0`, { force: true }); await p.waitForLoadState('load');
      const t = await p.evaluate(async () => { await document.fonts.ready; return { tim: getComputedStyle(document.documentElement).getPropertyValue('--tim').trim(), h1: document.querySelectorAll('h1').length, logo: (() => { const i = document.querySelector('.logo img'); return !!i && i.complete && i.naturalWidth > 0; })(), cur: [...document.querySelectorAll('#menu a[aria-current]')].map((a) => a.textContent.trim()) }; });
      if (!p.url().includes(`/${tep}/index.html`) || t.tim.toLowerCase() !== '#5a1e5e' || t.h1 !== 1 || !t.logo || !t.cur.includes(ten === 'Cẩm nang thú cưng' ? ten : ten)) sai.push(`${ten}: ${p.url().replace(goc, '')} ${JSON.stringify(t)}`);
    }
    ok(`[${tag}] Menu: 7 mục dẫn tới đúng trang (…/index.html), mỗi trang có CSS, đúng một H1, logo hiện, mục menu hiện tại đúng`, sai.length === 0, sai.join(' | '));
    await p.goto(goc + 'bang-gia/index.html', { waitUntil: 'load' }); if (mobile) await p.click('#nut-menu'); await p.click('.logo'); await p.waitForLoadState('load');
    ok(`[${tag}] Từ trang con bấm logo: về trang chủ (home/index.html), có đủ khu`, /home\/index\.html$/.test(p.url()) && (await p.evaluate(() => document.querySelectorAll('main > section').length)) === 11, p.url());
    // Tab bảng giá, link nhóm giá từ trang chủ, Bé Cam, sản phẩm
    await p.goto(goc + 'bang-gia/index.html', { waitUntil: 'load' }); await p.click('[role=tab] >> nth=3'); const tab = await p.evaluate(() => ({ sel: document.querySelectorAll('[role=tab][aria-selected=true]').length, hien: [...document.querySelectorAll('[role=tabpanel]')].filter((e) => !e.hidden).length }));
    ok(`[${tag}] Trang Bảng giá: bấm tab đổi nhóm (JavaScript chạy)`, tab.sel === 1 && tab.hien === 1, JSON.stringify(tab));
    await p.goto(goc + 'home/index.html', { waitUntil: 'load' }); await p.click('#bang-gia a.gia-gon-the >> nth=1'); await p.waitForLoadState('load');
    ok(`[${tag}] Thẻ giá ở trang chủ dẫn tới trang Bảng giá (…/bang-gia/index.html#nhom-…)`, /bang-gia\/index\.html#nhom-/.test(p.url()), p.url());
    await p.goto(goc + 'home/index.html', { waitUntil: 'load' }); await p.click(mobile ? '#cam-nut-duoi' : '#cam-nut'); await p.click('[data-hoi="bang-gia"]'); const lk = await p.getAttribute('#cam-tra a', 'href');
    await p.click('#cam-tra a'); await p.waitForLoadState('load');
    ok(`[${tag}] Bé Cam: "Tra cứu bảng giá" dẫn đúng (đường dẫn tương đối) tới trang Bảng giá`, /bang-gia\/index\.html$/.test(p.url()) && !lk.startsWith('/'), `${lk} → ${p.url()}`);
    await p.goto(goc + 'home/index.html', { waitUntil: 'load' }); await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; })); await p.click('#san-pham .sp-tab >> nth=1'); await p.waitForTimeout(500); const sp = await p.evaluate(() => [...document.querySelectorAll('#san-pham .sp-panel')].findIndex((e) => !e.hidden));
    ok(`[${tag}] Khu Sản phẩm: chọn ảnh nhỏ đổi nhóm; ảnh sản phẩm tải được`, sp === 1 && (await p.evaluate(() => [...document.querySelectorAll('#san-pham img')].every((i) => i.complete && i.naturalWidth > 0))), '');
    const hw = await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1); ok(`[${tag}] Trang chủ không cuộn ngang`, hw, '');
    ok(`[${tag}] Không lỗi JavaScript, không tệp nào bị hỏng khi duyệt hết các trang`, loi.length === 0, loi.join(' | '));
    await ctx.close();
  }
  // Biểu mẫu giả lập trên bản xem thử: không gửi gì
  { const ctx = await ctxMoi({ width: 1440, height: 900 }, false), p = await ctx.newPage(); await p.goto(goc + 'dat-lich/index.html', { waitUntil: 'load' });
    const chay = await p.evaluate(() => ({ mode: document.getElementById('form-dat-lich').dataset.mode, ep: document.getElementById('form-dat-lich').dataset.endpoint || '', xem: /chưa gửi dữ liệu thật/.test(document.body.textContent) }));
    ok('Bản xem thử giữ biểu mẫu ở chế độ GIẢ LẬP: không có địa chỉ nhận, có dòng "chưa gửi dữ liệu thật"', chay.mode === 'gia-lap' && !chay.ep && chay.xem, JSON.stringify(chay)); await ctx.close(); }
  const kh = [...ngoai].filter((h) => !/fonts\.(googleapis|gstatic)\.com|zalo\.me|facebook\.com|maps\.app\.goo\.gl|www\.google\.com/.test(h));
  ok('Chỉ có phông chữ Google (và liên kết ra ngoài như Zalo, Facebook, bản đồ khi bấm) bị gọi; không máy chủ lạ nào', kh.length === 0, [...ngoai].join(', '));
  ok('Không có yêu cầu nào tới đường dẫn tuyệt đối "/benhvienthuyleson/" hoặc tệp không tồn tại (404)', yeuCau404.length === 0, yeuCau404.slice(0, 6).join(' | '));
  await b.close(); may.close();
  const dem = (t) => kq.filter((x) => x.tt === t).length, tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')}`;
  fs.writeFileSync(path.join(KQ, 'ket-qua-ban-xem-thu.txt'), [`Kiểm tra bản xem thử đặt ở thư mục lạ (${TIEN_TO}/) · Chromium ${b.version ? '' : ''}Playwright · ${new Date().toISOString()}`, tom, '', ...kq.map((x) => `[${x.tt}] ${x.ten}${x.ct && x.tt !== 'ĐẠT' ? '  → ' + x.ct : ''}`), '', '[CHƯA XÁC MINH] Máy chủ xem thử THẬT (claude.ai): khung bọc trang chính, cách giải đường dẫn tương đối, Content-Security-Policy và việc có giữ "#nhom-…" khi chuyển trang chưa kiểm được từ đây'].join('\n'));
  console.log(tom); kq.filter((x) => x.tt === 'KHÔNG ĐẠT').forEach((x) => console.log('✗', x.ten, '→', x.ct));
  process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
