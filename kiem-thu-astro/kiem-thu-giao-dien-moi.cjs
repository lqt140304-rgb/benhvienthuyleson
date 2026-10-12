// Kiểm thử NỀN MÓNG giao diện mới (bước 1, docs/KE-HOACH-GIAO-DIEN-MOI.md mục 9). Chạy sau `npm run build`:
//   NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-giao-dien-moi.cjs
// Tự dựng giao diện 'moi' vào dist-moi bằng dung-giao-dien.cjs (bản sao tạm, mã trong repo không đổi); dist hiện có là giao diện mặc định 'r36'.
// Kiểm: hai bộ CSS tách hẳn; phông tự chứa vẽ đúng (kể cả dấu tiếng Việt), không gọi mạng ngoài; token màu; hien.js (4 kiểu, một lần, nối tiếp
// 60ms tối đa 5 mục, focus, in); ba lớp tắt/mở (không JS, giảm chuyển động, tắt hiệu ứng trang trí); script hỏng thì nội dung tự hiện; dung lượng.
// Bốn trạng thái: ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH. Chỉ Chromium của Playwright. Không gọi mạng ra ngoài.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process'), zlib = require('zlib');
const GOC = path.resolve(__dirname, '..'), BASE = '/benhvienthuyleson';
const CONG_MOI = 4379, CONG_R36 = 4378, URL_MOI = `http://localhost:${CONG_MOI}${BASE}`, URL_R36 = `http://localhost:${CONG_R36}${BASE}`;
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });
const TRANG = ['/', '/bang-gia/', '/dich-vu/', '/gioi-thieu/', '/lien-he/', '/dat-lich/', '/nhan-vien/', '/tu-van/', '/tu-van/cho/', '/tu-van/meo/', '/nhat-ky-ca-benh/'];

// JavaScript hiệu ứng của giao diện mới: cả script nhúng trong trang lẫn tệp .js (gói đủ lớn thì Astro tách thành tệp) có chứa "astro:page-load"
const jsHieuUng = (thuMuc) => {
  const h = fs.readFileSync(path.join(GOC, thuMuc, 'index.html'), 'utf8'), ds = [...h.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const m of h.matchAll(/<script type="module" src="([^"]+)"/g)) { const f = path.join(GOC, thuMuc, m[1].replace(BASE + '/', '')); if (fs.existsSync(f)) ds.push(fs.readFileSync(f, 'utf8')); }
  return ds.filter((c) => /astro:page-load/.test(c)).join('\n'); // dấu hiệu riêng của gói hieu-ung (ui.js của R3.6 cũng có chữ "da-hien")
};
const kq = [];
const ok = (ten, dieuKien, ct = '') => kq.push({ tt: dieuKien ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 500) });
const chuaChay = (ten, ly) => kq.push({ tt: 'CHƯA CHẠY', ten, ct: ly });
const chuaXm = (ten, ly) => kq.push({ tt: 'CHƯA XÁC MINH', ten, ct: ly });
const muc = (t) => { kq.push({ tt: 'MỤC', ten: t, ct: '' }); console.log('\n== ' + t); };

// Phần tử thử chèn vào cuối trang thật (giao diện 'moi') để kiểm bốn kiểu data-hien và [data-trang-tri]
const CHEN = `
<section id="thu-hien" style="padding:1400px 0 400px">
  <p id="h-mo" data-hien="mo">mo</p>
  <p id="h-len" data-hien="len">len</p>
  <figure id="h-man" data-hien="mo-man"><div id="h-man-con" style="height:80px;background:#5A1E5E"></div></figure>
  <svg id="h-ve" data-hien="ve" width="120" height="20" viewBox="0 0 120 20"><path class="net" pathLength="1" d="M2 12 Q60 2 118 12" fill="none" stroke="#EA7A24" stroke-width="2"/></svg>
  <ul>${[1, 2, 3, 4, 5, 6, 7].map((i) => `<li id="h-ds-${i}" data-hien="len">mục ${i}</li>`).join('')}</ul>
  <a id="h-focus-a" href="#x">liên kết trong khối</a>
</section>
<div id="h-tt" data-trang-tri style="width:20px;height:20px;animation:thu-quay 2s linear infinite"></div>
<style>@keyframes thu-quay{to{transform:rotate(360deg)}}</style>`;

