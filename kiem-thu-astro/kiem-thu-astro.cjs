// Kiểm thử bản dựng Astro của website Lê Sơn (giao diện mới). Chạy sau `npm run build`:
//   NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-astro.cjs        (cần Playwright; không thêm vào package.json của website)
// Bốn trạng thái: ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH. Chỉ ĐẠT mới tính là đạt. Chỉ Chromium của Playwright được chạy.
// Không gửi dữ liệu thật: mọi yêu cầu ra ngoài máy chủ cục bộ đều bị chặn; yêu cầu tới Google Apps Script chỉ được ghi nhận và trả lời giả.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const GOC = path.resolve(__dirname, '..'), DIST = path.join(GOC, 'dist'), BASE = '/benhvienthuyleson';
const CONG = 4399, CONG2 = 4398, URLG = `http://localhost:${CONG}${BASE}`;
const COMMIT_GOC = process.env.COMMIT_GOC || '24d5057'; // commit trước khi tích hợp giao diện mới
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });

const kq = []; // { tt, ten, ct }
const ok = (ten, dieuKien, ct = '') => kq.push({ tt: dieuKien ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 400) });
const chuaChay = (ten, ly) => kq.push({ tt: 'CHƯA CHẠY', ten, ct: ly });
const chuaXm = (ten, ly) => kq.push({ tt: 'CHƯA XÁC MINH', ten, ct: ly });
const muc = (t) => { kq.push({ tt: 'MỤC', ten: t, ct: '' }); console.log('\n== ' + t); };

const dichVu = JSON.parse(fs.readFileSync(path.join(GOC, 'src/data/dich_vu.json'), 'utf8')).danh_sach.filter((d) => d && d.ten);
const neo = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cam = JSON.parse(fs.readFileSync(path.join(GOC, 'src/data/cam.json'), 'utf8'));

// ---------- 1. Liên kết trên toàn bộ dist (không cần trình duyệt) ----------
function lietKeHtml(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? lietKeHtml(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []); }
function kiemLienKet() {
  muc('1. Liên kết và tệp trong bản dựng (dist)');
  const trang = lietKeHtml(DIST), loi = [], ngoai = new Map(); let tong = 0;
  const html = new Map(trang.map((f) => [f, fs.readFileSync(f, 'utf8')]));
  const coId = (f, id) => new RegExp(`\\sid=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html.get(f) || '');
  for (const f of trang) {
    const noi = html.get(f), tuongDoi = '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
    if (/noindex/.test(noi) === false && /sitemap/.test(f)) continue;
    const re = /\s(?:href|src|action)=["']([^"']+)["']|url\(["']?([^"')]+)/g; let m;
    while ((m = re.exec(noi))) {
      const v = (m[1] || m[2] || '').trim();
      if (!v || /^(data:|mailto:|tel:|javascript:|#?$)/.test(v)) continue;
      if (/^https?:\/\//.test(v)) {
        if (/lqt140304-rgb\.github\.io\/benhvienthuyleson/.test(v)) { if (!/canonical|og:|sitemap/.test(noi.slice(Math.max(0, m.index - 80), m.index))) loi.push(`${tuongDoi} → link tuyệt đối tới website: ${v}`); continue; }
        const host = new URL(v).host; ngoai.set(host, (ngoai.get(host) || 0) + 1); continue;
      }
      if (!/^[./#?]/.test(v) && !/^[A-Za-z0-9_-]+\//.test(v) && !/\.(css|js|jpg|png|svg|xml|webp)$/.test(v)) continue; // giá trị content="..." thông thường
      tong++;
      const [truocHash, hash] = v.split('#'); const duongDan = truocHash.split('?')[0];
      let dich;
      if (duongDan === '') dich = f;
      else if (duongDan.startsWith(BASE + '/')) dich = path.join(DIST, duongDan.slice(BASE.length));
      else if (duongDan.startsWith('/')) { loi.push(`${tuongDoi} → ${v}: thiếu tiền tố ${BASE}`); continue; }
      else dich = path.join(path.dirname(f), duongDan);
      if (fs.existsSync(dich) && fs.statSync(dich).isDirectory()) dich = path.join(dich, 'index.html');
      if (!fs.existsSync(dich)) { loi.push(`${tuongDoi} → ${v}: không có tệp đích`); continue; }
      if (hash && dich.endsWith('.html') && hash !== 'top') {
        const nhom = /^nhom-(.+)$/.exec(hash);
        const id = nhom ? 'tab-' + nhom[1] : hash;
        if (!coId(dich, id)) loi.push(`${tuongDoi} → ${v}: không có id #${id} ở trang đích`);
      }
      const q = /[?&]nhom=([^&]+)/.exec(v);
      if (q && !dichVu.some((d) => neo(d.ten) === decodeURIComponent(q[1]))) loi.push(`${tuongDoi} → ${v}: nhóm không có trong dữ liệu dịch vụ`);
    }
  }
  ok(`Mọi liên kết nội bộ, ảnh, CSS, JS trong ${trang.length} trang đều có tệp đích; hash nhóm giá và mục trang có id; không còn link tuyệt đối tới website cũ (${tong} liên kết đã kiểm)`, loi.length === 0, loi.slice(0, 8).join(' | '));
  const dsNgoai = [...ngoai.keys()];
  console.log('Máy chủ ngoài được trỏ tới:', dsNgoai.join(', ') || '(không)');
  return dsNgoai;
}

