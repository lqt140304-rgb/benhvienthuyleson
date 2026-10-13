// Kiểm thử BƯỚC 2 giao diện mới: Header, Hero (khung video + khung chờ), Giới thiệu, chuyển trang (docs/KE-HOACH-GIAO-DIEN-MOI.md mục 4, 9). Chạy sau `npm run build`:
//   NODE_PATH=$(npm root -g) node kiem-thu-astro/kiem-thu-giao-dien-moi-b2.cjs
// Tự dựng giao diện 'moi' vào dist-moi, và một bản có video thử vào dist-moi-video (video do ffmpeg tạo ra, chép vào BẢN SAO TẠM; repo không đổi).
// Cần ffmpeg; không có thì các mục video là CHƯA CHẠY. Bốn trạng thái: ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH. Chỉ Chromium của Playwright. Không gọi mạng ra ngoài.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const GOC = path.resolve(__dirname, '..'), BASE = '/benhvienthuyleson';
const CONG = 4374, CONG_V = 4373, URL_M = `http://localhost:${CONG}${BASE}`, URL_V = `http://localhost:${CONG_V}${BASE}`;
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });
const tt = JSON.parse(fs.readFileSync(path.join(GOC, 'src/data/thong_tin.json'), 'utf8'));
// JavaScript hiệu ứng của giao diện mới: cả script nhúng trong trang lẫn tệp .js (gói đủ lớn thì Astro tách thành tệp) có chứa "astro:page-load"
const jsHieuUng = (thuMuc) => {
  const h = fs.readFileSync(path.join(GOC, thuMuc, 'index.html'), 'utf8'), ds = [...h.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const m of h.matchAll(/<script type="module" src="([^"]+)"/g)) { const f = path.join(GOC, thuMuc, m[1].replace(BASE + '/', '')); if (fs.existsSync(f)) ds.push(fs.readFileSync(f, 'utf8')); }
  return ds.filter((c) => /astro:page-load/.test(c)).join('\n'); // dấu hiệu riêng của gói hieu-ung (ui.js của R3.6 cũng có chữ "da-hien")
};
const kq = [];
const ok = (ten, dk, ct = '') => kq.push({ tt: dk ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 600) });
const chuaChay = (ten, ly) => kq.push({ tt: 'CHƯA CHẠY', ten, ct: ly });
const chuaXm = (ten, ly) => kq.push({ tt: 'CHƯA XÁC MINH', ten, ct: ly });
const muc = (t) => { kq.push({ tt: 'MỤC', ten: t, ct: '' }); console.log('\n== ' + t); };
const cho = (ms) => new Promise((r) => setTimeout(r, ms));
const MENU = ['Trang chủ', 'Dịch vụ', 'Bảng giá', 'Đặt lịch', 'Cẩm nang thú cưng', 'Ca bệnh', 'Giới thiệu', 'Liên hệ'];
const TIEU_DE = 'Sức khỏe hôm nay, hạnh phúc về sau.';

function taoVideoThu() {
  const th = fs.mkdtempSync(path.join(os.tmpdir(), 'video-thu-'));
  const chay = (a) => cp.execSync(`ffmpeg -y -loglevel error ${a}`, { cwd: th });
  try {
    chay('-f lavfi -i testsrc2=size=1280x720:rate=24 -t 3 -c:v libvpx-vp9 -b:v 300k -an hero.webm');
    chay('-f lavfi -i testsrc2=size=854x480:rate=24 -t 3 -c:v libvpx-vp9 -b:v 150k -an hero-480.webm');
    chay('-f lavfi -i testsrc2=size=960x640:rate=1 -frames:v 1 -q:v 5 hero-poster.jpg');
    return { th, tep: { 'public/video/hero.webm': path.join(th, 'hero.webm'), 'public/video/hero-480.webm': path.join(th, 'hero-480.webm'), 'public/video/hero-poster.jpg': path.join(th, 'hero-poster.jpg') } };
  } catch (e) { return { loi: String(e.message).split('\n')[0] }; }
}

