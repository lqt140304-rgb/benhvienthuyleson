// Kiểm thử riêng cho thiết kế R3.6 (chữ tiêu đề Playfair Display + chuyển động tinh tế). Chạy sau `npm run build`:
//   PHONG_CUC_BO=<thư mục> NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-r36.cjs
// PHONG_CUC_BO (không bắt buộc): thư mục chứa hai gói @fontsource/playfair-display và @fontsource/be-vietnam-pro đã giải nén
//   (<thư mục>/fontsource-playfair-display/package, <thư mục>/fontsource-be-vietnam-pro/package; lấy bằng `npm pack` rồi `tar xzf`).
//   Có thì yêu cầu tới Google Fonts được trả bằng tệp phông cục bộ (trễ 300 ms để giống mạng thật, phông "swap" sau khi trang đã hiện).
//   Không có thì phông Google bị chặn: chỉ kiểm được khai báo phông, còn phông thật vẽ ra và dịch bố cục do đổi phông là CHƯA XÁC MINH.
// COMMIT_TRUOC (mặc định 422c7a4, bản ngay trước R3.6): dựng bản đó vào thư mục tạm để so dịch bố cục (CLS) trước / sau.
// Bốn trạng thái: ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH. Chỉ Chromium của Playwright. Không gọi mạng ra ngoài.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const GOC = path.resolve(__dirname, '..'), BASE = '/benhvienthuyleson';
const CONG = 4389, CONG_TRUOC = 4388, URL_SAU = `http://localhost:${CONG}${BASE}`, URL_TRUOC = `http://localhost:${CONG_TRUOC}${BASE}`;
const COMMIT_TRUOC = process.env.COMMIT_TRUOC || '422c7a4';
const PHONG = process.env.PHONG_CUC_BO ? path.resolve(process.env.PHONG_CUC_BO) : null;
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });
const TRANG = ['/', '/bang-gia/', '/dich-vu/', '/gioi-thieu/', '/lien-he/', '/dat-lich/', '/nhan-vien/', '/tu-van/', '/tu-van/cho/', '/tu-van/meo/', '/nhat-ky-ca-benh/'];
const MAX_TROI = 12; // hoạ tiết hero trôi tối đa 12px

const kq = [];
const ok = (ten, dieuKien, ct = '') => kq.push({ tt: dieuKien ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 500) });
const chuaChay = (ten, ly) => kq.push({ tt: 'CHƯA CHẠY', ten, ct: ly });
const chuaXm = (ten, ly) => kq.push({ tt: 'CHƯA XÁC MINH', ten, ct: ly });
const muc = (t) => { kq.push({ tt: 'MỤC', ten: t, ct: '' }); console.log('\n== ' + t); };

// ---------- Phông cục bộ thay Google Fonts ----------
let cssPhong = null; const tepPhong = new Map();
if (PHONG) {
  const goi = [['fontsource-playfair-display', ['600', '700']], ['fontsource-be-vietnam-pro', ['400', '500', '600']]];
  const phan = [];
  for (const [g, ws] of goi) for (const w of ws) {
    const thu = path.join(PHONG, g, 'package'), f = path.join(thu, w + '.css');
    if (!fs.existsSync(f)) { cssPhong = null; break; }
    phan.push(fs.readFileSync(f, 'utf8').replace(/url\(\.\/files\/([^)]+)\)/g, (m, ten) => { tepPhong.set(ten, path.join(thu, 'files', ten)); return `url(https://fonts.gstatic.com/cuc-bo/${ten})`; }));
    cssPhong = phan.join('\n');
  }
}

