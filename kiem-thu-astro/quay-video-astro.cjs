// Quay video bản dựng Astro (Playwright recordVideo → mp4 bằng ffmpeg). Cần máy chủ: node kiem-thu-astro/may-chu.cjs 4321
// Chạy: NODE_PATH=$(npm root -g) node kiem-thu-astro/quay-video-astro.cjs [thư mục ra]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const RA = path.resolve(process.argv[2] || path.join(__dirname, 'video')); fs.mkdirSync(RA, { recursive: true });
const URLG = 'http://localhost:4321/benhvienthuyleson';
const cuon = async (p, den, buoc = 18) => { const y0 = await p.evaluate(() => scrollY); for (let i = 1; i <= buoc; i++) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y0 + (den - y0) * i / buoc); await p.waitForTimeout(45); } };
const viTri = (p, sel) => p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY - 90, sel);
let b;
async function quay(ten, w, h, tuy, kichBan) {
  const tam = path.join(RA, 'tam-' + ten); fs.rmSync(tam, { recursive: true, force: true });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN', recordVideo: { dir: tam, size: { width: w, height: h } }, ...tuy });
  await ctx.route('**/*', (r) => (r.request().url().startsWith('http://localhost') ? r.continue() : r.abort())); // không gọi ra ngoài
  await ctx.addInitScript(() => { try { sessionStorage.setItem('cam-da-chao', '1'); } catch (e) {} });
  const p = await ctx.newPage(); await p.goto(URLG + '/'); await p.evaluate(() => document.fonts.ready);
  await kichBan(p, w); await ctx.close();
  const webm = fs.readdirSync(tam).find((f) => f.endsWith('.webm')), ra = path.join(RA, ten);
  execSync(`ffmpeg -y -loglevel error -i "${path.join(tam, webm)}" -c:v libx264 -pix_fmt yuv420p -crf 26 -movflags +faststart "${ra}.mp4"`); fs.rmSync(tam, { recursive: true, force: true }); console.log('video', ra + '.mp4');
}
const KICH_BAN = async (p, w) => {
  await p.waitForTimeout(2500);
  for (const id of ['gioi-thieu', 'dich-vu']) { await cuon(p, await viTri(p, '#' + id)); await p.waitForTimeout(1200); }
  for (const i of [0, 1, 2, 3, 4]) { const t = p.locator('#dich-vu a.the-dv').nth(i); if (w >= 1024) await t.hover(); else await t.scrollIntoViewIfNeeded(); await p.waitForTimeout(800); }
  await p.mouse.move(5, 5);
  await cuon(p, await viTri(p, '#san-pham')); await p.waitForTimeout(1200); // Sản phẩm nổi bật ngay dưới Dịch vụ
  await p.click('.sp-tab >> nth=1'); await p.waitForTimeout(900); await p.click('.sp-tab >> nth=2'); await p.waitForTimeout(900);
  await p.click('.sp-panel:not([hidden]) [data-sp-sau]'); await p.waitForTimeout(900);
  await cuon(p, await viTri(p, '#bang-gia')); await p.waitForTimeout(1200);
  await cuon(p, await viTri(p, '#dat-lich')); await p.waitForTimeout(1200);
  await cuon(p, await viTri(p, '#doi-ngu')); await p.waitForTimeout(3000);
  await cuon(p, await viTri(p, '#cam-nang')); await p.waitForTimeout(3000);
  await p.click('#cn-dung'); await p.waitForTimeout(1000); await p.click('#cn-sau'); await p.waitForTimeout(900); await p.click('#cn-dung'); await p.waitForTimeout(1200);
  await cuon(p, await viTri(p, '#danh-gia')); await p.waitForTimeout(1000);
  await cuon(p, await viTri(p, '#lien-he')); await p.waitForTimeout(1000);
  await cuon(p, 0, 24); await p.waitForTimeout(500);
  if (w < 1280) { await p.click('#nut-menu'); await p.waitForTimeout(900); await p.click('#menu a[href$="/bang-gia/"]'); } else await p.click('#menu a[href$="/bang-gia/"]');
  await p.waitForTimeout(1500);
  for (const i of [1, 3, 6]) { await p.click(`.bg-tab [role="tab"] >> nth=${i}`); await p.waitForTimeout(700); }
  await p.goBack(); await p.waitForTimeout(1200);
  await p.click(w < 1024 ? '#cam-nut-duoi' : '#cam-nut'); await p.waitForTimeout(800); await p.click('[data-hoi="bang-gia"]'); await p.waitForTimeout(800); await p.click('#cam-tra a'); await p.waitForTimeout(1500); // Bé Cam → trang Bảng giá thật
  await p.goto(URLG + '/dich-vu/'); await p.waitForTimeout(1500); await cuon(p, 1400, 14); await p.waitForTimeout(800);
  await p.goto(URLG + '/dat-lich/'); await p.waitForTimeout(1500);
  await p.goto(URLG + '/khong-co/'); await p.waitForTimeout(1500);
};
(async () => {
  b = await chromium.launch();
  await quay('astro-desktop-1440', 1440, 900, {}, KICH_BAN);
  await quay('astro-mobile-390', 390, 844, { deviceScaleFactor: 1, isMobile: true, hasTouch: true }, KICH_BAN);
  await quay('astro-giam-chuyen-dong-390', 390, 844, { reducedMotion: 'reduce', isMobile: true, hasTouch: true }, KICH_BAN);
  // Đổi cài đặt "giảm chuyển động" khi đang xem (bật rồi tắt)
  await quay('astro-doi-giam-chuyen-dong-1440', 1440, 900, {}, async (p) => {
    await cuon(p, await viTri(p, '#doi-ngu')); await p.waitForTimeout(3000);
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(3500);
    await cuon(p, await viTri(p, '#san-pham')); await p.click('.sp-tab >> nth=1'); await p.waitForTimeout(1200);
    await cuon(p, await viTri(p, '#cam-nang')); await p.waitForTimeout(3000);
    await p.emulateMedia({ reducedMotion: 'no-preference' }); await p.waitForTimeout(4000);
  });
  await b.close();
})();