(async () => {
  if (!fs.existsSync(path.join(GOC, 'dist', 'index.html'))) { console.error('Chưa có dist: chạy `npm run build` trước.'); process.exit(2); }
  require('./dung-giao-dien.cjs').dungGiaoDien('moi', 'dist-moi');
  const may = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG_MOI)], { stdio: 'ignore', env: { ...process.env, DIST: path.join(GOC, 'dist-moi') } });
  const may2 = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG_R36)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const b = await chromium.launch(), phienBan = b.version();
  const ngoai = new Set(), yeuCauPhong = { moi: 0, r36: 0 };
  const ctxMoi = async (tuy = {}, boScript = false) => {
    const ctx = await b.newContext({ locale: 'vi-VN', ...tuy });
    await ctx.route('**/*', async (r) => {
      const u = r.request().url();
      if (u.startsWith(`http://localhost:${CONG_MOI}`) || u.startsWith(`http://localhost:${CONG_R36}`)) {
        if (/\/fonts\/.+\.woff2$/.test(u)) yeuCauPhong[u.includes(`:${CONG_MOI}`) ? 'moi' : 'r36']++;
        if (boScript && r.request().resourceType() === 'script') { // giả lập script hiệu ứng không tải được: chặn tệp .js chứa hien.js
          const res = await r.fetch(); if (/astro:page-load/.test(await res.text())) return r.abort();
        }
        return r.continue();
      }
      ngoai.add(new URL(u).host); return r.abort();
    });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('cam-da-chao', '1'); } catch (e) {} });
    return ctx;
  };
  const mo = async (ctx, duong, goc = URL_MOI, loi) => {
    const p = await ctx.newPage();
    if (loi) { p.on('pageerror', (e) => loi.push(duong + ' · ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) loi.push(duong + ' · ' + m.text().slice(0, 120)); }); }
    await p.goto(goc + duong, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); return p;
  };
  const chenThu = (p) => p.evaluate((html) => { document.querySelector('main').insertAdjacentHTML('beforeend', html); document.dispatchEvent(new Event('astro:page-load')); }, CHEN);

  // ---------- 1. Hai bộ CSS tách hẳn, phông tự chứa ----------
  muc('1. Công tắc GIAO_DIEN: hai bộ CSS tách hẳn; giao diện mới dùng phông tự chứa, không gọi mạng ngoài');
  {
    const doc = (d) => { const h = fs.readFileSync(path.join(GOC, d, 'index.html'), 'utf8'); return { css: [...h.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]), google: /fonts\.googleapis/.test(h), preload: [...h.matchAll(/rel="preload" href="([^"]+)"/g)].map((m) => m[1]), html: (/<html[^>]*>/.exec(h) || [''])[0], scriptNhung: jsHieuUng(d).length > 0 }; };
    const r36 = doc('dist'), moi = doc('dist-moi');
    const noiDung = (d, href) => fs.readFileSync(path.join(GOC, d, href.replace(BASE + '/', '')), 'utf8');
    ok('Giao diện mặc định (dist, GIAO_DIEN = r36): đúng MỘT tệp CSS là bộ R3.6 (có .hero-chu, không có Newsreader), vẫn dùng Google Fonts như trước, không tải trước phông tự chứa, không có script hiệu ứng mới', r36.css.filter((c) => !/googleapis/.test(c)).length === 1 && /r36\./.test(r36.css.join()) && r36.google && !r36.preload.length && !r36.scriptNhung && !/data-giao-dien/.test(r36.html) && /\.hero-chu/.test(noiDung('dist', r36.css.find((c) => /r36\./.test(c)))) && !/Newsreader/.test(noiDung('dist', r36.css.find((c) => /r36\./.test(c)))), JSON.stringify(r36));
    const cssTw = moi.css.filter((c) => /\/tailwind\./.test(c)), cssChinh = moi.css.filter((c) => !/\/tailwind\./.test(c));
    const cssMoi = cssChinh.length === 1 ? noiDung('dist-moi', cssChinh[0]) : '', cssTwNd = cssTw.length === 1 ? noiDung('dist-moi', cssTw[0]) : '';
    ok('Giao diện mới (dist-moi): đúng MỘT tệp CSS chính là bộ mới + MỘT tệp Tailwind (không có Preflight: không có lớp base, không reset; mọi lớp có tiền tố tw:; lớp tiện ích !important) (có Newsreader, --kem, data-hien), KHÔNG có quy tắc nào của le-son.css (.hero-nen, .sp-panel, Playfair, --bong-1), không gọi Google Fonts, tải trước 2 tệp Newsreader 500, <html data-giao-dien="moi">', cssChinh.length === 1 && cssTw.length === 1 && moi.css.length === 2 && !/@layer base|box-sizing:border-box;margin:0|::file-selector-button/.test(cssTwNd) && /\.tw\\:/.test(cssTwNd) && /!important/.test(cssTwNd) && /Newsreader/.test(cssMoi) && /--kem:/.test(cssMoi) && /data-hien/.test(cssMoi) && !/\.hero-nen|\.sp-panel|Playfair|--bong-1/.test(cssMoi) && !moi.google && moi.preload.length === 2 && /data-giao-dien="moi"/.test(moi.html) && moi.scriptNhung, JSON.stringify({ ...moi, kichThuoc: cssMoi.length }));
    const tepPhong = [...cssMoi.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1].replace(/["']/g, ''));
    const thieu = tepPhong.filter((t) => !t.startsWith(BASE + '/fonts/') || !fs.existsSync(path.join(GOC, 'dist-moi', t.replace(BASE + '/', ''))));
    ok(`${tepPhong.length} @font-face trỏ tới tệp có thật trong ${BASE}/fonts/ (Newsreader 400/500/600 + nghiêng 500, Be Vietnam Pro 400/500/600; mỗi độ đậm 2 tệp Latin + Việt); có giấy phép OFL đi kèm`, tepPhong.length === 14 && thieu.length === 0 && fs.existsSync(path.join(GOC, 'public/fonts/LICENSE-newsreader.txt')) && fs.existsSync(path.join(GOC, 'public/fonts/LICENSE-be-vietnam-pro.txt')), thieu.join(', '));
  }

  // ---------- 2. Phông vẽ thật, token ----------
  muc('2. Phông vẽ thật và token màu (giao diện mới)');
  {
    const loi = [];
    for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
      const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile }), sai = [];
      for (const t of ['/', '/bang-gia/', '/dat-lich/', '/gioi-thieu/']) {
        const p = await mo(ctx, t, URL_MOI, loi), cdp = await ctx.newCDPSession(p);
        await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
        const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
        // h3 trong .sp2-the (tên sản phẩm, Newsreader 26px) và .bg-dau (tiêu đề nhóm ở trang Bảng giá) là tiêu đề lớn Newsreader 36px theo thiết kế bước 3, nên không tính vào "h3 là Be Vietnam Pro"
        for (const [chon, mong] of [['h1', 'Newsreader'], ['h2', 'Newsreader'], ['h3:not(.bg-dau h3, .sp2-the h3)', 'Be Vietnam Pro'], ['p', 'Be Vietnam Pro']]) {
          const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: `main ${chon}` });
          for (const id of nodeIds.slice(0, 3)) {
            const bm = await cdp.send('DOM.getBoxModel', { nodeId: id }).catch(() => null);
            if (!bm || !bm.model.width) continue;
            const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: id });
            const khac = fonts.filter((f) => !f.familyName.startsWith(mong));
            if (khac.length) sai.push(`${t} ${chon} cần ${mong}, được ${fonts.map((f) => f.familyName + ':' + f.glyphCount).join(', ')}`);
          }
        }
        await p.close();
      }
      ok(`${w}x${h}: phông vẽ thật (CSS.getPlatformFontsForNode) ở 4 trang: h1/h2 chỉ Newsreader, h3/đoạn văn chỉ Be Vietnam Pro, không ký tự nào (kể cả dấu tiếng Việt) rơi sang phông dự phòng`, sai.length === 0, sai.slice(0, 6).join(' | '));
      await ctx.close();
    }
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/', URL_MOI, loi);
    const x = await p.evaluate(() => { const cs = (s) => document.querySelector(s) && getComputedStyle(document.querySelector(s)); return { nen: cs('body').backgroundColor, h1: cs('h1').color, h1co: cs('h1').fontSize + '/' + cs('h1').lineHeight, h1nang: cs('h1').fontWeight, chu: cs('body').color, tim: getComputedStyle(document.documentElement).getPropertyValue('--tim').trim(), cam: getComputedStyle(document.documentElement).getPropertyValue('--cam').trim(), ngoc: getComputedStyle(document.documentElement).getPropertyValue('--ngoc').trim(), ke: getComputedStyle(document.documentElement).getPropertyValue('--ke').trim() }; });
    ok('Token: nền trang kem #FBF7F1, h1 mực tím #5A1E5E cỡ 48–66px (to hơn bản đầu theo yêu cầu 12/10: 66px ở 1440), chữ #1E1B1F; biến --tim/--cam/--ngoc/--ke đúng bảng màu kế hoạch', x.nen === 'rgb(251, 247, 241)' && x.h1 === 'rgb(90, 30, 94)' && parseFloat(x.h1co) >= 56 && parseFloat(x.h1co) <= 66.5 && x.chu === 'rgb(30, 27, 31)' && x.tim.toUpperCase() === '#5A1E5E' && x.cam.toUpperCase() === '#EA7A24' && x.ngoc.toUpperCase() === '#23706E' && x.ke.toUpperCase() === '#E3DDD3', JSON.stringify(x));
    await ctx.close();
    ok('Giao diện mới: không lỗi JavaScript / console ở các trang đã mở', loi.length === 0, loi.join(' | '));
  }

  // ---------- 3. hien.js ----------
  muc('3. Hiện khi cuộn (hien.js): bốn kiểu, một lần, nối tiếp 60ms tối đa 5 mục, focus, in');
  const trangThai = (p) => p.evaluate(() => {
    const g = (id, con) => { const e = document.getElementById(id); const c = getComputedStyle(con ? document.getElementById(con) : e); return { da: e.classList.contains('da-hien'), op: +c.opacity, tf: c.transform, clip: c.clipPath }; };
    const net = getComputedStyle(document.querySelector('#h-ve .net')).strokeDashoffset;
    return { mo: g('h-mo'), len: g('h-len'), man: g('h-man', 'h-man-con'), ve: { ...g('h-ve'), net }, ds: [...document.querySelectorAll('#thu-hien [data-hien]')].map((e) => e.style.getPropertyValue('--tre') || '0ms'), coHU: document.documentElement.classList.contains('co-hieu-ung') };
  });
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    await chenThu(p); await p.waitForTimeout(200);
    const truoc = await trangThai(p);
    ok('Trước khi cuộn tới: mo mờ hẳn; len mờ + lệch 12px; mo-man che kín phần tử con bằng clip-path (không mờ); nét ve chưa vẽ (dashoffset 1)', truoc.coHU && !truoc.mo.da && truoc.mo.op === 0 && truoc.len.op === 0 && /matrix\(1, 0, 0, 1, 0, 12\)/.test(truoc.len.tf) && truoc.man.op === 1 && /inset\(0px 100% 0px 0px\)/.test(truoc.man.clip) && truoc.ve.op === 1 && /^1(px)?$/.test(truoc.ve.net), JSON.stringify(truoc));
    await p.evaluate(() => { document.getElementById('thu-hien').scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy({ top: 1300, behavior: 'instant' }); });
    await p.waitForTimeout(150);
    const giua = await trangThai(p);
    await p.waitForTimeout(1200);
    const sau = await trangThai(p);
    ok('Sau khi cuộn tới: cả bốn kiểu đã hiện (độ mờ 1, không lệch, clip-path none, nét vẽ xong dashoffset 0)', sau.mo.da && sau.mo.op === 1 && sau.len.op === 1 && sau.len.tf === 'none' && sau.man.clip === 'none' && /^0(px)?$/.test(sau.ve.net), JSON.stringify(sau));
    const tre = giua.ds.map((v) => parseInt(v, 10)), mong = tre.map((_, i) => Math.min(i, 4) * 60);
    ok(`${tre.length} phần tử vào màn hình cùng lúc hiện nối tiếp theo thứ tự trên trang: 0, 60, 120, 180, 240ms rồi dừng ở 240ms (tối đa 5 bậc); xong thì độ trễ được gỡ`, tre.length === 11 && tre.join() === mong.join() && sau.ds.every((v) => v === '0ms'), `đang chạy: ${giua.ds.join(' ')} · mong đợi: ${mong.join(' ')} · xong: ${sau.ds.join(' ')}`);
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(300); await p.evaluate(() => document.getElementById('thu-hien').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(300);
    const lai = await p.evaluate(() => [...document.querySelectorAll('#thu-hien [data-hien]')].map((e) => e.getAttribute('class') || ''));
    ok('Mỗi phần tử hiện MỘT lần: cuộn đi rồi quay lại không ẩn / chạy lại', lai.every((c) => /da-hien/.test(c)), lai.join(','));
    // Gọi khởi động lại (như astro:page-load) không theo dõi trùng, không lỗi
    const loiLai = []; p.on('pageerror', (e) => loiLai.push(e.message));
    await p.evaluate(() => { document.dispatchEvent(new Event('astro:page-load')); document.dispatchEvent(new Event('astro:page-load')); }); await p.waitForTimeout(100);
    ok('Gọi khởi động lại nhiều lần (astro:page-load) không lỗi và không làm phần tử đã hiện ẩn lại', loiLai.length === 0 && (await p.evaluate(() => [...document.querySelectorAll('#thu-hien [data-hien]')].every((e) => getComputedStyle(e).opacity === '1'))), loiLai.join(' | '));
    await ctx.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    await chenThu(p); await p.waitForTimeout(100);
    await p.evaluate(() => { const s = document.getElementById('thu-hien'); s.setAttribute('data-hien', 'len'); document.dispatchEvent(new Event('astro:page-load')); });
    await p.waitForTimeout(500);
    const truocF = await p.evaluate(() => getComputedStyle(document.getElementById('thu-hien')).opacity);
    await p.focus('#h-focus-a'); await p.waitForTimeout(50);
    const f = { link: await p.evaluate(() => document.activeElement.id), truocF };
    const kh = await p.evaluate(() => { const s = document.getElementById('thu-hien'); return { da: s.classList.contains('da-hien'), op: getComputedStyle(s).opacity, tr: getComputedStyle(s).transitionDuration }; });
    ok('Focus bằng bàn phím vào phần tử trong khối data-hien đang ẩn → khối hiện NGAY (không chờ chuyển động)', f.truocF === '0' && f.link === 'h-focus-a' && kh.da && kh.op === '1', JSON.stringify({ ...f, ...kh }));
    await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(500); // chuyển tiếp độ mờ đang chạy dở (máy in thật không có chuyển tiếp)
    const inAn = await p.evaluate(() => [...document.querySelectorAll('[data-hien]')].filter((e) => getComputedStyle(e).opacity !== '1').length);
    ok('Khi in: mọi phần tử data-hien hiện đủ', inAn === 0, `${inAn} phần tử còn ẩn`);
    await ctx.close();
  }

  // ---------- 4. Ba lớp tắt/mở + script hỏng ----------
  muc('4. Ba lớp tắt/mở: không JavaScript, giảm chuyển động, tắt "Hiệu ứng trang trí"; script hiệu ứng hỏng');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }), an = [];
    for (const t of TRANG) { const p = await mo(ctx, t); const x = await p.evaluate(() => ({ hu: document.documentElement.classList.contains('co-hieu-ung'), an: [...document.querySelectorAll('[data-hien]')].filter((e) => getComputedStyle(e).opacity !== '1').length })); if (x.hu || x.an) an.push(`${t}: ${JSON.stringify(x)}`); await p.close(); }
    ok(`Tắt JavaScript: ${TRANG.length} trang không có lớp co-hieu-ung, mọi phần tử data-hien hiện đủ (độ mờ 1)`, an.length === 0, an.join(' | '));
    await ctx.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p = await mo(ctx, '/');
    await chenThu(p); await p.waitForTimeout(100);
    const truoc = await trangThai(p);
    const tr = await p.evaluate(() => { const c = getComputedStyle(document.getElementById('h-len')); return { prop: c.transitionProperty, dur: c.transitionDuration }; });
    await p.evaluate(() => { document.getElementById('thu-hien').scrollIntoView({ behavior: 'instant' }); window.scrollBy({ top: 1300, behavior: 'instant' }); }); await p.waitForTimeout(500);
    const sau = await trangThai(p);
    const lap = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity).length);
    ok('Giảm chuyển động: KHÔNG còn dịch chuyển / mở màn / vẽ nét (len không lệch, mo-man không che, nét vẽ sẵn), chuyển tiếp chỉ còn độ mờ 160ms; vẫn hiện ra được; không chuyển động lặp vô hạn nào chạy', truoc.coHU && truoc.len.tf === 'none' && truoc.man.clip === 'none' && /^0(px)?$/.test(truoc.ve.net) && /^opacity/.test(tr.prop) && /^0\.16s/.test(tr.dur) && sau.len.op === 1 && sau.mo.op === 1 && lap === 0, JSON.stringify({ truoc: { len: truoc.len, man: truoc.man.clip, net: truoc.ve.net }, tr, lap }));
    await ctx.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    await chenThu(p); await p.waitForTimeout(100);
    const truoc = await p.evaluate(() => document.getElementById('h-tt').getAnimations().map((a) => a.playState));
    const nut = await p.$('[data-nut-trang-tri]');
    if (!nut) chuaChay('Tắt "Hiệu ứng trang trí" bằng nút', 'Trang chủ chưa có nút [data-nut-trang-tri] ở giao diện này');
    else {
      await p.evaluate(() => document.querySelector('[data-nut-trang-tri]').click()); await p.waitForTimeout(100);
      const sau = await p.evaluate(() => ({ lop: document.documentElement.classList.contains('tat-trang-tri'), an: document.getElementById('h-tt').getAnimations().map((a) => a.playState), ls: localStorage.getItem('le-son-trang-tri') }));
      ok('Tắt "Hiệu ứng trang trí" (nút có sẵn, nhớ trong localStorage): html.tat-trang-tri, phần tử [data-trang-tri] đang quay thì dừng', truoc.includes('running') && sau.lop && sau.an.every((s) => s === 'paused') && sau.ls === 'tat', JSON.stringify({ truoc, sau }));
    }
    await ctx.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }, true), p = await mo(ctx, '/');
    const ngay = await p.evaluate(() => ({ hu: document.documentElement.classList.contains('co-hieu-ung'), script: !!document.querySelector('script[type="module"]:not([src])') }));
    await p.waitForTimeout(3300);
    const sau = await p.evaluate(() => ({ hu: document.documentElement.classList.contains('co-hieu-ung'), an: [...document.querySelectorAll('[data-hien]')].filter((e) => getComputedStyle(e).opacity !== '1').length }));
    ok('Script hiệu ứng không tải được: sau 3 giây lớp co-hieu-ung tự gỡ, mọi nội dung hiện đủ', ngay.hu && !ngay.script && !sau.hu && sau.an === 0, JSON.stringify({ ngay, sau }));
    await ctx.close();
  }

  // ---------- 5. Giao diện mặc định không bị ảnh hưởng, dung lượng ----------
  muc('5. Giao diện mặc định (r36) không tải gì của giao diện mới; dung lượng');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), loi = [];
    for (const t of TRANG.slice(0, 4)) { const p = await mo(ctx, t, URL_R36, loi); await p.close(); }
    ok('Giao diện r36: không tải tệp phông tự chứa nào, không lỗi JavaScript', yeuCauPhong.r36 === 0 && loi.length === 0, `phông tự chứa: ${yeuCauPhong.r36}; lỗi: ${loi.join(' | ')}`);
    await ctx.close();
    const js = jsHieuUng('dist-moi');
    const nen = zlib.gzipSync(js).length;
    ok(`JavaScript hiệu ứng mới < 8 KB nén (kế hoạch mục 8): ${nen} byte gzip (${js.length} byte)`, js.length > 0 && nen < 8192, '');
  }

  muc('6. Yêu cầu mạng ra ngoài và giới hạn');
  ok('Không gọi máy chủ ngoài nào ngoài Google Fonts của giao diện r36 (bị chặn) và bản đồ nhúng trang Liên hệ (không mở trong lần chạy này)', [...ngoai].every((x) => /fonts\.(googleapis|gstatic)\.com|^www\.google\.com$/.test(x)), [...ngoai].join(', '));
  ok(`Giao diện mới thực sự tải phông tự chứa (${yeuCauPhong.moi} lần)`, yeuCauPhong.moi > 0, '');
  chuaXm('Bố cục các khu ở giao diện mới', 'Bước 1 chỉ là nền móng: các khu (header, hero…) chưa làm lại nên giao diện "moi" còn thô; kiểm ở bước 2–7');
  chuaChay('Firefox, Safari/WebKit, Edge; điện thoại thật', `Chỉ có Chromium ${phienBan} của Playwright`);

  await b.close(); may.kill(); may2.kill(); fs.rmSync(path.join(GOC, 'dist-moi'), { recursive: true, force: true });
  const dem = (t) => kq.filter((x) => x.tt === t).length;
  const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA CHẠY ${dem('CHƯA CHẠY')} · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH')}`;
  const dong = [`Kiểm thử nền móng giao diện mới (bước 1) · Chromium ${phienBan} (Playwright) · ${new Date().toISOString()}`, tom, '', ...kq.map((x) => x.tt === 'MỤC' ? `\n-- ${x.ten}` : `[${x.tt}] ${x.ten}${x.ct ? '  → ' + x.ct : ''}`)];
  fs.writeFileSync(path.join(KQ, 'ket-qua-giao-dien-moi.txt'), dong.join('\n'));
  console.log('\n' + tom + '\n' + kq.filter((x) => x.tt === 'KHÔNG ĐẠT').map((x) => '✗ ' + x.ten + ' → ' + x.ct).join('\n'));
  process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