// ---------- Dựng bản trước R3.6 để so CLS ----------
function dungBanTruoc() {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'r36-truoc-'));
  try {
    cp.execSync(`git worktree add --detach "${tam}/ma" ${COMMIT_TRUOC}`, { cwd: GOC, stdio: 'ignore' });
    fs.symlinkSync(path.join(GOC, 'node_modules'), path.join(tam, 'ma', 'node_modules'));
    cp.execSync('npx astro build', { cwd: path.join(tam, 'ma'), stdio: 'ignore' });
    return { dist: path.join(tam, 'ma', 'dist'), don: () => { try { cp.execSync(`git worktree remove --force "${tam}/ma"`, { cwd: GOC, stdio: 'ignore' }); } catch { /* bỏ qua */ } fs.rmSync(tam, { recursive: true, force: true }); } };
  } catch (e) {
    try { cp.execSync(`git worktree remove --force "${tam}/ma"`, { cwd: GOC, stdio: 'ignore' }); } catch { /* bỏ qua */ }
    fs.rmSync(tam, { recursive: true, force: true });
    return { loi: e.message.split('\n')[0] };
  }
}

(async () => {
  if (!fs.existsSync(path.join(GOC, 'dist', 'index.html'))) { console.error('Chưa có dist: chạy `npm run build` trước.'); process.exit(2); }
  const may = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG)], { stdio: 'ignore' });
  const truoc = dungBanTruoc();
  const may2 = truoc.dist ? cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG_TRUOC)], { stdio: 'ignore', env: { ...process.env, DIST: truoc.dist } }) : null;
  await new Promise((r) => setTimeout(r, 800));
  const b = await chromium.launch(), phienBan = b.version();
  const ngoai = new Set(); let soPhong = 0;
  const ctxMoi = async (tuy = {}) => {
    const ctx = await b.newContext({ locale: 'vi-VN', ...tuy });
    await ctx.route('**/*', async (r) => {
      const u = r.request().url();
      if (u.startsWith(`http://localhost:${CONG}`) || u.startsWith(`http://localhost:${CONG_TRUOC}`)) return r.continue();
      if (cssPhong && /^https:\/\/fonts\.googleapis\.com\/css2/.test(u)) return r.fulfill({ status: 200, contentType: 'text/css', headers: { 'access-control-allow-origin': '*' }, body: cssPhong });
      const m = /^https:\/\/fonts\.gstatic\.com\/cuc-bo\/(.+)$/.exec(u);
      if (cssPhong && m && tepPhong.has(m[1])) { soPhong++; await new Promise((x) => setTimeout(x, 300)); return r.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(tepPhong.get(m[1])) }); }
      ngoai.add(new URL(u).host); return r.abort();
    });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('cam-da-chao', '1'); } catch (e) {} });
    return ctx;
  };
  const mo = async (ctx, duong, goc = URL_SAU) => { const p = await ctx.newPage(); await p.goto(goc + duong, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); return p; };

  // ---------- 1. Chữ: h1/h2 Playfair Display, còn lại Be Vietnam Pro ----------
  muc('1. Chữ tiêu đề: h1/h2 dùng Playfair Display; h3/h4, nhãn, nút, nội dung giữ Be Vietnam Pro');
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const tag = `${w}x${h}`, ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    const saiLon = [], saiNho = []; let demLon = 0, demNho = 0;
    for (const t of TRANG) {
      const p = await mo(ctx, t);
      const x = await p.evaluate(() => {
        const dau = (e) => getComputedStyle(e).fontFamily.split(',')[0].trim().replace(/["']/g, '');
        const thay = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.textContent.trim(); };
        const lon = [...document.querySelectorAll('h1, h2')].filter(thay), nho = [...document.querySelectorAll('h3, h4, p, label, button, .nut, .nhan, input, select, textarea, li')].filter(thay);
        return { lon: lon.length, nho: nho.length, saiLon: lon.filter((e) => dau(e) !== 'Playfair Display').map((e) => e.tagName + '.' + e.className + '=' + dau(e)), saiNho: nho.filter((e) => dau(e) !== 'Be Vietnam Pro' && !e.closest('h1, h2')).map((e) => e.tagName + '.' + e.className + '=' + dau(e)) };
      });
      demLon += x.lon; demNho += x.nho;
      x.saiLon.forEach((s) => saiLon.push(t + ' ' + s)); x.saiNho.forEach((s) => saiNho.push(t + ' ' + s));
      await p.close();
    }
    ok(`${tag}: ${demLon} tiêu đề h1/h2 hiển thị trên ${TRANG.length} trang đều khai báo Playfair Display đầu tiên`, demLon > 0 && saiLon.length === 0, saiLon.slice(0, 6).join(' | '));
    ok(`${tag}: ${demNho} phần tử h3/h4, đoạn văn, nhãn, nút, ô nhập, mục danh sách (ngoài h1/h2) đều khai báo Be Vietnam Pro đầu tiên`, demNho > 0 && saiNho.length === 0, saiNho.slice(0, 6).join(' | '));
    await ctx.close();
  }
  // Phông thật được vẽ ra (kể cả dấu tiếng Việt), đo bằng DevTools Protocol CSS.getPlatformFontsForNode
  if (!cssPhong) chuaXm('Phông Playfair Display / Be Vietnam Pro thật sự được vẽ ra, đủ dấu tiếng Việt', 'Không có PHONG_CUC_BO và Google Fonts bị chặn trong môi trường này: chỉ kiểm được khai báo CSS');
  else {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), sai = [];
    for (const t of ['/', '/bang-gia/', '/dat-lich/', '/gioi-thieu/']) {
      const p = await mo(ctx, t), cdp = await ctx.newCDPSession(p);
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      for (const [chon, mong] of [['h1', 'Playfair Display'], ['h2', 'Playfair Display'], ['h3', 'Be Vietnam Pro'], ['p', 'Be Vietnam Pro']]) {
        const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: `main ${chon}` });
        for (const id of nodeIds.slice(0, 3)) {
          const { model } = await cdp.send('DOM.getBoxModel', { nodeId: id }).catch(() => ({}));
          if (!model || !model.width) continue;
          // phông vẽ của nút văn bản con
          const { node } = await cdp.send('DOM.describeNode', { nodeId: id, depth: 1 });
          const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: id });
          const ten = fonts.map((f) => `${f.familyName}:${f.glyphCount}`), khac = fonts.filter((f) => !f.familyName.startsWith(mong)); // tên phông vẽ có thể kèm độ đậm, vd "Be Vietnam Pro SemiBold"
          if (!fonts.length && (node.children || []).some((c) => c.nodeType === 3 && c.nodeValue.trim())) sai.push(`${t} ${chon}: không có phông`);
          if (khac.length) sai.push(`${t} ${chon} cần ${mong}, được ${ten.join(', ')}`);
        }
      }
      await p.close();
    }
    ok('Phông vẽ thật (CSS.getPlatformFontsForNode, phông cục bộ thay Google Fonts) ở 4 trang: h1/h2 chỉ Playfair Display, h3/đoạn văn chỉ Be Vietnam Pro, không ký tự nào (kể cả dấu tiếng Việt) rơi sang phông dự phòng', sai.length === 0, sai.slice(0, 6).join(' | '));
    await ctx.close();
  }

  // ---------- 2. Giảm chuyển động / tắt hiệu ứng trang trí ----------
  muc('2. Giảm chuyển động và nút "Hiệu ứng trang trí" tắt các chuyển động R3.6');
  const R36 = ['r36-len', 'r36-troi'];
  const doc = (p) => p.evaluate((R36) => {
    const an = document.getAnimations().filter((a) => a.playState === 'running' || a.playState === 'pending');
    const r = (a) => a.animationName || (a.transitionProperty ? 'transition:' + a.transitionProperty : 'khác');
    const hero = document.querySelector('.hero');
    const tt = [...document.querySelectorAll('.hero .hoa-tiet')].map((e) => getComputedStyle(e).translate);
    const nut = document.querySelector('.nut-chinh'), sau = nut && getComputedStyle(nut, '::after');
    return {
      coHU: document.documentElement.classList.contains('co-hieu-ung'), tat: document.documentElement.classList.contains('tat-trang-tri'),
      r36: an.filter((a) => R36.includes(a.animationName)).map((a) => a.animationName + '@' + (a.effect && a.effect.target ? a.effect.target.className : '')),
      vohan: an.filter((a) => a.effect && a.effect.getComputedTiming().iterations === Infinity && a.effect.getComputedTiming().duration > 1).map(r),
      anHien: [...document.querySelectorAll('[data-hien]')].filter((e) => +getComputedStyle(e).opacity < 1).length,
      tt, py: hero && hero.style.getPropertyValue('--py'), anhLuot: sau ? sau.content : 'không có nút',
    };
  }, R36);
  {
    // a) Máy bật giảm chuyển động từ đầu
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p = await mo(ctx, '/');
    await p.waitForTimeout(300);
    const x0 = await doc(p);
    await p.mouse.wheel(0, 500); await p.waitForTimeout(400); await p.hover('.nut-chinh');
    const x1 = await doc(p);
    ok('Bật giảm chuyển động từ đầu: không gắn html.co-hieu-ung, không chạy r36-len / r36-troi, không có chuyển động lặp vô hạn, mọi thẻ [data-hien] hiện sẵn', !x0.coHU && x0.r36.length === 0 && x0.vohan.length === 0 && x0.anHien === 0, JSON.stringify(x0));
    ok('Bật giảm chuyển động từ đầu: cuộn 500px thì hoạ tiết hero không trôi (translate none, không đặt --py); rê chuột nút chính không có ánh lướt', x1.tt.every((v) => v === 'none') && !x1.py && x1.anhLuot === 'none' && x1.r36.length === 0, JSON.stringify(x1));
    await ctx.close();
  }
  {
    // b) Đổi sang giảm chuyển động giữa chừng
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    await p.waitForTimeout(1600);
    const x0 = await doc(p);
    ok('Kiểm chứng điều kiện thử: khi KHÔNG giảm chuyển động, trang chủ có html.co-hieu-ung và thẻ "Chẩn đoán" đang lơ lửng (r36-troi)', x0.coHU && x0.r36.some((s) => s.startsWith('r36-troi')), JSON.stringify(x0.r36));
    await p.mouse.wheel(0, 400); await p.waitForTimeout(400);
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(400);
    await p.mouse.wheel(0, 200); await p.waitForTimeout(400);
    const x1 = await doc(p);
    ok('Đổi sang giảm chuyển động giữa chừng: r36-troi và mọi chuyển động lặp vô hạn dừng; hoạ tiết hero về vị trí gốc (translate none)', x1.r36.length === 0 && x1.vohan.length === 0 && x1.tt.every((v) => v === 'none'), JSON.stringify(x1));
    await ctx.close();
  }
  {
    // c) Người dùng tắt "Hiệu ứng trang trí"
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    await p.waitForTimeout(1600); await p.click('.hero [data-nut-trang-tri]'); await p.waitForTimeout(300);
    await p.mouse.wheel(0, 500); await p.waitForTimeout(400);
    const x = await doc(p);
    const dung = await p.evaluate(() => document.getAnimations().filter((a) => a.animationName === 'r36-troi').map((a) => a.playState));
    ok('Tắt "Hiệu ứng trang trí": html.tat-trang-tri; thẻ "Chẩn đoán" ngừng lơ lửng (r36-troi tạm dừng); cuộn 500px hoạ tiết hero vẫn ở vị trí gốc', x.tat && dung.every((s) => s === 'paused') && x.tt.every((v) => v === 'none'), JSON.stringify({ tat: x.tat, r36troi: dung, tt: x.tt, py: x.py }));
    await ctx.close();
  }

  // ---------- 3. Hoạ tiết hero trôi tối đa 12px, chỉ máy tính có chuột ----------
  muc(`3. Hoạ tiết hero trôi theo cuộn: tối đa ${MAX_TROI}px, chỉ máy tính có chuột (≥ 1024px)`);
  const doTroi = async (p) => {
    const cao = await p.evaluate(() => document.documentElement.scrollHeight), dich = [];
    let lonNhat = 0, pyLon = 0;
    for (let y = 0; y <= cao; y += 120) {
      await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(60);
      const x = await p.evaluate(() => ({ py: parseFloat(document.querySelector('.hero').style.getPropertyValue('--py')) || 0, tt: [...document.querySelectorAll('.hero .hoa-tiet')].map((e) => { const v = getComputedStyle(e).translate; return v === 'none' ? 0 : Math.abs(parseFloat(v.split(' ')[1] || '0')); }) }));
      pyLon = Math.max(pyLon, Math.abs(x.py)); lonNhat = Math.max(lonNhat, ...x.tt); dich.push(Math.max(...x.tt));
    }
    return { pyLon, lonNhat, coTroi: dich.some((d) => d > 0.5), soLan: dich.length };
  };
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    const x = await doTroi(p);
    ok(`1440×900 có chuột: hoạ tiết hero có trôi khi cuộn (kiểm chứng điều kiện thử) và KHÔNG hoạ tiết nào lệch quá ${MAX_TROI}px ở mọi vị trí cuộn (${x.soLan} vị trí, mỗi 120px tới cuối trang)`, x.coTroi && x.lonNhat <= MAX_TROI + 0.01, `--py lớn nhất ${x.pyLon}px; hoạ tiết lệch lớn nhất ${x.lonNhat}px`);
    await ctx.close();
  }
  for (const [w, h, mobile, ten] of [[390, 844, true, 'điện thoại 390×844 (cảm ứng)'], [1024, 768, true, 'máy tính bảng 1024×768 (cảm ứng)'], [1280, 800, false, 'máy tính 1280×800 + giảm chuyển động']]) {
    const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, ...(mobile ? {} : { reducedMotion: 'reduce' }) }), p = await mo(ctx, '/');
    const x = await doTroi(p);
    ok(`${ten}: hoạ tiết hero không trôi theo cuộn`, !x.coTroi && x.pyLon === 0, `--py lớn nhất ${x.pyLon}px; lệch lớn nhất ${x.lonNhat}px`);
    await ctx.close();
  }

  // ---------- 4. Không cuộn ngang ở 7 cỡ (kể cả khi hiệu ứng đang chạy / rê chuột) ----------
  muc('4. Không cuộn ngang ở 7 kích thước + màn ngang, đo cả lúc hiệu ứng hero đang chạy và khi rê chuột nút / ảnh');
  {
    const KT = [[360, 740], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [844, 390]], hong = [];
    const do_ = (p) => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    for (const [w, h] of KT) {
      const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
      for (const t of TRANG) {
        const p = await ctx.newPage(); await p.goto(URL_SAU + t, { waitUntil: 'domcontentloaded' });
        const a = await do_(p); // lúc hero đang nhích lên / hoạ tiết đang hiện
        await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
        const b2 = await do_(p);
        let c = b2;
        if (w >= 1024) { const nut = await p.$('.nut-chinh'), anh = await p.$('.anh-that, .sp-anh'); if (nut && await nut.isVisible()) await nut.hover().catch(() => {}); if (anh && await anh.isVisible()) await anh.hover().catch(() => {}); await p.waitForTimeout(300); c = await do_(p); }
        for (const [luc, x] of [['đang chạy', a], ['xong', b2], ['rê chuột', c]]) if (x.sw > x.cw + 1) hong.push(`${w}x${h} ${t} (${luc}): ${x.sw}/${x.cw}`);
        await p.close();
      }
      await ctx.close();
    }
    ok(`${TRANG.length} trang × ${KT.length} kích thước (360, 390, 430, 768, 1024, 1280, 1440, ngang 844×390): không cuộn ngang lúc hiệu ứng đang chạy, khi xong và khi rê chuột (≥ 1024px)`, hong.length === 0, hong.slice(0, 6).join(' | '));
  }

  // ---------- 5. Dịch bố cục (CLS) không tăng so với trước R3.6 ----------
  muc(`5. Dịch bố cục (CLS): dưới 0,1 và không tăng so với bản trước R3.6 (commit ${COMMIT_TRUOC})`);
  const doCls = async (ctx, goc, t) => {
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__dich = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__dich.push(e.sources.map((s) => s.node && s.node.nodeName + '.' + (s.node.className || '')).join('+') + ':' + e.value.toFixed(3)); } }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(goc + t, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
    const tai = await p.evaluate(() => window.__cls);
    // cuộn chậm tới cuối để các thẻ [data-hien] hiện ra (chỉ opacity / transform: không được gây dịch)
    const cao = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= cao; y += 300) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(80); }
    await p.waitForTimeout(800);
    const x = await p.evaluate(() => ({ tong: window.__cls, dich: window.__dich.slice(0, 4) }));
    await p.close();
    return { tai, ...x };
  };
  if (!truoc.dist) chuaXm(`So CLS với bản trước R3.6 (commit ${COMMIT_TRUOC})`, 'Không dựng được bản trước: ' + truoc.loi);
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const tag = `${w}x${h}`, ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    const cao = [], tang = [], bang = [];
    for (const t of TRANG) {
      const s = await doCls(ctx, URL_SAU, t);
      if (s.tong >= 0.1) cao.push(`${t}: ${s.tong.toFixed(3)} ${s.dich.join(' ')}`);
      if (truoc.dist) { const tr = await doCls(ctx, URL_TRUOC, t); bang.push(`${t} ${tr.tong.toFixed(3)}→${s.tong.toFixed(3)}`); if (s.tong > tr.tong + 0.01) tang.push(`${t}: trước ${tr.tong.toFixed(3)}, sau ${s.tong.toFixed(3)} ${s.dich.join(' ')}`); }
      else bang.push(`${t} ${s.tong.toFixed(3)}`);
    }
    const kemPhong = cssPhong ? 'có phông cục bộ đổi "swap" sau 300 ms' : 'phông Google bị chặn';
    ok(`${tag} (${kemPhong}): ${TRANG.length} trang có CLS dưới 0,1 khi tải và cuộn tới cuối`, cao.length === 0, (cao.join(' | ') || bang.join(' · ')));
    if (truoc.dist) ok(`${tag} (${kemPhong}): CLS từng trang không tăng quá 0,01 so với bản trước R3.6`, tang.length === 0, tang.join(' | ') || bang.join(' · '));
    await ctx.close();
  }
  if (!cssPhong) chuaXm('CLS khi phông thật được tải về và đổi (swap)', 'Không có PHONG_CUC_BO: phông Google bị chặn nên không đo được dịch do đổi phông');

  muc('6. Yêu cầu mạng ra ngoài và giới hạn');
  ok('Không gọi máy chủ ngoài nào ngoài phông Google (đã chặn hoặc trả bằng tệp cục bộ) và bản đồ nhúng trang Liên hệ (chặn)', [...ngoai].every((x) => /fonts\.(googleapis|gstatic)\.com|^www\.google\.com$/.test(x)), [...ngoai].join(', '));
  if (cssPhong) ok(`Phông cục bộ thực sự được dùng (${soPhong} lần tải tệp phông)`, soPhong > 0, '');
  chuaChay('Firefox, Safari/WebKit, Edge; điện thoại thật', `Chỉ có Chromium ${phienBan} của Playwright`);
  chuaXm('Phông tải từ Google Fonts thật (tốc độ, đủ ký tự)', 'Môi trường này chặn Google Fonts; cần mở web thật để xem');
  chuaXm('Cảm nhận chuyển động (đẹp / mượt) trên máy thật', 'Cần người xem');

  await b.close(); may.kill(); if (may2) may2.kill(); if (truoc.don) truoc.don();
  const dem = (t) => kq.filter((x) => x.tt === t).length;
  const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA CHẠY ${dem('CHƯA CHẠY')} · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH')}`;
  const dong = [`Kiểm thử thiết kế R3.6 · Chromium ${phienBan} (Playwright) · phông: ${cssPhong ? 'cục bộ (@fontsource)' : 'bị chặn'} · ${new Date().toISOString()}`, tom, '', ...kq.map((x) => x.tt === 'MỤC' ? `\n-- ${x.ten}` : `[${x.tt}] ${x.ten}${x.ct ? '  → ' + x.ct : ''}`)];
  fs.writeFileSync(path.join(KQ, 'ket-qua-r36.txt'), dong.join('\n'));
  console.log('\n' + tom + '\n' + kq.filter((x) => x.tt === 'KHÔNG ĐẠT').map((x) => '✗ ' + x.ten + ' → ' + x.ct).join('\n'));
  process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
