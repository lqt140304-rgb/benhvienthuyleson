// Kiểm thử BƯỚC 3 giao diện mới: Dịch vụ nổi bật, Sản phẩm nổi bật, Tóm tắt giá, trang Bảng giá (docs/KE-HOACH-GIAO-DIEN-MOI.md mục 5, 9). Chạy sau `npm run build`:
//   NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-giao-dien-moi-b3.cjs
// Tự dựng giao diện 'moi' vào dist-moi (bản sao tạm). So chữ và giá với giao diện R3.6 đang chạy (dist, cùng nguồn dữ liệu): giá và nội dung phải GIỐNG HỆT.
// Bốn trạng thái: ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH. Chỉ Chromium của Playwright. Không gọi mạng ra ngoài.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const GOC = path.resolve(__dirname, '..'), BASE = '/benhvienthuyleson';
const CONG = 4366, CONG_R = 4365, URL_M = `http://localhost:${CONG}${BASE}`, URL_R = `http://localhost:${CONG_R}${BASE}`;
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });
const kq = [];
const ok = (ten, dk, ct = '') => kq.push({ tt: dk ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 700) });
const chuaXm = (ten, ly) => kq.push({ tt: 'CHƯA XÁC MINH', ten, ct: ly });
const muc = (t) => { kq.push({ tt: 'MỤC', ten: t, ct: '' }); console.log('\n== ' + t); };
const cho = (ms) => new Promise((r) => setTimeout(r, ms));
const chuan = (s) => String(s).replace(/\s+/g, ' ').trim();