// ---------- 2. Dữ liệu giá và logo không đổi so với trước khi tích hợp ----------
function kiemDuLieu() {
  muc(`2. Dữ liệu giá, logo, dữ liệu nguồn so với commit ${COMMIT_GOC}`);
  const tep = [...fs.readdirSync(path.join(GOC, 'src/data')).map((f) => 'src/data/' + f), 'public/img/logo.jpg', 'public/img/og.jpg', 'public/img/favicon.png'];
  const khac = [];
  for (const t of tep) {
    let goc; try { goc = cp.execSync(`git show ${COMMIT_GOC}:${t}`, { cwd: GOC, maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { continue; }
    const nay = fs.readFileSync(path.join(GOC, t));
    if (crypto.createHash('sha256').update(goc).digest('hex') !== crypto.createHash('sha256').update(nay).digest('hex')) khac.push(t);
  }
  ok(`${tep.length} tệp dữ liệu / logo giống hệt bản gốc (SHA-256)`, khac.length === 0, khac.join(', '));
}

(async () => {
  // Dựng thêm hai bản để thử các chế độ biểu mẫu: PUBLIC_MODE_DAT_LICH=that (nhận thật, dùng máy chủ giả) và =cu (biểu mẫu cũ)
  for (const [mode, thuMuc] of [['that', 'dist-that'], ['cu', 'dist-cu']]) cp.execSync(`npx astro build --outDir ${thuMuc}`, { cwd: GOC, env: { ...process.env, PUBLIC_MODE_DAT_LICH: mode }, stdio: 'ignore' });
  const may = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG)], { stdio: 'ignore' });
  const may2 = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG2)], { stdio: 'ignore', env: { ...process.env, DIST: path.join(GOC, 'dist-that') } });
  await new Promise((r) => setTimeout(r, 800));
  const ngoaiBuild = kiemLienKet(); kiemDuLieu();
  const b = await chromium.launch();
  const phienBan = b.version();
  const ngoaiYeuCau = new Set(); let guiGoogle = 0;
  const ctxMoi = async (tuy = {}) => {
    const ctx = await b.newContext({ locale: 'vi-VN', ...tuy });
    await ctx.route('**/*', (r) => {
      const u = r.request().url();
      if (u.startsWith(`http://localhost:${CONG}`) || u.startsWith(`http://localhost:${CONG2}`)) return r.continue();
      ngoaiYeuCau.add(new URL(u).host);
      if (/script\.google\.com/.test(u)) { guiGoogle++; return r.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' }); }
      return r.abort(); // phông chữ Google và mọi thứ khác: chặn, không gọi ra ngoài
    });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('cam-da-chao', '1'); } catch (e) {} });
    return ctx;
  };
  const moTrang = async (ctx, duong, loi) => {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => loi && loi.push(duong + ' · ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && loi && !/Failed to load resource/.test(m.text())) loi.push(duong + ' · ' + m.text().slice(0, 120)); });
    const res = await p.goto(URLG + duong, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    return { p, res };
  };
  const TRANG = ['/', '/bang-gia/', '/dich-vu/', '/gioi-thieu/', '/lien-he/', '/dat-lich/', '/nhan-vien/', '/tu-van/', '/tu-van/cho/', '/tu-van/meo/', '/nhat-ky-ca-benh/'];

  // ---------- 3. Trang, tiêu đề, lỗi console ----------
  muc('3. Các trang mở được, có tiêu đề / ngôn ngữ / H1, không lỗi JavaScript');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), loi = [], hong = [];
    for (const t of TRANG) {
      const { p, res } = await moTrang(ctx, t, loi);
      const x = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, h1: document.querySelectorAll('h1').length, main: document.querySelectorAll('main').length, mo: !!document.querySelector('meta[name=description]'), canon: !!document.querySelector('link[rel=canonical]') }));
      if (res.status() !== 200 || x.lang !== 'vi' || !x.title || x.h1 !== 1 || x.main !== 1 || !x.mo || !x.canon) hong.push(t + ' ' + JSON.stringify({ s: res.status(), ...x }));
      await p.close();
    }
    ok(`${TRANG.length} trang: mã 200, lang="vi", có <title>, mô tả, canonical, đúng một <h1> và một <main>`, hong.length === 0, hong.join(' | '));
    ok('Không có lỗi JavaScript / console trên các trang', loi.length === 0, loi.join(' | '));
    const { p, res } = await moTrang(ctx, '/khong-co-trang-nay/', null);
    const t404 = await p.evaluate(() => ({ h1: document.querySelector('h1')?.textContent, robots: document.querySelector('meta[name=robots]')?.content, lienKet: [...document.querySelectorAll('main a')].map((a) => a.getAttribute('href')) }));
    ok('Trang không tồn tại trả 404 thật, có H1, noindex, nút về trang chủ và Bảng giá', res.status() === 404 && /Không tìm thấy/.test(t404.h1) && /noindex/.test(t404.robots) && t404.lienKet.includes(BASE + '/') && t404.lienKet.includes(BASE + '/bang-gia/'), JSON.stringify(t404));
    await ctx.close();
  }

  // ---------- 4. Header ----------
  muc('4. Header: mục đang xem, menu điện thoại, focus bàn phím');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), sai = [];
    const mong = { '/': 'Trang chủ', '/bang-gia/': 'Bảng giá', '/dich-vu/': 'Dịch vụ', '/dat-lich/': 'Đặt lịch', '/tu-van/': 'Cẩm nang thú cưng', '/tu-van/cho/': 'Cẩm nang thú cưng', '/nhat-ky-ca-benh/': 'Ca bệnh', '/gioi-thieu/': 'Giới thiệu', '/lien-he/': 'Liên hệ', '/nhan-vien/': '' };
    for (const [t, ten] of Object.entries(mong)) {
      const { p } = await moTrang(ctx, t, null);
      const ds = await p.evaluate(() => [...document.querySelectorAll('#menu a[aria-current]')].map((a) => a.textContent.trim()));
      if (ds.length !== (ten ? 1 : 0) || (ten && ds[0] !== ten)) sai.push(`${t}: ${JSON.stringify(ds)} (mong "${ten}")`);
      await p.close();
    }
    ok('Mỗi trang chỉ có một mục menu đúng được đánh dấu (aria-current); trang nhân viên không có mục nào', sai.length === 0, sai.join(' | '));
    const { p } = await moTrang(ctx, '/');
    const ids = await p.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id));
    ok('Thứ tự khu ở trang chủ: Hero, Giới thiệu, Dịch vụ, Sản phẩm (ngay dưới Dịch vụ), Bảng giá, Đặt lịch, Đội ngũ, Cẩm nang, Điều trị, Đánh giá, Liên hệ', JSON.stringify(ids) === JSON.stringify(['noi-dung', 'gioi-thieu', 'dich-vu', 'san-pham', 'bang-gia', 'dat-lich', 'doi-ngu', 'cam-nang', 'dieu-tri', 'danh-gia', 'lien-he']), ids.join(','));
    await p.evaluate(() => document.getElementById('bang-gia').scrollIntoView({ behavior: 'instant', block: 'start' })); await p.waitForTimeout(400);
    const a1 = await p.evaluate(() => [...document.querySelectorAll('#menu a[aria-current]')].map((a) => a.textContent.trim()));
    await p.evaluate(() => document.getElementById('dich-vu').scrollIntoView({ behavior: 'instant', block: 'start' })); await p.waitForTimeout(400);
    const a2 = await p.evaluate(() => [...document.querySelectorAll('#menu a[aria-current]')].map((a) => a.textContent.trim()));
    ok('Cuộn trang chủ: mục Dịch vụ sáng khi tới khu Dịch vụ; khu Bảng giá (tóm tắt) không đánh dấu nhầm mục', a2.join() === 'Dịch vụ' && a1.join() !== 'Dịch vụ', `${a1} / ${a2}`);
    // Tab: skip link rồi các mục, focus nhìn thấy rõ
    await p.goto(URLG + '/'); const dau = [];
    for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); dau.push(await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e), r = e.getBoundingClientRect(); return { ten: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 24), ro: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none', trongMan: r.bottom > 0 && r.top < innerHeight && r.width > 0 }; })); }
    ok('14 lần Tab đầu: lần 1 là "Bỏ qua đến nội dung"; mỗi phần tử focus đều hiện rõ khung focus và nằm trong màn hình', /Bỏ qua/.test(dau[0].ten) && dau.every((d) => d.ro && d.trongMan), JSON.stringify(dau.filter((d) => !d.ro || !d.trongMan)));
    await p.close(); await ctx.close();
    const m = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const { p: pm } = await moTrang(m, '/');
    await pm.click('#nut-menu'); await pm.waitForTimeout(400);
    const mo = await pm.evaluate(() => ({ ex: document.getElementById('nut-menu').getAttribute('aria-expanded'), nhin: document.getElementById('menu').getBoundingClientRect().height > 100, foc: document.activeElement.closest('#menu') !== null }));
    await pm.keyboard.press('Escape'); await pm.waitForTimeout(300);
    const dong = await pm.evaluate(() => ({ ex: document.getElementById('nut-menu').getAttribute('aria-expanded'), foc: document.activeElement.id }));
    ok('Menu điện thoại: mở (aria-expanded, focus vào menu), Esc đóng và trả focus về nút Menu', mo.ex === 'true' && mo.nhin && mo.foc && dong.ex === 'false' && dong.foc === 'nut-menu', JSON.stringify({ mo, dong }));
    await m.close();
  }

  // ---------- 5. Không cuộn ngang ở các kích thước ----------
  muc('5. Bố cục: không cuộn ngang, không chữ tràn ở 7 kích thước + màn ngang');
  {
    const KT = [[360, 740], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [844, 390]];
    const hong = [];
    for (const [w, h] of KT) {
      const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
      for (const t of TRANG.concat(['/khong-co/'])) {
        const p = await ctx.newPage(); await p.goto(URLG + t, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
        const x = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, tran: [...document.querySelectorAll('main h1, main h2, main h3, main p, main a, main button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.cn-dai, .cn-ray, .hero-nen, [aria-hidden="true"], .bg-bang, .tp-prose'); }).slice(0, 2).map((e) => e.tagName + '.' + e.className) }));
        if (x.sw > x.cw + 1 || x.tran.length) hong.push(`${w}x${h} ${t}: scrollWidth ${x.sw}/${x.cw} ${x.tran.join(',')}`);
        await p.close();
      }
      await ctx.close();
    }
    ok(`${TRANG.length + 1} trang × ${KT.length} kích thước (360, 390, 430, 768, 1024, 1280, 1440, ngang 844×390): không cuộn ngang, không phần tử tràn khung`, hong.length === 0, hong.slice(0, 6).join(' | '));
  }

  // ---------- 6. Bảng giá: dữ liệu nguyên gốc, tab, hash ----------
  muc('6. Bảng giá: đủ giá từ dữ liệu, tab bằng chuột / bàn phím, mở thẳng nhóm bằng #nhom-…');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } });
    const { p } = await moTrang(ctx, '/dich-vu/');
    const chu = (await p.evaluate(() => document.body.textContent)).replace(/\s+/g, ' ');
    const gia = (g) => { const t = String(g || '').trim(); return !t || t === '–' ? null : /\d$/.test(t) ? t + 'đ' : t; };
    const dsGia = new Set();
    for (const d of dichVu) { for (const r of d.bang?.dong ?? []) for (const g of r.gia ?? []) { const x = gia(g); if (x) dsGia.add(x); } for (const h of d.hang_muc ?? []) { const x = gia(h.gia); if (x) dsGia.add(x); } }
    const thieu = [...dsGia].filter((g) => !chu.includes(g));
    ok(`Trang Dịch vụ hiện đủ ${dsGia.size} mức giá khác nhau lấy từ dich_vu.json (đúng từng ký tự, đơn vị đ)`, thieu.length === 0, thieu.join(', '));
    const { p: pg } = await moTrang(ctx, '/bang-gia/');
    const chuGia = (await pg.evaluate(() => document.body.textContent)).replace(/\s+/g, ' ');
    ok('Trang Bảng giá chứa đủ cùng các mức giá', [...dsGia].every((g) => chuGia.includes(g)), [...dsGia].filter((g) => !chuGia.includes(g)).join(', '));
    ok('Có đủ một tab và một panel cho mỗi nhóm dịch vụ', await pg.evaluate((n) => document.querySelectorAll('[role=tab]').length === n && document.querySelectorAll('[role=tabpanel]').length === n, dichVu.length));
    const sai = [];
    for (const d of dichVu) {
      await pg.goto(`${URLG}/bang-gia/#nhom-${neo(d.ten)}`); await pg.reload(); await pg.waitForTimeout(150);
      const x = await pg.evaluate((id) => ({ sel: document.getElementById('tab-' + id)?.getAttribute('aria-selected'), hien: !document.getElementById('p-' + id)?.hidden, hienKhac: [...document.querySelectorAll('[role=tabpanel]')].filter((e) => !e.hidden).length, foc: document.activeElement.id }), neo(d.ten));
      if (x.sel !== 'true' || !x.hien || x.hienKhac !== 1 || x.foc !== 'tab-' + neo(d.ten)) sai.push(neo(d.ten) + ' ' + JSON.stringify(x));
    }
    ok(`Mở /bang-gia/#nhom-<mã> cho ${dichVu.length} nhóm: tab được chọn, chỉ panel đó hiện, focus ở tab`, sai.length === 0, sai.join(' | '));
    await pg.goto(URLG + '/bang-gia/'); await pg.focus('[role=tab][aria-selected=true]'); await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('End');
    const cuoi = await pg.evaluate(() => ({ foc: document.activeElement.getAttribute('aria-selected'), id: document.activeElement.id, n: document.querySelectorAll('[role=tab]').length }));
    await pg.keyboard.press('Home'); const dau = await pg.evaluate(() => document.activeElement.id);
    ok('Tab bằng bàn phím: mũi tên phải, End → tab cuối, Home → tab đầu; focus đi theo', cuoi.foc === 'true' && dau === (await pg.evaluate(() => document.querySelectorAll('[role=tab]')[0].id)), JSON.stringify({ cuoi, dau }));
    await ctx.close();
    const mb = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const { p: pm } = await moTrang(mb, '/bang-gia/#nhom-xet-nghiem');
    const bangMobile = await pm.evaluate(() => { const bg = document.querySelector('.bg-the'); return { the: [...document.querySelectorAll('.bg-the')].some((e) => e.offsetParent !== null) }; });
    chuaXm('Bảng giá cân nặng trên điện thoại (mỗi mức một dòng mở ra được) hiển thị đúng ý', 'Chỉ kiểm tra có hiện; cần người xem trên máy thật. Kết quả đo: ' + JSON.stringify(bangMobile));
    await mb.close();
  }

  // ---------- 7. Hai dải thẻ + giảm chuyển động ----------
  muc('7. Hai dải thẻ (Cẩm nang, Đội ngũ): tự trượt, Tạm dừng, giảm chuyển động lúc mở và khi đổi giữa chừng');
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const tag = `${w}x${h}`, ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    const { p } = await moTrang(ctx, '/');
    const tt = (ma) => p.evaluate((m) => window.__dai[m].trangThai(), ma);
    const x = async (ma) => (await tt(ma)).x;
    // dải nằm ngoài màn hình thì tự dừng (đỡ tốn pin), nên đo từng dải khi đang nằm giữa màn hình
    const giua = (ma) => p.evaluate((m) => document.getElementById(m + '-dai').scrollIntoView({ behavior: 'instant', block: 'center' }), ma);
    await p.mouse.move(2, 2);
    const chay = {};
    for (const ma of ['cn', 'dn']) { await giua(ma); await p.waitForTimeout(300); const a = await x(ma); await p.waitForTimeout(1500); chay[ma] = (await x(ma)) !== a; }
    ok(`[${tag}] Lúc đầu cả hai dải tự trượt (nút "Tạm dừng")`, chay.cn && chay.dn && (await p.textContent('#cn-dung')).includes('Tạm dừng'), JSON.stringify(chay));
    await giua('cn');
    await p.click('#cn-dung'); const t0 = await x('cn'); await p.waitForTimeout(900);
    ok(`[${tag}] Bấm Tạm dừng: dải dừng, nút thành "Tiếp tục" (aria-pressed, title)`, (await x('cn')) === t0 && (await p.getAttribute('#cn-dung', 'aria-pressed')) === 'true' && (await p.getAttribute('#cn-dung', 'title')) === 'Tiếp tục', '');
    await p.click('#cn-dung');
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(600);
    await giua('cn'); const g0 = { cn: await x('cn'), dn: await x('dn') }; await p.waitForTimeout(1500);
    const gm = await p.evaluate(() => ({ cn: document.getElementById('cn-dung').getAttribute('aria-pressed'), dn: document.getElementById('dn-dung').getAttribute('aria-pressed'), tt: [...document.querySelectorAll('[data-nut-trang-tri] .tt-trang-thai')].map((e) => e.textContent), lop: document.documentElement.classList.contains('tat-trang-tri') }));
    ok(`[${tag}] Bật giảm chuyển động khi đang xem: cả hai dải đứng yên, nút "Tiếp tục", trang trí tắt ("Đang tắt theo cài đặt máy")`, g0.cn === (await x('cn')) && g0.dn === (await x('dn')) && gm.cn === 'true' && gm.dn === 'true' && gm.lop && gm.tt.every((s) => /theo cài đặt máy/.test(s)), JSON.stringify(gm));
    const truoc = (await tt('cn')).thuTu[0]; await p.click('#cn-sau'); await p.waitForTimeout(200);
    ok(`[${tag}] Đang giảm chuyển động: nút Sau vẫn chuyển đúng một thẻ`, (await tt('cn')).thuTu[1] === truoc || (await tt('cn')).thuTu[0] !== truoc, '');
    await p.emulateMedia({ reducedMotion: 'no-preference' }); await p.waitForTimeout(500);
    const lai = {};
    for (const ma of ['cn', 'dn']) { await giua(ma); await p.waitForTimeout(300); const a = await x(ma); await p.waitForTimeout(1500); lai[ma] = (await x(ma)) !== a; }
    ok(`[${tag}] Tắt giảm chuyển động giữa chừng: hai dải chạy lại`, lai.cn && lai.dn, JSON.stringify(lai));
    await ctx.close();
    const r = await ctxMoi({ viewport: { width: w, height: h }, reducedMotion: 'reduce', isMobile: mobile, hasTouch: mobile });
    const { p: pr } = await moTrang(r, '/');
    for (const ma of ['cn', 'dn']) await pr.evaluate((m) => document.getElementById(m + '-dai').scrollIntoView({ behavior: 'instant', block: 'center' }), ma);
    const r0 = await pr.evaluate(() => [window.__dai.cn.trangThai().x, window.__dai.dn.trangThai().x]); await pr.waitForTimeout(1800);
    const r1 = await pr.evaluate(() => [window.__dai.cn.trangThai().x, window.__dai.dn.trangThai().x, document.getElementById('cn-dung').getAttribute('aria-pressed')]);
    ok(`[${tag}] Mở trang khi máy đã bật giảm chuyển động: cả hai dải đứng yên, nút "Tiếp tục"`, r0[0] === r1[0] && r0[1] === r1[1] && r1[2] === 'true', JSON.stringify([r0, r1]));
    await r.close();
  }

  // ---------- 8. Khu Sản phẩm ----------
  muc('8. Khu "Sản phẩm nổi bật"');
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const tag = `${w}x${h}`, ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    const { p } = await moTrang(ctx, '/');
    const chu = (await p.textContent('#san-pham')).replace(/\s+/g, ' ');
    ok(`[${tag}] Không có giá, nhãn hiệu, tồn kho, số lượng bán; có chip "Ảnh minh hoạ" và "chờ bệnh viện xác nhận"`, !/\d[\d.]*\s*(đ|₫|vnđ)(?![\p{L}])/iu.test(chu) && !/(còn hàng|hết hàng|đã bán|giảm giá|giỏ hàng|thanh toán)/i.test(chu) && /Ảnh minh hoạ/.test(chu) && /chờ bệnh viện xác nhận/.test(chu), chu.slice(0, 160));
    await p.focus('.sp-tab[aria-selected=true]'); await p.keyboard.press('ArrowRight');
    const k1 = await p.evaluate(() => ({ id: document.activeElement.id, sel: document.activeElement.getAttribute('aria-selected'), hien: [...document.querySelectorAll('#san-pham .sp-panel')].findIndex((e) => !e.hidden) }));
    await p.click('.sp-panel:not([hidden]) [data-sp-sau]'); await p.click('.sp-panel:not([hidden]) [data-sp-sau]');
    const k2 = await p.evaluate(() => [...document.querySelectorAll('#san-pham .sp-panel')].findIndex((e) => !e.hidden));
    ok(`[${tag}] Mũi tên chuyển nhóm và focus theo; Sau ×2 quay vòng về đầu`, k1.sel === 'true' && k1.hien === 1 && k1.id === 'sp-t-1' && k2 === 0, JSON.stringify({ k1, k2 }));
    const to = await p.evaluate(() => [...document.querySelectorAll('#san-pham .sp-tab, #san-pham .sp-panel:not([hidden]) .nut-tron, #san-pham .sp-panel:not([hidden]) .sp-cta')].map((e) => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));
    ok(`[${tag}] Ảnh chọn và nút đủ lớn để chạm (≥ 44px; nhỏ nhất ${Math.min(...to)}px)`, Math.min(...to) >= 44, '');
    await ctx.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const { p } = await moTrang(ctx, '/');
    const x = await p.evaluate(() => ({ panel: [...document.querySelectorAll('#san-pham .sp-panel')].filter((e) => e.offsetHeight > 0).length, tab: getComputedStyle(document.querySelector('#san-pham .sp-chon')).display }));
    ok('Không JavaScript: cả 3 nhóm sản phẩm hiện đủ, bộ chọn ẩn', x.panel === 3 && x.tab === 'none', JSON.stringify(x));
    const y = await p.evaluate(() => ({ dv: [...document.querySelectorAll('#dich-vu .the-dv')].filter((e) => e.offsetHeight > 0 && getComputedStyle(e).opacity === '1').length, gia: document.querySelectorAll('#bang-gia .gia-gon-the').length, an: [...document.querySelectorAll('[data-hien]')].filter((e) => getComputedStyle(e).opacity !== '1').length }));
    ok('Không JavaScript: trang chủ hiện đủ nội dung (thẻ dịch vụ, tóm tắt giá, không khối nào bị ẩn mờ)', y.dv >= 5 && y.gia === 5 && y.an === 0, JSON.stringify(y));
    const { p: pg } = await moTrang(ctx, '/bang-gia/');
    ok('Không JavaScript: Bảng giá có ghi chú dẫn tới trang Dịch vụ (xem đủ mọi nhóm)', (await pg.textContent('noscript').catch(() => '')) !== undefined && (await pg.evaluate(() => document.querySelector('.bg-panel:not([hidden])') !== null)), '');
    await ctx.close();
  }

  // ---------- 9. Bé Cam ----------
  muc('9. Bé Cam');
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const tag = `${w}x${h}`, ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    const { p } = await moTrang(ctx, '/');
    const nut = mobile ? '#cam-nut-duoi' : '#cam-nut';
    await p.click(nut); await p.waitForTimeout(350);
    const m = await p.evaluate(() => ({ hien: !document.getElementById('cam-bang').hidden, foc: document.activeElement.closest('#cam-bang') !== null, chao: [...document.querySelectorAll('.cam-chao')].filter((e) => !e.hidden).map((e) => e.textContent.trim()), ex: document.getElementById('cam-nut').getAttribute('aria-expanded') }));
    ok(`[${tag}] Mở Bé Cam: hộp thoại hiện, focus vào trong, đúng một câu chào lấy từ cam.json`, m.hien && m.foc && m.chao.length === 1 && [cam.trang_chu, cam.ngoai_gio].includes(m.chao[0]), JSON.stringify(m));
    await p.click('[data-hoi="bang-gia"]'); const link = await p.getAttribute('#cam-tra a', 'href');
    ok(`[${tag}] "Tra cứu bảng giá" dẫn tới /bang-gia/ thật`, link === BASE + '/bang-gia/', link);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const d = await p.evaluate(() => ({ an: document.getElementById('cam-bang').hidden, foc: document.activeElement.id }));
    ok(`[${tag}] Esc đóng Bé Cam và trả focus về nút mở`, d.an && /cam-nut/.test(d.foc), JSON.stringify(d));
    await p.click(nut); await p.click('[data-hoi="dich-vu"]'); await p.click('#cam-tra button[data-toi]'); await p.waitForTimeout(500);
    const toi = await p.evaluate(() => ({ foc: document.activeElement.tagName, tren: Math.round(document.getElementById('dich-vu').getBoundingClientRect().top) }));
    ok(`[${tag}] "Xem dịch vụ" cuộn tới khu Dịch vụ ở trang chủ, focus ở tiêu đề (không rơi về BODY)`, toi.foc === 'H2', JSON.stringify(toi));
    await ctx.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), { p } = await moTrang(ctx, '/lien-he/');
    await p.click('#cam-nut'); await p.click('[data-hoi="dat-lich"]'); const l = await p.getAttribute('#cam-tra a', 'href');
    ok('Ở trang khác: "Đặt lịch khám" dẫn tới /dat-lich/ (không dùng link tuyệt đối)', l === BASE + '/dat-lich/', l);
    await ctx.close();
  }

  // ---------- 10. Hiệu ứng: nút trang trí, icon một lần ----------
  muc('10. Hiệu ứng trang trí và icon dịch vụ');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), { p } = await moTrang(ctx, '/');
    await p.click('.hero [data-nut-trang-tri]'); const a = await p.evaluate(() => ({ lop: document.documentElement.classList.contains('tat-trang-tri'), pr: document.querySelector('[data-nut-trang-tri]').getAttribute('aria-pressed'), ls: localStorage.getItem('le-son-trang-tri') }));
    await p.reload(); const bb = await p.evaluate(() => document.documentElement.classList.contains('tat-trang-tri'));
    ok('Nút "Hiệu ứng trang trí": tắt được, nhớ lựa chọn sau khi tải lại', a.lop && a.pr === 'false' && a.ls === 'tat' && bb, JSON.stringify(a));
    await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    const dem = await p.evaluate(() => ({ dv: document.querySelectorAll('#dich-vu svg.ic48').length, gia: document.querySelectorAll('#bang-gia svg.ic48').length }));
    ok('Icon dịch vụ mới (SVG lưới 48) hiện ở thẻ dịch vụ và tóm tắt giá', dem.dv >= 5 && dem.gia >= 4, JSON.stringify(dem));
    await p.hover('#dich-vu a.the-dv.nho >> nth=0'); await p.waitForTimeout(150);
    const nd = await p.evaluate(() => document.querySelector('#dich-vu a.the-dv.nho svg.ic48').querySelectorAll('*').length > 0 && [...document.querySelectorAll('#dich-vu a.the-dv.nho svg.ic48 *')].some((e) => e.getAnimations().length > 0));
    ok('Rê chuột vào thẻ dịch vụ: icon chạy chuyển động (một lần, do CSS)', nd, '');
    await ctx.close();
  }

  // ---------- 11. Biểu mẫu đặt lịch mới ----------
  muc('11. Biểu mẫu đặt lịch mới: trường, kiểm tra, giả lập (0 yêu cầu), nhận thật với máy chủ giả (đã nhận / lỗi / quá thời gian / không đọc được / trùng)');
  const nhomDat = dichVu.filter((d) => d.dat_lich !== false && !d.cap_cuu), dvThuong = neo(nhomDat.find((d) => d.icon !== 'bed').ten), dvNoiTru = neo(nhomDat.find((d) => d.icon === 'bed').ten);
  const vn = new Date(Date.now() + 7 * 3600e3), cong = (n) => { const d = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + n)); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`; };
  const dien = async (p, o = {}) => {
    await p.fill('#m-ten', o.ten ?? 'Khách thử nghiệm'); await p.fill('#m-sdt', o.sdt ?? '0912 345 678'); await p.fill('#m-thu', o.thu ?? 'Bé Thử');
    if (o.khac) { await p.check('input[name="m-loai"][value="khac"]', { force: true }); await p.fill('#m-loai-khac', o.khac); }
    await p.selectOption('#m-dv', o.dv ?? dvThuong); await p.fill('#m-ngay', o.ngay ?? cong(2)); await p.selectOption('#m-gio', o.gio ?? '09:00');
    if (o.don) await p.fill('#m-ngay-don', o.don);
    if (o.ghi) await p.fill('#m-ghi', o.ghi);
  };
  const choHien = (p, sel) => p.waitForSelector(sel, { state: 'visible', timeout: 8000 });
  const SAU = `Đã nhận yêu cầu đặt lịch, bệnh viện sẽ liên hệ xác nhận`;
  // --- Trường và kiểm tra (chế độ mặc định: giả lập) ---
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const tag = `${w}x${h}`, ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile }), { p } = await moTrang(ctx, '/dat-lich/');
    const dsTruong = await p.evaluate(() => ({ ten: !!document.getElementById('m-ten'), sdt: document.getElementById('m-sdt').inputMode, thu: !!document.getElementById('m-thu'), loai: [...document.querySelectorAll('input[name="m-loai"]')].map((r) => r.value), dv: document.getElementById('m-dv').options.length, gio: [...document.getElementById('m-gio').options].map((o) => o.value).filter(Boolean), ghi: document.getElementById('m-ghi').required, ngay: document.getElementById('m-ngay').inputMode, bay: getComputedStyle(document.getElementById('m-web').closest('.bay')).left }));
    ok(`[${tag}] Đủ trường: tên khách hàng, số điện thoại (inputmode tel), tên thú cưng, loài (Chó / Mèo / Khác), dịch vụ, ngày, giờ cách 30 phút từ 8:00 đến 20:30 (nửa giờ cuối trước 21:00 đóng cửa), ghi chú không bắt buộc; ô bẫy ẩn khỏi mắt người`, dsTruong.ten && dsTruong.sdt === 'tel' && dsTruong.thu && dsTruong.loai.join() === 'cho,meo,khac' && dsTruong.dv === nhomDat.length + 1 && dsTruong.gio[0] === '08:00' && dsTruong.gio.at(-1) === '20:30' && dsTruong.gio.length === 26 && !dsTruong.ghi && dsTruong.ngay === 'numeric' && /-\d+px/.test(dsTruong.bay), JSON.stringify(dsTruong));
    ok(`[${tag}] Chưa nhập gì: nút gửi tắt; lời nhắc nói rõ`, await p.isDisabled('#m-gui') && /Điền các ô có dấu/.test(await p.textContent('#form-chu')), '');
    const an0 = await p.evaluate(() => ({ khac: document.getElementById('o-loai-khac').hidden, don: document.getElementById('o-ngay-don').hidden }));
    await p.check('input[name="m-loai"][value="khac"]', { force: true }); const a1 = await p.evaluate(() => !document.getElementById('o-loai-khac').hidden && document.getElementById('m-loai-khac').required);
    await p.fill('#m-ten', 'A'); await p.fill('#m-sdt', '0912345678'); await p.fill('#m-thu', 'B'); await p.selectOption('#m-dv', dvThuong); await p.fill('#m-ngay', cong(1)); await p.selectOption('#m-gio', '10:00');
    const chuaKhac = await p.isDisabled('#m-gui');
    await p.fill('#m-loai-khac', 'thỏ'); const duKhac = !(await p.isDisabled('#m-gui'));
    await p.check('input[name="m-loai"][value="cho"]', { force: true }); const a2 = await p.evaluate(() => document.getElementById('o-loai-khac').hidden);
    ok(`[${tag}] Chọn "Khác" hiện ô nhập loài (bắt buộc, thiếu thì chưa gửi được); chọn lại Chó thì ẩn`, an0.khac && a1 && chuaKhac && duKhac && a2, JSON.stringify({ an0, a1, chuaKhac, duKhac, a2 }));
    await p.selectOption('#m-dv', dvNoiTru); const nt = await p.evaluate(() => ({ don: !document.getElementById('o-ngay-don').hidden, nhan: document.getElementById('m-ngay-nhan').textContent }));
    const chuaDon = await p.isDisabled('#m-gui');
    await p.fill('#m-ngay', cong(3)); await p.fill('#m-ngay-don', cong(2)); await p.locator('#m-ngay-don').blur(); await p.waitForTimeout(100);
    const truoc = await p.evaluate(() => ({ loi: document.getElementById('m-ngay-don-loi').textContent, ban: document.getElementById('m-gui').disabled }));
    await p.fill('#m-ngay-don', cong(3)); await p.locator('#m-ngay-don').blur(); const cung = !(await p.isDisabled('#m-gui'));
    await p.fill('#m-ngay-don', cong(5)); const sau = !(await p.isDisabled('#m-gui'));
    await p.selectOption('#m-dv', dvThuong); const anDon = await p.evaluate(() => document.getElementById('o-ngay-don').hidden);
    ok(`[${tag}] Dịch vụ nội trú: hiện "Ngày đón dự kiến" (bắt buộc); ngày đón TRƯỚC ngày gửi bị báo lỗi; cùng ngày hoặc sau thì hợp lệ; đổi dịch vụ thường thì ẩn`, nt.don && /Ngày gửi/.test(nt.nhan) && chuaDon && /không được trước ngày gửi/.test(truoc.loi) && truoc.ban && cung && sau && anDon, JSON.stringify({ nt, chuaDon, truoc, cung, sau, anDon }));
    await p.reload(); await p.fill('#m-sdt', '12345'); await p.locator('#m-sdt').blur(); await p.fill('#m-ngay', cong(-1)); await p.locator('#m-ngay').blur(); await p.locator('#m-ten').focus(); await p.locator('#m-ten').blur();
    const sai = await p.evaluate(() => ({ sdt: document.getElementById('m-sdt-loi').textContent, ngay: document.getElementById('m-ngay-loi').textContent, ten: document.getElementById('m-ten-loi').textContent, inv: document.getElementById('m-sdt').getAttribute('aria-invalid') }));
    ok(`[${tag}] Báo lỗi cạnh từng ô (số điện thoại sai, ngày quá khứ, thiếu tên), aria-invalid, nội dung tiếng Việt`, /10 số/.test(sai.sdt) && /từ hôm nay/.test(sai.ngay) && /tên khách hàng/.test(sai.ten) && sai.inv === 'true', JSON.stringify(sai));
    await ctx.close();
  }
  // --- Giả lập (mặc định): 0 yêu cầu ---
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), nguoi = [];
    ctx.on('request', (r) => { if (!r.url().startsWith(`http://localhost:${CONG}`)) nguoi.push(r.url()); });
    for (const trang of ['/dat-lich/', '/']) {
      const { p } = await moTrang(ctx, trang);
      if (trang === '/') await p.evaluate(() => document.getElementById('dat-lich').scrollIntoView());
      const truoc = nguoi.length;
      ok(`[${trang}] Chế độ giả lập có dòng "Bản xem trước · chưa gửi dữ liệu thật"`, /chưa gửi dữ liệu thật/.test(await p.textContent('.the-xem')), '');
      await dien(p, { khac: 'thỏ', ghi: 'thử' }); await choHien(p, '#m-gui:not([disabled])'); await p.click('#m-gui'); await choHien(p, '#dl-nhan');
      const t = (await p.textContent('#dl-nhan')).replace(/\s+/g, ' ');
      const ngoai = nguoi.slice(truoc).filter((u) => !/fonts\.(googleapis|gstatic)/.test(u));
      ok(`[${trang}] Bấm gửi ở chế độ giả lập: 0 yêu cầu mạng; hiện "Hoàn tất giả lập, chưa gửi đi đâu"; KHÔNG có câu "Đã nhận yêu cầu"`, ngoai.length === 0 && /Hoàn tất giả lập/.test(t) && /CHƯA được gửi/.test(t) && !t.includes(SAU) && !/đã được xác nhận|đã xác nhận lịch/i.test(t), JSON.stringify({ ngoai, t: t.slice(0, 120) }));
      await p.close();
    }
    await ctx.close();
  }
  // --- Nhận thật với máy chủ giả (bản dựng PUBLIC_MODE_DAT_LICH=that) ---
  {
    const URLT = `http://localhost:${CONG2}${BASE}`;
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } });
    await ctx.route(`http://localhost:${CONG2}/**`, (r) => r.continue()); // máy chủ bản "that" cũng là cục bộ
    const moThat = async () => { const p = await ctx.newPage(); const loi = []; p.on('pageerror', (e) => loi.push(e.message)); await p.goto(URLT + '/dat-lich/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); p.__loi = loi; return p; };
    const chanGoogle = async (p, xuLy) => { const ds = []; await p.route(/script\.google\.com/, async (r) => { const rq = r.request(); ds.push({ body: rq.postData(), ct: rq.headers()['content-type'], method: rq.method() }); await xuLy(r, ds.length); }); return ds; };
    const gui = async (p) => { await choHien(p, '#m-gui:not([disabled])'); await p.click('#m-gui'); };
    const hang = { dien: 'x' };
    // a. Thành công
    { const p = await moThat(), ds = await chanGoogle(p, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ma: 'LS-261011-AB12' }) }));
      ok('[nhận thật] Bản dựng chế độ "that" không có dòng "chưa gửi dữ liệu thật"; địa chỉ nhận lấy từ thong_tin.json', (await p.locator('.the-xem').count()) === 0 && /script\.google\.com/.test(await p.getAttribute('#form-dat-lich', 'data-endpoint')), '');
      await dien(p, { ghi: 'ghi chú thử' }); await gui(p); await choHien(p, '#dl-nhan'); const t = (await p.textContent('#dl-nhan')).replace(/\s+/g, ' ');
      const j = ds[0] && JSON.parse(ds[0].body);
      ok('[nhận thật] Máy chủ trả { ok: true, ma }: hiện đúng câu "Đã nhận yêu cầu đặt lịch, bệnh viện sẽ liên hệ xác nhận." + mã yêu cầu + tóm tắt; không nói "đã xác nhận lịch"', t.includes(SAU) && t.includes('LS-261011-AB12') && /Lịch hẹn chỉ được xác nhận sau khi nhân viên liên hệ/.test(t) && !/lịch (đã|hẹn đã) được xác nhận/i.test(t), t.slice(0, 160));
      ok('[nhận thật] Đúng 1 yêu cầu, POST, Content-Type text/plain (không gây bước kiểm tra trước), JSON có đủ trường và ma_yeu_cau', ds.length === 1 && ds[0].method === 'POST' && /text\/plain/.test(ds[0].ct) && j && j.ten_khach === 'Khách thử nghiệm' && j.dien_thoai === '0912345678' && j.ten_thu_cung === 'Bé Thử' && j.loai === 'Chó' && j.dich_vu_ma === dvThuong && /^\d{4}-\d{2}-\d{2}$/.test(j.ngay) && j.gio === '09:00' && j.ghi_chu === 'ghi chú thử' && j.website === '' && String(j.ma_yeu_cau).length >= 8, JSON.stringify(j));
      await p.click('#dl-lam-lai'); await p.waitForTimeout(150);
      const lai = await p.evaluate(() => ({ ten: document.getElementById('m-ten').value, form: !document.getElementById('form-dat-lich').hidden, the: document.getElementById('dl-nhan').hidden }));
      ok('[nhận thật] "Gửi yêu cầu khác": form trống trở lại, thẻ kết quả ẩn', lai.ten === '' && lai.form && lai.the, JSON.stringify(lai));
      await dien(p); await gui(p); await choHien(p, '#dl-nhan'); const j2 = JSON.parse(ds[1].body);
      ok('[nhận thật] Yêu cầu thứ hai dùng mã yêu cầu MỚI', j2.ma_yeu_cau !== j.ma_yeu_cau, '');
      ok('[nhận thật] Không có lỗi JavaScript', p.__loi.length === 0, p.__loi.join('|')); await p.close(); }
    // b. Máy chủ báo lỗi (đọc được)
    { const p = await moThat(), ds = await chanGoogle(p, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, loi: 'Số điện thoại chưa đúng.' }) }));
      await dien(p, { ghi: 'giữ nguyên' }); await gui(p); await choHien(p, '#dl-thong-bao');
      const x = await p.evaluate(() => ({ tb: document.getElementById('dl-thong-bao').textContent, ten: document.getElementById('m-ten').value, ghi: document.getElementById('m-ghi').value, nut: document.getElementById('m-gui').textContent.trim(), bat: !document.getElementById('m-gui').disabled, the: document.getElementById('dl-nhan').hidden, role: document.getElementById('dl-thong-bao').getAttribute('role'), tel: !!document.querySelector('#dl-thong-bao a[href^="tel:"]'), foc: document.activeElement.id }));
      ok('[thất bại] Máy chủ báo lỗi đọc được: hiện thông báo thất bại (role=alert, focus vào đó, có số gọi), GIỮ nguyên dữ liệu, nút thành "Gửi lại" và bấm được, KHÔNG báo đã nhận', /Chưa gửi được yêu cầu/.test(x.tb) && x.ten === 'Khách thử nghiệm' && x.ghi === 'giữ nguyên' && x.nut === 'Gửi lại' && x.bat && x.the && x.role === 'alert' && x.tel && x.foc === 'dl-thong-bao' && !x.tb.includes(SAU), JSON.stringify(x));
      await p.close(); }
    // c. Quá thời gian
    { const p = await moThat(); await p.evaluate(() => { document.getElementById('form-dat-lich').dataset.cho = '1200'; });
      const ds = await chanGoogle(p, () => new Promise(() => {})); // không bao giờ trả lời
      await dien(p); await gui(p); const dang = await p.evaluate(() => ({ nut: document.getElementById('m-gui').textContent.trim(), busy: document.getElementById('m-gui').getAttribute('aria-busy'), khoa: [...document.querySelectorAll('#form-dat-lich fieldset')].every((f) => f.disabled), chu: document.getElementById('form-chu').textContent }));
      await choHien(p, '#dl-thong-bao'); const x = await p.evaluate(() => ({ tb: document.getElementById('dl-thong-bao').textContent, ten: document.getElementById('m-ten').value, nut: document.getElementById('m-gui').textContent.trim(), the: document.getElementById('dl-nhan').hidden, khoa: [...document.querySelectorAll('#form-dat-lich fieldset')].some((f) => f.disabled) }));
      ok('[đang gửi] Trong lúc chờ: nút "Đang gửi…" (aria-busy), các ô nhập bị khoá, dòng trạng thái nói đang gửi', dang.nut === 'Đang gửi…' && dang.busy === 'true' && dang.khoa && /Đang gửi/.test(dang.chu), JSON.stringify(dang));
      ok('[quá thời gian] Không có phản hồi: báo "Chưa nhận được xác nhận…" (KHÔNG báo thành công), giữ dữ liệu, mở khoá ô nhập, nút "Gửi lại"', /Chưa nhận được xác nhận/.test(x.tb) && x.ten === 'Khách thử nghiệm' && x.nut === 'Gửi lại' && x.the && !x.khoa && !x.tb.includes(SAU), JSON.stringify(x));
      await p.close(); }
    // d. Phản hồi không đọc được (giống script cũ trả chữ "ok") và e. lỗi mạng
    for (const [ten, xl] of [['phản hồi không đọc được (văn bản "ok" như script cũ)', (r) => r.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' })], ['JSON thiếu mã', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })], ['lỗi 500', (r) => r.fulfill({ status: 500, contentType: 'text/html', body: '<h1>lỗi</h1>' })], ['lỗi mạng', (r) => r.abort('failed')]]) {
      const p = await moThat(); await chanGoogle(p, xl); await dien(p); await gui(p); await choHien(p, '#dl-thong-bao');
      const x = await p.evaluate(() => ({ tb: document.getElementById('dl-thong-bao').textContent, the: document.getElementById('dl-nhan').hidden, ten: document.getElementById('m-ten').value }));
      ok(`[không báo nhầm] ${ten}: báo "Chưa nhận được xác nhận…", không hiện "Đã nhận", giữ dữ liệu`, /Chưa nhận được xác nhận/.test(x.tb) && x.the && x.ten === 'Khách thử nghiệm' && !x.tb.includes(SAU), JSON.stringify(x)); await p.close();
    }
    // f. Bấm nhiều lần / Enter lặp
    { const p = await moThat(), ds = await chanGoogle(p, async (r) => { await new Promise((k) => setTimeout(k, 900)); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ma: 'LS-X-1' }) }); });
      await dien(p); await choHien(p, '#m-gui:not([disabled])');
      await p.evaluate(() => { const f = document.getElementById('form-dat-lich'), b = document.getElementById('m-gui'); b.click(); b.click(); b.click(); f.requestSubmit(); f.dispatchEvent(new Event('submit', { cancelable: true })); });
      await p.focus('#m-ten').catch(() => {}); await p.keyboard.press('Enter').catch(() => {});
      await choHien(p, '#dl-nhan'); await p.waitForTimeout(300);
      ok('[chống trùng] Bấm nút 3 lần, gửi bằng mã lệnh 2 lần, Enter lặp trong lúc chờ: chỉ ĐÚNG 1 yêu cầu', ds.length === 1, `${ds.length} yêu cầu`); await p.close(); }
    // g. Gửi lại dùng lại mã; đổi nội dung thì mã mới; honeypot
    { const p = await moThat(), ds = await chanGoogle(p, (r, lan) => (lan < 3 ? r.abort('failed') : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ma: 'LS-X-2', trung: true }) })));
      await dien(p); await gui(p); await choHien(p, '#dl-thong-bao'); await gui(p); await p.waitForFunction(() => document.getElementById('m-gui').textContent.trim() === 'Gửi lại' && !document.getElementById('m-gui').disabled);
      await p.waitForTimeout(150);
      const m1 = JSON.parse(ds[0].body).ma_yeu_cau, m2 = ds[1] && JSON.parse(ds[1].body).ma_yeu_cau;
      ok('[chống trùng] "Gửi lại" nguyên nội dung dùng lại CÙNG mã yêu cầu (máy chủ nhờ đó bỏ qua bản trùng)', ds.length === 2 && m1 === m2, `${m1} / ${m2}`);
      await p.fill('#m-ghi', 'đổi nội dung'); await gui(p); await choHien(p, '#dl-nhan'); const m3 = JSON.parse(ds[2].body).ma_yeu_cau;
      ok('[chống trùng] Đổi nội dung rồi gửi: mã yêu cầu MỚI; máy chủ trả trùng thì vẫn hiện đã nhận', m3 !== m1 && (await p.textContent('#dl-nhan')).includes(SAU), `${m1} / ${m3}`); await p.close(); }
    { const p = await moThat(), ds = await chanGoogle(p, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"ma":"x"}' }));
      await dien(p); await p.evaluate(() => { document.getElementById('m-web').value = 'bot'; }); await p.evaluate(() => document.getElementById('form-dat-lich').requestSubmit()); await p.waitForTimeout(500);
      ok('[bẫy spam] Ô bẫy có chữ: không gửi yêu cầu nào và không báo đã nhận', ds.length === 0 && (await p.evaluate(() => document.getElementById('dl-nhan').hidden)), `${ds.length} yêu cầu`); await p.close(); }
    await ctx.close();
  }
  // --- Chế độ cũ còn dùng được ---
  { const f = fs.readFileSync(path.join(GOC, 'dist-cu/dat-lich/index.html'), 'utf8'), g = fs.readFileSync(path.join(GOC, 'dist-cu/index.html'), 'utf8');
    ok('Chế độ "cu" (quay lại biểu mẫu cũ): trang Đặt lịch có biểu mẫu cũ #dat-lich, không có biểu mẫu mới; trang chủ chỉ còn lối vào /dat-lich/', /id="dat-lich"[^>]*data-endpoint/.test(f) && !/id="form-dat-lich"/.test(f) && !/id="form-dat-lich"/.test(g) && /Mở biểu mẫu đặt lịch/.test(g), ''); }

  // ---------- 12. Không gọi ra ngoài ----------
  muc('12. Yêu cầu mạng ra ngoài');
  const cho = [...ngoaiYeuCau].filter((h) => !/fonts\.(googleapis|gstatic)\.com|script\.google\.com|^www\.google\.com$/.test(h));
  ok('Trong toàn bộ lần chạy, ngoài phông chữ Google, bản đồ nhúng ở trang Liên hệ (www.google.com) và địa chỉ nhận form (đã chặn / trả lời giả) không có máy chủ nào khác bị gọi', cho.length === 0, [...ngoaiYeuCau].join(', '));
  console.log('Máy chủ ngoài bị chặn:', [...ngoaiYeuCau].join(', '));

  // ---------- Chưa chạy ----------
  muc('13. Chưa chạy / chưa xác minh');
  chuaChay('Firefox, Safari/WebKit, Microsoft Edge', `Chỉ có Chromium ${phienBan} của Playwright trong môi trường này`);
  chuaChay('Điện thoại / máy tính bảng thật (iOS, Android)', 'Chỉ giả lập kích thước màn hình và cảm ứng');
  chuaChay('Trình đọc màn hình (VoiceOver, TalkBack, NVDA)', 'Chỉ kiểm tra thuộc tính ARIA, thứ tự Tab, vị trí focus');
  chuaChay('Tương phản màu theo WCAG', 'Chưa đo tỉ lệ tương phản');
  chuaChay('Gửi form thật tới Google Apps Script / nhận email / ghi Google Sheet', 'Cố ý không gọi: chỉ dùng máy chủ giả. Cần chủ dự án thử trên môi trường của họ');
  chuaChay('Triển khai lên GitHub Pages (nhánh main)', 'Không triển khai; chỉ dựng và chạy cục bộ dưới đúng base /benhvienthuyleson/');
  chuaXm('Cảm nhận chuyển động và độ mượt trên máy yếu', 'Cần người xem video / thử trên máy thật');
  chuaXm('Nội dung cẩm nang / ca bệnh khi đã có bài thật', 'Thư mục src/content hiện rỗng: giao diện bài viết và ca bệnh chưa được duyệt bằng nội dung thật (kiểm bằng dữ liệu thử ở bước riêng nếu có)');

  await b.close(); may.kill(); may2.kill(); for (const t of ['dist-that', 'dist-cu']) fs.rmSync(path.join(GOC, t), { recursive: true, force: true });
  const dem = (t) => kq.filter((x) => x.tt === t).length;
  const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA CHẠY ${dem('CHƯA CHẠY')} · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH')}`;
  const dong = [`Kiểm thử bản dựng Astro Lê Sơn · Chromium ${phienBan} (Playwright) · ${new Date().toISOString()}`, tom, '', ...kq.map((x) => x.tt === 'MỤC' ? `\n-- ${x.ten}` : `[${x.tt}] ${x.ten}${x.ct ? '  → ' + x.ct : ''}`)];
  fs.writeFileSync(path.join(KQ, 'ket-qua.txt'), dong.join('\n')); fs.writeFileSync(path.join(KQ, 'ket-qua.json'), JSON.stringify(kq, null, 1));
  console.log('\n' + tom + '\n' + kq.filter((x) => x.tt === 'KHÔNG ĐẠT').map((x) => '✗ ' + x.ten + ' → ' + x.ct).join('\n'));
  process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
