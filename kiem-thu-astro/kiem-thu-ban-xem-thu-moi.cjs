// Kiểm tra BẢN XEM THỬ giao diện mới (thư mục xem-thu-moi/ do `dung-ban-xem-thu.cjs --dist=dist-moi --ra=xem-thu-moi` tạo) khi đặt ở một thư mục LẠ, không phải /benhvienthuyleson/:
// CSS, phông tự chứa, ảnh, JavaScript, menu, tab Bảng giá, dải sản phẩm, các trang con. Mô phỏng khung xem thử: trang chính được bọc khung (không có <html> / <head> / <body> riêng),
// mọi địa chỉ ngoài bị chặn, tệp không có thì 404, không tự mở index.html cho thư mục.
// Chạy: NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-ban-xem-thu-moi.cjs [thư mục=xem-thu-moi]
// KHÔNG chứng minh được điều gì về máy chủ xem thử THẬT (claude.ai): chỉ chứng minh đường dẫn của bản xem thử không phụ thuộc thư mục đặt nó.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const GOC = path.resolve(__dirname, '..'), RA = path.resolve(GOC, process.argv[2] || 'xem-thu-moi'), CONG = 4395, TIEN_TO = '/mot/thu-muc/la/ban-xem-thu-moi';
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });
const kq = []; const ok = (ten, dk, ct = '') => kq.push({ tt: dk ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 400) });
const KIEU = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const boc = (m) => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${m}</body></html>`;
const yeuCau404 = [];
const may = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (!u.startsWith(TIEN_TO + '/')) { yeuCau404.push(req.url); res.writeHead(404); return res.end('khong co'); }
  const rel = u.slice(TIEN_TO.length + 1);
  if (rel === '') { res.writeHead(200, { 'Content-Type': KIEU['.html'] }); return res.end(boc(fs.readFileSync(path.join(RA, 'index.html'), 'utf8'))); }
  const f = path.join(RA, rel);
  if (!f.startsWith(RA) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { yeuCau404.push(req.url); res.writeHead(404); return res.end('khong co'); }
  res.writeHead(200, { 'Content-Type': KIEU[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(CONG);
const goc = `http://localhost:${CONG}${TIEN_TO}/`;
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch(), ngoai = new Set();
  const ctxMoi = (vp, mobile) => b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, locale: 'vi-VN' }).then(async (ctx) => { await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(`http://localhost:${CONG}`)) return r.continue(); ngoai.add(new URL(u).host); return r.abort(); }); await ctx.addInitScript(() => { try { sessionStorage.setItem('cam-da-chao', '1'); } catch (e) {} }); return ctx; });
  const TRANG = [['Dịch vụ', 'dich-vu'], ['Bảng giá', 'bang-gia'], ['Đặt lịch', 'dat-lich'], ['Cẩm nang thú cưng', 'tu-van'], ['Ca bệnh', 'nhat-ky-ca-benh'], ['Giới thiệu', 'gioi-thieu'], ['Liên hệ', 'lien-he']];
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const tag = `${w}x${h}`, ctx = await ctxMoi({ width: w, height: h }, mobile), p = await ctx.newPage(), loi = [];
    p.on('pageerror', (e) => loi.push(e.message)); p.on('requestfailed', (r) => { if (r.url().startsWith(`http://localhost:${CONG}`) && !/ERR_ABORTED/.test((r.failure() || {}).errorText || '')) loi.push('hỏng: ' + r.url()); });
    await p.goto(goc, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await cho(1200);
    const a = await p.evaluate(() => ({ kem: getComputedStyle(document.documentElement).getPropertyValue('--kem').trim(), nen: getComputedStyle(document.body).backgroundColor, dau: !!document.getElementById('dau'), nenDau: !!document.querySelector('.dau-nen'), h1: document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(), phongH1: getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0].replace(/["']/g, ''), san: window.__hieuUngSan === true, hu: document.documentElement.classList.contains('co-hieu-ung'), khu: ['gioi-thieu', 'dich-vu', 'sp-noi-bat', 'bang-gia', 'dat-lich', 'doi-ngu', 'cam-nang', 'dieu-tri', 'danh-gia', 'lien-he'].filter((i) => document.getElementById(i)).length }));
    ok(`[${tag}] Trang chính (bọc khung, thư mục lạ): CSS giao diện mới áp dụng (--kem #FBF7F1, nền kem), header mới, tiêu đề hero Newsreader đúng chữ, JavaScript hiệu ứng chạy (co-hieu-ung + __hieuUngSan)`, a.kem.toUpperCase() === '#FBF7F1' && a.nen === 'rgb(251, 247, 241)' && a.dau && a.nenDau && /^Sức khỏe hôm nay, hạnh phúc về sau\.$/.test(a.h1) && a.phongH1 === 'Newsreader' && a.san && a.hu, JSON.stringify(a));
    const phong = await (async () => { const cdp = await ctx.newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); const { root } = await cdp.send('DOM.getDocument', { depth: -1 }); const kqp = []; for (const [chon, mong] of [['h1', 'Newsreader'], ['p', 'Be Vietnam Pro']]) { const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: chon }); for (const id of nodeIds.slice(0, 3)) { const bm = await cdp.send('DOM.getBoxModel', { nodeId: id }).catch(() => null); if (!bm || !bm.model.width) continue; const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: id }); if (fonts.some((f) => !f.familyName.startsWith(mong))) kqp.push(chon + ':' + fonts.map((f) => f.familyName).join('+')); } } return kqp; })();
    ok(`[${tag}] Phông tự chứa (tải từ ../fonts/ của bản xem thử) vẽ đúng: h1 chỉ Newsreader, đoạn văn chỉ Be Vietnam Pro, không rơi sang phông dự phòng`, phong.length === 0, phong.join(' | '));
    const anh = await p.evaluate(async () => { const is = [...document.images]; is.forEach((i) => { i.loading = 'eager'; }); await new Promise((r) => setTimeout(r, 1500)); return { tong: is.length, hong: is.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')) }; });
    ok(`[${tag}] Mọi ảnh trên trang chính tải được (logo, ảnh sản phẩm minh hoạ…): ${anh.tong} ảnh`, anh.tong >= 4 && anh.hong.length === 0, anh.hong.join(', '));
    // cuộn hết trang: các khu hiện đủ (hien.js), không lỗi
    const cao = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= cao; y += 400) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await cho(50); } await cho(900);
    const an = await p.evaluate(() => [...document.querySelectorAll('[data-hien]')].filter((e) => !e.classList.contains('da-hien')).length);
    ok(`[${tag}] Cuộn hết trang chính: mọi phần tử [data-hien] đã hiện (hien.js chạy trong khung), header thu gọn khi cuộn`, an === 0 && await p.evaluate(() => document.getElementById('dau').classList.contains('da-cuon')) === true, `còn ẩn: ${an}`);
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await cho(300);
    // menu: máy tính bấm "Bảng giá" → trang con; điện thoại mở / đóng tấm phủ
    if (mobile) {
      await p.click('#nut-menu'); await cho(600); const m1 = await p.evaluate(() => { const r = document.getElementById('menu').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
      await p.keyboard.press('Escape'); await cho(500); const m2 = await p.evaluate(() => getComputedStyle(document.getElementById('menu')).visibility);
      ok(`[${tag}] Menu điện thoại trong khung xem thử: mở phủ kín màn hình, Esc đóng lại`, m1.join() === [0, 0, 390, 844].join() && m2 === 'hidden', JSON.stringify({ m1, m2 }));
    } else {
      const sp = await p.evaluate(() => { const d = document.querySelector('[data-sp2-dai]'); return d ? { sw: d.scrollWidth > d.clientWidth, nut: !document.querySelector('[data-sp2-dk]').hidden } : null; });
      ok(`[${tag}] Dải sản phẩm trong khung xem thử cuộn ngang được, nút Trước / Sau hiện`, sp && sp.sw && sp.nut, JSON.stringify(sp));
    }
    for (const [ten, tep] of TRANG) {
      await p.goto(goc + tep + '/index.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await cho(250);
      const x = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, dau: !!document.querySelector('.dau-nen'), kem: getComputedStyle(document.body).backgroundColor, tt: document.title }));
      if (x.h1 !== 1 || !x.dau || x.kem !== 'rgb(251, 247, 241)') loi.push(`${tep}: ${JSON.stringify(x)}`);
    }
    // trang Bảng giá: tab, gạch chân, hash
    await p.goto(goc + 'bang-gia/index.html#nhom-grooming-spa', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await cho(800);
    const bg = await p.evaluate(() => { const s = document.querySelector('.bg-tab [aria-selected=true]'), g = document.querySelector('.bg-gach'); return { sel: s && s.id, ok: !!g && Math.abs(new DOMMatrix(getComputedStyle(g).transform).e - s.offsetLeft) <= 1, bang: document.querySelectorAll('.bg-panel:not([hidden]) td').length }; });
    ok(`[${tag}] Trang Bảng giá trong khung xem thử: mở thẳng #nhom-grooming-spa chọn đúng tab, gạch chân đúng vị trí, bảng giá hiện đủ ô`, /grooming/.test(bg.sel) && bg.ok && (mobile || bg.bang >= 30), JSON.stringify(bg));
    ok(`[${tag}] Không lỗi JavaScript, không tệp nào bị hỏng khi duyệt hết các trang`, loi.length === 0, loi.join(' | '));
    await ctx.close();
  }
  ok('Không có yêu cầu 404 nào ra ngoài thư mục xem thử (kể cả /fonts/, /img/, /_astro/)', yeuCau404.length === 0, yeuCau404.slice(0, 5).join(' | '));
  ok('Không gọi máy chủ ngoài nào ngoài bản đồ nhúng ở trang Liên hệ (www.google.com, đã chặn; bước 6 đổi thành nút "Mở bản đồ"); không Google Fonts (phông tự chứa)', [...ngoai].every((h) => h === 'www.google.com'), [...ngoai].join(', '));
  await b.close(); may.close();
  const dong = [`Kiểm tra bản xem thử giao diện mới đặt ở thư mục lạ (${TIEN_TO}/) · Chromium Playwright · ${new Date().toISOString()}`, `ĐẠT ${kq.filter((x) => x.tt === 'ĐẠT').length} · KHÔNG ĐẠT ${kq.filter((x) => x.tt === 'KHÔNG ĐẠT').length}`, '', ...kq.map((x) => `[${x.tt}] ${x.ten}${x.ct ? '  → ' + x.ct : ''}`)];
  fs.writeFileSync(path.join(KQ, 'ket-qua-ban-xem-thu-moi.txt'), dong.join('\n'));
  console.log(dong.slice(0, 2).join('\n') + '\n' + kq.filter((x) => x.tt === 'KHÔNG ĐẠT').map((x) => '✗ ' + x.ten + ' → ' + x.ct).join('\n'));
  process.exit(kq.some((x) => x.tt === 'KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
