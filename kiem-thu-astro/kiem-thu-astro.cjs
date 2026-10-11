// Kiểm thử bản dựng Astro của website Lê Sơn (giao diện mới). Chạy sau `npm run build`:
//   NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-astro.cjs        (cần Playwright; không thêm vào package.json của website)
// Bốn trạng thái: ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH. Chỉ ĐẠT mới tính là đạt. Chỉ Chromium của Playwright được chạy.
// Không gửi dữ liệu thật: mọi yêu cầu ra ngoài máy chủ cục bộ đều bị chặn; yêu cầu tới Google Apps Script chỉ được ghi nhận và trả lời giả.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const GOC = path.resolve(__dirname, '..'), DIST = path.join(GOC, 'dist'), BASE = '/benhvienthuyleson';
const CONG = 4399, URLG = `http://localhost:${CONG}${BASE}`;
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
    const re = /\s(?:href|src|action|content)=["']([^"']+)["']|url\(["']?([^"')]+)/g; let m;
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
  const may = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const ngoaiBuild = kiemLienKet(); kiemDuLieu();
  const b = await chromium.launch();
  const phienBan = b.version();
  const ngoaiYeuCau = new Set(); let guiGoogle = 0;
  const ctxMoi = async (tuy = {}) => {
    const ctx = await b.newContext({ locale: 'vi-VN', ...tuy });
    await ctx.route('**/*', (r) => {
      const u = r.request().url();
      if (u.startsWith(`http://localhost:${CONG}`)) return r.continue();
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
    for (const ma of ['cn', 'dn']) await p.evaluate((m) => document.getElementById(m + '-dai').scrollIntoView({ behavior: 'instant', block: 'center' }), ma);
    await p.mouse.move(2, 2);
    const kd = { cn: await tt('cn'), dn: await tt('dn') }; await p.waitForTimeout(1500);
    ok(`[${tag}] Lúc đầu cả hai dải tự trượt (nút "Tạm dừng")`, (await tt('cn')).x !== kd.cn.x && (await x('dn')) !== kd.dn.x && (await p.textContent('#cn-dung')).includes('Tạm dừng'), '');
    await p.click('#cn-dung'); const t0 = await x('cn'); await p.waitForTimeout(900);
    ok(`[${tag}] Bấm Tạm dừng: dải dừng, nút thành "Tiếp tục" (aria-pressed, title)`, (await x('cn')) === t0 && (await p.getAttribute('#cn-dung', 'aria-pressed')) === 'true' && (await p.getAttribute('#cn-dung', 'title')) === 'Tiếp tục', '');
    await p.click('#cn-dung');
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(600);
    const g0 = { cn: await x('cn'), dn: await x('dn') }; await p.waitForTimeout(1500);
    const gm = await p.evaluate(() => ({ cn: document.getElementById('cn-dung').getAttribute('aria-pressed'), dn: document.getElementById('dn-dung').getAttribute('aria-pressed'), tt: [...document.querySelectorAll('[data-nut-trang-tri] .tt-trang-thai')].map((e) => e.textContent), lop: document.documentElement.classList.contains('tat-trang-tri') }));
    ok(`[${tag}] Bật giảm chuyển động khi đang xem: cả hai dải đứng yên, nút "Tiếp tục", trang trí tắt ("Đang tắt theo cài đặt máy")`, g0.cn === (await x('cn')) && g0.dn === (await x('dn')) && gm.cn === 'true' && gm.dn === 'true' && gm.lop && gm.tt.every((s) => /theo cài đặt máy/.test(s)), JSON.stringify(gm));
    const truoc = (await tt('cn')).thuTu[0]; await p.click('#cn-sau'); await p.waitForTimeout(200);
    ok(`[${tag}] Đang giảm chuyển động: nút Sau vẫn chuyển đúng một thẻ`, (await tt('cn')).thuTu[1] === truoc || (await tt('cn')).thuTu[0] !== truoc, '');
    await p.emulateMedia({ reducedMotion: 'no-preference' }); await p.waitForTimeout(500);
    const b0 = { cn: await x('cn'), dn: await x('dn') }; await p.waitForTimeout(1500);
    ok(`[${tag}] Tắt giảm chuyển động giữa chừng: hai dải chạy lại`, (await x('cn')) !== b0.cn && (await x('dn')) !== b0.dn, '');
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

  // ---------- 11. Form đặt lịch hiện tại: chưa đổi hành vi ----------
  muc('11. Form đặt lịch hiện tại (giữ nguyên hành vi ở giai đoạn này; không gửi dữ liệu thật)');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), { p } = await moTrang(ctx, '/dat-lich/');
    const g0 = guiGoogle;
    await p.click('#gui'); await p.waitForTimeout(250);
    const loi = await p.evaluate(() => [...document.querySelectorAll('.loi:not([hidden])')].length);
    ok('Gửi form trống: hiện lỗi từng ô và KHÔNG gửi yêu cầu nào', loi >= 2 && guiGoogle === g0, `${loi} lỗi, ${guiGoogle - g0} yêu cầu`);
    await p.fill('#f-ten', 'Người thử nghiệm'); await p.fill('#f-sdt', '0912345678');
    const nhom = await p.evaluate(() => { const s = document.getElementById('f-nhom'); const o = [...s.options].find((x) => /kham/.test(x.dataset.id || '')) || s.options[1]; return o.value; });
    await p.selectOption('#f-nhom', nhom); await p.waitForTimeout(100);
    const dv = await p.evaluate(() => { const s = document.getElementById('f-dv'); return [...s.options].find((x) => x.value)?.value; });
    await p.selectOption('#f-dv', dv); await p.waitForTimeout(100);
    if (await p.isVisible('#f-kg')) await p.selectOption('#f-kg', { index: 1 });
    const ngay = new Date(Date.now() + 7 * 3600e3 + 2 * 86400e3).toISOString().slice(0, 10);
    await p.fill('#f-ngay', ngay); await p.fill('#f-gio', '10:00');
    await p.click('#gui'); await p.waitForTimeout(900);
    const sau = await p.evaluate(() => ({ ok: !document.getElementById('ok').hidden, loiGui: document.getElementById('loi-gui').textContent, loiHien: [...document.querySelectorAll('.loi:not([hidden])')].map((e) => e.id) }));
    ok('Điền đúng rồi gửi (máy chủ nhận được giả lập): có đúng 1 yêu cầu tới địa chỉ nhận, hiện thông báo đã gửi', guiGoogle - g0 === 1 && sau.ok, JSON.stringify({ yeuCau: guiGoogle - g0, ...sau }));
    await ctx.close();
  }

  // ---------- 12. Không gọi ra ngoài ----------
  muc('12. Yêu cầu mạng ra ngoài');
  const cho = [...ngoaiYeuCau].filter((h) => !/fonts\.(googleapis|gstatic)\.com|script\.google\.com/.test(h));
  ok('Trong toàn bộ lần chạy, ngoài phông chữ Google và địa chỉ nhận form (đã chặn / trả lời giả) không có máy chủ nào khác bị gọi', cho.length === 0, [...ngoaiYeuCau].join(', '));
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

  await b.close(); may.kill();
  const dem = (t) => kq.filter((x) => x.tt === t).length;
  const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA CHẠY ${dem('CHƯA CHẠY')} · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH')}`;
  const dong = [`Kiểm thử bản dựng Astro Lê Sơn · Chromium ${phienBan} (Playwright) · ${new Date().toISOString()}`, tom, '', ...kq.map((x) => x.tt === 'MỤC' ? `\n-- ${x.ten}` : `[${x.tt}] ${x.ten}${x.ct ? '  → ' + x.ct : ''}`)];
  fs.writeFileSync(path.join(KQ, 'ket-qua.txt'), dong.join('\n')); fs.writeFileSync(path.join(KQ, 'ket-qua.json'), JSON.stringify(kq, null, 1));
  console.log('\n' + tom + '\n' + kq.filter((x) => x.tt === 'KHÔNG ĐẠT').map((x) => '✗ ' + x.ten + ' → ' + x.ct).join('\n'));
  process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
