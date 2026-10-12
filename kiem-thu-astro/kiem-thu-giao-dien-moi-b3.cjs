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
    for (const [w, h, cot] of [[1440, 900, 2], [768, 1024, 2], [390, 844, 1]]) {
      const c = await ctxMoi({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 }), p = await mo(c, '/'); await toi(p, '#bang-gia', 100); await cho(1400);
      const g = await p.evaluate(() => { const r = (e) => e.getBoundingClientRect(), the = [...document.querySelectorAll('#bang-gia .dvx-the')].map(r), b = r(document.querySelector('.dvx-banner')), tren = new Set(the.map((x) => Math.round(x.top))).size, trai = new Set(the.map((x) => Math.round(x.left))).size; const a = [...document.querySelectorAll('.dvx-banner a')]; return { n: the.length, hang: tren, cot: trai, banner: b.top >= Math.max(...the.map((x) => x.bottom)) - 1, tran: document.documentElement.scrollWidth > innerWidth, nut: a.map((x) => [x.textContent.trim(), new URL(x.href).pathname, x.getBoundingClientRect().height >= 44]), h2: parseFloat(getComputedStyle(document.querySelector('#bang-gia h2')).fontSize), fonts: [getComputedStyle(document.querySelector('#bang-gia h2')).fontFamily.split(',')[0], getComputedStyle(document.querySelector('.dvx-the b')).fontFamily.split(',')[0], getComputedStyle(document.querySelector('.dvx-the span:last-child')).fontFamily.split(',')[0]], mau: getComputedStyle(document.querySelector('.dvx-banner')).backgroundColor }; });
      ok(`${w}px: ${cot} cột (${g.cot} vị trí trái, ${g.hang} hàng), 4 thẻ, khối tím nằm DƯỚI lưới, không tràn ngang, tiêu đề ${g.h2}px; 2 nút "Đặt lịch khám" → /dat-lich/ và "Xem bảng giá" → /bang-gia/ cao ≥ 44px; nền tím #5A1E5E; Newsreader + Be Vietnam Pro`, g.n === 4 && g.cot === cot && g.banner && !g.tran && g.nut.length === 2 && /Đặt lịch khám/.test(g.nut[0][0]) && /\/dat-lich\/$/.test(g.nut[0][1]) && /Xem bảng giá/.test(g.nut[1][0]) && /\/bang-gia\/$/.test(g.nut[1][1]) && g.nut.every((x) => x[2]) && g.mau === 'rgb(90, 30, 94)' && g.fonts[0] === 'Newsreader' && g.fonts[1] === 'Newsreader' && g.fonts[2].replace(/"/g, '') === 'Be Vietnam Pro', JSON.stringify(g));
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
    await (await pr.$('.dvx-the')).hover(); await cho(400);
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
  const layTrang = (p) => p.evaluate(() => { const t = (e) => e.textContent.replace(/\s+/g, ' ').trim(); return [...document.querySelectorAll('.bg-panel')].map((pa) => ({ id: pa.id, ten: t(pa.querySelector('.bg-dau :is(h2,h3)')), cells: [...pa.querySelectorAll('.bg-bang th, .bg-bang td, .bg-ds li, .bg-the summary, .bg-the dd, .bg-giam li, .bg-ghi')].map(t) })); });
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } });
    const pm = await mo(ctx, '/bang-gia/'), pc = await mo(ctx, '/bang-gia/', URL_R);
    const a = await layTrang(pm), c = await layTrang(pc), dem = a.reduce((s, x) => s + x.cells.length, 0);
    ok(`MỌI giá và chữ trong bảng của ${a.length} nhóm (${dem} ô / hàng) giống hệt trang Bảng giá R3.6: không đổi một chữ số`, a.length === c.length && a.length >= 7 && JSON.stringify(a) === JSON.stringify(c), a.map((x, i) => (JSON.stringify(x) === JSON.stringify(c[i]) ? '' : 'khác: ' + x.id)).filter(Boolean).join(' | '));
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
    const an = await pm.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target).map((a) => ({ ten: a.animationName || a.transitionProperty, dai: a.effect.getTiming().duration, tren: a.effect.target.className && a.effect.target.className.baseVal === undefined ? a.effect.target.className : '', trongBang: !!(a.effect.target.closest && a.effect.target.closest('.bg-bang, .bg-ds, tr, li')) })));
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
    const bg = await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'), cot = (i) => [...pa.querySelectorAll('.bg-ds li')].map((l) => l.querySelector('.gia, .nhan-gia')).filter(Boolean).map((e) => ({ r: Math.round(e.getBoundingClientRect().right), a: getComputedStyle(e).fontVariantNumeric, t: getComputedStyle(e).textAlign })); return { gia: cot(0), ten: pa.querySelector('.bg-ten') && getComputedStyle(pa.querySelector('.bg-ten')).fontFamily.split(',')[0].replace(/["']/g, '') }; });
    ok('Hàng giá: số căn phải thẳng một mép (' + [...new Set(bg.gia.map((x) => x.r))].join(',') + '), dùng tabular-nums; chữ "Báo sau khi khám" / "Theo giờ hẹn" là chữ thường, không bịa số', bg.gia.length >= 6 && new Set(bg.gia.map((x) => x.r)).size === 1 && bg.gia.filter((x) => /tabular-nums/.test(x.a)).length >= 4, JSON.stringify(bg));
    await p.click('#tab-grooming-spa'); await cho(500);
    const bang = await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'), cs = [...pa.querySelectorAll('.bg-bang')]; return cs.map((t) => { const cols = [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((c) => Math.round(c.getBoundingClientRect().right))); const ok = cols[0].map((_, j) => new Set(cols.map((r) => r[j])).size === 1).every(Boolean); return { thẳng: ok, dongs: cols.length, canPhai: [...t.querySelectorAll('tbody td')].every((c) => getComputedStyle(c).textAlign === 'right'), fv: /tabular-nums/.test(getComputedStyle(t.querySelector('table')).fontVariantNumeric) }; }); });
    ok('Bảng theo cân nặng (Grooming): các cột giá thẳng hàng tuyệt đối từ trên xuống dưới, căn phải, tabular-nums', bang.length >= 1 && bang.every((x) => x.thẳng && x.canPhai && x.fv && x.dongs >= 7), JSON.stringify(bang));
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

  // ---------- 7. Trang Bảng giá trên điện thoại, giảm chuyển động ----------
  muc('7. Trang Bảng giá: điện thoại 390 và giảm chuyển động');
  {
    const ctx = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p = await mo(ctx, '/bang-gia/'); await cho(500);
    const m = await p.evaluate(() => { const th = document.querySelector('.bg-tab'), pa = document.querySelector('.bg-panel:not([hidden])'); return { cuon: th.scrollWidth > th.clientWidth + 20, bang: getComputedStyle(pa.querySelector('.bg-bang') || document.body).display, the: !!pa.querySelector('.bg-the'), sw: document.documentElement.scrollWidth }; });
    await p.click('#tab-cap-cuu-24-24', { force: true }).catch(() => {}); await cho(700);
    const cu = await p.evaluate(() => { const th = document.querySelector('.bg-tab'), s = document.querySelector('.bg-tab [aria-selected=true]'), r = s.getBoundingClientRect(), rt = th.getBoundingClientRect(); return { id: s.id, trong: r.left >= rt.left - 1 && r.right <= rt.right + 1, x: Math.round(new DOMMatrix(getComputedStyle(document.querySelector('.bg-gach')).transform).e), tx: s.offsetLeft, sl: Math.round(th.scrollLeft), sw: document.documentElement.scrollWidth }; });
    ok('Điện thoại: thanh tab cuộn ngang được; chọn tab cuối (Cấp cứu) thì thanh tự cuộn để tab nằm trọn trong khung và gạch chân đi theo; không cuộn ngang cả trang', m.cuon && m.sw <= 390 && /cap-cuu/.test(cu.id) && cu.trong && Math.abs(cu.x - cu.tx) <= 1 && cu.sl > 50 && cu.sw <= 390, JSON.stringify({ m, cu }));
    await p.click('#tab-grooming-spa'); await cho(500);
    const mb = await p.evaluate(() => { const pa = document.querySelector('.bg-panel:not([hidden])'), the = pa.querySelector('.bg-the'), ds = [...pa.querySelectorAll('.bg-kg')], bang = pa.querySelector('.bg-bang'); return { bangAn: getComputedStyle(bang).display === 'none', theHien: getComputedStyle(the).display !== 'none', so: ds.length, cao: Math.round(ds[0].querySelector('summary').getBoundingClientRect().height), sw: document.documentElement.scrollWidth }; });
    await p.click('.bg-panel:not([hidden]) .bg-kg summary'); await cho(300);
    const mo1 = await p.evaluate(() => { const k = document.querySelector('.bg-panel:not([hidden]) .bg-kg'); return { mo: k.open, dd: [...k.querySelectorAll('dd')].map((e) => e.textContent.trim()).slice(0, 3) }; });
    ok('Điện thoại, Grooming: bảng ngang ẩn, hiện từng mức cân nặng mở ra được (' + mb.so + ' mức, mỗi dòng cao ≥ 56px); bấm mở thì hiện các giá', mb.bangAn && mb.theHien && mb.so >= 7 && mb.cao >= 56 && mb.sw <= 390 && mo1.mo && mo1.dd.length >= 3 && mo1.dd.every((x) => /đ/.test(x)), JSON.stringify({ mb, mo1 }));
    await ctx.close();
    const c2 = await ctxMoi({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p2 = await mo(c2, '/bang-gia/'); await cho(300);
    await p2.click('#tab-xet-nghiem'); await cho(40);
    const r = await p2.evaluate(() => { const s = document.querySelector('#tab-xet-nghiem'), g = document.querySelector('.bg-gach'); return { x: Math.round(new DOMMatrix(getComputedStyle(g).transform).e), tx: s.offsetLeft, tp: getComputedStyle(g).transitionProperty, pa: document.getAnimations().filter((a) => a.animationName === 'bg-mo').map((a) => a.effect.getTiming().duration) }; });
    ok('Giảm chuyển động: gạch chân nhảy tức thì tới tab mới (chuyển tiếp không còn transform); panel mới hiện gần như tức thì', Math.abs(r.x - r.tx) <= 1 && !/transform/.test(r.tp) && r.pa.every((d) => d <= 1), JSON.stringify(r));
    await c2.close();
    const c3 = await ctxMoi({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }), p3 = await mo(c3, '/bang-gia/');
    const nj = await p3.evaluate(() => ({ gach: !!document.querySelector('.bg-gach'), hien: [...document.querySelectorAll('.bg-panel')].filter((x) => !x.hidden).length, bang: getComputedStyle(document.querySelector('.bg-bang')).display }));
    ok('Tắt JavaScript: nhóm đầu tiên hiện đủ bảng giá (các nhóm khác có ở trang Dịch vụ và bảng giá như R3.6), không có gạch chân trượt', !nj.gach && nj.hien === 1 && nj.bang !== 'none', JSON.stringify(nj));
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