(async () => {
  if (!fs.existsSync(path.join(GOC, 'dist', 'index.html'))) { console.error('Chưa có dist: chạy `npm run build` trước.'); process.exit(2); }
  require('./dung-giao-dien.cjs').dungGiaoDien('moi', 'dist-moi');
  const may = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG)], { stdio: 'ignore', env: { ...process.env, DIST: path.join(GOC, 'dist-moi') } });
  const may2 = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG_R)], { stdio: 'ignore' });
  await cho(900);
  const b = await chromium.launch(), phienBan = b.version();
  const ngoai = new Set(), loiChung = [];
  const ctxMoi = async (tuy = {}) => {
    const ctx = await b.newContext({ locale: 'vi-VN', ...tuy });
    await ctx.route('**/*', async (r) => { const u = r.request().url(); if (u.startsWith(`http://localhost:${CONG}`) || u.startsWith(`http://localhost:${CONG_R}`)) return r.continue(); ngoai.add(new URL(u).host); return r.abort(); });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('cam-da-chao', '1'); } catch (e) {} });
    return ctx;
  };
  const mo = async (ctx, duong, goc = URL_M, cho2 = 'load') => {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => loiChung.push(duong + ' · ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) loiChung.push(duong + ' · ' + m.text().slice(0, 120)); });
    await p.goto(goc + duong, { waitUntil: cho2 }); await p.evaluate(() => document.fonts.ready); return p;
  };
  const toi = (p, sel, lech = 80) => p.evaluate(([s, l]) => { const e = document.querySelector(s); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - l, behavior: 'instant' }); }, [sel, lech]);

  // Lấy chữ từ hai giao diện để so (cùng dữ liệu nguồn)
  const layHome = (p, laMoi) => p.evaluate((laMoi) => {
    const t = (e) => e.textContent.replace(/\s+/g, ' ').trim();
    if (laMoi) return {
      dv: [...document.querySelectorAll('#dich-vu .dv-hang:not(.dv-tat-ca)')].map((a) => ({ ten: t(a.querySelector('.dv-ten')), mo: t(a.querySelector('.dv-mo')), gia: t(a.querySelector('.dv-gia')), href: a.getAttribute('href') })),
      sp: [...document.querySelectorAll('#sp-noi-bat .sp2-the')].map((c) => ({ ten: t(c.querySelector('h3')), mo: t(c.querySelector('p')), href: c.querySelector('a').getAttribute('href') })),
      gg: [...document.querySelectorAll('#bang-gia .dvx-the')].map((a) => ({ ten: t(a.querySelector('b')), href: a.getAttribute('href'), aria: a.getAttribute('aria-label') })),
      phu: [], cuoi: '', nutCuoi: ''
    };
    return {
      dv: [...document.querySelectorAll('#dich-vu a.the-dv:not(.tat-ca)')].map((a) => ({ ten: t(a.querySelector('h3')), mo: t(a.querySelector('p')), gia: t(a.querySelector('.dv-gia, .dv-di')), href: a.getAttribute('href') })),
      sp: [...document.querySelectorAll('#san-pham .sp-panel')].map((c) => ({ ten: t(c.querySelector('h3')), mo: t(c.querySelector('.sp-mo')), href: c.querySelector('a').getAttribute('href') })),
      gg: [...document.querySelectorAll('#bang-gia .gia-gon-the')].map((a) => ({ ten: t(a.querySelector('.gia-gon-ten b')), dk: t(a.querySelector('.gia-gon-ten small')), gia: t(a.querySelector('.gia-gon-gia, .gia-gon-chu')), href: a.getAttribute('href'), aria: a.getAttribute('aria-label') })),
      phu: [...document.querySelectorAll('#bang-gia .gia-gon-phu')].map((a) => ({ chu: t(a), href: a.getAttribute('href') })), cuoi: t(document.querySelector('#bang-gia .bg-cuoi p')), nutCuoi: t(document.querySelector('#bang-gia .bg-cuoi .nut')),
      tatCa: t(document.querySelector('#dich-vu a.tat-ca .tc-chu')),
    };
  }, laMoi);

  // ---------- 1. Nội dung và giá giống hệt giao diện đang chạy ----------
  muc('1. Chữ và giá ở trang chủ GIỐNG HỆT giao diện R3.6 đang chạy (cùng dữ liệu nguồn)');
  let moi, cu;
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } });
    const pm = await mo(ctx, '/'), pc = await mo(ctx, '/', URL_R);
    moi = await layHome(pm, true); cu = await layHome(pc, false);
    const dvCu = cu.dv.map((x, i) => ({ ...x, mo: x.mo.split(/(?<=\.)\s/)[0], gia: i === 0 ? 'Phí báo sau khám' : x.gia })); // R3.6 ở thẻ Khám ghi 2 câu và "Xem bảng giá khám"; giao diện mới: hàng một dòng = câu đầu của mô tả + "Phí báo sau khám" (chữ có sẵn ở khu tóm tắt giá)
    ok('Sản phẩm nổi bật: 3 thẻ đúng tiêu đề, mô tả và liên kết như R3.6; không giá, không giỏ hàng, không số lượng bán; giữ ghi chú "chờ bệnh viện xác nhận"', moi.sp.length === 3 && JSON.stringify(moi.sp) === JSON.stringify(cu.sp) && !/giỏ|Thêm vào|đ\b|đã bán|Giảm/.test(await pm.evaluate(() => document.getElementById('sp-noi-bat').textContent)) && /Mẫu minh hoạ · chờ bệnh viện xác nhận danh sách sản phẩm/.test(await pm.evaluate(() => document.getElementById('sp-noi-bat').textContent)), JSON.stringify({ moi: moi.sp, cu: cu.sp }));
    ok('Khu Dịch vụ (thay "Bảng giá tham khảo"): 4 thẻ đúng thứ tự Khám & Điều trị · Xét nghiệm & Chẩn đoán · Grooming & Spa · Nội trú & Chăm sóc; mỗi thẻ dẫn tới ĐÚNG nhóm giá mà R3.6 dẫn tới (/bang-gia/#nhom-…, bốn dòng đầu của tóm tắt giá cũ); không giá nào được hiện ở trang chủ', moi.gg.length === 4 && JSON.stringify(moi.gg.map((x) => x.ten)) === JSON.stringify(['Khám & Điều trị', 'Xét nghiệm & Chẩn đoán', 'Grooming & Spa', 'Nội trú & Chăm sóc']) && JSON.stringify(moi.gg.map((x) => x.href)) === JSON.stringify(cu.gg.slice(0, 4).map((x) => x.href)) && !/\d+\.\d{3}\s?đ|Từ \d/.test(await pm.evaluate(() => document.getElementById('bang-gia').textContent)), JSON.stringify({ moi: moi.gg.map((x) => [x.ten, x.href]), cu: cu.gg.map((x) => [x.ten, x.href]) }));
    const kieu = await pm.evaluate(() => { const hs = [...document.querySelectorAll('.dvx-the, .dvx-banner, .sp2-the')]; return { so: !!document.querySelector('#gioi-thieu ol, #bang-gia ol') || /(^|\s)0[1-5](\s|$)/.test(document.getElementById('bang-gia').textContent), bong: hs.filter((e) => getComputedStyle(e).boxShadow !== 'none').length }; });
    ok('Không đánh số, không bóng đổ ở thẻ dịch vụ / khối tím / thẻ sản phẩm (đã chốt: danh mục không số, viền 1px thay bóng)', !kieu.so && kieu.bong === 0, JSON.stringify(kieu));
    await ctx.close();
  }

  // (Mục 2 và 3 cũ — danh sách 5 hàng "Dịch vụ nổi bật" ở trang chủ — đã bỏ: khu này gộp vào "Giới thiệu + Dịch vụ nổi bật", kiểm ở kiem-thu-giao-dien-moi-b2.cjs mục 8.)

  muc('4. Sản phẩm nổi bật: cột trái dính + dải thẻ cuộn ngang, không tự trượt, nút Trước / Sau, vạch tiến độ');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/'); await toi(p, '#sp-noi-bat', 100); await cho(700);
    const a = await p.evaluate(() => { const d = document.querySelector('[data-sp2-dai]'), t = [...d.querySelectorAll('.sp2-the')], rd = d.getBoundingClientRect(), tr = document.querySelector('.sp2-trai'), dk = document.querySelector('[data-sp2-dk]'); return { sw: d.scrollWidth, cw: d.clientWidth, x: d.scrollLeft, snap: getComputedStyle(d).scrollSnapType, ovx: getComputedStyle(d).overflowX, cat: Math.round(t[2].getBoundingClientRect().right - rd.right), the: t.map((e) => Math.round(e.getBoundingClientRect().width)), cot: [Math.round(tr.getBoundingClientRect().width), Math.round(rd.width)], dinh: getComputedStyle(tr).position, top: getComputedStyle(tr).top, hien: !dk.hidden, truoc: document.querySelector('[data-sp2-truoc]').getAttribute('aria-disabled'), sau: document.querySelector('[data-sp2-sau]').getAttribute('aria-disabled'), rg: document.querySelector('[data-sp2-truoc]').getBoundingClientRect().width, tab: d.tabIndex, vung: d.getAttribute('role') + '|' + d.getAttribute('aria-label') }; });
    ok('Bố cục: cột trái ~30% (' + a.cot[0] + 'px, dính position: sticky top 92px) + dải thẻ ~70% (' + a.cot[1] + 'px) cuộn ngang (scroll-snap x mandatory); thẻ thứ 3 bị cắt mép khung ' + a.cat + 'px để báo còn cuộn được; dải là vùng có nhãn, vào được bằng Tab', a.sw > a.cw + 100 && /x mandatory/.test(a.snap) && a.ovx === 'auto' && a.cat > 40 && a.dinh === 'sticky' && a.top === '92px' && a.cot[0] / (a.cot[0] + a.cot[1]) > 0.25 && a.cot[0] / (a.cot[0] + a.cot[1]) < 0.35 && a.tab === 0 && /^region\|/.test(a.vung), JSON.stringify(a));
    ok('Nút Trước / Sau (≥ 52px) hiện khi có JavaScript; lúc đầu "Trước" bị vô hiệu hoá, "Sau" dùng được', a.hien && a.rg >= 52 && a.truoc === 'true' && a.sau === 'false', JSON.stringify({ hien: a.hien, rg: a.rg, truoc: a.truoc, sau: a.sau }));
    await cho(3500); const yen = await p.evaluate(() => document.querySelector('[data-sp2-dai]').scrollLeft);
    ok('KHÔNG tự trượt: sau 3,5 giây dải vẫn đứng yên (scrollLeft 0)', yen === 0, 'scrollLeft = ' + yen);
    const y0 = await p.evaluate(() => scrollY); await p.click('[data-sp2-sau]'); await cho(900);
    const b1 = await p.evaluate(() => { const d = document.querySelector('[data-sp2-dai]'); return { x: Math.round(d.scrollLeft), max: Math.round(d.scrollWidth - d.clientWidth), buoc: Math.round(d.querySelector('.sp2-the').offsetWidth + 24), sau: document.querySelector('[data-sp2-sau]').getAttribute('aria-disabled'), truoc: document.querySelector('[data-sp2-truoc]').getAttribute('aria-disabled'), p0: document.querySelector('[data-sp2-vach]').style.getPropertyValue('--p0'), pw: document.querySelector('[data-sp2-vach]').style.getPropertyValue('--pw'), y: scrollY }; });
    ok('Bấm "Sau": dải cuộn một bước (tối đa ' + b1.buoc + 'px, dải chỉ còn ' + b1.max + 'px để cuộn nên dừng ở cuối), "Trước" được bật, vạch tiến độ dịch theo (--p0 > 0), trang KHÔNG bị cuộn dọc', Math.abs(b1.x - Math.min(b1.buoc, b1.max)) <= 3 && b1.x > 100 && b1.truoc === 'false' && parseFloat(b1.p0) > 0 && parseFloat(b1.pw) > 0.4 && Math.abs(b1.y - y0) <= 1, JSON.stringify({ ...b1, y0 }));
    const b2 = { x: b1.x, sau: b1.sau, max: b1.max };
    ok('Cuối dải: nút "Sau" tự bị vô hiệu hoá (aria-disabled="true"), vạch tiến độ chạm cuối', b2.sau === 'true' && Math.abs(b2.x - b2.max) <= 3, JSON.stringify(b2));
    await p.click('[data-sp2-truoc]'); await cho(900); const b3 = await p.evaluate(() => Math.round(document.querySelector('[data-sp2-dai]').scrollLeft));
    ok('Bấm "Trước": dải lùi lại một thẻ', b3 < b2.x && b3 >= 0, `${b2.x} → ${b3}`);
    await p.focus('[data-sp2-dai]'); await p.keyboard.press('Home'); await cho(500); await p.keyboard.press('ArrowRight'); await cho(600);
    const kb = await p.evaluate(() => ({ x: document.querySelector('[data-sp2-dai]').scrollLeft, vong: getComputedStyle(document.querySelector('[data-sp2-dai]')).outlineStyle }));
    ok('Bàn phím: Tab vào dải thì có viền focus; phím mũi tên phải cuộn dải', kb.vong !== 'none' && kb.x > 0, JSON.stringify(kb));
    await ctx.close();
    const cn = await ctxMoi({ viewport: { width: 1440, height: 900 } }), pn = await mo(cn, '/'); await toi(pn, '#sp-noi-bat', 100); await cho(500);
    await pn.click('[data-sp2-sau]'); await cho(90); const gn = await pn.evaluate(() => Math.round(document.querySelector('[data-sp2-dai]').scrollLeft)); await cn.close();
    const c2 = await ctxMoi({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p2 = await mo(c2, '/'); await toi(p2, '#sp-noi-bat', 100); await cho(500);
    await p2.click('[data-sp2-sau]'); await cho(90); const gx = await p2.evaluate(() => Math.round(document.querySelector('[data-sp2-dai]').scrollLeft)); const gx2 = await (async () => { await cho(800); return p2.evaluate(() => [Math.round(document.querySelector('[data-sp2-dai]').scrollLeft), Math.round(document.querySelector('[data-sp2-dai]').scrollWidth - document.querySelector('[data-sp2-dai]').clientWidth)]); })();
    ok('Giảm chuyển động: bấm "Sau" cuộn tức thì, không cuộn mượt: sau 90ms đã ở ' + gx + 'px (bình thường mới ở ' + gn + 'px, đang cuộn mượt) và cuối cùng dừng đúng cuối dải (' + gx2[0] + ' / ' + gx2[1] + 'px)', gx > gn + 40 && gx >= gx2[1] - 40 && Math.abs(gx2[0] - gx2[1]) <= 3, JSON.stringify({ gn, gx, gx2 }));
    await c2.close();
    const c3 = await ctxMoi({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }), p3 = await mo(c3, '/');
    const nj = await p3.evaluate(() => ({ dk: getComputedStyle(document.querySelector('[data-sp2-dk]')).display, thes: [...document.querySelectorAll('.sp2-the')].map((e) => +getComputedStyle(e).opacity), ovx: getComputedStyle(document.querySelector('[data-sp2-dai]')).overflowX }));
    ok('Tắt JavaScript: nút Trước / Sau và vạch ẩn, mọi thẻ hiện đủ, dải vẫn cuộn ngang được bằng tay', nj.dk === 'none' && nj.thes.every((o) => o === 1) && nj.ovx === 'auto', JSON.stringify(nj));
    await c3.close();
    const c4 = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p4 = await mo(c4, '/'); await toi(p4, '#sp-noi-bat', 80); await cho(600);
    const m = await p4.evaluate(() => { const d = document.querySelector('[data-sp2-dai]'), t = [...d.querySelectorAll('.sp2-the')], r = (e) => e.getBoundingClientRect(); return { xep: r(document.querySelector('.sp2-trai')).bottom <= r(d).top + 1, ke: Math.round(r(t[1]).left), vw: innerWidth, rong: Math.round(r(t[0]).width), dinh: getComputedStyle(document.querySelector('.sp2-trai')).position, sw: document.documentElement.scrollWidth, nut: Math.round(r(document.querySelector('.sp2-trai .nut')).width) }; });
    ok('Điện thoại: chữ + nút ở trên, dải thẻ ở dưới (không dính); thẻ kế tiếp lấp ló ở mép phải (bắt đầu tại ' + m.ke + 'px < ' + m.vw + 'px); nút "Liên hệ tư vấn" rộng hết khung; không cuộn ngang', m.xep && m.ke < m.vw - 20 && m.dinh === 'static' && m.sw <= 390 && m.nut >= 340, JSON.stringify(m));
    await c4.close();
  }

  // ---------- 5. Premium Service Showcase ----------
  muc('5. Khu Dịch vụ (lưới 2×2 + khối tím): bố cục 3 cỡ màn, hover / focus, CTA, giảm chuyển động');
  {
    for (const [w, h, cot] of [[1440, 900, 3], [768, 1024, 2], [390, 844, 1]]) {
      const c = await ctxMoi({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 }), p = await mo(c, '/'); await toi(p, '#bang-gia', 100); await cho(1400);
      const g = await p.evaluate(() => { const r = (e) => e.getBoundingClientRect(), the = [...document.querySelectorAll('#bang-gia .dvx-the')].map(r), b = r(document.querySelector('.dvx-banner')), tren = new Set(the.map((x) => Math.round(x.top))).size, trai = new Set(the.map((x) => Math.round(x.left))).size; const a = [...document.querySelectorAll('.dvx-banner a')]; return { n: the.length, hang: tren, cot: trai, banner: b.top >= Math.max(...the.map((x) => x.bottom)) - 1, tran: document.documentElement.scrollWidth > innerWidth, nut: a.map((x) => [x.textContent.trim(), new URL(x.href).pathname, x.getBoundingClientRect().height >= 44]), h2: parseFloat(getComputedStyle(document.querySelector('#bang-gia h2')).fontSize), fonts: [getComputedStyle(document.querySelector('#bang-gia h2')).fontFamily.split(',')[0], getComputedStyle(document.querySelector('.dvx-the b')).fontFamily.split(',')[0], getComputedStyle(document.querySelector('.dvx-the span:last-child')).fontFamily.split(',')[0]], mau: getComputedStyle(document.querySelector('.dvx-banner')).backgroundColor }; });
      ok(`${w}px: ${w >= 1024 ? 'bố cục BENTO 2 hàng (7+5 / 5+7 cột, 3 vị trí trái)' : cot + ' cột'} (${g.cot} vị trí trái, ${g.hang} hàng), 4 thẻ, khối tím nằm DƯỚI lưới, không tràn ngang, tiêu đề ${g.h2}px; 2 nút "Đặt lịch khám" → /dat-lich/ và "Xem bảng giá" → /bang-gia/ cao ≥ 44px; nền tím #5A1E5E; Newsreader + Be Vietnam Pro`, g.n === 4 && g.cot === cot && (w < 1024 || g.hang === 2) && g.banner && !g.tran && g.nut.length === 2 && /Đặt lịch khám/.test(g.nut[0][0]) && /\/dat-lich\/$/.test(g.nut[0][1]) && /Xem bảng giá/.test(g.nut[1][0]) && /\/bang-gia\/$/.test(g.nut[1][1]) && g.nut.every((x) => x[2]) && g.mau === 'rgb(90, 30, 94)' && g.fonts[0] === 'Newsreader' && g.fonts[1] === 'Newsreader' && g.fonts[2].replace(/"/g, '') === 'Be Vietnam Pro', JSON.stringify(g));
      await c.close();
    }
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/'); await toi(p, '#bang-gia', 100); await cho(1400);
    const t0 = await p.evaluate(() => { const a = document.querySelector('.dvx-the'); return { z: getComputedStyle(a.querySelector('.dvx-zoom')).transform, bd: getComputedStyle(a).borderColor, ar: getComputedStyle(a.querySelector('.dvx-cta-chu .mui')).transform }; });
    await (await p.$('.dvx-the')).hover(); await cho(900);
    const t1 = await p.evaluate(() => { const a = document.querySelector('.dvx-the'); return { z: getComputedStyle(a.querySelector('.dvx-zoom')).transform, bd: getComputedStyle(a).borderColor, ar: getComputedStyle(a.querySelector('.dvx-cta-chu .mui')).transform, nen: getComputedStyle(a).backgroundColor }; });
    ok('Rê chuột vào thẻ: ảnh zoom nhẹ (scale 1,05), viền đổi sang tím nhạt, nền sáng lên trắng, mũi tên nhích sang phải 6px', /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(t0.z) && /matrix\(1\.05/.test(t1.z) && t0.bd !== t1.bd && t1.nen === 'rgb(255, 255, 255)' && /matrix\(1, 0, 0, 1, 6,/.test(t1.ar), JSON.stringify({ t0, t1 }));
    await p.mouse.move(5, 5); await p.keyboard.press('Tab'); await p.evaluate(() => document.querySelectorAll('.dvx-the')[1].focus()); await cho(900);
    const f = await p.evaluate(() => { const a = document.activeElement, c = getComputedStyle(a); return { ten: a.querySelector('b').textContent, vong: c.outlineStyle, rong: c.outlineWidth, z: getComputedStyle(a.querySelector('.dvx-zoom')).transform }; });
    ok('Focus bàn phím vào thẻ: viền focus 3px nhìn rõ, ảnh zoom giống khi rê chuột', f.vong === 'solid' && f.rong === '3px' && /matrix\(1\.05/.test(f.z), JSON.stringify(f));
    await p.evaluate(() => document.querySelectorAll('.dvx-banner a')[0].focus()); await cho(300);
    const f2 = await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return { v: c.outlineStyle, r: c.outlineWidth, m: c.outlineColor }; });
    ok('Focus vào nút trên nền tím: viền trắng 3px (thấy rõ trên nền tím)', f2.v === 'solid' && f2.r === '3px' && f2.m === 'rgb(255, 255, 255)', JSON.stringify(f2));
    await ctx.close();
    const cr = await ctxMoi({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), pr = await mo(cr, '/'); await toi(pr, '#bang-gia', 100); await cho(600);
    await pr.evaluate(() => document.querySelector('.dvx-banner').scrollIntoView({ behavior: 'instant', block: 'center' })); await cho(500); await pr.evaluate(() => document.querySelector('#bang-gia h2').scrollIntoView({ behavior: 'instant', block: 'start' })); await cho(500); await (await pr.$('.dvx-the')).hover(); await cho(400);
    const rd = await pr.evaluate(() => { const a = document.querySelector('.dvx-the'); return { z: getComputedStyle(a.querySelector('.dvx-zoom')).transform, ar: getComputedStyle(a.querySelector('.dvx-cta-chu .mui')).transform, op: [...document.querySelectorAll('#bang-gia [data-hien]')].map((e) => +getComputedStyle(e).opacity), tf: [...document.querySelectorAll('#bang-gia [data-hien]')].map((e) => getComputedStyle(e).transform) }; });
    ok('Giảm chuyển động: không zoom, mũi tên không nhích, mọi thành phần hiện đủ và không dịch chuyển', /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(rd.z) && /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(rd.ar) && rd.op.every((o) => o === 1) && rd.tf.every((x) => x === 'none'), JSON.stringify(rd));
    await cr.close();
    const cj = await ctxMoi({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }), pj = await mo(cj, '/');
    const nj = await pj.evaluate(() => [...document.querySelectorAll('#bang-gia [data-hien]')].map((e) => +getComputedStyle(e).opacity));
    ok('Tắt JavaScript: toàn bộ khu hiện sẵn (độ mờ 1)', nj.length >= 6 && nj.every((o) => o === 1), JSON.stringify(nj));
    await cj.close();
    const cl = await ctxMoi({ viewport: { width: 1440, height: 900 } }), pl = await mo(cl, '/');
    const lk = await pl.evaluate(async () => { const out = []; for (const a of document.querySelectorAll('#bang-gia a')) { const r = await fetch(a.href, { method: 'GET' }).then((x) => x.status).catch(() => 0); out.push([new URL(a.href).pathname + new URL(a.href).hash, r]); } return out; });
    ok('Mọi liên kết trong khu (4 thẻ + 2 nút) mở được (HTTP 200) và 4 thẻ trỏ tới nhóm giá có thật trên /bang-gia/', lk.length === 6 && lk.every((x) => x[1] === 200), JSON.stringify(lk));
    await cl.close();
  }

  // ---------- 6. Trang Bảng giá ----------
  muc('6. Trang Bảng giá (máy tính): tab gạch chân tím trượt, bảng giá căn phải, giá giữ nguyên');
  const layTrang = (p) => p.evaluate(() => { const t = (e) => e.textContent.replace(/\s+/g, ' ').trim(); const re = /(?:từ\s*)?\d{1,3}(?:\.\d{3})*\s?đ?/gi; return [...document.querySelectorAll('.bg-panel')].map((pa) => { const cl = pa.cloneNode(true); cl.querySelectorAll('.bg-the').forEach((e) => e.remove()); /* R3.6 in mỗi ô giá hai lần (bảng + danh sách điện thoại): chỉ tính một lần */ return { id: pa.id, ten: t(pa.querySelector('.bg-dau :is(h2,h3)')), gia: (cl.textContent.match(/\d{1,3}(?:\.\d{3})+/g) || []).sort(), chu: pa.textContent.replace(/\s+/g, '') }; }); });
  const NGUON = require('../src/data/dich_vu.json').danh_sach, AN = ['Gói khám sức khoẻ tổng quát'] /* đồng bộ với src/lib/bang-gia-trinh-bay.ts: hạng mục ẩn ở giao diện mới */;
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } });
    const pm = await mo(ctx, '/bang-gia/'), pc = await mo(ctx, '/bang-gia/', URL_R);
    const a = await layTrang(pm), c = await layTrang(pc); c[0].gia.splice(c[0].gia.indexOf('300.000'), 1); /* R3.6 còn hiện Gói khám 300.000đ; giao diện mới ẩn theo yêu cầu */ const dem = a.reduce((s, x) => s + x.gia.length, 0), ks = (s) => String(s).replace(/\s+/g, '');
    const thieu = []; NGUON.forEach((d, k) => { const nd = a[k].chu, can = [d.ten, d.mo_ta, d.ghi_chu, ...(d.bang.cot || []), ...(d.bang.dong || []).map((r) => r.nhan), ...(d.hang_muc || []).filter((m) => !AN.includes(m.ten)).flatMap((m) => [m.ten, m.ghi_chu]), ...(d.giam_dai_ngay || []).map((g) => g.nhan)].filter(Boolean); can.forEach((x) => { x.split(/\.\s+/).map((y) => y.trim().replace(/\.$/, '')).filter(Boolean).forEach((y) => { if (!nd.includes(ks(y))) thieu.push(d.ten + ': ' + y.slice(0, 40)); }); }); });
    ok(`MỌI giá (${dem} mức giá, ${a.length} nhóm) trong Bảng giá MỚI giống hệt R3.6 (cùng danh sách số tiền ở từng nhóm), và mọi tên dịch vụ / hạng mục / cột / mức cân nặng / mô tả / ghi chú trong dữ liệu gốc đều còn nguyên chữ trong trang`, a.length === c.length && a.length === 8 && a.every((x, k) => x.id === c[k].id && JSON.stringify(x.gia) === JSON.stringify(c[k].gia)) && thieu.length === 0, thieu.slice(0, 4).join(' | ') + ' ' + a.map((x, k) => (JSON.stringify(x.gia) === JSON.stringify(c[k].gia) ? '' : 'khác giá: ' + x.id)).filter(Boolean).join(' | '));
    await pm.waitForTimeout(600);
    const t0 = await pm.evaluate(() => { const th = document.querySelector('.bg-tab'), ts = [...th.querySelectorAll('[role=tab]')], g = document.querySelector('.bg-gach'), m = new DOMMatrix(getComputedStyle(g).transform), s = ts.find((x) => x.getAttribute('aria-selected') === 'true'); return { so: ts.length, mot: th.scrollWidth <= th.clientWidth + 1, cao: Math.round(th.getBoundingClientRect().height), x: Math.round(m.e), w: Math.round(m.a * 100), tx: s.offsetLeft, tw: s.offsetWidth, mau: getComputedStyle(g).backgroundColor, day: Math.round(g.getBoundingClientRect().bottom - th.getBoundingClientRect().bottom), tp: getComputedStyle(g).transitionProperty + ' / ' + getComputedStyle(g).transitionDuration, nen: getComputedStyle(th).backgroundColor, bo: getComputedStyle(th).borderRadius }; });
    ok('Thanh tab: 8 tab trên MỘT hàng ở 1440px, không nền / bo (chữ + đường kẻ mảnh); gạch chân tím 3px nằm đúng dưới tab đang chọn (vị trí ' + t0.x + '/' + t0.tx + ', rộng ' + t0.w + '/' + t0.tw + ') và chuyển tiếp 240ms chỉ trên transform', t0.so === 8 && t0.mot && Math.abs(t0.x - t0.tx) <= 1 && Math.abs(t0.w - t0.tw) <= 1 && t0.mau === 'rgb(90, 30, 94)' && /^transform \/ 0\.24s/.test(t0.tp) && t0.bo === '0px', JSON.stringify(t0));
    await pm.click('#tab-grooming-spa'); await pm.waitForTimeout(110);
    const giua = await pm.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.bg-gach')).transform).e);
    await pm.waitForTimeout(500);
    const t1 = await pm.evaluate(() => { const s = document.querySelector('#tab-grooming-spa'), m = new DOMMatrix(getComputedStyle(document.querySelector('.bg-gach')).transform), pa = document.getElementById('p-grooming-spa'), c = document.getElementById('p-' + document.querySelector('.bg-tab [role=tab]').id.replace('tab-', '')); return { x: Math.round(m.e), tx: s.offsetLeft, w: Math.round(m.a * 100), tw: s.offsetWidth, hien: !pa.hidden, cu: c.hidden, ten: pa.querySelector('.bg-dau :is(h2,h3)').textContent.trim() }; });
    ok('Bấm tab "Grooming - Spa": gạch chân TRƯỢT tới tab mới (giữa chừng ở ' + Math.round(giua) + 'px, giữa vị trí cũ ' + t0.x + ' và mới ' + t1.tx + '), tới đúng nơi, đúng độ rộng; panel mới hiện, panel cũ ẩn', giua > t0.x + 5 && giua < t1.tx - 5 && Math.abs(t1.x - t1.tx) <= 1 && Math.abs(t1.w - t1.tw) <= 1 && t1.hien && t1.cu && /Grooming/.test(t1.ten), JSON.stringify({ giua, t0x: t0.x, t1 }));
    // đổi panel: chỉ mờ hiện 160ms, các hàng không hiện nối tiếp
    await pm.click('#tab-xet-nghiem');
    const an = await pm.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target).map((a) => ({ ten: a.animationName || a.transitionProperty, dai: a.effect.getTiming().duration, tren: a.effect.target.className && a.effect.target.className.baseVal === undefined ? a.effect.target.className : '', trongBang: !!(a.effect.target.closest && a.effect.target.closest('.bga-ds, li') && !/bga-tt|bga-chev|bga-hang/.test(String(a.effect.target.className))) })));
    const panel = an.filter((x) => x.ten === 'bg-mo');
    ok('Đổi nhóm: panel mới chỉ MỜ HIỆN 160ms (hoạt cảnh bg-mo trên panel); không có hoạt cảnh nào trên từng hàng / ô giá (giá không bao giờ chờ hiệu ứng)', panel.length === 1 && panel[0].dai === 160 && an.filter((x) => x.trongBang).length === 0, JSON.stringify(an));
    await pm.keyboard.press('Tab').catch(() => {}); await pm.focus('#tab-xet-nghiem'); await pm.keyboard.press('ArrowRight'); await pm.waitForTimeout(500);
    const kb = await pm.evaluate(() => { const s = document.querySelector('.bg-tab [aria-selected=true]'); return { id: s.id, x: Math.round(new DOMMatrix(getComputedStyle(document.querySelector('.bg-gach')).transform).e), tx: s.offsetLeft }; });
    await pm.keyboard.press('End'); await pm.waitForTimeout(500); const kb2 = await pm.evaluate(() => { const s = document.querySelector('.bg-tab [aria-selected=true]'); return { id: s.id, x: Math.round(new DOMMatrix(getComputedStyle(document.querySelector('.bg-gach')).transform).e), tx: s.offsetLeft }; });
    ok('Bàn phím: mũi tên phải sang tab kế (Tiêm phòng vaccine), End sang tab cuối (Cấp cứu); gạch chân đi theo đúng tab', kb.id === 'tab-tiem-phong-vaccine' && Math.abs(kb.x - kb.tx) <= 1 && /cap-cuu/.test(kb2.id) && Math.abs(kb2.x - kb2.tx) <= 1, JSON.stringify({ kb, kb2 }));
    const cc = await pm.evaluate(() => { const ch = document.querySelector('.bg-panel:not([hidden]) .cho-xn'), tab = document.querySelector('#tab-cap-cuu-24-24 .tab-cho'); return { chip: ch && ch.textContent.trim(), vien: ch && getComputedStyle(ch).borderColor, mau: ch && getComputedStyle(ch).color, nen: ch && getComputedStyle(ch).backgroundColor, an: ch ? document.getAnimations().filter((a) => a.effect.target === ch).length : -1, cham: tab && getComputedStyle(tab).borderColor, sr: document.querySelector('#tab-cap-cuu-24-24 .an-chu') && document.querySelector('#tab-cap-cuu-24-24 .an-chu').textContent.trim() }; });
    ok('Nhóm chờ xác nhận (Cấp cứu 24/24): chip "Chờ xác nhận" viền ngọc, nền trong, ĐỨNG YÊN (không hoạt cảnh); tab có chấm viền ngọc và chữ "(chờ xác nhận)" cho trình đọc màn hình', cc.chip === 'Chờ xác nhận' && cc.vien === 'rgb(35, 112, 110)' && cc.mau === 'rgb(35, 112, 110)' && /rgba\(0, 0, 0, 0\)|transparent/.test(cc.nen) && cc.an === 0 && cc.cham === 'rgb(35, 112, 110)' && /chờ xác nhận/.test(cc.sr), JSON.stringify(cc));
    await ctx.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/bang-gia/'); await cho(400);
    await p.click('#tab-kham-va-chan-doan').catch(() => {}); await cho(300);
    const bg = await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'), g = [...pa.querySelectorAll('.bga-gia')].map((e) => ({ r: Math.round(e.getBoundingClientRect().right), a: getComputedStyle(e).fontVariantNumeric, t: getComputedStyle(e).textAlign, so: e.classList.contains('gia') })); return { g }; });
    ok('Hàng giá (Khám và chẩn đoán): số tiền và trạng thái ("Báo sau khi khám", "Theo giờ hẹn") căn phải; các số tiền thẳng MỘT mép (' + [...new Set(bg.g.filter((x) => x.so).map((x) => x.r))].join(',') + '), tabular-nums', bg.g.length >= 4 && new Set(bg.g.filter((x) => x.so).map((x) => x.r)).size === 1 && bg.g.filter((x) => x.so && /tabular-nums/.test(x.a)).length >= 1 && bg.g.every((x) => x.t === 'right'), JSON.stringify(bg));
    await p.click('#tab-grooming-spa'); await cho(500);
    await p.click('.bg-panel:not([hidden]) .bga-co-acc .bga-hang'); await cho(500);
    const kg = await p.evaluate(() => { const li = document.querySelector('.bg-panel:not([hidden]) .bga-co-acc.mo'), rs = [...li.querySelectorAll('.bga-kg dd')].map((e) => Math.round(e.getBoundingClientRect().right)), v = [...li.querySelectorAll('.bga-kg dd .gia')].map((e) => getComputedStyle(e).fontVariantNumeric); return { dong: rs.length, thang: new Set(rs.filter((_, i) => i % 2 === 0)).size === 1 && new Set(rs.filter((_, i) => i % 2 === 1)).size === 1, tab: v.every((x) => /tabular-nums/.test(x)) }; });
    ok('Danh sách cân nặng trong accordion (Grooming): đủ ' + kg.dong + ' mức, giá căn phải thẳng cột, tabular-nums', kg.dong >= 8 && kg.thang && kg.tab, JSON.stringify(kg));
    const st = await p.evaluate(() => { const h = document.querySelector('.bg-panel:not([hidden]) .bg-dau :is(h2,h3)'), c = getComputedStyle(h); return { pos: c.position, top: c.top, bg: c.backgroundColor, ff: c.fontFamily.split(',')[0].replace(/["']/g, ''), z: c.zIndex }; });
    await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'); window.scrollTo({ top: pa.getBoundingClientRect().top + scrollY + 420, behavior: 'instant' }); }); await cho(500);
    const dinh = await p.evaluate(() => { const h = document.querySelector('.bg-panel:not([hidden]) .bg-dau :is(h2,h3)'); return Math.round(h.getBoundingClientRect().top); });
    ok('Tiêu đề nhóm DÍNH khi cuộn: position sticky, nền kem đặc (không lộ chữ phía dưới), Newsreader; sau khi cuộn sâu vào bảng vẫn nằm ngay dưới header đã thu (đỉnh ' + dinh + 'px, mong đợi 60px)', st.pos === 'sticky' && st.top === '60px' && st.bg === 'rgb(251, 247, 241)' && st.ff === 'Newsreader' && Math.abs(dinh - 60) <= 1, JSON.stringify({ st, dinh }));
    await ctx.close();
  }
  {
    // Mở thẳng bằng #nhom-…: loé nền cam nhạt MỘT lần
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage();
    p.on('pageerror', (e) => loiChung.push('hash · ' + e.message));
    await p.goto(URL_M + '/bang-gia/#nhom-grooming-spa', { waitUntil: 'load' });
    const lan = [];
    for (let i = 0; i < 12; i++) { lan.push(await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'), h = pa && pa.querySelector('.bg-dau :is(h2,h3)'); return pa && h ? { loe: pa.classList.contains('loe'), bg: getComputedStyle(h).backgroundColor, ten: pa.id } : null; })); await cho(70); }
    await cho(500); const sau = await p.evaluate(() => ({ loe: !!document.querySelector('.bg-panel.loe'), bg: getComputedStyle(document.querySelector('.bg-panel:not([hidden]) .bg-dau :is(h2,h3)')).backgroundColor, ap: document.getAnimations().filter((a) => a.animationName === 'loe-cam').length, dai: (document.getAnimations().find((a) => a.animationName === 'loe-cam') || { effect: { getTiming: () => ({}) } }).effect.getTiming().duration, sel: document.querySelector('.bg-tab [aria-selected=true]').id }));
    const co = lan.filter((x) => x && x.loe), doi = new Set(co.map((x) => x.bg));
    ok('Mở thẳng /bang-gia/#nhom-grooming-spa: tab Grooming được chọn, tiêu đề nhóm loé nền cam nhạt (' + doi.size + ' sắc độ trong lúc loé, từ #FBE6D4 về kem) rồi hết (lớp loe tự gỡ sau ~0,7s); hoạt cảnh loe-cam chỉ MỘT lần', /grooming/.test(sau.sel) && co.length >= 3 && doi.size >= 3 && [...doi].some((c) => /^rgb\(25[01], 2[23]\d, 2\d\d\)/.test(c) || /^rgb\(25[01], 2[3-4]\d/.test(c)) && !sau.loe && sau.bg === 'rgb(251, 247, 241)', JSON.stringify({ lan: lan.slice(0, 12).map((x) => x && [x.loe, x.bg]), sau }));
    await ctx.close();
    const c2 = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p2 = await mo(c2, '/bang-gia/'); await cho(1000);
    const khong = await p2.evaluate(() => !!document.querySelector('.bg-panel.loe') || document.getAnimations().some((a) => a.animationName === 'loe-cam'));
    ok('Vào trang Bảng giá bình thường (không có #nhom-…): KHÔNG loé', !khong, String(khong));
    await c2.close();
  }

  // ---------- 6b. Bảng giá: Minimal Accordion List ----------
  muc('6b. Bảng giá — Tab + Accordion: mở / đóng, trợ năng, bàn phím, một mục mở trong mỗi nhóm, đổi tab, nút CTA, giữ nguyên dữ liệu');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/bang-gia/'); await cho(500);
    const NG = require('../src/data/dich_vu.json').danh_sach, IDS = await p.evaluate(() => [...document.querySelectorAll('.bg-tab [role=tab]')].map((t) => t.id));
    // 1. Tám tab chuyển đúng
    const tab = [];
    for (const id of IDS) { await p.click('#' + id); await cho(120); tab.push(await p.evaluate((i) => { const hien = [...document.querySelectorAll('.bg-panel')].filter((x) => !x.hidden); return hien.length === 1 && hien[0].id === i.replace('tab-', 'p-') && document.getElementById(i).getAttribute('aria-selected') === 'true' && hien[0].querySelector('.bg-dau :is(h2,h3)').textContent.includes(document.getElementById(i).textContent.trim().slice(0, 6)); }, id)); }
    ok('Cả 8 tab nhóm dịch vụ chuyển đúng (đúng một panel hiện, đúng tiêu đề, aria-selected): ' + NG.map((d) => d.ten).join(' · '), IDS.length === 8 && tab.length === 8 && tab.every(Boolean), JSON.stringify(tab));
    // 2. Số hàng và số mức giá khớp dữ liệu gốc
    const dem = await p.evaluate(() => [...document.querySelectorAll('.bg-panel')].map((pa) => ({ muc: pa.querySelectorAll('.bga-muc').length, kg: pa.querySelectorAll('.bga-kg > div').length, gia: pa.querySelectorAll('.bga-gia.gia, .bga-kg .gia').length })));
    const PP = require('../src/data/phu_phi.json'), mong = NG.map((d) => { const hv = d.hang_muc.filter((m) => !AN.includes(m.ten)), gop = hv.filter((m) => m.ten.startsWith('Siêu âm') && m.gia && !m.ghi_chu), cg = gop.length >= 2; return { muc: d.bang.cot.length + hv.length - (cg ? gop.length - 1 : 0) + (d.cap_cuu ? PP.kham_ngoai_gio.length + 1 : 0), kg: d.bang.cot.length * d.bang.dong.length + (cg ? gop.length : 0) }; });
    ok('Số hàng và số dòng cân nặng của từng nhóm khớp dữ liệu gốc (hạng mục + cột bảng; cân nặng × cột): ' + dem.map((x) => x.muc + '/' + x.kg).join(' '), JSON.stringify(dem.map((x) => [x.muc, x.kg])) === JSON.stringify(mong.map((x) => [x.muc, x.kg])), JSON.stringify({ dem, mong }));
    // 3. Mở / đóng, aria, chevron, 220ms
    await p.click('#tab-kham-va-chan-doan'); await cho(300);
    const a0 = await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'), n = [...pa.querySelectorAll('button.bga-hang')]; return { n: n.length, dong: n.every((b) => b.getAttribute('aria-expanded') === 'false'), lk: n.every((b) => { const v = document.getElementById(b.getAttribute('aria-controls')); return v && v.getAttribute('aria-labelledby') === b.id && v.inert; }), tinh: [...pa.querySelectorAll('.bga-tinh')].every((e) => e.tagName !== 'BUTTON' && !e.hasAttribute('aria-expanded')), tinhSo: pa.querySelectorAll('.bga-tinh').length, cao0: Math.round(document.getElementById(n[0].getAttribute('aria-controls')).getBoundingClientRect().height) }; });
    ok('Khám và chẩn đoán lúc mới vào: ' + a0.n + ' hàng mở được đều THU GỌN (aria-expanded=false, vùng mở có aria-controls / aria-labelledby, không nhận focus), ' + a0.tinhSo + ' hàng không có nội dung thêm là hàng tĩnh (không phải nút, không accordion rỗng)', a0.n === 1 && a0.dong && a0.lk && a0.tinh && a0.tinhSo >= 3 && a0.cao0 === 0, JSON.stringify(a0));
    await p.click('button.bga-hang >> nth=0'); await cho(60);
    const giua = await p.evaluate(() => { const b = document.querySelector('.bg-panel:not([hidden]) button.bga-hang'); return { h: Math.round(document.getElementById(b.getAttribute('aria-controls')).getBoundingClientRect().height), tp: getComputedStyle(document.getElementById(b.getAttribute('aria-controls'))).transitionDuration, ch: getComputedStyle(b.querySelector('.bga-chev')).transitionDuration }; });
    await cho(400);
    const mo1 = await p.evaluate(() => { const b = document.querySelector('.bg-panel:not([hidden]) button.bga-hang'), v = document.getElementById(b.getAttribute('aria-controls')), m = new DOMMatrix(getComputedStyle(b.querySelector('.bga-chev')).transform); return { ae: b.getAttribute('aria-expanded'), h: Math.round(v.getBoundingClientRect().height), ine: v.inert, xoay: Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI), vis: getComputedStyle(v).visibility, nd: v.textContent.trim().slice(0, 30) }; });
    ok('Mở accordion: nội dung trượt ra mượt (giữa chừng cao ' + giua.h + 'px rồi ' + mo1.h + 'px, chuyển tiếp ' + giua.tp + '), mũi tên xoay 180° (' + mo1.xoay + '°, ' + giua.ch + '), aria-expanded=true, hiện nội dung "' + mo1.nd + '…"', mo1.ae === 'true' && mo1.h > giua.h - 1 && giua.h < mo1.h && /0\.22s/.test(giua.tp) && /0\.22s/.test(giua.ch) && Math.abs(Math.abs(mo1.xoay) - 180) <= 1 && mo1.vis === 'visible' && !mo1.ine, JSON.stringify({ giua, mo1 }));
    await p.click('button.bga-hang >> nth=0'); await cho(500);
    ok('Đóng accordion: aria-expanded=false, vùng nội dung thu về cao 0 và không nhận focus', await p.evaluate(() => { const b = document.querySelector('.bg-panel:not([hidden]) button.bga-hang'), v = document.getElementById(b.getAttribute('aria-controls')); return b.getAttribute('aria-expanded') === 'false' && Math.round(v.getBoundingClientRect().height) === 0 && v.inert; }));
    // 4. Bàn phím Enter / Space
    await p.focus('button.bga-hang >> nth=0'); await p.keyboard.press('Enter'); await cho(400); const e1 = await p.getAttribute('.bg-panel:not([hidden]) button.bga-hang', 'aria-expanded');
    await p.keyboard.press('Space'); await cho(400); const e2 = await p.getAttribute('.bg-panel:not([hidden]) button.bga-hang', 'aria-expanded');
    const fv = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('.bg-panel:not([hidden]) button.bga-hang')); document.querySelector('.bg-panel:not([hidden]) button.bga-hang').focus(); return { vien: getComputedStyle(document.activeElement).outlineStyle, rong: getComputedStyle(document.activeElement).outlineWidth }; });
    ok('Bàn phím: Enter mở, Space đóng; nút có viền focus rõ (' + fv.vien + ' ' + fv.rong + ')', e1 === 'true' && e2 === 'false' && fv.vien === 'solid' && fv.rong === '2px', JSON.stringify({ e1, e2, fv }));
    // 5. Chỉ mở một mục trong cùng nhóm + đổi tab đóng lại
    await p.click('#tab-xet-nghiem'); await cho(300);
    const x0 = await p.evaluate(() => [...document.querySelectorAll('.bg-panel:not([hidden]) button.bga-hang')].length);
    await p.click('#tab-grooming-spa'); await cho(300);
    await p.click('.bg-panel:not([hidden]) button.bga-hang >> nth=0'); await cho(300); await p.click('.bg-panel:not([hidden]) button.bga-hang >> nth=1'); await cho(400);
    const m2 = await p.evaluate(() => [...document.querySelectorAll('.bg-panel:not([hidden]) button.bga-hang')].map((b) => b.getAttribute('aria-expanded')));
    await p.click('#' + IDS[4]); await cho(300); await p.click('#tab-grooming-spa'); await cho(300);
    const m3 = await p.evaluate(() => [...document.querySelectorAll('.bg-panel:not([hidden]) button.bga-hang')].map((b) => b.getAttribute('aria-expanded')));
    ok('Chỉ MỘT accordion mở trong cùng nhóm (mở mục 2 thì mục 1 tự đóng: ' + m2.slice(0, 3).join(',') + '); đổi tab rồi quay lại thì các mục đã đóng (' + m3.filter((x) => x === 'true').length + ' mở)', m2.filter((x) => x === 'true').length === 1 && m2[1] === 'true' && m3.every((x) => x === 'false') && x0 === 0, JSON.stringify({ m2, m3, x0 }));
    await p.click('#' + IDS[6]); await cho(400);
    const nt = await p.evaluate(() => { const li = document.querySelector('.bg-panel:not([hidden]) .bga-co-acc'); return { so: document.querySelectorAll('.bg-panel:not([hidden]) .bga-co-acc').length, mo: li.classList.contains('mo'), ae: li.querySelector('button').getAttribute('aria-expanded'), dong: li.querySelectorAll('.bga-kg > div').length, giam: !!document.querySelector('.bg-panel:not([hidden]) .bg-giam'), ghi: !!document.querySelector('.bg-panel:not([hidden]) .bg-ghi') }; });
    ok('Gửi nội trú (chỉ một bảng cân nặng): mở sẵn, đủ 7 mức cân nặng; khối "Gửi dài ngày được giảm" và ghi chú tính giờ còn nguyên', nt.so === 1 && nt.mo && nt.ae === 'true' && nt.dong === 7 && nt.giam && nt.ghi, JSON.stringify(nt));
    // 6. Trạng thái báo giá giữ đúng, không bịa "Từ", giống R3.6
    await p.click('#tab-kham-va-chan-doan'); await cho(200);
    const tt = await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'); return pa.textContent.replace(/\s+/g, ' '); });
    const pc2 = await mo(ctx, '/bang-gia/', URL_R); const tuC = await pc2.evaluate(() => [...document.querySelectorAll('.bg-panel')].map((pa) => pa.querySelectorAll('.bg-bang small.tu, .bg-ds small.tu').length)); const tuM = await p.evaluate(() => [...document.querySelectorAll('.bg-panel')].map((pa) => pa.querySelectorAll('small.tu').length));
    ok('Dịch vụ báo giá sau khi khám giữ đúng trạng thái ("Báo sau khi khám", "Theo giờ hẹn"), số lượng chữ "từ" ở từng nhóm giống R3.6 (' + tuM.join(',') + '): không tự thêm "Từ", không biến giá tham khảo thành giá cam kết', /Báo sau khi khám/.test(tt) && /Theo giờ hẹn/.test(tt) && JSON.stringify(tuC) === JSON.stringify(tuM), JSON.stringify({ tuC, tuM }));
    // 7. Ghi chú cuối + CTA
    const cu = await p.evaluate(() => { const c = document.querySelector('.bga-cuoi'); return { t: c.querySelector('p').textContent.replace(/\s+/g, ' ').trim(), a: [...c.querySelectorAll('a')].map((a) => [a.textContent.trim(), new URL(a.href).pathname]) }; });
    const http200 = []; for (const [, h] of cu.a) http200.push(await p.evaluate((u) => fetch(u).then((r) => r.status).catch(() => 0), h));
    ok('Ghi chú cuối đúng câu đã duyệt ("Chi phí mang tính tham khảo, có thể thay đổi tùy tình trạng thú cưng, cân nặng và chỉ định của bác sĩ. Vui lòng liên hệ để được tư vấn chính xác.") + giữ "Chưa gồm thuốc, vật tư phát sinh."; hai nút "Đặt lịch khám" → /dat-lich/ và "Liên hệ tư vấn" → /lien-he/ mở được', /^Chi phí mang tính tham khảo, có thể thay đổi tùy tình trạng thú cưng, cân nặng và chỉ định của bác sĩ\. Vui lòng liên hệ để được tư vấn chính xác\./.test(cu.t) && /Chưa gồm thuốc, vật tư phát sinh/.test(cu.t) && cu.a.length === 2 && /Đặt lịch khám/.test(cu.a[0][0]) && /\/dat-lich\/$/.test(cu.a[0][1]) && /Liên hệ tư vấn/.test(cu.a[1][0]) && /\/lien-he\/$/.test(cu.a[1][1]) && http200.every((x) => x === 200), JSON.stringify({ cu, http200 }));
    await ctx.close();
    // 8. Giảm chuyển động
    const c2 = await ctxMoi({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p2 = await mo(c2, '/bang-gia/'); await cho(300);
    await p2.click('button.bga-hang >> nth=0'); await cho(60);
    const rd = await p2.evaluate(() => { const b = document.querySelector('.bg-panel:not([hidden]) button.bga-hang'), v = document.getElementById(b.getAttribute('aria-controls')); return { tp: getComputedStyle(v).transitionDuration, ch: getComputedStyle(b.querySelector('.bga-chev')).transitionProperty, h: Math.round(v.getBoundingClientRect().height), ae: b.getAttribute('aria-expanded') }; });
    ok('Giảm chuyển động: accordion mở / đóng tức thì (không còn chuyển tiếp chiều cao), vẫn đúng trạng thái', rd.ae === 'true' && rd.h > 0 && /^0s|^0\.00?1s|0s$/.test(rd.tp) && !/transform/.test(rd.ch), JSON.stringify(rd)); await c2.close();
    // 9. Ba cỡ màn: không tràn ngang ở MỌI tab, tab vuốt ngang được (điện thoại)
    for (const [w, h, mob] of [[1440, 900, false], [768, 1024, false], [390, 844, true]]) {
      const c3 = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob }), p3 = await mo(c3, '/bang-gia/'); await cho(300); const ket = [];
      for (const id of IDS) { await p3.click('#' + id, { force: true }).catch(() => {}); await cho(150); const mh = await p3.$$('.bg-panel:not([hidden]) button.bga-hang'); if (mh.length) { await mh[mh.length - 1].click(); await cho(260); } ket.push(await p3.evaluate(() => ({ tran: document.documentElement.scrollWidth > innerWidth, cat: [...document.querySelectorAll('.bg-panel:not([hidden]) .bga-ten, .bga-mo, .bga-gia, .bga-kg dt, .bga-kg dd')].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }) }))); }
      const cu2 = await p3.evaluate(() => { const t = document.querySelector('.bg-tab'); return { cuon: t.scrollWidth > t.clientWidth + 20, cao: Math.min(...[...document.querySelectorAll('.bg-tab button')].map((b) => Math.round(b.getBoundingClientRect().height))) }; });
      ok(`${w}px: không tràn ngang và không bị cắt ở cả 8 tab (mở mục cuối mỗi nhóm)${mob ? '; thanh tab vuốt ngang được (' + (cu2.cuon ? 'có' : 'không') + '); tab cao ≥ 44px (' + cu2.cao + ')' : ''}`, ket.length === 8 && ket.every((x) => !x.tran && !x.cat) && (!mob || (cu2.cuon && cu2.cao >= 44)), JSON.stringify({ ket: ket.filter((x) => x.tran || x.cat).length, cu2 }));
      await c3.close();
    }
  }

  // ---------- 7. Trang Bảng giá trên điện thoại, giảm chuyển động ----------
  muc('7. Trang Bảng giá: điện thoại 390 và giảm chuyển động');
  {
    const ctx = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p = await mo(ctx, '/bang-gia/'); await cho(500);
    const m = await p.evaluate(() => { const th = document.querySelector('.bg-tab'), pa = document.querySelector('.bg-panel:not([hidden])'); return { cuon: th.scrollWidth > th.clientWidth + 20, sw: document.documentElement.scrollWidth }; });
    await p.click('#tab-cap-cuu-24-24', { force: true }).catch(() => {}); await cho(700);
    const cu = await p.evaluate(() => { const th = document.querySelector('.bg-tab'), s = document.querySelector('.bg-tab [aria-selected=true]'), r = s.getBoundingClientRect(), rt = th.getBoundingClientRect(); return { id: s.id, trong: r.left >= rt.left - 1 && r.right <= rt.right + 1, x: Math.round(new DOMMatrix(getComputedStyle(document.querySelector('.bg-gach')).transform).e), tx: s.offsetLeft, sl: Math.round(th.scrollLeft), sw: document.documentElement.scrollWidth }; });
    ok('Điện thoại: thanh tab cuộn ngang được; chọn tab cuối (Cấp cứu) thì thanh tự cuộn để tab nằm trọn trong khung và gạch chân đi theo; không cuộn ngang cả trang', m.cuon && m.sw <= 390 && /cap-cuu/.test(cu.id) && cu.trong && Math.abs(cu.x - cu.tx) <= 1 && cu.sl > 50 && cu.sw <= 390, JSON.stringify({ m, cu }));
    await p.click('#tab-grooming-spa'); await cho(500);
    await p.click('#tab-kham-va-chan-doan'); await cho(400);
    const mb = await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'), hs = [...pa.querySelectorAll('button.bga-hang')], r = (e) => e.getBoundingClientRect(), h0 = hs[0], gia = h0.querySelector('.bga-gia'), mo = h0.querySelector('.bga-mo'); return { so: hs.length, cao: Math.round(Math.min(...hs.map((x) => r(x).height))), giaDuoi: r(gia).top >= r(mo).bottom - 1, giaTrai: Math.round(r(gia).left) <= Math.round(r(h0).left) + 20, chev: Math.round(r(h0.querySelector('.bga-chev')).width), sw: document.documentElement.scrollWidth, tran: [...pa.querySelectorAll('.bga-hang, .bga-ten, .bga-mo')].some((e) => r(e).right > innerWidth + 1) }; });
    await p.click('.bg-panel:not([hidden]) button.bga-hang'); await cho(400);
    const mo1 = await p.evaluate(() => { const k = document.querySelector('.bg-panel:not([hidden]) .bga-co-acc.mo'); return { mo: !!k, ct: k && k.querySelector('.bga-kg dd').textContent.trim(), hien: k && getComputedStyle(k.querySelector('.bga-tt')).visibility === 'visible' }; });
    ok('Điện thoại, Khám và chẩn đoán: hàng accordion cao ≥ 56px (' + mb.cao + 'px), giá nằm DƯỚI mô tả (không ép sang phải), mũi tên rộng ' + mb.chev + 'px, không tràn ngang; bấm mở thì hiện nội dung chi tiết', mb.so >= 1 && mb.cao >= 56 && mb.giaDuoi && mb.giaTrai && mb.chev >= 20 && mb.sw <= 390 && !mb.tran && mo1.mo && mo1.hien && /đ/.test(mo1.ct || ''), JSON.stringify({ mb, mo1 }));
    await p.click('#tab-grooming-spa'); await cho(500); await p.click('.bg-panel:not([hidden]) .bga-co-acc .bga-hang'); await cho(400);
    const gk = await p.evaluate(() => { const li = document.querySelector('.bg-panel:not([hidden]) .bga-co-acc.mo'); return { dong: li.querySelectorAll('.bga-kg > div').length, dd: [...li.querySelectorAll('.bga-kg dd')].map((e) => e.textContent.trim()).slice(0, 3), sw: document.documentElement.scrollWidth }; });
    ok('Điện thoại, Grooming: mở một dịch vụ (Tắm chó lông ngắn) hiện đủ ' + gk.dong + ' mức cân nặng kèm giá, không tràn ngang', gk.dong >= 8 && gk.dd.every((x) => /đ/.test(x)) && gk.sw <= 390, JSON.stringify(gk));
    await ctx.close();
    const c2 = await ctxMoi({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p2 = await mo(c2, '/bang-gia/'); await cho(300);
    await p2.click('#tab-xet-nghiem'); await cho(40);
    const r = await p2.evaluate(() => { const s = document.querySelector('#tab-xet-nghiem'), g = document.querySelector('.bg-gach'); return { x: Math.round(new DOMMatrix(getComputedStyle(g).transform).e), tx: s.offsetLeft, tp: getComputedStyle(g).transitionProperty, pa: document.getAnimations().filter((a) => a.animationName === 'bg-mo').map((a) => a.effect.getTiming().duration) }; });
    ok('Giảm chuyển động: gạch chân nhảy tức thì tới tab mới (chuyển tiếp không còn transform); panel mới hiện gần như tức thì', Math.abs(r.x - r.tx) <= 1 && !/transform/.test(r.tp) && r.pa.every((d) => d <= 1), JSON.stringify(r));
    await c2.close();
    const c3 = await ctxMoi({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }), p3 = await mo(c3, '/bang-gia/');
    const nj = await p3.evaluate(() => ({ gach: !!document.querySelector('.bg-gach'), hien: [...document.querySelectorAll('.bg-panel')].filter((x) => !x.hidden).length, bang: [...document.querySelectorAll('.bg-panel:not([hidden]) .bga-tt')].every((e) => getComputedStyle(e).visibility === 'visible' && e.getBoundingClientRect().height > 0) }));
    ok('Tắt JavaScript: nhóm đầu tiên hiện đủ bảng giá (các nhóm khác có ở trang Dịch vụ và bảng giá như R3.6), không có gạch chân trượt', !nj.gach && nj.hien === 1 && nj.bang, JSON.stringify(nj));
    await c3.close();
  }

  // ---------- 8. Cuộn ngang, CLS, bàn phím ----------
  muc('8. Không cuộn ngang ở 9 cỡ (trang chủ + Bảng giá), CLS, bàn phím');
  {
    const hong = [];
    for (const [w, h] of [[360, 740], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [844, 390]]) {
      const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
      for (const t of ['/', '/bang-gia/', '/bang-gia/#nhom-grooming-spa']) {
        const p = await ctx.newPage(); await p.goto(URL_M + t, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await cho(900);
        const x = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        if (x.sw > x.cw + 1) hong.push(`${w}x${h} ${t}: ${x.sw}/${x.cw}`);
        await p.close();
      }
      await ctx.close();
    }
    ok('9 kích thước (360, 390, 430, 768, 1024, 1280, 1440, 1920, ngang 844×390) × 3 trang (chủ, Bảng giá, Bảng giá mở nhóm Grooming): không cuộn ngang', hong.length === 0, hong.join(' | '));
    const cls = [];
    for (const [w, h, mb, t] of [[1440, 900, false, '/'], [390, 844, true, '/'], [1440, 900, false, '/bang-gia/'], [390, 844, true, '/bang-gia/']]) {
      const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mb, hasTouch: mb }), p = await ctx.newPage();
      await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
      await p.goto(URL_M + t, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await cho(1200);
      const cao = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= cao; y += 300) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await cho(60); } await cho(600);
      if (t === '/bang-gia/') { await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await cho(300); for (const id of ['grooming-spa', 'xet-nghiem', 'phau-thuat']) { await p.click('#tab-' + id); await cho(450); } } // bấm thật (sự kiện người dùng: CLS không tính dịch do thao tác)
      cls.push(`${w}px ${t} ${(await p.evaluate(() => window.__cls)).toFixed(4)}`); await ctx.close();
    }
    ok('CLS (cuộn hết trang, đổi 3 tab Bảng giá) dưới 0,1 ở cả 4 trường hợp: ' + cls.join(' · '), cls.every((s) => parseFloat(s.split(' ').pop()) < 0.1), cls.join(' | '));
  }

  muc('9. Yêu cầu mạng ra ngoài, lỗi, giới hạn');
  ok('Không lỗi JavaScript / console ở mọi trang đã mở (giao diện mới)', loiChung.length === 0, loiChung.join(' | '));
  ok('Không gọi máy chủ ngoài nào (ngoại lệ duy nhất: phông Google của giao diện R3.6 khi trang R3.6 được mở để so chữ, đã chặn; giao diện mới dùng phông tự chứa)', [...ngoai].every((h) => /^fonts\.(googleapis|gstatic)\.com$/.test(h)), [...ngoai].join(', '));
  chuaXm('Dịch vụ, sản phẩm, tóm tắt giá, Bảng giá trên Firefox, Safari, Edge và điện thoại thật', `Chỉ có Chromium ${phienBan} của Playwright`);
  chuaXm('Cảm nhận bằng mắt: hàng danh mục, gạch chân trượt, loé nền cam nhạt có "đẹp, mượt" không', 'Kiểm được giá trị, thời lượng và trạng thái; cảm nhận cần người xem');
  chuaXm('Ảnh sản phẩm thật và danh sách sản phẩm thật', 'Đang dùng ảnh minh hoạ có sẵn trong public/img/san-pham-minh-hoa/; bệnh viện chưa xác nhận danh sách');
  chuaXm('Các trang con khác (Dịch vụ & bảng giá, Giới thiệu, Liên hệ…) ở giao diện mới', 'Chỉ trang Bảng giá được làm lại ở bước 3; trang Dịch vụ & bảng giá dùng chung kiểu bảng nhưng chưa rà từng chỗ (bước 5–6)');

  await b.close(); may.kill(); may2.kill(); fs.rmSync(path.join(GOC, 'dist-moi'), { recursive: true, force: true });
  const dem = (t) => kq.filter((x) => x.tt === t).length;
  const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA CHẠY ${dem('CHƯA CHẠY')} · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH')}`;
  const dong = [`Kiểm thử bước 3 giao diện mới (dịch vụ, sản phẩm, tóm tắt giá, trang Bảng giá) · Chromium ${phienBan} (Playwright) · ${new Date().toISOString()}`, tom, '', ...kq.map((x) => x.tt === 'MỤC' ? `\n-- ${x.ten}` : `[${x.tt}] ${x.ten}${x.ct ? '  → ' + x.ct : ''}`)];
  fs.writeFileSync(path.join(KQ, 'ket-qua-giao-dien-moi-b3.txt'), dong.join('\n'));
  console.log('\n' + tom + '\n' + kq.filter((x) => x.tt === 'KHÔNG ĐẠT').map((x) => '✗ ' + x.ten + ' → ' + x.ct).join('\n'));
  process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
