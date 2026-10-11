// Quay video biểu mẫu đặt lịch mới. Cần: máy chủ bản thường (cổng 4321) và bản dựng chế độ 'that' (dựng bằng `node kiem-thu-astro/dung-che-do.cjs that dist-that`, chạy `DIST=dist-that node kiem-thu-astro/may-chu.cjs 4398`). Dùng máy chủ GIẢ của Google qua page.route; không gửi gì ra ngoài.
// Chạy: NODE_PATH=$(npm root -g) node kiem-thu-astro/quay-video-form.cjs [thư mục ra]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const RA = path.resolve(process.argv[2] || path.join(__dirname, 'video')); fs.mkdirSync(RA, { recursive: true });
const pad = (n) => String(n).padStart(2, '0'), vn = new Date(Date.now() + 7 * 3600e3), ngay = (n) => { const d = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + n)); return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; };
let b;
async function quay(ten, cong, w, h, tuy, kichBan) {
  const tam = path.join(RA, 'tam-' + ten); fs.rmSync(tam, { recursive: true, force: true });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN', recordVideo: { dir: tam, size: { width: w, height: h } }, ...tuy });
  await ctx.route('**/*', (r) => (r.request().url().startsWith('http://localhost') ? r.continue() : r.abort()));
  const p = await ctx.newPage(); await p.goto(`http://localhost:${cong}/benhvienthuyleson/dat-lich/`); await p.evaluate(() => document.fonts.ready);
  await kichBan(p); await ctx.close();
  const webm = fs.readdirSync(tam).find((f) => f.endsWith('.webm')), ra = path.join(RA, ten);
  execSync(`ffmpeg -y -loglevel error -i "${path.join(tam, webm)}" -c:v libx264 -pix_fmt yuv420p -crf 26 -movflags +faststart "${ra}.mp4"`); fs.rmSync(tam, { recursive: true, force: true }); console.log('video', ra + '.mp4');
}
const dien = async (p, t = 350) => {
  await p.fill('#m-ten', 'Khách thử nghiệm'); await p.waitForTimeout(t); await p.fill('#m-sdt', '0912345678'); await p.waitForTimeout(t); await p.fill('#m-thu', 'Bé Thử'); await p.waitForTimeout(t);
  await p.check('input[name="m-loai"][value="khac"]', { force: true }); await p.waitForTimeout(t); await p.fill('#m-loai-khac', 'thỏ'); await p.waitForTimeout(t);
  await p.selectOption('#m-dv', { index: 7 }); await p.waitForTimeout(t); await p.fill('#m-ngay', ngay(2)); await p.waitForTimeout(t); await p.fill('#m-ngay-don', ngay(1)); await p.locator('#m-ngay-don').blur(); await p.waitForTimeout(900); // ngày đón trước ngày gửi: báo lỗi
  await p.fill('#m-ngay-don', ngay(4)); await p.waitForTimeout(t); await p.selectOption('#m-gio', '09:00'); await p.waitForTimeout(t);
};
(async () => {
  b = await chromium.launch();
  await quay('form-gia-lap-desktop-1440', 4321, 1440, 900, {}, async (p) => {
    await p.waitForTimeout(800); await p.locator('#m-ten').focus(); await p.locator('#m-sdt').focus(); await p.waitForTimeout(700); // báo lỗi khi bỏ trống
    await dien(p); await p.click('#m-gui'); await p.waitForTimeout(2500);
  });
  await quay('form-nhan-voi-may-chu-gia-desktop-1440', 4398, 1440, 900, {}, async (p) => {
    let lan = 0; await p.route(/script\.google\.com/, async (r) => { lan++; await new Promise((k) => setTimeout(k, 1200)); if (lan === 1) return r.abort('failed'); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ma: 'LS-261011-7F3A' }) }); });
    await p.waitForTimeout(800); await dien(p, 250); await p.click('#m-gui'); await p.waitForTimeout(2800); // đang gửi → chưa nhận được xác nhận (giữ dữ liệu)
    await p.click('#m-gui'); await p.waitForTimeout(3500); // gửi lại → đã nhận + mã
  });
  await quay('form-nhan-voi-may-chu-gia-mobile-390', 4398, 390, 844, { isMobile: true, hasTouch: true }, async (p) => {
    await p.route(/script\.google\.com/, async (r) => { await new Promise((k) => setTimeout(k, 1200)); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ma: 'LS-261011-7F3A' }) }); });
    await p.waitForTimeout(800); await dien(p, 250); await p.click('#m-gui'); await p.waitForTimeout(3500);
  });
  await b.close();
})();