(async () => {
  if (!fs.existsSync(path.join(GOC, 'dist', 'index.html'))) { console.error('Chưa có dist: chạy `npm run build` trước.'); process.exit(2); }
  const { dungGiaoDien } = require('./dung-giao-dien.cjs');
  dungGiaoDien('moi', 'dist-moi');
  const vd = taoVideoThu();
  if (vd.tep) dungGiaoDien('moi', 'dist-moi-video', vd.tep);
  const may = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG)], { stdio: 'ignore', env: { ...process.env, DIST: path.join(GOC, 'dist-moi') } });
  const may2 = vd.tep ? cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG_V)], { stdio: 'ignore', env: { ...process.env, DIST: path.join(GOC, 'dist-moi-video') } }) : null;
  await cho(900);
  const b = await chromium.launch(), phienBan = b.version();
  const ngoai = new Set(), loiChung = [];
  const ctxMoi = async (tuy = {}, boScript = false) => {
    const ctx = await b.newContext({ locale: 'vi-VN', ...tuy });
    await ctx.route('**/*', async (r) => {
      const u = r.request().url();
      if (u.startsWith(`http://localhost:${CONG}`) || u.startsWith(`http://localhost:${CONG_V}`)) {
        if (boScript && r.request().resourceType() === 'script') { const res = await r.fetch(); if (/astro:page-load/.test(await res.text())) return r.abort(); } // giả lập script hiệu ứng không tải được
        if (/\/fonts\/.+\.woff2$/.test(u) && ctx.__tre) await cho(ctx.__tre);
        return r.continue();
      }
      ngoai.add(new URL(u).host); return r.abort();
    });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('cam-da-chao', '1'); } catch (e) {} });
    return ctx;
  };
  const mo = async (ctx, duong, goc = URL_M, cho2 = 'load') => {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => loiChung.push(duong + ' · ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) loiChung.push(duong + ' · ' + m.text().slice(0, 120)); });
    await p.goto(goc + duong, { waitUntil: cho2 }); await p.evaluate(() => document.fonts.ready); return p;
  };
  const cuon = (p, y) => p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);

  // ---------- 1. Nội dung và cấu trúc (HTML đã dựng) ----------
  muc('1. Nội dung và cấu trúc: header, hero chỉ 4 thứ, giới thiệu không đánh số; dữ liệu không đổi');
  {
    const h = fs.readFileSync(path.join(GOC, 'dist-moi/index.html'), 'utf8');
    const lay = (re) => (re.exec(h) || [''])[0];
    const header = lay(/<header class="dau"[\s\S]*?<\/header>/), hero = lay(/<section class="hero"[\s\S]*?<\/section>/), gt = lay(/<section class="khoi" id="gioi-thieu"[\s\S]*?<\/section>/);
    const chu = (x) => x.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#38;|&amp;/g, '&').replace(/\s+/g, ' ').trim();
    const links = [...(/<ul class="menu-ds">[\s\S]*?<\/ul>/.exec(header) || [''])[0].matchAll(/<a href="([^"]*)"[^>]*>([^<]+)<\/a>/g)].map((m) => [m[2], m[1]]);
    ok('Header: đúng 8 mục menu theo thứ tự đã duyệt, mục Trang chủ có aria-current="page", logo có nhãn, nút "Đặt lịch khám", nút Menu có aria-expanded / aria-controls, giữ id #dau #menu #nut-menu cho ui.js', links.map((l) => l[0]).join('|') === MENU.join('|') && /<a href="#top" aria-current="page">Trang chủ/.test(header) && /aria-label="Bệnh viện thú y Lê Sơn – về đầu trang"/.test(header) && /nut-dau" href="[^"]*\/dat-lich\/">Đặt lịch khám/.test(header) && /id="nut-menu" aria-expanded="false" aria-controls="menu"/.test(header) && /id="dau"/.test(header) && /id="menu"/.test(header), JSON.stringify(links));
    ok('Hero (phương án 2 Warm Companionship): tiêu đề đúng chữ đã chốt "Sức khỏe hôm nay, hạnh phúc về sau." (hai dòng, ngắt tại dấu phẩy), id noi-dung cho liên kết "Bỏ qua"', chu(lay(/<h1[\s\S]*?<\/h1>/)) === TIEU_DE && /<section class="hero" id="noi-dung"/.test(hero), chu(lay(/<h1[\s\S]*?<\/h1>/)));
    const phu = chu(lay(/<p class="hero-phu">[\s\S]*?<\/p>/));
    ok('Hero: câu phụ đúng chữ đã chốt ("Thú cưng không chỉ là vật nuôi, mà là thành viên trong gia đình. Lê Sơn luôn ở bên để chăm sóc chúng thật trọn vẹn."); MỘT nút chính "Đặt lịch khám" + MỘT liên kết chữ "Xem bảng giá"; còn dòng giờ mở cửa + hotline; không có số liệu / nhãn / hoạ tiết bịa', phu === 'Thú cưng không chỉ là vật nuôi, mà là thành viên trong gia đình. Lê Sơn luôn ở bên để chăm sóc chúng thật trọn vẹn.' && (hero.match(/class="nut nut-chinh/g) || []).length === 1 && /Đặt lịch khám/.test(chu(lay(/<div class="hero-nut">[\s\S]*?<\/div>/))) && (hero.match(/class="lien-ket/g) || []).length === 1 && /Xem bảng giá/.test(chu(lay(/<div class="hero-nut">[\s\S]*?<\/div>/))) && /class="hero-tt"/.test(hero) && !/class="nhan"|dai-tt|hero-ghi|hoa-tiet|data-nut-trang-tri|Chẩn đoán ngay|\d+\+|\d+%/.test(chu(hero)), phu);
    const the4 = [...hero.matchAll(/<a class="hero-the-a" href="([^"]*)"[^>]*>[\s\S]*?<span class="hero-the-ten">([^<]*)<\/span>/g)].map((m) => [m[2], m[1]]);
    ok('Hero: bốn thẻ dịch vụ nhỏ đúng chữ và thứ tự (Khám & Điều trị toàn diện · Chăm sóc sức khỏe định kỳ · Grooming & Spa thư giãn · Tư vấn dinh dưỡng và hành vi); ba thẻ đầu dẫn tới nhóm giá /bang-gia/#nhom-…, thẻ cuối tới /tu-van/', the4.map((x) => x[0].replace(/&amp;/g, '&')).join('|') === 'Khám & Điều trị toàn diện|Chăm sóc sức khỏe định kỳ|Grooming & Spa thư giãn|Tư vấn dinh dưỡng và hành vi' && the4.slice(0, 3).every((x) => /\/bang-gia\/#nhom-/.test(x[1])) && /\/tu-van\/$/.test(the4[3][1]), JSON.stringify(the4));
    ok('Hero: chưa có ảnh / video thật thì hiện khung chờ ấm màu "Ảnh · video thực tế sắp cập nhật" (không ảnh giả), không có thẻ <video>, không có nút tạm dừng', /Ảnh · video thực tế sắp cập nhật/.test(hero) && !/<video|hv-dung/.test(hero) && /hv hv-chua/.test(hero), '');
    ok('Giới thiệu + Dịch vụ nổi bật (gộp): tiêu đề "Giới thiệu Bệnh viện thú y Lê Sơn", ba điểm KHÔNG đánh số (không <ol>, không "01/02/03"), một khung chờ ảnh "Ảnh thực tế · sắp cập nhật", dùng lớp Tailwind tw:', /Giới thiệu Bệnh viện thú y Lê Sơn/.test(chu(gt)) && !/<ol|>0[1-3]</.test(gt) && !/\b0[1-3]\b/.test(chu(gt)) && (gt.match(/Ảnh thực tế · sắp cập nhật/g) || []).length === 1 && /class="[^"]*\btw:/.test(gt), chu(gt).slice(0, 200));
    let thayDoi = '';
    try { thayDoi = cp.execSync('git status --porcelain src/data public/img', { cwd: GOC }).toString().trim(); } catch (e) { thayDoi = 'không chạy được git'; }
    ok('Dữ liệu src/data/*, logo và ảnh trong public/img không bị sửa (git status sạch)', thayDoi === '', thayDoi);
  }

  // ---------- 2. Header trên máy tính ----------
  muc('2. Header máy tính: thu gọn 76 → 60px khi cuộn quá 24px chỉ bằng transform, không dịch bố cục');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    const doDau = () => p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect(), c = (s, pc) => getComputedStyle(document.querySelector(s), pc || null);
      return { cuon: document.getElementById('dau').classList.contains('da-cuon'), dau: Math.round(r('.dau').height), top: Math.round(r('.dau').top), nen: +r('.dau-nen').height.toFixed(1), logo: +r('.logo img').height.toFixed(1), ke: +c('.dau-ke').opacity, small: +c('.logo-chu small').opacity, hero: Math.round(r('.hero').top + scrollY), bong: c('.dau').boxShadow, bongNen: c('.dau-nen').boxShadow };
    });
    const a = await doDau();
    await cuon(p, 20); await cho(450); const b20 = await doDau();
    await cuon(p, 30); await cho(450); const b30 = await doDau();
    ok('Chưa cuộn / cuộn 20px: chưa thu gọn (dải 76px, logo 44px, chưa có đường kẻ); cuộn 30px (quá 24px): thu còn dải 60px, logo 36px, hiện đường kẻ 1px, nhãn nhỏ mờ đi', !a.cuon && !b20.cuon && Math.abs(a.nen - 76) < 1 && Math.abs(a.logo - 44) < 1 && a.ke === 0 && b20.ke === 0 && b30.cuon && Math.abs(b30.nen - 60) < 1 && Math.abs(b30.logo - 36) < 1 && b30.ke === 1 && b30.small === 0, JSON.stringify({ a, b20, b30 }));
    ok('Khung header GIỮ 76px khi thu gọn (chỉ transform) và hero không dịch vị trí (dải trên trang: ' + a.hero + 'px → ' + b30.hero + 'px); header dính ở top 0; không bóng đổ', a.dau === 76 && b30.dau === 76 && a.hero === b30.hero && b30.top === 0 && a.bong === 'none' && b30.bong === 'none' && b30.bongNen === 'none', JSON.stringify({ a, b30 }));
    const tr = await p.evaluate(() => { const g = (s) => { const c = getComputedStyle(document.querySelector(s)); return c.transitionProperty + ' / ' + c.transitionDuration; }; return { nen: g('.dau-nen'), dau: g('.dau'), dauIn: g('.dau-in'), ke: g('.dau-ke') }; });
    ok('Chuyển tiếp thu gọn 240ms chỉ trên transform (dải nền) và opacity (đường kẻ); khung header và vùng chứa không có chuyển tiếp nào (không đổi height)', /^transform \/ 0\.24s/.test(tr.nen) && /^opacity \/ 0\.24s/.test(tr.ke) && /\/ 0s$/.test(tr.dau) && /\/ 0s$/.test(tr.dauIn), JSON.stringify(tr));
    await cuon(p, 0); await cho(450); const lai = await doDau();
    ok('Cuộn về đầu trang: header trở lại như lúc đầu', !lai.cuon && Math.abs(lai.nen - 76) < 1 && lai.ke === 0, JSON.stringify(lai));
    const taiKhoan = await p.evaluate(() => ({ menuDau: getComputedStyle(document.querySelector('.menu-dau')).display, menuChan: getComputedStyle(document.querySelector('.menu-chan')).display, nutMenu: getComputedStyle(document.getElementById('nut-menu')).display, cta: getComputedStyle(document.querySelector('.nut-dau')).display }));
    ok('Từ 1280px: menu nằm ngang trong header, nút Menu và phần đầu / chân của tấm phủ ẩn, nút "Đặt lịch khám" hiện', taiKhoan.menuDau === 'none' && taiKhoan.menuChan === 'none' && taiKhoan.nutMenu === 'none' && taiKhoan.cta !== 'none', JSON.stringify(taiKhoan));
    await ctx.close();
  }

  // ---------- 3. Nét bút cam ----------
  muc('3. Nét bút cam vẽ tay dưới mục menu đang xem (320ms, đổi theo mục đang xem)');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    await cho(700);
    const doNet = (pg) => (pg || p).evaluate(() => { const s = document.querySelector('.net-menu'), a = document.querySelector('.menu-ds a[aria-current]'); if (!s) return null; const r = s.getBoundingClientRect(), ra = a && a.getBoundingClientRect(); return { co: !!a, ten: a && a.textContent, trai: ra && Math.round(r.left - ra.left), phai: ra && Math.round(ra.right - r.right), duoi: ra && Math.round(r.top - ra.bottom), op: +s.style.opacity, mau: getComputedStyle(s.querySelector('.net')).stroke, dash: getComputedStyle(s.querySelector('.net')).strokeDashoffset, dur: getComputedStyle(s.querySelector('.net')).animationDuration }; });
    const n1 = await doNet();
    ok('Trang chủ: nét bút cam (#EA7A24) nằm ngay dưới "Trang chủ" (vượt hai mép ≤ 8px, sát chân chữ), đã vẽ xong (dashoffset 0), thời gian vẽ 320ms', n1 && n1.ten === 'Trang chủ' && n1.op === 1 && n1.mau === 'rgb(234, 122, 36)' && Math.abs(n1.trai + 3) <= 2 && Math.abs(n1.phai + 3) <= 2 && n1.duoi >= -10 && n1.duoi <= -4 && /^0(px)?$/.test(n1.dash) && n1.dur === '0.32s', JSON.stringify(n1));
    await p.evaluate(() => { const k = document.getElementById('dich-vu'); window.scrollTo({ top: k.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }); });
    await cho(200); const giua = await doNet(); await cho(700); const n2 = await doNet();
    ok('Cuộn tới khu Dịch vụ: aria-current chuyển sang "Dịch vụ", nét bút dời xuống dưới chữ đó và vẽ lại (đang vẽ dở hoặc đã xong, kết thúc ở dashoffset 0)', n2 && n2.ten === 'Dịch vụ' && Math.abs(n2.trai + 3) <= 2 && /^0(px)?$/.test(n2.dash) && giua && giua.ten === 'Dịch vụ', JSON.stringify({ giua, n2 }));
    await p.setViewportSize({ width: 1100, height: 800 }); await cho(300);
    const hep = await doNet();
    ok('Dưới 1280px (menu thành tấm phủ): nét bút ẩn', hep && hep.op === 0, JSON.stringify(hep));
    await p.close();
    const p2 = await mo(ctx, '/bang-gia/'); await cho(600); const n3 = await doNet(p2);
    ok('Trang Bảng giá: nét bút nằm dưới "Bảng giá" (aria-current="page" sẵn trong HTML)', n3 && n3.ten === 'Bảng giá' && n3.op === 1 && Math.abs(n3.trai + 3) <= 2, JSON.stringify(n3));
    await ctx.close();
  }

  // ---------- 4. Menu điện thoại ----------
  muc('4. Menu điện thoại / máy tính bảng (dưới 1280px): tấm phủ trượt từ phải, mục nối tiếp 40ms, không số, đóng bằng 4 cách');
  for (const [w, h, ten] of [[390, 844, 'điện thoại 390×844'], [768, 1024, 'máy tính bảng 768×1024']]) {
    const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true }), p = await mo(ctx, '/');
    const dong = await p.evaluate(() => { const m = document.getElementById('menu'), n = document.getElementById('nut-menu'), r = n.getBoundingClientRect(); return { vis: getComputedStyle(m).visibility, trai: Math.round(m.getBoundingClientRect().left), rong: Math.round(r.width), cao: Math.round(r.height), exp: n.getAttribute('aria-expanded'), nhan: n.getAttribute('aria-label'), cta: getComputedStyle(document.querySelector('.nut-dau')).display, ht: n.getAttribute('aria-controls') }; });
    ok(`${ten}: lúc đóng tấm phủ ẩn và nằm ngoài màn hình bên phải; nút Menu ≥ 44×44px, aria-expanded="false", nhãn "Mở menu"; nút "Đặt lịch khám" của header ẩn`, dong.vis === 'hidden' && dong.trai >= w && dong.rong >= 44 && dong.cao >= 44 && dong.exp === 'false' && dong.nhan === 'Mở menu' && dong.cta === 'none' && dong.ht === 'menu', JSON.stringify(dong));
    await p.click('#nut-menu'); await cho(600);
    const mo1 = await p.evaluate(() => {
      const m = document.getElementById('menu'), r = m.getBoundingClientRect(), n = document.getElementById('nut-menu'), lis = [...m.querySelectorAll('.menu-ds li')], a = m.querySelector('a[aria-current]');
      const ra = a.getBoundingClientRect(), chan = m.querySelector('.menu-chan'), rc = chan.getBoundingClientRect(), cta = chan.querySelector('.nut').getBoundingClientRect();
      return { vis: getComputedStyle(m).visibility, r: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vw: innerWidth, vh: innerHeight, exp: n.getAttribute('aria-expanded'), nhan: n.getAttribute('aria-label'), lop: m.classList.contains('mo'), body: document.body.classList.contains('menu-mo'), ov: getComputedStyle(document.body).overflow, tieuDiem: document.activeElement.textContent.trim(), so: lis.length, caoMin: Math.min(...lis.map((l) => l.querySelector('a').getBoundingClientRect().height)), tre0: getComputedStyle(lis[0]).transitionDelay, tre7: getComputedStyle(lis[7]).transitionDelay, dur: getComputedStyle(m).transitionDuration.split(',')[0].trim(), conLi: lis.every((l) => l.children.length === 1), chu: m.textContent.replace(/\s+/g, ' '), nenHienTai: getComputedStyle(a).backgroundColor, traiHT: Math.round(ra.left), phaiHT: Math.round(ra.right), sdt: !!chan.querySelector('.menu-sdt'), moCua: chan.querySelector('.mo-cua').getAttribute('data-trang'), ctaDuoi: Math.round(cta.bottom), ctaRong: Math.round(cta.width) };
    });
    ok(`${ten}: mở menu → tấm phủ phủ kín màn hình (0,0,${w}×${mo1.vh}), trượt 280ms, aria-expanded="true", nhãn "Đóng menu", cuộn trang bị khóa, focus vào mục đầu "Trang chủ"`, mo1.vis === 'visible' && mo1.r.join() === [0, 0, w, mo1.vh].join() && mo1.dur === '0.28s' && mo1.exp === 'true' && mo1.nhan === 'Đóng menu' && mo1.lop && mo1.body && mo1.ov === 'hidden' && mo1.tieuDiem === 'Trang chủ', JSON.stringify(mo1));
    ok(`${ten}: 8 mục, mỗi mục cao ≥ 44px, hiện nối tiếp cách 40ms (mục 1: 120ms, mục 8: 400ms); KHÔNG số, KHÔNG ô đánh dấu (mỗi mục chỉ có chữ); mục đang xem tô nền kem đậm trải kín hàng (mép trái 0, mép phải ${w})`, mo1.so === 8 && mo1.caoMin >= 44 && mo1.tre0 === '0.12s' && mo1.tre7 === '0.4s' && mo1.conLi && !/\b0[1-8]\b/.test(mo1.chu) && mo1.nenHienTai === 'rgb(243, 236, 225)' && mo1.traiHT === 0 && mo1.phaiHT === w, JSON.stringify({ tre0: mo1.tre0, tre7: mo1.tre7, nen: mo1.nenHienTai, hang: [mo1.traiHT, mo1.phaiHT], chu: mo1.chu.slice(0, 120) }));
    ok(`${ten}: cuối tấm phủ có trạng thái giờ mở cửa, số điện thoại, nút "Đặt lịch khám" rộng đúng khung và nằm trọn trong màn hình (đáy nút ${mo1.ctaDuoi}px ≤ ${mo1.vh}px)`, mo1.sdt && /^(mo|dong)$/.test(mo1.moCua) && mo1.ctaDuoi <= mo1.vh && mo1.ctaRong >= w - 70, JSON.stringify({ sdt: mo1.sdt, moCua: mo1.moCua, ctaDuoi: mo1.ctaDuoi, ctaRong: mo1.ctaRong }));
    const dongBang = async (cach) => {
      await p.evaluate(() => { const n = document.getElementById('nut-menu'); if (n.getAttribute('aria-expanded') !== 'true') n.click(); }); await cho(500);
      if (cach === 'esc') await p.keyboard.press('Escape'); else if (cach === 'nut') await p.click('[data-menu-dong]'); else if (cach === 'link') await p.click('.menu-ds a[href="#dich-vu"]');
      await cho(550);
      return p.evaluate(() => ({ vis: getComputedStyle(document.getElementById('menu')).visibility, exp: document.getElementById('nut-menu').getAttribute('aria-expanded'), body: document.body.classList.contains('menu-mo'), tieuDiem: document.activeElement.id || document.activeElement.tagName }));
    };
    const e1 = await dongBang('esc'), e2 = await dongBang('nut'), e3 = await dongBang('link');
    ok(`${ten}: đóng được bằng phím Esc (trả focus về nút Menu), nút X trong tấm phủ (trả focus), bấm một mục (cuộn tới khu); sau khi đóng tấm phủ ẩn lại, trang cuộn được`, [e1, e2, e3].every((e) => e.vis === 'hidden' && e.exp === 'false' && !e.body) && e1.tieuDiem === 'nut-menu' && e2.tieuDiem === 'nut-menu', JSON.stringify({ e1, e2, e3 }));
    await ctx.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }), p = await mo(ctx, '/');
    await p.click('#nut-menu'); await cho(60);
    const doM = () => p.evaluate(() => { const m = document.getElementById('menu'), l = m.querySelector('.menu-ds li'); return { trai: Math.round(m.getBoundingClientRect().left), op: +getComputedStyle(l).opacity, tf: getComputedStyle(l).transform, prop: getComputedStyle(m).transitionProperty, dur: getComputedStyle(l).transitionDuration }; });
    const x = await doM(); await cho(300); const x2 = await doM();
    ok('Giảm chuyển động: mở menu không trượt (mép trái 0 ngay sau 60ms), không dịch chuyển, chuyển tiếp chỉ còn độ mờ 160ms (xong sau 300ms: các mục hiện đủ)', x.trai === 0 && x.tf === 'none' && !/transform/.test(x.prop) && x.dur === '0.16s' && x2.op === 1, JSON.stringify({ x, x2 }));
    await ctx.close();
  }

  // ---------- 5. Hero lúc vào trang ----------
  muc('5. Hero lúc vào trang (~0,9s): tiêu đề hiện từng dòng bằng mặt nạ, nét bút cam, rồi câu phụ / nút / dòng trạng thái; khung video mở mo-man');
  {
    // Bố cục thẻ dịch vụ + thứ tự trên điện thoại (phương án 2 Warm Companionship)
    for (const [ten, w, hh, mob] of [['máy tính 1440', 1440, 900, false], ['máy tính bảng 768', 768, 1024, false], ['điện thoại 390', 390, 844, true]]) {
      const c5 = await ctxMoi({ viewport: { width: w, height: hh }, isMobile: mob, hasTouch: mob }), p5 = await mo(c5, '/'); await cho(1300);
      const z = await p5.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), the = [...document.querySelectorAll('.hero-the-a')].map((e) => e.getBoundingClientRect()), h = r('.hero'); return { n: the.length, trai: new Set(the.map((x) => Math.round(x.left))).size, hang: new Set(the.map((x) => Math.round(x.top))).size, cuoi: Math.round(h.bottom - Math.max(...the.map((x) => x.bottom))), tran: document.documentElement.scrollWidth > innerWidth, h1: r('.hero h1').bottom, phu: [r('.hero-phu').top, r('.hero-phu').bottom], anh: [r('.hero-khung').top, r('.hero-khung').bottom], nut: [r('.hero-nut').top, r('.hero-nut').height, r('.hero-nut .nut').height], cth: Math.min(...the.map((x) => x.top)), h1px: parseFloat(getComputedStyle(document.querySelector('.hero h1')).fontSize), the: the.map((x) => Math.round(x.height)) }; });
      const dkCot = w >= 1200 ? z.trai === 4 && z.hang === 1 : w >= 768 ? z.trai === 2 && z.hang === 2 : z.trai === 2 && z.hang === 2;
      const dkThuTu = !mob || (z.h1 <= z.phu[0] + 2 && z.phu[1] <= z.anh[0] + 2 && z.anh[1] <= z.nut[0] + 2 && z.nut[0] + z.nut[1] <= z.cth + 2);
      ok(`Hero (${ten}): 4 thẻ dịch vụ ${w >= 1200 ? 'nằm MỘT hàng ở chân hero' : 'xếp 2×2'}, không tràn ngang${mob ? ', thứ tự: tiêu đề → câu phụ → ảnh → hai nút → thẻ; nút chính cao ≥ 52px; tiêu đề ' + z.h1px + 'px' : ''}`, z.n === 4 && dkCot && !z.tran && dkThuTu && (!mob || (z.nut[2] >= 52 && z.h1px >= 34)), JSON.stringify(z));
      await c5.close();
    }
    // Video hero phủ kín cả khu hero và mờ dần sang trái (yêu cầu của chủ nhà)
    const hinh = (p) => p.evaluate(() => { const h = document.querySelector('.hero').getBoundingClientRect(), k = document.querySelector('.hero-khung').getBoundingClientRect(), v = document.querySelector('.hv'), c = document.querySelector('.hero-chu').getBoundingClientRect(), m = getComputedStyle(v).maskImage; return { h: [h.left, h.width, h.height], k: [k.left, k.width, k.height], c: [c.left, c.right], toi: document.documentElement.scrollWidth <= innerWidth, mask: m, dungTrong: !document.querySelector('.hero-chu').contains(document.querySelector('.hv')) }; });
    for (const [ten, w, hh] of [['máy tính 1440', 1440, 900], ['máy tính 1100', 1100, 800]]) {
      const c2 = await ctxMoi({ viewport: { width: w, height: hh } }), p2 = await mo(c2, '/'); await cho(900);
      const x = await hinh(p2);
      ok(`Hero (${ten}): khung video phủ kín CẢ khu hero (cùng trái / rộng / cao), không tràn ngang, mờ dần sang trái (mặt nạ ngang), không nằm trong khối chữ`, Math.abs(x.k[0] - x.h[0]) < 1 && Math.abs(x.k[1] - x.h[1]) < 1 && Math.abs(x.k[2] - x.h[2]) < 1 && x.k[1] >= w - 20 && x.toi && /linear-gradient\(to right|linear-gradient\(90deg|right/.test(x.mask) && x.dungTrong, JSON.stringify(x));
      await c2.close();
    }
    const c3 = await ctxMoi({ viewport: { width: 390, height: 844 } }), p3 = await mo(c3, '/'); await cho(900);
    const y = await p3.evaluate(() => ({ k: document.querySelector('.hero-khung').getBoundingClientRect().toJSON(), c: document.querySelector('.hero-chu').getBoundingClientRect().toJSON(), toi: document.documentElement.scrollWidth <= innerWidth, w: innerWidth }));
    ok('Hero (điện thoại 390): chữ ở trên, dải video đầy bề ngang ở dưới (không tràn ngang trang)', y.k.top >= y.c.bottom - 1 && Math.abs(y.k.width - y.w) < 2 && y.toi, JSON.stringify(y));
    await c3.close();
  }
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/');
    const an = await p.evaluate(() => document.getAnimations().filter((a) => a.animationName && /^hero-/.test(a.animationName)).map((a) => ({ ten: a.animationName, tre: a.effect.getTiming().delay, dai: a.effect.getTiming().duration, het: a.effect.getComputedTiming().endTime })));
    const het = Math.max(...an.map((x) => x.het)), theoTen = (t) => an.filter((x) => x.ten === t);
    ok(`Chuỗi vào trang: tiêu đề 2 dòng (hero-dong) cách 90ms (0 → 90ms), nét bút 320ms bắt đầu 380ms, câu phụ 420ms · nút 480ms · dòng trạng thái 540ms; mọi thứ xong trước ${Math.round(het)}ms (≤ 950ms)`, theoTen('hero-dong').map((x) => x.tre).join() === '0,90' && theoTen('hero-ve').length === 1 && theoTen('hero-ve')[0].tre === 380 && theoTen('hero-ve')[0].dai === 320 && theoTen('hero-len').map((x) => x.tre).join() === '420,480,540' && het <= 950, JSON.stringify(an));
    await cho(1300);
    const sau = await p.evaluate(() => { const o = (s) => +getComputedStyle(document.querySelector(s)).opacity; return { ap: document.getAnimations().filter((a) => a.playState === 'running').length, h1: o('.hero h1'), phu: o('.hero-phu'), nut: o('.hero-nut'), tt: o('.hero-tt'), dash: getComputedStyle(document.querySelector('.hero .nhan-but .net')).strokeDashoffset, mau: getComputedStyle(document.querySelector('.hero .nhan-but .net')).stroke, khung: getComputedStyle(document.querySelector('.hv')).clipPath, wrap: document.querySelector('.hero-khung').classList.contains('da-hien'), chu: document.querySelector('.hero h1').textContent.replace(/\s+/g, ' ').trim() };
    });
    ok('Sau ~1,3s: không còn chuyển động nào đang chạy, tiêu đề / câu phụ / nút / dòng trạng thái hiện đủ, nét bút cam vẽ xong, khung video đã mở (clip-path none); chữ tiêu đề đúng', sau.ap === 0 && sau.h1 === 1 && sau.phu === 1 && sau.nut === 1 && sau.tt === 1 && /^0(px)?$/.test(sau.dash) && sau.mau === 'rgb(234, 122, 36)' && sau.khung === 'none' && sau.wrap && sau.chu === TIEU_DE, JSON.stringify(sau));
    await ctx.close();
  }
  {
    const loi = [];
    for (const [tuy, ten] of [[{ reducedMotion: 'reduce' }, 'giảm chuyển động'], [{ javaScriptEnabled: false }, 'tắt JavaScript']]) {
      const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 }, ...tuy }), p = await mo(ctx, '/'); await cho(80);
      // chuyển tiếp 160ms của độ mờ / màu (opacity, color, background-color, border-color, outline-color) vẫn được phép khi giảm chuyển động (giam-chuyen-dong.css), nên không tính; riêng chữ "Giờ mở cửa" đổi màu theo giờ Việt Nam lúc nạp trang
      const x = await p.evaluate(() => { const o = (s) => +getComputedStyle(document.querySelector(s)).opacity; return { ap: document.getAnimations().filter((a) => a.playState === 'running' && a.effect.getComputedTiming().duration > 1 && !['opacity', 'color', 'background-color', 'border-color', 'outline-color'].includes(a.transitionProperty)).length, o: [o('.hero h1'), o('.hero-phu'), o('.hero-nut'), o('.hero-tt')], dash: getComputedStyle(document.querySelector('.hero .nhan-but .net')).strokeDashoffset, khung: getComputedStyle(document.querySelector('.hv')).clipPath, cho: getComputedStyle(document.querySelector('.hv-cho')).display }; });
      if (!(x.ap === 0 && x.o.every((v) => v === 1) && /^0(px)?$/.test(x.dash) && (x.khung === 'none' || tuy.reducedMotion) && x.cho !== 'none')) loi.push(ten + ' ' + JSON.stringify(x));
      await ctx.close();
    }
    ok('Giảm chuyển động và tắt JavaScript: sau 80ms hero đã hiện đủ (không chuyển động nào chạy > 1ms, nét bút vẽ sẵn, khung chờ video hiện)', loi.length === 0, loi.join(' | '));
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }, true), p = await mo(ctx, '/'); await cho(3400);
    const x = await p.evaluate(() => ({ hu: document.documentElement.classList.contains('co-hieu-ung'), h1: +getComputedStyle(document.querySelector('.hero h1')).opacity, an: document.getAnimations().length, khung: getComputedStyle(document.querySelector('.hv')).clipPath }));
    ok('Script hiệu ứng không tải được: sau 3 giây lớp co-hieu-ung tự gỡ, hero và khung video hiện đủ (không bị mặt nạ che)', !x.hu && x.h1 === 1 && x.khung === 'none', JSON.stringify(x));
    await ctx.close();
  }

  // ---------- 6. Trạng thái "Đang mở cửa" ----------
  muc('6. "Đang mở cửa" theo giờ Việt Nam (8:00 – 21:00), không phụ thuộc múi giờ của máy');
  {
    const ca = [['07:59', 'dong'], ['08:00', 'mo'], ['12:00', 'mo'], ['20:59', 'mo'], ['21:00', 'dong'], ['23:30', 'dong'], ['03:00', 'dong']], sai = [], bang = [];
    for (const tz of ['America/New_York', 'Asia/Ho_Chi_Minh']) for (const [gio, mong] of ca) {
      const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 }, timezoneId: tz }), p = await ctx.newPage();
      await p.clock.install({ time: new Date(`2026-10-13T${gio}:00+07:00`) });
      await p.goto(URL_M + '/', { waitUntil: 'load' }); await cho(150);
      const x = await p.evaluate(() => [...document.querySelectorAll('[data-mo-cua]')].map((e) => ({ t: e.getAttribute('data-trang'), chu: e.querySelector('.mc-chu').textContent, gio: e.querySelector('.mc-gio').textContent.trim(), mau: getComputedStyle(e.querySelector('.mc-dot')).backgroundColor })));
      bang.push(`${tz.split('/')[1]} ${gio}=${x[0] && x[0].t}`);
      const dung = x.length === 2 && x.every((e) => e.t === mong && e.chu === (mong === 'mo' ? 'Đang mở cửa' : 'Đang đóng cửa') && e.gio === '· 8:00–21:00') && (mong !== 'mo' || x[0].mau === 'rgb(35, 112, 110)');
      if (!dung) sai.push(`${tz} ${gio}: ${JSON.stringify(x)}`);
      await ctx.close();
    }
    ok(`14 trường hợp (7 mốc giờ × múi giờ máy New York và Việt Nam): 7:59 đóng · 8:00 mở · 12:00 mở · 20:59 mở · 21:00 đóng · 23:30, 3:00 đóng; hai chỗ hiển thị (hero và tấm phủ menu) đều đúng; chấm ngọc khi mở`, sai.length === 0, sai.join(' | ') || bang.join(' '));
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage();
    await p.clock.install({ time: new Date('2026-10-13T20:59:30+07:00') });
    await p.goto(URL_M + '/', { waitUntil: 'load' }); await cho(100);
    const truoc = await p.evaluate(() => document.querySelector('.hero [data-mo-cua]').getAttribute('data-trang'));
    await p.clock.fastForward(75000); await cho(100);
    const sau = await p.evaluate(() => document.querySelector('.hero [data-mo-cua]').getAttribute('data-trang'));
    ok('Đang mở lúc 20:59:30, sau 75 giây trang tự cập nhật sang "đóng" mà không cần tải lại', truoc === 'mo' && sau === 'dong', `${truoc} → ${sau}`);
    await ctx.close();
    const c2 = await ctxMoi({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }), p2 = await mo(c2, '/');
    const nj = await p2.evaluate(() => { const e = document.querySelector('.hero [data-mo-cua]'); return { t: e.getAttribute('data-trang'), chu: e.textContent.replace(/\s+/g, ' ').trim(), dot: getComputedStyle(e.querySelector('.mc-dot')).display }; });
    ok('Tắt JavaScript: chỉ hiện "Giờ mở cửa · 8:00–21:00" (không khẳng định đang mở hay đóng), không có chấm trạng thái', nj.t === null && nj.chu === 'Giờ mở cửa · 8:00–21:00' && nj.dot === 'none', JSON.stringify(nj));
    await c2.close();
  }

  // ---------- 7. Video hero ----------
  muc('7. Video hero (bản dựng có video thử do ffmpeg tạo): ảnh bìa ngay, video tải sau khi trang hiện xong, 480p cho điện thoại, nút tạm dừng, tự dừng, tiết kiệm dữ liệu');
  if (!vd.tep) chuaChay('Toàn bộ các mục video hero', 'Không tạo được video thử (cần ffmpeg có libvpx-vp9): ' + vd.loi);
  else {
    const theoDoi = (p, nhat) => { p.on('request', (r) => { if (/\/video\//.test(r.url())) nhat.push({ u: r.url().split('/video/')[1], t: Date.now() }); }); };
    const doV = (p) => p.evaluate(() => { const v = document.querySelector('.hv-video'), k = document.querySelector('.hv'), n = document.querySelector('.hv-dung'); return v ? { pau: v.paused, nguon: (v.currentSrc || '').split('/video/')[1] || '', chay: k.classList.contains('dang-chay'), op: +getComputedStyle(v).opacity, nut: n && !n.hidden, ap: n && n.getAttribute('aria-pressed'), nhan: n && n.getAttribute('aria-label'), muted: v.muted, loop: v.loop, pi: v.hasAttribute('playsinline'), con: v.querySelectorAll('source').length } : null; });
    { // Điện thoại: video "lồng vào chữ" tiêu đề (chủ dự án 13/10/2026)
      const ctx = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p = await ctx.newPage(); p.on('pageerror', (e) => loiChung.push('chữ-video · ' + e.message));
      await p.goto(URL_V + '/', { waitUntil: 'load' }); await cho(3000);
      const x = await p.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), h = r('.hero h1'), k = r('.hero-khung'), n = document.querySelector('.hv-dung'), nb = n.getBoundingClientRect(), cs = getComputedStyle(document.querySelector('.hero h1')), t = document.elementFromPoint(nb.left + nb.width / 2, nb.top + nb.height / 2); return { cls: document.querySelector('.hero').className, mix: cs.mixBlendMode, mau: cs.color, nen: cs.backgroundColor, trung: Math.abs(h.top - k.top) < 2 && Math.abs(h.height - k.height) < 2 && Math.abs(h.left - k.left) < 2, hv: +getComputedStyle(document.querySelector('.hv')).opacity, chay: !!document.querySelector('.hv.dang-chay'), nutTren: !!t && t.closest('.hv-dung') === n, nutTrong: nb.top >= h.top && nb.bottom <= h.bottom, tran: document.documentElement.scrollWidth > innerWidth, vitri: getComputedStyle(document.querySelector('.hv-video')).position, cao: Math.round(h.height) }; });
      ok('Điện thoại + có video: video "lồng vào chữ" tiêu đề: tiêu đề chữ ĐEN, nền kem, hoà trộn lighten (hình hiện qua nét chữ), khung video trùng đúng khung tiêu đề, video đang chạy, nút tạm dừng nằm TRÊN tiêu đề (bấm được) và trong khung, không tràn ngang', /chu-video/.test(x.cls) && x.mix === 'lighten' && x.mau === 'rgb(0, 0, 0)' && x.nen === 'rgb(251, 247, 241)' && x.trung && x.hv === 1 && x.chay && x.nutTren && x.nutTrong && !x.tran, JSON.stringify(x));
      await p.click('.hv-dung'); await cho(300); const dung = await p.evaluate(() => ({ pau: document.querySelector('.hv-video').paused, mix: getComputedStyle(document.querySelector('.hero h1')).mixBlendMode }));
      ok('Điện thoại: bấm tạm dừng thì video dừng, chữ vẫn hiện khung hình đang dừng (không biến mất)', dung.pau && dung.mix === 'lighten', JSON.stringify(dung));
      await ctx.close();
      const c2 = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p2 = await c2.newPage(); await p2.goto(URL_V + '/', { waitUntil: 'load' }); await cho(2500);
      const d = await p2.evaluate(() => { const cs = getComputedStyle(document.querySelector('.hero h1')); return { mix: cs.mixBlendMode, mau: cs.color }; });
      ok('Máy tính (có video): tiêu đề KHÔNG lồng video, vẫn chữ tím như thiết kế (chỉ điện thoại mới lồng chữ)', d.mix === 'normal' && d.mau === 'rgb(90, 30, 94)', JSON.stringify(d)); await c2.close();
      const c3 = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }), p3 = await c3.newPage(); await p3.goto(URL_V + '/', { waitUntil: 'load' }); await cho(1200);
      const g = await p3.evaluate(() => ({ mix: getComputedStyle(document.querySelector('.hero h1')).mixBlendMode, poster: !!document.querySelector('.hv-poster'), tran: document.documentElement.scrollWidth > innerWidth, chay: !!document.querySelector('.hv.dang-chay') }));
      ok('Giảm chuyển động (điện thoại, có ảnh bìa): không tải video; ảnh bìa tĩnh vẫn hiện qua nét chữ, không tràn ngang', !g.chay && g.poster && g.mix === 'lighten' && !g.tran, JSON.stringify(g)); await c3.close();
    }
    { // Điện thoại, KHÔNG có ảnh / video: tiêu đề tím như thường, khung chờ như cũ
      const c4 = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p4 = await mo(c4, '/'); await cho(1200);
      const h = await p4.evaluate(() => { const cs = getComputedStyle(document.querySelector('.hero h1')); return { mix: cs.mixBlendMode, mau: cs.color, cls: document.querySelector('.hero').className, cho: !!document.querySelector('.hv-cho'), media: document.querySelector('.hero').hasAttribute('data-media') }; });
      ok('Điện thoại, chưa có ảnh / video: tiêu đề tím như thường (không lồng chữ, không chữ nhạt khó đọc), vẫn là khung chờ như cũ', h.mix === 'normal' && h.mau === 'rgb(90, 30, 94)' && !/chu-video/.test(h.cls) && h.cho && !h.media, JSON.stringify(h)); await c4.close();
    }
    {
      const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), nhat = []; let tLoad = 0;
      const p = await ctx.newPage(); theoDoi(p, nhat); p.on('load', () => { tLoad = Date.now(); });
      p.on('pageerror', (e) => loiChung.push('video · ' + e.message));
      await p.goto(URL_V + '/', { waitUntil: 'load' }); await cho(2500);
      const x = await doV(p), poster = await p.evaluate(() => { const i = document.querySelector('.hv-poster'); return i && { ok: i.complete && i.naturalWidth > 0, op: +getComputedStyle(i).opacity }; });
      ok('Máy tính: ảnh bìa tải và hiện ngay; tệp video chỉ được yêu cầu SAU khi trang tải xong (sự kiện load), chỉ bản 720p hero.webm (không tải bản 480p)', poster && poster.ok && poster.op === 1 && nhat.some((r) => r.u === 'hero-poster.jpg') && nhat.filter((r) => /\.webm$/.test(r.u)).length > 0 && nhat.filter((r) => /\.webm$/.test(r.u)).every((r) => r.t >= tLoad) && !nhat.some((r) => /480/.test(r.u)), JSON.stringify(nhat.map((r) => [r.u, r.t - tLoad])));
      ok('Video đang chạy: tắt tiếng, lặp, playsinline; mờ dần đè lên ảnh bìa (lớp dang-chay, độ mờ 1); nút tạm dừng hiện với nhãn "Tạm dừng video"; chỉ có 2 nguồn (webm); video không đọc được bằng trình đọc màn hình', x && !x.pau && x.nguon === 'hero.webm' && x.chay && x.op === 1 && x.nut && x.ap === 'false' && x.nhan === 'Tạm dừng video' && x.muted && x.loop && x.pi && x.con === 1 && (await p.evaluate(() => document.querySelector('.hv-video').getAttribute('aria-hidden') === 'true' && document.querySelector('.hv-video').tabIndex === -1)), JSON.stringify(x));
      await p.focus('.hv-dung'); await p.keyboard.press('Space'); await cho(150); const d1 = await doV(p);
      await p.keyboard.press('Enter'); await cho(300); const d2 = await doV(p);
      ok('Nút tạm dừng dùng được bằng bàn phím: Space → dừng (aria-pressed true, nhãn "Phát video"), Enter → chạy lại', d1.pau && d1.ap === 'true' && d1.nhan === 'Phát video' && !d2.pau && d2.ap === 'false' && d2.nhan === 'Tạm dừng video', JSON.stringify({ d1, d2 }));
      await cuon(p, 2500); await cho(500); const k1 = await doV(p); await cuon(p, 0); await cho(500); const k2 = await doV(p);
      ok('Cuộn đi làm video khuất màn hình thì tự dừng, cuộn về thì chạy tiếp', k1.pau && !k2.pau, JSON.stringify({ k1: k1.pau, k2: k2.pau }));
      await p.click('.hv-dung'); await cho(150); await cuon(p, 2500); await cho(400); await cuon(p, 0); await cho(500); const k3 = await doV(p);
      ok('Người dùng đã bấm dừng thì cuộn đi rồi quay lại video vẫn dừng (ý người dùng được giữ)', k3.pau && k3.ap === 'true', JSON.stringify(k3));
      await p.click('.hv-dung'); await cho(300);
      await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); await cho(200); const t1 = await doV(p);
      await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); await cho(400); const t2 = await doV(p);
      ok('Đổi tab (trang ẩn) thì video dừng, quay lại thì chạy tiếp', t1.pau && !t2.pau, JSON.stringify({ t1: t1.pau, t2: t2.pau }));
      const nutTT = await p.$('[data-nut-trang-tri]');
      if (!nutTT) chuaChay('Tắt "Hiệu ứng trang trí" khi video đang chạy', 'Không thấy nút [data-nut-trang-tri]');
      else {
        await p.evaluate(() => document.querySelector('[data-nut-trang-tri]').click()); await cho(500); const o1 = await doV(p);
        await p.evaluate(() => document.querySelector('[data-nut-trang-tri]').click()); await cho(900); const o2 = await doV(p);
        ok('Tắt "Hiệu ứng trang trí" lúc video đang chạy: video dừng và trả về ảnh bìa (bỏ dang-chay); bật lại: chạy tiếp, không tải lại', o1.pau && !o1.chay && !o2.pau && o2.chay && nhat.filter((r) => r.u === 'hero.webm').length === 1, JSON.stringify({ o1, o2, soLanTai: nhat.filter((r) => r.u === 'hero.webm').length }));
      }
      await ctx.close();
    }
    {
      const ctx = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), nhat = [], p = await ctx.newPage(); theoDoi(p, nhat);
      await p.goto(URL_V + '/', { waitUntil: 'load' }); await cho(2500); const x = await doV(p);
      ok('Điện thoại 390px: chỉ tải bản 480p (hero-480.webm), không tải bản 720p; video chạy', x && x.nguon === 'hero-480.webm' && !x.pau && x.chay && !nhat.some((r) => r.u === 'hero.webm'), JSON.stringify({ nguon: x && x.nguon, nhat: nhat.map((r) => r.u) }));
      await ctx.close();
    }
    const khongTai = [];
    for (const [tuy, nhanh, init] of [
      [{ reducedMotion: 'reduce' }, 'giảm chuyển động', null],
      [{}, 'tiết kiệm dữ liệu (saveData)', () => { Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' }, configurable: true }); }],
      [{}, 'mạng 2G', () => { Object.defineProperty(navigator, 'connection', { value: { saveData: false, effectiveType: '2g' }, configurable: true }); }],
      [{}, 'đã tắt "Hiệu ứng trang trí" từ lần trước', () => { try { localStorage.setItem('le-son-trang-tri', 'tat'); } catch (e) {} }],
    ]) {
      const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 }, ...tuy }); if (init) await ctx.addInitScript(init);
      const nhat = [], p = await ctx.newPage(); theoDoi(p, nhat);
      await p.goto(URL_V + '/', { waitUntil: 'load' }); await cho(1800);
      const x = await doV(p), poster = await p.evaluate(() => { const i = document.querySelector('.hv-poster'); return i && i.complete && i.naturalWidth > 0; });
      if (nhat.some((r) => /\.webm$/.test(r.u)) || !x || x.con !== 0 || x.chay || x.nut || !poster) khongTai.push(nhanh + ' ' + JSON.stringify({ nhat: nhat.map((r) => r.u), x, poster }));
      await ctx.close();
    }
    ok('KHÔNG tải video (chỉ ảnh bìa, không nút tạm dừng) khi: bật giảm chuyển động · tiết kiệm dữ liệu · mạng 2G · đã tắt "Hiệu ứng trang trí"', khongTai.length === 0, khongTai.join(' | '));
  }

  // ---------- 8. Giới thiệu + Dịch vụ nổi bật (gộp một khu, Tailwind) ----------
  muc('8. Giới thiệu + Dịch vụ nổi bật gộp một khu "Trọng tâm hình ảnh" (Tailwind): ảnh trái 60% / nội dung phải 40%, tiêu đề đè lên ảnh, không chữ cái đầu lớn');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/'); await cho(300);
    const x = await p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect(), cs = (s, pc) => getComputedStyle(document.querySelector(s), pc);
      const f = r('#gioi-thieu figure'), nd = r('#gioi-thieu .khung > div > div:last-child'), h2 = document.querySelector('#gioi-thieu h2'), hr = h2.getBoundingClientRect();
      const para = [...document.querySelectorAll('#gioi-thieu p')].find((e) => /bệnh viện thú y dành/.test(e.textContent));
      const tong = f.width + nd.width;
      return { anh: Math.round(f.width / tong * 100), nd: Math.round(nd.width / tong * 100), cao: Math.round(f.height), h2Phong: cs('#gioi-thieu h2').fontFamily.split(',')[0].replace(/["']/g, ''), h2Co: parseFloat(cs('#gioi-thieu h2').fontSize), h2Mau: cs('#gioi-thieu h2').color, h2TrongAnh: hr.left >= f.left && hr.right <= f.right && hr.top >= f.top && hr.bottom <= f.bottom, chuL: getComputedStyle(para, '::first-letter').float, coChu: parseFloat(getComputedStyle(para).fontSize), nhan: document.querySelectorAll('#gioi-thieu .nhan').length, caiDat: !!document.querySelector('#gioi-thieu figure img') };
    });
    ok('Máy tính: ảnh ~60% / nội dung ~40% (' + x.anh + '/' + x.nd + '); tiêu đề Newsreader ' + x.h2Co + 'px màu trắng nằm TRONG khung ảnh; đoạn giới thiệu ' + x.coChu + 'px, KHÔNG có chữ cái đầu lớn (float = none); không còn dòng nhãn nhỏ phía trên (chủ dự án đã bỏ)', Math.abs(x.anh - 60) <= 3 && Math.abs(x.nd - 40) <= 3 && x.h2Phong === 'Newsreader' && x.h2Co >= 48 && x.h2Mau === 'rgb(255, 255, 255)' && x.h2TrongAnh && x.chuL === 'none' && x.coChu >= 19 && x.nhan === 0, JSON.stringify(x));
    const gt = await p.evaluate(() => { const g = document.querySelector('#gioi-thieu'); return { ids: [...document.querySelectorAll('#gioi-thieu,#dich-vu')].map((e) => e.id), cu: !!document.querySelector('.gt-mo,.gt-anh,.dv-ds,.gt-bai'), diem: [...g.querySelectorAll('ul > li')].map((l) => l.textContent.replace(/\s+/g, ' ').trim()), links: [...g.querySelectorAll('a.lien-ket')].map((a) => [a.textContent.trim(), new URL(a.href).pathname]), ol: g.querySelectorAll('ol').length, so: /\b0[1-3]\b/.test(g.textContent), cho: g.querySelectorAll('figure').length === 1 && /Ảnh thực tế · sắp cập nhật/.test(g.textContent) }; });
    ok('Nội dung giữ nguyên: ba điểm nổi bật (Chẩn đoán tại viện · Từ phòng bệnh đến phẫu thuật · Tham khảo chi phí trước khi đến) không đánh số; liên kết "Tìm hiểu thêm về bệnh viện" → /gioi-thieu/ và "Xem tất cả dịch vụ" → /dich-vu/; có khung chờ ảnh (chưa bịa ảnh); id #gioi-thieu và #dich-vu đều có mặt; không còn khu Dịch vụ nổi bật riêng', gt.ids.join() === 'gioi-thieu,dich-vu' && !gt.cu && gt.diem.length === 3 && /Chẩn đoán tại viện/.test(gt.diem[0]) && /Từ phòng bệnh đến phẫu thuật/.test(gt.diem[1]) && /Tham khảo chi phí trước khi đến/.test(gt.diem[2]) && gt.links.length === 2 && /Tìm hiểu thêm về bệnh viện/.test(gt.links[0][0]) && /\/gioi-thieu\/$/.test(gt.links[0][1]) && /Xem tất cả dịch vụ/.test(gt.links[1][0]) && /\/dich-vu\/$/.test(gt.links[1][1]) && !gt.ol && !gt.so && gt.cho, JSON.stringify(gt));
    const dich = await p.evaluate(async () => { document.querySelector('.menu-ds a[href="#dich-vu"]').click(); await new Promise((r) => setTimeout(r, 1200)); return { hash: location.hash, y: Math.round(document.querySelector('#dich-vu').getBoundingClientRect().top), cur: [...document.querySelectorAll('.menu-ds a[aria-current]')].map((a) => a.textContent.trim()) }; });
    ok('Menu "Dịch vụ" trên trang chủ cuộn tới #dich-vu (nằm trong khung nhìn, dưới header); trạng thái active của menu vẫn đúng một mục', /dich-vu|^$/.test(dich.hash) && dich.y >= 0 && dich.y < 700 && dich.cur.length <= 1, JSON.stringify(dich));
    const truoc = await p.evaluate(() => { const e = document.querySelector('#gioi-thieu [data-hien="mo-man"] > *'); return getComputedStyle(e).clipPath; });
    await ctx.close();
    const c1 = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p1 = await mo(c1, '/'); await cho(200);
    const cl0 = await p1.evaluate(() => getComputedStyle(document.querySelector('#gioi-thieu [data-hien="mo-man"] > figure')).clipPath);
    await p1.evaluate(() => document.querySelector('#gioi-thieu').scrollIntoView({ behavior: 'instant' })); await cho(1400);
    const cl1 = await p1.evaluate(() => ({ clip: getComputedStyle(document.querySelector('#gioi-thieu [data-hien="mo-man"] > figure')).clipPath, hang: [...document.querySelectorAll('#gioi-thieu ul > li')].map((l) => l.classList.contains('da-hien')) }));
    ok('Hiệu ứng khi cuộn tới: khung ảnh mở "mo-man" (clip-path che trước, mở hết sau), ba hàng điểm hiện nối tiếp', /^inset\(0px 100% 0px 0px\)$/.test(cl0) && cl1.clip === 'none' && cl1.hang.every(Boolean), JSON.stringify({ cl0, cl1 }));
    await c1.close();
    const c2 = await ctxMoi({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p2 = await mo(c2, '/'); await cho(300);
    const m = await p2.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const f = r('#gioi-thieu figure'), nd = r('#gioi-thieu .khung > div > div:last-child'); return { fl: Math.round(f.left), fw: Math.round(f.width), vw: innerWidth, anhTren: f.bottom <= nd.top + 1, tran: document.documentElement.scrollWidth > innerWidth, h2: Math.round(parseFloat(getComputedStyle(document.querySelector('#gioi-thieu h2')).fontSize)) }; });
    ok('Điện thoại: ảnh ở trên, nội dung ở dưới, ảnh vừa khít bề ngang (không tràn), tiêu đề ≥ 32px', m.anhTren && !m.tran && Math.abs(m.fw - (m.vw - 2 * m.fl)) <= 2 && m.fl >= 14 && m.h2 >= 32, JSON.stringify(m));
    await c2.close();
    const c3 = await ctxMoi({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p3 = await mo(c3, '/'); await cho(300);
    await p3.evaluate(() => document.querySelector('#gioi-thieu').scrollIntoView({ behavior: 'instant' })); await cho(500);
    const rd = await p3.evaluate(() => ({ clip: getComputedStyle(document.querySelector('#gioi-thieu [data-hien="mo-man"] > figure')).clipPath, op: [...document.querySelectorAll('#gioi-thieu [data-hien]')].map((e) => +getComputedStyle(e).opacity), tf: [...document.querySelectorAll('#gioi-thieu [data-hien]')].map((e) => getComputedStyle(e).transform) }));
    ok('Giảm chuyển động: nội dung khu hiện đủ (độ mờ 1), không dịch chuyển, không che bằng clip-path', rd.clip === 'none' && rd.op.every((o) => o === 1) && rd.tf.every((t) => t === 'none'), JSON.stringify(rd));
    await c3.close();
    const c4 = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p4 = await mo(c4, '/'); await cho(300);
    await p4.evaluate(() => document.querySelector('#gioi-thieu').scrollIntoView({ behavior: 'instant' })); await cho(1200);
    const bp = []; for (let i = 0; i < 12; i++) { await p4.keyboard.press('Tab'); bp.push(await p4.evaluate(() => { const a = document.activeElement; return a && a.closest('#gioi-thieu') ? (a.textContent.trim().slice(0, 30) + '|' + getComputedStyle(a).outlineStyle + '|' + getComputedStyle(a).outlineWidth) : ''; })); }
    const trongKhu = bp.filter((v) => v);
    ok('Bàn phím: Tab đi qua đủ 5 liên kết trong khu (3 điểm + 2 liên kết chữ) theo thứ tự, mỗi liên kết có viền focus nhìn thấy', trongKhu.length >= 5 && trongKhu.slice(0, 5).every((v) => v.split('|')[1] !== 'none') && /Chẩn đoán/.test(trongKhu[0]) && /Xem tất cả/.test(trongKhu[4]), JSON.stringify(trongKhu));
    await c4.close();
  }

  // ---------- 9. Chuyển trang ----------
  muc('9. Chuyển trang: View Transitions giữa các trang (mờ đi / mờ hiện 240ms), header và Bé Cam có tên riêng; tắt khi giảm chuyển động');
  {
    const css = fs.readdirSync(path.join(GOC, 'dist-moi/_astro')).filter((f) => /^index\..+\.css$/.test(f)).map((f) => fs.readFileSync(path.join(GOC, 'dist-moi/_astro', f), 'utf8')).join('\n');
    ok('CSS có @view-transition { navigation: auto }, header đặt view-transition-name "dau-trang", Bé Cam "be-cam", mờ 240ms (token --t-trang)', /@view-transition\s*\{\s*navigation:\s*auto/.test(css) && /\.dau\{[^}]*view-transition-name:dau-trang/.test(css) && /\.cam\{view-transition-name:be-cam/.test(css) && /::view-transition-old\(root\)\{animation:vt-ra var\(--t-trang\)/.test(css) && /--t-trang:\.24s/.test(css), '');
    // Chromium chạy không giao diện thỉnh thoảng không kích hoạt View Transition ở lần chuyển trang đầu (đã thấy cả ở giao diện R3.6: 3/8 lần): thử tối đa 4 lần, ghi số lần
    const chuyen = async (tuy) => {
      for (let lan = 1; lan <= 4; lan++) {
        const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 }, ...tuy });
        await ctx.addInitScript(() => { window.addEventListener('pagereveal', (e) => { try { sessionStorage.setItem('pr', e.viewTransition ? 'vt' : 'khong'); if (e.viewTransition) e.viewTransition.ready.then(() => { const ds = document.getAnimations().filter((a) => a.effect && a.effect.pseudoElement && /^::view-transition/.test(a.effect.pseudoElement)).map((a) => a.effect.pseudoElement + '=' + a.effect.getTiming().duration); sessionStorage.setItem('prd', JSON.stringify(ds)); }, () => {}); } catch (x) {} }); });
        const p = await mo(ctx, '/'); await cho(1200);
        await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), p.click('.menu-ds a[href$="/bang-gia/"]')]); await cho(900);
        const x = await p.evaluate(() => ({ url: location.pathname, pr: sessionStorage.getItem('pr'), prd: JSON.parse(sessionStorage.getItem('prd') || '[]') }));
        await ctx.close();
        if (x.pr === 'vt') return { ...x, lan };
        if (lan === 4) return { ...x, lan };
      }
    };
    const bt = await chuyen({}), gm = await chuyen({ reducedMotion: 'reduce' });
    const goc = (x) => x.prd.filter((s) => /\(root\)=/.test(s));
    ok(`Bấm "Bảng giá": trình duyệt chạy View Transition (sự kiện pagereveal có viewTransition; thử ${bt.lan}/4 lần); hoạt cảnh root cũ / mới đều 240ms; header ("dau-trang") có nhóm chuyển riêng nên đứng yên, không chớp`, /bang-gia/.test(bt.url) && bt.pr === 'vt' && goc(bt).includes('::view-transition-old(root)=240') && goc(bt).includes('::view-transition-new(root)=240') && bt.prd.some((s) => /dau-trang/.test(s)), JSON.stringify(bt));
    if (gm.pr === 'vt') ok(`Giảm chuyển động: đổi trang vẫn xảy ra, nhưng không có hoạt cảnh mờ nào của root (thử ${gm.lan}/4 lần)`, /bang-gia/.test(gm.url) && goc(gm).length === 0, JSON.stringify(gm));
    else chuaXm('Giảm chuyển động: không còn hoạt cảnh mờ khi chuyển trang', 'View Transition không kích hoạt được trong 4 lần thử ở chế độ này nên chưa quan sát được; CSS đã có quy tắc animation: none cho ::view-transition-*');
  }

  // ---------- 10. Bàn phím ----------
  muc('10. Bàn phím: thứ tự Tab đúng, mọi mục dừng lại đều thấy rõ viền focus');
  {
    const ctx = await ctxMoi({ viewport: { width: 1440, height: 900 } }), p = await mo(ctx, '/'), ds = [], mat = [];
    await p.evaluate(() => { document.body.focus(); window.scrollTo({ top: 0, behavior: 'instant' }); });
    for (let i = 0; i < 14; i++) {
      await p.keyboard.press('Tab');
      const f = await p.evaluate(() => { const e = document.activeElement, c = getComputedStyle(e), t = (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim(); return { t, ring: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) >= 2 || c.boxShadow !== 'none' }; });
      ds.push(f.t); if (!f.ring) mat.push(f.t);
    }
    const mong = ['Bỏ qua đến nội dung', 'Bệnh viện thú y Lê Sơn – về đầu trang', ...MENU, 'Đặt lịch khám', 'Đặt lịch khám', 'Xem bảng giá', '0973 555 105'];
    ok('Tab 14 lần từ đầu trang: Bỏ qua → logo → 8 mục menu → "Đặt lịch khám" (header) → nút chính hero → "Xem bảng giá" → hotline; nút Menu và nội dung tấm phủ (ẩn ở máy tính) không bị Tab vào', ds.join('|') === mong.join('|'), ds.join(' | '));
    ok('Mỗi mục nhận focus đều có viền focus rõ (outline ≥ 2px)', mat.length === 0, mat.join(' | '));
    await ctx.close();
  }

  // ---------- 11. Cuộn ngang, CLS ----------
  muc('11. Trang chủ giao diện mới: không cuộn ngang ở 7 cỡ + màn ngang + 1920px; dịch bố cục (CLS) gần 0, header thu gọn không gây dịch');
  {
    const hong = [];
    for (const [w, h] of [[360, 740], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [844, 390]]) {
      const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 }), p = await ctx.newPage();
      await p.goto(URL_M + '/', { waitUntil: 'domcontentloaded' }); const a = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      await p.evaluate(() => document.fonts.ready); await cho(1200); const b2 = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      await p.click('#nut-menu', { timeout: 500 }).catch(() => {}); await cho(500); const c = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      for (const [luc, v] of [['đang tải', a], ['xong', b2], ['mở menu', c]]) if (v.sw > v.cw + 1) hong.push(`${w}x${h} ${luc}: ${v.sw}/${v.cw}`);
      await ctx.close();
    }
    ok('9 kích thước (360, 390, 430, 768, 1024, 1280, 1440, 1920, ngang 844×390): không cuộn ngang lúc đang tải, khi xong và khi mở menu', hong.length === 0, hong.join(' | '));
    const cls = [];
    for (const [w, h, mb] of [[1440, 900, false], [390, 844, true]]) {
      const ctx = await ctxMoi({ viewport: { width: w, height: h }, isMobile: mb, hasTouch: mb }); ctx.__tre = 300; // phông tải trễ 300ms để đo cả dịch do đổi phông
      const p = await ctx.newPage();
      await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
      await p.goto(URL_M + '/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await cho(1500);
      const tai = await p.evaluate(() => window.__cls);
      const cao = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= cao; y += 250) { await cuon(p, y); await cho(60); } await cho(600);
      for (let y = cao; y >= 0; y -= 250) { await cuon(p, y); await cho(40); } await cho(600);
      const sau = await p.evaluate(() => window.__cls);
      cls.push({ w, tai: +tai.toFixed(4), sau: +sau.toFixed(4) });
      await ctx.close();
    }
    ok('CLS khi tải (phông trễ 300ms) dưới 0,1 và cuộn từ đầu tới cuối rồi về lại (header thu gọn / mở ra, hiện khi cuộn) không làm CLS tăng thêm quá 0,001: ' + cls.map((c) => `${c.w}px ${c.tai}→${c.sau}`).join(' · '), cls.every((c) => c.tai < 0.1 && c.sau - c.tai <= 0.001), JSON.stringify(cls));
  }

  // ---------- 12. Giao diện mặc định không đổi ----------
  muc('12. Giao diện mặc định (r36) không bị ảnh hưởng');
  {
    const h = fs.readFileSync(path.join(GOC, 'dist/index.html'), 'utf8');
    ok('dist (GIAO_DIEN = r36): header cũ (không có .dau-nen), hero cũ (.hero-chu, tiêu đề "Chăm sóc tận tâm"), không nạp script / phông của giao diện mới, CSS vẫn là tệp r36.BvJ89V1I.css (nội dung không đổi so với trước bước 1)', !/dau-nen/.test(h) && /class="hero-chu"/.test(h) && /Chăm sóc tận tâm/.test(h) && !/da-hien/.test((/<script type="module">[\s\S]*?<\/script>/.exec(h) || [''])[0]) && !/data-giao-dien/.test(h) && fs.existsSync(path.join(GOC, 'dist/_astro/r36.BvJ89V1I.css')), '');
  }

  muc('13. Yêu cầu mạng ra ngoài, lỗi, giới hạn');
  ok('Giao diện mới: không lỗi JavaScript / console ở mọi trang đã mở', loiChung.length === 0, loiChung.join(' | '));
  ok('Không gọi máy chủ ngoài nào (không Google Fonts: phông tự chứa; bản đồ nhúng không mở trong lần chạy này)', [...ngoai].length === 0, [...ngoai].join(', '));
  chuaXm('Header, hero, giới thiệu trên Firefox, Safari, Edge và điện thoại thật; View Transitions trên trình duyệt khác', `Chỉ có Chromium ${phienBan} của Playwright`);
  chuaXm('Chuyển trang đẹp / mượt, header "không chớp" bằng mắt thường', 'Kiểm được sự kiện, tên nhóm và thời lượng; cảm nhận bằng mắt cần người xem');
  chuaXm('Video thật của bệnh viện (dung lượng, độ nét, H.264 trên Safari)', 'Chỉ thử bằng video do ffmpeg tạo (WebM VP9); chưa có video thật');
  chuaXm('Cảm giác về bố cục các khu còn lại của trang chủ ở giao diện mới', 'Các khu khác (dịch vụ, sản phẩm, bảng giá, đặt lịch, đội ngũ, cẩm nang, đánh giá, liên hệ, chân trang) chưa làm lại: kiểm ở bước 3–7');

  await b.close(); may.kill(); if (may2) may2.kill();
  for (const t of ['dist-moi', 'dist-moi-video']) fs.rmSync(path.join(GOC, t), { recursive: true, force: true });
  if (vd.th) fs.rmSync(vd.th, { recursive: true, force: true });
  const dem = (t) => kq.filter((x) => x.tt === t).length;
  const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA CHẠY ${dem('CHƯA CHẠY')} · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH')}`;
  const dong = [`Kiểm thử bước 2 giao diện mới (header, hero, giới thiệu, chuyển trang) · Chromium ${phienBan} (Playwright) · ${new Date().toISOString()}`, tom, '', ...kq.map((x) => x.tt === 'MỤC' ? `\n-- ${x.ten}` : `[${x.tt}] ${x.ten}${x.ct ? '  → ' + x.ct : ''}`)];
  fs.writeFileSync(path.join(KQ, 'ket-qua-giao-dien-moi-b2.txt'), dong.join('\n'));
  console.log('\n' + tom + '\n' + kq.filter((x) => x.tt === 'KHÔNG ĐẠT').map((x) => '✗ ' + x.ten + ' → ' + x.ct).join('\n'));
  process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
