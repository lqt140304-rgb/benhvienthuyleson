// Kiểm thử trang Đặt lịch giao diện mới (biểu mẫu 4 bước, tóm tắt, lịch, hiệu ứng, gửi). Chạy: node kiem-thu-astro/kiem-thu-dat-lich-moi.cjs
// Dựng HAI bản trong thư mục tạm (repo không đổi): (1) moi + gia-lap (kiểm giao diện, không gửi gì); (2) moi + that + địa chỉ GIẢ,
// trình duyệt chặn mọi yêu cầu ra ngoài và chuyển yêu cầu tới script THẬT apps-script/Code.v2.gs chạy với Trang tính giả (mo-phong-google.cjs). KHÔNG gọi Google.
// Bốn trạng thái: ĐẠT / KHÔNG ĐẠT / CHƯA CHẠY / CHƯA XÁC MINH. Kết quả: kiem-thu-astro/ket-qua/ket-qua-dat-lich-moi.txt
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process'), http = require('http');
const { chromium } = require('playwright'), { taoMoiTruong } = require('./mo-phong-google.cjs');
const GOC = path.resolve(__dirname, '..'), BASE = '/benhvienthuyleson', DIA_CHI = 'https://script.google.com/macros/s/KIEM-THU-GIA/exec';
const kq = []; const ok = (ten, dk, ct = '') => kq.push({ tt: dk ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 400) });
const chuaXm = (ten, ly) => kq.push({ tt: 'CHƯA XÁC MINH', ten, ct: ly });
function dung(mode, ra) {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'le-son-dl-'));
  try {
    for (const f of ['package.json', 'astro.config.mjs', 'tsconfig.json']) fs.copyFileSync(path.join(GOC, f), path.join(tam, f));
    for (const d of ['src', 'public']) fs.cpSync(path.join(GOC, d), path.join(tam, d), { recursive: true });
    fs.symlinkSync(path.join(GOC, 'node_modules'), path.join(tam, 'node_modules'), 'dir');
    const s = path.join(tam, 'src/lib/site.ts'), d = path.join(tam, 'src/lib/dat-lich.ts');
    fs.writeFileSync(s, fs.readFileSync(s, 'utf8').replace(/export const GIAO_DIEN: GiaoDien = '[a-z0-9-]+';/, "export const GIAO_DIEN: GiaoDien = 'moi';"));
    fs.writeFileSync(d, fs.readFileSync(d, 'utf8').replace(/export const modeDatLich: ModeDatLich = '[a-z-]+';/, `export const modeDatLich: ModeDatLich = '${mode}';`));
    if (mode === 'that') { const t = path.join(tam, 'src/data/thong_tin.json'), j = JSON.parse(fs.readFileSync(t, 'utf8')); j.dia_chi_nhan_dat_lich = DIA_CHI; fs.writeFileSync(t, JSON.stringify(j, null, 2)); }
    cp.execSync(`npx astro build --outDir "${ra}"`, { cwd: tam, stdio: 'ignore' });
  } finally { fs.rmSync(tam, { recursive: true, force: true }); }
}
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
const phucVu = (root, cong) => new Promise((r) => { const sv = http.createServer((q, s) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(BASE, '')); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { s.statusCode = 404; return s.end(); } s.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); s.end(fs.readFileSync(f)); }).listen(cong, () => r(sv)); });
const vnHomNay = (n = 0) => { const v = new Date(Date.now() + 7 * 3600e3), d = new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate() + n)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const D1 = fs.mkdtempSync(path.join(os.tmpdir(), 'dl1-')), D2 = fs.mkdtempSync(path.join(os.tmpdir(), 'dl2-'));
  dung('gia-lap', D1); dung('that', D2);
  const sv1 = await phucVu(D1, 4581), sv2 = await phucVu(D2, 4582), U1 = `http://localhost:4581${BASE}`, U2 = `http://localhost:4582${BASE}`;
  const b = await chromium.launch(), loiTrang = [];
  const mo = async (url, tuy = {}, gioVn, env, kieu) => {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, ...tuy }), p = await ctx.newPage(); p.__ds = []; p.__ra = [];
    if (gioVn) { const v = new Date(Date.now() + 7 * 3600e3); await ctx.clock.setFixedTime(new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), gioVn[0] - 7, gioVn[1]))); }
    p.on('pageerror', (e) => loiTrang.push(e.message));
    await ctx.route(/^(?!http:\/\/localhost)/, async (r) => {
      const u = r.request().url(); p.__ra.push(u); if (!/script\.google\.com/.test(u) || !env) return r.abort();
      const body = r.request().postData() || '', lan = p.__ds.push({ u, body }), cach = kieu ? kieu(lan) : 'qua';
      if (cach === 'loi-mang') return r.abort('failed');
      if (cach === 'treo') return new Promise(() => {});
      if (cach === 'loi-may-chu') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, loi: 'Số điện thoại không hợp lệ.' }) });
      if (cach === 'rac') return r.fulfill({ status: 200, contentType: 'text/html', body: '<html>Lỗi</html>' });
      const tra = env.ctx.doPost({ postData: { contents: body } }).getContent();
      if (cach === 'mat-phan-hoi') return r.abort('failed');
      return r.fulfill({ status: 200, contentType: 'application/json', body: tra });
    });
    await p.goto(url + '/dat-lich/', { waitUntil: 'load' }); await cho(150); return p;
  };
  const buocHien = (p) => p.evaluate(() => { const s = [...document.querySelectorAll('.dlm-buoc')].find((x) => !x.hidden); return s ? +s.dataset.buoc : 0; });
  const loiChu = (p, id) => p.evaluate((i) => (document.getElementById(i).textContent || '').trim(), id);
  const chonLoai = (p, v) => p.click(`label.dlm-the:has(input[name=loai][value=${v}])`);
  const tiep = async (p) => { await p.click('#dlm-tiep'); await cho(120); };
  const b1 = async (p, loai = 'cho', ten = 'Bông', them = {}) => { await chonLoai(p, loai); if (loai === 'khac') await p.fill('#dlm-loai-khac', them.khac || 'Thỏ'); await p.fill('#dlm-ten-thu', ten); if (them.giong) await p.fill('#dlm-giong', them.giong); if (them.tuoi) await p.fill('#dlm-tuoi', them.tuoi); if (them.can) await p.fill('#dlm-can', them.can); if (them.gt) await p.click(`label.dlm-chip:has(input[value="${them.gt}"])`); if (them.tt) await p.fill('#dlm-tinh-trang', them.tt); };
  const b2 = (p, noiTru) => p.click(noiTru ? 'label.dlm-the-dv:has(input[data-noi-tru])' : 'label.dlm-the-dv:has(input[name=dich_vu]:not([data-noi-tru])) >> nth=0');
  const chonNgay = async (p, hopId, isoNgay) => { for (let i = 0; i < 7; i++) { const n = await p.$(`#${hopId} .dlm-ngay[data-iso="${isoNgay}"]:not(:disabled)`); if (n) { await n.click(); return true; } const t = await p.$(`#${hopId} .dlm-lich-chuyen >> nth=1`); if (!t || await t.isDisabled()) return false; await t.click(); } return false; };
  const b3 = async (p, ngay = vnHomNay(2), gio = '09:00', noiTru, don) => { await chonNgay(p, 'dlm-lich', ngay); await p.click(`.dlm-chip-gio:has(input[value="${gio}"])`); if (noiTru) await chonNgay(p, 'dlm-lich-don', don || vnHomNay(4)); };
  const b4 = async (p, ten = 'Nguyễn Thử Nghiệm', sdt = '0912 345 678', email = '', ghi = '') => { await p.fill('#dlm-ten-khach', ten); await p.fill('#dlm-sdt', sdt); if (email) await p.fill('#dlm-email', email); if (ghi) await p.fill('#dlm-ghi-chu', ghi); };
  const luong = async (p, o = {}) => { await b1(p, o.loai || 'cho', o.ten || 'Bông', o); await tiep(p); await b2(p, o.noiTru); await tiep(p); await b3(p, o.ngay, o.gio, o.noiTru, o.don); await tiep(p); await b4(p, o.khach, o.sdt, o.email, o.ghi); };

  // ===== 1. Cấu trúc và bố cục =====
  for (const [w, h, ten, mob] of [[1440, 1000, 'máy tính 1440', false], [768, 1024, 'máy tính bảng 768', false], [390, 844, 'điện thoại 390', true]]) {
    const p = await mo(U1, { viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
    const x = await p.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), gs = (s, k) => getComputedStyle(document.querySelector(s))[k]; const f = r('.dlm-form'), a = r('.dlm-ben'), c = [...document.querySelectorAll('.dlm-the')].slice(0, 3).map((e) => e.getBoundingClientRect());
      return { tran: document.documentElement.scrollWidth > innerWidth, formTrai: Math.round(f.left), benTrai: Math.round(a.left), dau: a.top > f.top - 400, tien: document.querySelectorAll('.dlm-tien li').length, h1: document.querySelector('h1').textContent.trim(), loai: c.map((e) => [Math.round(e.width), Math.round(e.height)]), sticky: gs('.dlm-ben', 'position'), nut: [...document.querySelectorAll('.dlm-nut:not([hidden]), .dlm-huy')].map((e) => Math.round(e.getBoundingClientRect().height)), ttMo: document.getElementById('dlm-tt-nut').getAttribute('aria-expanded'), ttThan: getComputedStyle(document.getElementById('dlm-tt-than')).display, tieuDe: gs('h1', 'fontFamily').split(',')[0], thoi: document.querySelectorAll('input[type=password], [name=password], [name=mat_khau]').length };
    });
    const cotRong = w >= 1024 ? x.benTrai > x.formTrai + 500 : x.benTrai <= x.formTrai + 2;
    ok(`${ten}: tiêu đề "Đặt lịch khám & chăm sóc" (Newsreader), 4 bước tiến trình, biểu mẫu + tóm tắt, ${w >= 1024 ? 'tóm tắt ở CỘT PHẢI và sticky' : 'tóm tắt xếp DƯỚI biểu mẫu'}, không tràn ngang, không ô mật khẩu / đăng nhập`, x.h1 === 'Đặt lịch khám & chăm sóc' && x.tieuDe === 'Newsreader' && x.tien === 4 && cotRong && (w < 1024 || x.sticky === 'sticky') && !x.tran && x.thoi === 0, JSON.stringify(x));
    ok(`${ten}: thẻ Chó / Mèo / Khác ${mob ? 'cao ≥ 76px, đủ rộng để chạm' : 'đủ lớn'}; mọi nút cao ≥ 44px`, x.loai.length === 3 && x.loai.every((s) => s[1] >= (mob ? 76 : 70) && s[0] >= 90) && x.nut.every((n) => n >= 44), JSON.stringify(x.loai) + ' ' + JSON.stringify(x.nut));
    if (mob) {
      ok('Điện thoại: tóm tắt thu gọn sẵn (nút aria-expanded=false, phần thân ẩn), bấm mở ra và bấm lại thì đóng', x.ttMo === 'false' && x.ttThan === 'none' && await (async () => { await p.click('#dlm-tt-nut'); const a = await p.evaluate(() => [document.getElementById('dlm-tt-nut').getAttribute('aria-expanded'), getComputedStyle(document.getElementById('dlm-tt-than')).display]); await p.click('#dlm-tt-nut'); const c = await p.evaluate(() => getComputedStyle(document.getElementById('dlm-tt-than')).display); return a[0] === 'true' && a[1] !== 'none' && c === 'none'; })(), JSON.stringify(x));
    }
    await p.context().close();
  }

  // ===== 2. Các tình huống người dùng (bản giả lập) =====
  { // Chó: đủ 4 bước + tóm tắt + kết quả giả lập, không có yêu cầu mạng ra ngoài
    const p = await mo(U1); await luong(p, { loai: 'cho', ten: 'Bông', giong: 'Golden', tuoi: '2 tuổi', can: '5,2', gt: 'Đực', tt: 'Ho nhẹ' });
    const tt = await p.evaluate(() => [...document.querySelectorAll('.dlm-tt-gt')].map((e) => e.textContent.trim()));
    ok('Khách đặt lịch cho CHÓ: tóm tắt cập nhật trực tiếp (Bông · Chó · Golden / dịch vụ / ngày giờ / họ tên · SĐT / chi phí lấy từ dữ liệu)', /Bông/.test(tt[0]) && /Khám và chẩn đoán/.test(tt[1]) && /09:00/.test(tt[2]) && /Nguyễn Thử Nghiệm · 0912345678/.test(tt[3]) && /Phí báo sau khám/.test(tt[4]), JSON.stringify(tt));
    { const xl = await p.evaluate(() => ({ t: document.getElementById('dlm-xem-lai-ds').textContent, sua: document.querySelectorAll('#dlm-xem-lai-ds .dlm-sua').length })); ok('Bước 4: có khối "Kiểm tra lại trước khi gửi" liệt kê đủ thông tin (kể cả giống, tuổi, cân nặng 5.2 kg, giới tính, tình trạng) và nút "Sửa" mỗi dòng', /Bông/.test(xl.t) && /Golden/.test(xl.t) && /Tuổi: 2 tuổi/.test(xl.t) && /Cân nặng: 5\.2 kg/.test(xl.t) && /Giới tính: Đực/.test(xl.t) && /Ho nhẹ/.test(xl.t) && xl.sua >= 6, JSON.stringify(xl)); }
    await p.click('#dlm-gui'); await p.waitForSelector('#dlm-nhan:not([hidden])', { timeout: 5000 });
    const t = await p.evaluate(() => document.getElementById('dlm-nhan').textContent.replace(/\s+/g, ' '));
    ok('Giả lập: sau khi gửi hiện "Hoàn tất giả lập", KHÔNG có câu "đã tiếp nhận / đặt lịch thành công", KHÔNG có yêu cầu mạng ra ngoài nào', /Hoàn tất giả lập/.test(t) && !/đã được tiếp nhận|Đặt lịch thành công|Đã nhận yêu cầu/.test(t) && p.__ra.length === 0, t.slice(0, 200) + ' | ra: ' + p.__ra.length);
    ok('Không lưu dữ liệu khách ở máy (localStorage / sessionStorage / cookie đều trống)', await p.evaluate(() => localStorage.length === 0 && sessionStorage.length === 0 && document.cookie === ''));
    await p.context().close();
  }
  { const p = await mo(U1); await luong(p, { loai: 'meo', ten: 'Miu' }); const t = await p.evaluate(() => document.querySelector('[data-tt=thu]').textContent.replace(/\s+/g, ' '));
    ok('Khách đặt lịch cho MÈO: tóm tắt ghi "Miu" và loài "Mèo"', /Miu/.test(t) && /Mèo/.test(t), t); await p.context().close(); }
  { const p = await mo(U1); const an0 = await p.evaluate(() => getComputedStyle(document.getElementById('dlm-o-khac')).display);
    await chonLoai(p, 'khac'); await cho(100); const hien = await p.evaluate(() => { const o = document.getElementById('dlm-o-khac'); return { d: getComputedStyle(o).display, req: document.getElementById('dlm-loai-khac').required, nhan: o.querySelector('label').textContent.replace(/\s+/g, ' ').trim() }; });
    await p.fill('#dlm-ten-thu', 'Bông'); await tiep(p); const sau = await buocHien(p), loi = await loiChu(p, 'dlm-loai-khac-loi');
    await p.fill('#dlm-loai-khac', 'Thỏ'); await tiep(p); const sau2 = await buocHien(p); await p.click('.dlm-tien-nut[data-toi="1"]'); await cho(100); await p.click('label.dlm-the:has(input[name=loai][value=cho])'); await p.click('label.dlm-the:has(input[name=loai][value=khac])'); const giu = await p.inputValue('#dlm-loai-khac');
    ok('Chọn "Khác": ô "Thú cưng của bạn là loài gì?" hiện (ban đầu ẩn, bắt buộc); bỏ trống → lỗi cụ thể và KHÔNG chuyển bước; nhập "Thỏ" → sang bước 2; đổi qua lại vẫn giữ "Thỏ"', an0 === 'none' && hien.d !== 'none' && hien.req && /loài gì/.test(hien.nhan) && sau === 1 && /nhập loài thú cưng/.test(loi) && sau2 === 2 && giu === 'Thỏ', JSON.stringify({ an0, hien, sau, loi, sau2, giu })); await p.context().close(); }
  { const p = await mo(U1); await chonLoai(p, 'cho'); await tiep(p); const s = await buocHien(p), l = await loiChu(p, 'dlm-ten-thu-loi'), foc = await p.evaluate(() => document.activeElement.id), inv = await p.getAttribute('#dlm-ten-thu', 'aria-invalid');
    ok('Không nhập tên thú cưng: lỗi ngay dưới ô ("Vui lòng nhập tên thú cưng."), ở lại bước 1, focus về ô lỗi, aria-invalid', s === 1 && /Vui lòng nhập tên thú cưng/.test(l) && foc === 'dlm-ten-thu' && inv === 'true', JSON.stringify({ s, l, foc, inv })); await p.context().close(); }
  { const p = await mo(U1); await tiep(p); const l = await loiChu(p, 'dlm-loai-loi'), s = await buocHien(p);
    ok('Chưa chọn loài: lỗi "Vui lòng chọn loài thú cưng" và không chuyển bước', /chọn loài thú cưng/.test(l) && s === 1, l); await p.context().close(); }
  { const p = await mo(U1); await b1(p, 'cho', 'Bông', { can: 'abc' }); await tiep(p); const l = await loiChu(p, 'dlm-can-loi'), s = await buocHien(p);
    ok('Cân nặng không phải số: báo lỗi và không chuyển bước', /Cân nặng là số kg/.test(l) && s === 1, l); await p.context().close(); }
  { const p = await mo(U1); await luong(p, { sdt: '12345' }); await p.click('#dlm-gui'); await cho(200);
    const x = await p.evaluate(() => ({ l: document.getElementById('dlm-sdt-loi').textContent.trim(), kq: document.getElementById('dlm-nhan').hidden, b: +document.querySelector('.dlm-buoc:not([hidden])').dataset.buoc }));
    ok('Số điện thoại không hợp lệ (12345): báo "Số điện thoại gồm 10 số…", KHÔNG gửi, ở lại bước 4', /gồm 10 số/.test(x.l) && x.kq && x.b === 4, JSON.stringify(x));
    for (const [v, hop] of [['0912345678', true], ['+84912345678', true], ['0912 345 678', true], ['091234567', false], ['abc', false], ['1912345678', false]]) { await p.fill('#dlm-sdt', v); await p.press('#dlm-sdt', 'Tab'); const l2 = await loiChu(p, 'dlm-sdt-loi'); if ((l2 === '') !== hop) { ok('Định dạng SĐT Việt Nam: ' + v, false, l2); } }
    ok('Định dạng SĐT Việt Nam: 0912345678, +84912345678, "0912 345 678" hợp lệ; 091234567, abc, 1912345678 bị từ chối', !kq.some((k) => k.tt === 'KHÔNG ĐẠT' && /Định dạng SĐT/.test(k.ten)));
    await p.fill('#dlm-sdt', '0912345678'); await p.fill('#dlm-email', 'sai-email'); await p.press('#dlm-email', 'Tab'); const le = await loiChu(p, 'dlm-email-loi'); await p.fill('#dlm-email', ''); await p.press('#dlm-email', 'Tab'); const le2 = await loiChu(p, 'dlm-email-loi');
    ok('Email không bắt buộc: để trống hợp lệ; nhập sai định dạng thì báo lỗi', /định dạng/.test(le) && le2 === '', le + ' | ' + le2); await p.context().close(); }
  { // Quay lại, đổi dịch vụ và thời gian
    const p = await mo(U1); await luong(p, { ten: 'Bông', khach: 'Trần Văn A' });
    await p.click('.dlm-tien-nut[data-toi="1"]'); await cho(150); const a1 = await p.inputValue('#dlm-ten-thu'), s1 = await buocHien(p);
    await p.click('.dlm-tien-nut[data-toi="2"]'); await cho(150); const dv1 = await p.evaluate(() => document.querySelector('input[name=dich_vu]:checked').getAttribute('data-ten'));
    await p.click('label.dlm-the-dv:has(input[value*="xet-nghiem"]) >> nth=0'); await tiep(p); await p.click(`.dlm-chip-gio:has(input[value="10:30"])`);
    await p.click('.dlm-tien-nut[data-toi="4"]'); await cho(150);
    const e = await p.evaluate(() => ({ ten: document.getElementById('dlm-ten-khach').value, ds: document.getElementById('dlm-xem-lai-ds').textContent, gio: document.querySelector('[data-tt=gio] .dlm-tt-gt').textContent, dv: document.querySelector('[data-tt=dv] .dlm-tt-gt').textContent }));
    ok('Quay lại bước 1 vẫn còn tên "Bông"; đổi sang Xét nghiệm và giờ 10:30 → tóm tắt + "Kiểm tra lại" đổi theo; thông tin liên hệ đã nhập không mất', a1 === 'Bông' && s1 === 1 && /Khám/.test(dv1) && e.ten === 'Trần Văn A' && /Xét nghiệm/.test(e.dv) && /10:30/.test(e.gio) && /Xét nghiệm/.test(e.ds) && /10:30/.test(e.ds), JSON.stringify({ a1, dv1, e }));
    await p.click('.dlm-tien-nut[data-toi="1"]'); await p.fill('#dlm-ten-thu', ''); await p.click('.dlm-tien-nut[data-toi="3"]'); await cho(150); const chan = await buocHien(p);
    ok('Không nhảy tới bước sau khi bước trước còn thiếu bắt buộc (xoá tên thú cưng rồi bấm bước 3 → ở lại bước 1)', chan === 1, 'bước ' + chan); await p.context().close(); }

  // ===== 3. Lịch, giờ, thời gian quá khứ, không có khung giờ =====
  { const p = await mo(U1); await b1(p); await tiep(p); await b2(p); await tiep(p);
    const x = await p.evaluate(() => { const nay = [...document.querySelectorAll('#dlm-lich .dlm-ngay')], tt = nay.map((e) => [e.dataset.iso, e.disabled]); return { truoc: document.querySelector('#dlm-lich .dlm-lich-chuyen').disabled, tt }; });
    const homNay = vnHomNay(), quaKhu = x.tt.filter(([i]) => i < homNay), tuongLai = x.tt.filter(([i]) => i >= homNay);
    ok('Lịch: mọi ngày trước hôm nay bị vô hiệu hoá, từ hôm nay trở đi chọn được, nút "tháng trước" tắt ở tháng hiện tại', quaKhu.every(([, d]) => d) && tuongLai.every(([, d]) => !d) && x.truoc, JSON.stringify({ quaKhu: quaKhu.length, tuongLai: tuongLai.length, truoc: x.truoc }));
    const goi = await p.evaluate(() => document.getElementById('dlm-gio-goi').textContent), noGio = await p.evaluate(() => document.querySelectorAll('#dlm-gio .dlm-chip-gio').length);
    ok('Trước khi chọn ngày: chưa hiện khung giờ (có lời nhắc chọn ngày); dòng gợi ý nói rõ đây là giờ MONG MUỐN, không phải lịch đã giữ chỗ', noGio === 0 && /không phải lịch đã được giữ chỗ/.test(goi));
    await chonNgay(p, 'dlm-lich', vnHomNay(2)); const gr = await p.evaluate(() => ({ nhom: [...document.querySelectorAll('.dlm-gio-ten')].map((e) => e.textContent), gio: [...document.querySelectorAll('.dlm-chip-gio input')].map((e) => e.value), tat: document.querySelectorAll('.dlm-chip-gio.tat').length }));
    ok('Ngày tương lai: khung giờ 08:00–21:00 cách 30 phút (' + gr.gio.length + ' ô) chia nhóm Sáng / Chiều / Tối, không ô nào bị tắt', gr.nhom.join() === 'Sáng,Chiều,Tối' && gr.gio[0] === '08:00' && gr.gio[gr.gio.length - 1] === '20:30' && gr.tat === 0, JSON.stringify(gr));
    await tiep(p); const l = await loiChu(p, 'dlm-gio-loi'), s = await buocHien(p); ok('Chưa chọn giờ: báo "Vui lòng chọn giờ mong muốn", không chuyển bước', /chọn giờ mong muốn/.test(l) && s === 3, l); await p.context().close(); }
  { const p = await mo(U1, {}, [14, 5]); await b1(p); await tiep(p); await b2(p); await tiep(p); await chonNgay(p, 'dlm-lich', vnHomNay(0));
    const x = await p.evaluate(() => [...document.querySelectorAll('.dlm-chip-gio')].map((e) => [e.querySelector('input').value, e.querySelector('input').disabled]));
    ok('Hôm nay lúc 14:05 (giờ VN): các giờ ≤ 14:00 bị vô hiệu hoá (gạch ngang), từ 14:30 trở đi chọn được', x.filter(([g]) => g <= '14:00').every(([, d]) => d) && x.filter(([g]) => g >= '14:30').every(([, d]) => !d), JSON.stringify(x.slice(10, 16)));
    await p.context().close(); }
  { const p = await mo(U1, {}, [21, 30]); await b1(p); await tiep(p); await b2(p); await tiep(p); await chonNgay(p, 'dlm-lich', vnHomNay(0)); await cho(100);
    const x = await p.evaluate(() => ({ k: (document.querySelector('.dlm-khong-gio') || {}).textContent || '', so: document.querySelectorAll('.dlm-chip-gio').length })); await tiep(p); const l = await loiChu(p, 'dlm-ngay-loi'), s = await buocHien(p);
    ok('Hôm nay lúc 21:30 (hết giờ nhận lịch): hiện thông báo "không có khung giờ phù hợp", không có ô giờ nào, không cho sang bước sau; chọn ngày mai thì có giờ', /hết giờ nhận lịch/.test(x.k) && x.so === 0 && /hết giờ nhận lịch/.test(l) && s === 3 && await (async () => { await chonNgay(p, 'dlm-lich', vnHomNay(1)); return (await p.$$('.dlm-chip-gio')).length > 0; })(), JSON.stringify({ x, l, s })); await p.context().close(); }
  { const p = await mo(U1); await b1(p); await tiep(p); await b2(p, true); await tiep(p);
    const hien = await p.evaluate(() => ({ don: getComputedStyle(document.getElementById('dlm-o-don')).display, nhan: document.getElementById('dlm-ngay-nhan').textContent.trim() }));
    await chonNgay(p, 'dlm-lich', vnHomNay(3)); await p.click('.dlm-chip-gio:has(input[value="09:00"])'); const donTruoc = await p.evaluate(() => [...document.querySelectorAll('#dlm-lich-don .dlm-ngay')].filter((e) => e.dataset.iso < (document.querySelector('#dlm-lich .dlm-ngay.chon') || {}).dataset.iso).every((e) => e.disabled));
    await tiep(p); const l = await loiChu(p, 'dlm-don-loi'), s = await buocHien(p); await chonNgay(p, 'dlm-lich-don', vnHomNay(5)); await tiep(p); const s2 = await buocHien(p);
    ok('Dịch vụ nội trú: hiện thêm "Ngày đón dự kiến" (nhãn đổi thành "Ngày gửi thú cưng"), ngày đón không trước ngày gửi, bắt buộc; chọn xong mới sang bước 4', hien.don !== 'none' && /Ngày gửi/.test(hien.nhan) && donTruoc && /ngày đón/.test(l) && s === 3 && s2 === 4, JSON.stringify({ hien, donTruoc, l, s, s2 })); await p.context().close(); }

  // ===== 4. Hiệu ứng và trợ năng =====
  { const p = await mo(U1); await chonLoai(p, 'cho'); await p.fill('#dlm-ten-thu', 'B'); await cho(60);
    const moi = await p.evaluate(() => [...document.querySelectorAll('.dlm-tt-ds > div.moi')].map((e) => e.dataset.tt)), ttCu = await p.evaluate(() => document.querySelector('[data-tt=dv]').classList.contains('moi'));
    ok('Tóm tắt trực tiếp: gõ tên thú cưng chỉ làm nổi bật ĐÚNG dòng "Thú cưng" (không nhấp nháy cả bảng); nền nổi bật tự tắt sau ~1s', moi.join() === 'thu' && !ttCu && await (async () => { await cho(1100); return (await p.$$('.dlm-tt-ds > div.moi')).length === 0; })(), moi.join());
    await p.fill('#dlm-ten-thu', 'Bông'); await tiep(p);
    const an = await p.evaluate(() => { const a = document.getAnimations().filter((x) => /dlm-vao/.test(x.animationName || '')).map((x) => [x.animationName, x.effect.getTiming().duration]); return a; }); const kf = await p.evaluate(() => { const r = []; for (const ss of document.styleSheets) { try { for (const x of ss.cssRules) if (x.name === 'dlm-vao-phai') r.push(x.cssText.replace(/\s+/g, ' ')); } catch (e) { /* */ } } return r.join(' '); });
    ok('Chuyển bước: hoạt cảnh mờ + trượt ngang 12px trong 320ms (dlm-vao-phai), dùng transform / opacity', an.some((x) => x[0] === 'dlm-vao-phai' && x[1] === 320) && /translate(X)?\(12px\)/.test(kf) && /opacity: 0/.test(kf), JSON.stringify(an) + kf.slice(0, 160));
    await p.click('.dlm-tien-nut[data-toi="1"]'); await chonLoai(p, 'meo'); await cho(400); const t = await p.evaluate(() => { const l = document.querySelector('label.dlm-the:has(input[value=meo]) .dlm-tick'); return { op: +getComputedStyle(l).opacity, tr: getComputedStyle(l).transform, dur: getComputedStyle(l).transitionDuration }; });
    ok('Chọn thẻ: dấu tick hiện (độ mờ 1), chuyển 220ms; viền tím + nền tím nhạt cho thẻ đã chọn', t.op === 1 && /0\.22s/.test(t.dur) && await p.evaluate(() => { const e = document.querySelector('label.dlm-the:has(input[value=meo]) .dlm-the-in'); return getComputedStyle(e).borderColor === 'rgb(90, 30, 94)' && getComputedStyle(e).backgroundColor === 'rgb(246, 238, 247)'; }), JSON.stringify(t));
    const hv = await (async () => { const e = await p.$('label.dlm-the:has(input[value=cho]) .dlm-the-in'); await e.hover(); await cho(300); return p.evaluate(() => getComputedStyle(document.querySelector('label.dlm-the:has(input[value=cho]) .dlm-the-in')).transform); })();
    ok('Rê chuột vào thẻ: nâng nhẹ lên 2px (translateY -2px)', /matrix\(1, 0, 0, 1, 0, -2\)/.test(hv), hv);
    await p.click('.dlm-tien-nut[data-toi="1"]'); const bt = await p.evaluate(() => { const n = document.getElementById('dlm-tiep'), m = n.querySelector('.mui'); return { dur: getComputedStyle(n).transitionDuration, mui: getComputedStyle(m).transitionDuration }; }); await (await p.$('#dlm-tiep')).hover(); await cho(300); const mt = await p.evaluate(() => getComputedStyle(document.querySelector('#dlm-tiep .mui')).transform);
    ok('Nút: chuyển 200ms, mũi tên dịch sang phải 4px khi rê chuột; bấm xuống thu 0,98', /0\.2s/.test(bt.dur) && /matrix\(1, 0, 0, 1, 4, 0\)/.test(mt) && await p.evaluate(() => /scale\(\.98\)|0\.98/.test([...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch (e) { return []; } }).map((r) => r.cssText).join(' '))), JSON.stringify({ bt, mt })); await p.context().close(); }
  { const p = await mo(U1, { reducedMotion: 'reduce' }); await b1(p); await tiep(p); const an = await p.evaluate(() => document.getAnimations().filter((x) => /dlm-vao/.test(x.animationName || '') && x.effect.getComputedTiming().duration > 1).length);
    await p.click('.dlm-tien-nut[data-toi="1"]'); await (await p.$('label.dlm-the:has(input[value=cho]) .dlm-the-in')).hover(); await cho(250); const hv = await p.evaluate(() => getComputedStyle(document.querySelector('label.dlm-the:has(input[value=cho]) .dlm-the-in')).transform);
    ok('Giảm chuyển động: chuyển bước không còn hoạt cảnh trượt, thẻ không nâng khi rê chuột, mũi tên không dịch', an === 0 && (hv === 'none' || hv === 'matrix(1, 0, 0, 1, 0, 0)') && await (async () => { await b1(p); await (await p.$('#dlm-tiep')).hover(); await cho(250); const t = await p.evaluate(() => getComputedStyle(document.querySelector('#dlm-tiep .mui')).transform); return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)'; })(), JSON.stringify({ an, hv })); await p.context().close(); }
  { // Bàn phím hoàn toàn
    const p = await mo(U1); await p.focus('input[name=loai][value=meo]'); await p.keyboard.press('Space'); await p.keyboard.press('Tab'); // → Khác? (radio nhóm: Tab rời nhóm)
    const dl = await p.evaluate(() => document.querySelector('input[name=loai]:checked').value); await p.focus('#dlm-ten-thu'); await p.keyboard.type('Miu'); await p.keyboard.press('Enter'); await cho(300); const s2 = await buocHien(p);
    await p.focus('input[name=dich_vu] >> nth=1'); await p.keyboard.press('Space'); await p.keyboard.press('Enter'); await cho(100); await p.focus('#dlm-tiep'); await p.keyboard.press('Enter'); await cho(300); const s3 = await buocHien(p);
    const lich = await p.evaluate(() => document.querySelector('#dlm-lich .dlm-ngay[tabindex="0"]').dataset.iso); await p.focus('#dlm-lich .dlm-ngay[tabindex="0"]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await cho(150);
    const chon = await p.evaluate(() => (document.querySelector('#dlm-lich .dlm-ngay.chon') || {}).dataset?.iso), vong = await p.evaluate(() => { const a = document.activeElement; return a.classList.contains('dlm-ngay') ? getComputedStyle(a).outlineStyle : 'khong'; });
    await p.focus('.dlm-chip-gio input >> nth=4'); await p.keyboard.press('Space'); await p.focus('#dlm-tiep'); await p.keyboard.press('Enter'); await cho(300); const s4 = await buocHien(p);
    await p.focus('#dlm-ten-khach'); await p.keyboard.type('Lê Bàn Phím'); await p.keyboard.press('Tab'); await p.keyboard.type('0912345678'); await p.focus('#dlm-gui'); await p.keyboard.press('Enter'); await p.waitForSelector('#dlm-nhan:not([hidden])', { timeout: 5000 });
    const dau = await p.evaluate(() => document.activeElement.id);
    ok('Chỉ dùng bàn phím: chọn loài bằng Space, Enter chuyển bước, chọn dịch vụ, mũi tên chọn ngày trong lịch (có viền focus), chọn giờ, nhập liên hệ, gửi bằng Enter → tới kết quả; focus chuyển vào thẻ kết quả', dl === 'meo' && s2 === 2 && s3 === 3 && chon && chon > lich && vong === 'solid' && s4 === 4 && dau === 'dlm-nhan', JSON.stringify({ dl, s2, s3, lich, chon, vong, s4, dau })); await p.context().close(); }
  { const p = await mo(U1); const x = await p.evaluate(() => ({ lang: document.documentElement.lang, nhom: document.querySelectorAll('[role=radiogroup]').length, lienNhan: [...document.querySelectorAll('#dlm-form input:not([type=radio]):not([type=hidden]):not(#dlm-web), textarea')].filter((i) => !document.querySelector(`label[for="${i.id}"]`)).map((i) => i.id), loiLive: document.querySelector('#dlm-tb').getAttribute('role'), tien: document.querySelector('.dlm-tien').getAttribute('aria-label'), cur: document.querySelector('.dlm-tien-nut[aria-current=step]') && document.querySelector('.dlm-tien-nut[aria-current=step]').dataset.toi, live: document.querySelector('.dlm-tt-ds').getAttribute('aria-live') }));
    ok('Trợ năng: mỗi ô nhập có <label>, nhóm radio có role, tiến trình có nhãn và aria-current="step", thông báo lỗi role=alert, tóm tắt aria-live', x.lienNhan.length === 0 && x.nhom >= 2 && x.tien && x.cur === '1' && x.loiLive === 'alert' && x.live === 'polite', JSON.stringify(x));
    await chonLoai(p, 'cho'); await p.fill('#dlm-tinh-trang', 'Bé khó thở và co giật'); await cho(100); const k = await p.evaluate(() => { const e = document.getElementById('dlm-khan'); return { hien: !e.hidden, t: e.textContent, tel: !!e.querySelector('a[href^="tel:"]') }; });
    ok('Tình trạng khẩn cấp (khó thở, co giật): hiện hướng dẫn GỌI NGAY cho bệnh viện (có liên kết tel:), không đưa kết luận y khoa; gõ nội dung bình thường thì ẩn', k.hien && k.tel && /không đưa ra kết luận y khoa/i.test(k.t) && await (async () => { await p.fill('#dlm-tinh-trang', 'Tiêm phòng định kỳ'); await cho(80); return p.evaluate(() => document.getElementById('dlm-khan').hidden); })(), JSON.stringify(k)); await p.context().close(); }

  // ===== 5. Gửi thật (đường 'that') qua máy chủ Code.v2.gs chạy với Trang tính giả =====
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, () => 'qua'); await luong(p, { loai: 'khac', khac: 'Thỏ', ten: 'Bông', giong: 'Thỏ tai cụp', tuoi: '1 tuổi', can: '1.8', gt: 'Cái', tt: 'Ăn ít 2 ngày', email: 'khach@example.com', ghi: 'Gọi sau 18h', khach: 'Lê Văn Thử', gio: '10:00' });
    await p.click('#dlm-gui'); await p.waitForSelector('#dlm-nhan:not([hidden])', { timeout: 8000 }); const t = await p.evaluate(() => document.getElementById('dlm-nhan').textContent.replace(/\s+/g, ' ')), j = JSON.parse(p.__ds[0].body), hang = env.st.rows.length > 1 ? env.o(1) : null;
    ok('Gửi thành công (máy chủ Code.v2.gs thật, Trang tính giả): hiện "Yêu cầu đặt lịch đã được tiếp nhận!" + mã yêu cầu + nói rõ nhân viên sẽ liên hệ xác nhận, KHÔNG nói "đã xác nhận / đặt lịch thành công"', /Yêu cầu đặt lịch đã được tiếp nhận!/.test(t) && /LS-\d{6}-[0-9A-Z]{6}/.test(t) && /nhân viên bệnh viện sẽ liên hệ xác nhận/i.test(t) && !/đặt lịch thành công|lịch đã được xác nhận/i.test(t), t.slice(0, 260));
    ok('Máy chủ nhận ĐỦ dữ liệu: đúng 1 dòng; dòng ghi tên, SĐT, thú cưng, loài Khác (Thỏ), dịch vụ, ngày, giờ; giống / tuổi / cân nặng / giới tính / email / tình trạng / ghi chú nằm trong cột Ghi chú (không mất)', !!hang && env.st.rows.length === 2 && JSON.stringify(hang).includes('Lê Văn Thử') && JSON.stringify(hang).includes('0912345678') && /Thỏ/.test(JSON.stringify(hang)) && /Giống: Thỏ tai cụp/.test(hang['Ghi chú']) && /Tuổi\/ngày sinh: 1 tuổi/.test(hang['Ghi chú']) && /Cân nặng: 1\.8 kg/.test(hang['Ghi chú']) && /Giới tính: Cái/.test(hang['Ghi chú']) && /Email: khach@example\.com/.test(hang['Ghi chú']) && /Ăn ít 2 ngày/.test(hang['Ghi chú']) && /Gọi sau 18h/.test(hang['Ghi chú']) && (hang['Ghi chú'] || '').length <= 1000, JSON.stringify(hang).slice(0, 360));
    ok('Gói gửi đi có mã yêu cầu, ô bẫy chống tin rác để trống, các trường mới (giống, tuổi, cân nặng, giới tính, email, tình trạng) gửi riêng để máy chủ mới đọc được', !!j.ma_yeu_cau && j.website === '' && j.giong === 'Thỏ tai cụp' && j.can_nang === '1.8' && j.gioi_tinh === 'Cái' && j.email === 'khach@example.com' && j.tinh_trang === 'Ăn ít 2 ngày' && j.dich_vu_ma, Object.keys(j).join());
    ok('Chỉ có DUY NHẤT yêu cầu tới địa chỉ nhận (script.google.com); không có yêu cầu ra ngoài nào khác', p.__ra.length === 1 && /script\.google\.com/.test(p.__ra[0]), JSON.stringify(p.__ra)); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, () => 'qua'); await luong(p); await p.dblclick('#dlm-gui'); await p.waitForSelector('#dlm-nhan:not([hidden])', { timeout: 8000 }); await cho(300);
    ok('Bấm gửi hai lần liên tiếp (double-click): chỉ MỘT yêu cầu được gửi, chỉ một dòng trong Trang tính', p.__ds.length === 1 && env.st.rows.length === 2, 'yêu cầu: ' + p.__ds.length + ', dòng: ' + env.st.rows.length); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, (lan) => (lan === 1 ? 'loi-mang' : 'qua')); await luong(p, { ten: 'Bông' }); await p.click('#dlm-gui'); await p.waitForSelector('#dlm-tb:not([hidden])', { timeout: 8000 });
    const x = await p.evaluate(() => ({ tb: document.getElementById('dlm-tb').textContent.replace(/\s+/g, ' '), nut: document.querySelector('#dlm-gui .dlm-nut-chu').textContent, ten: document.getElementById('dlm-ten-khach').value, kq: document.getElementById('dlm-nhan').hidden, form: !document.getElementById('dlm-form').hidden }));
    ok('Lỗi mạng khi gửi: hiện "Chưa nhận được xác nhận…" kèm số điện thoại, KHÔNG báo thành công, dữ liệu vẫn nguyên, nút đổi thành "Gửi lại"', /Chưa nhận được xác nhận/.test(x.tb) && /0973 555 105/.test(x.tb) && x.nut === 'Gửi lại' && x.ten === 'Nguyễn Thử Nghiệm' && x.kq && x.form, JSON.stringify(x));
    await p.click('#dlm-gui'); await p.waitForSelector('#dlm-nhan:not([hidden])', { timeout: 8000 }); const ma = p.__ds.map((d) => JSON.parse(d.body).ma_yeu_cau);
    ok('Bấm "Gửi lại" sau lỗi mạng: thành công, dùng LẠI cùng mã yêu cầu (hệ thống tránh trùng), Trang tính có đúng 1 dòng', ma.length === 2 && ma[0] === ma[1] && env.st.rows.length === 2, ma.join(' / ')); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, (lan) => (lan === 1 ? 'mat-phan-hoi' : 'qua')); await luong(p); await p.click('#dlm-gui'); await p.waitForSelector('#dlm-tb:not([hidden])', { timeout: 8000 }); const tuc = env.st.rows.length - 1; await p.click('#dlm-gui'); await p.waitForSelector('#dlm-nhan:not([hidden])', { timeout: 8000 });
    ok('Máy chủ ĐÃ lưu nhưng trình duyệt không nhận được phản hồi → gửi lại không tạo dòng thứ hai (chống trùng theo mã)', tuc === 1 && env.st.rows.length === 2, 'sau lần 1: ' + tuc + ', sau lần 2: ' + (env.st.rows.length - 1)); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, () => 'loi-may-chu'); await luong(p); await p.click('#dlm-gui'); await p.waitForSelector('#dlm-tb:not([hidden])', { timeout: 8000 }); const t = await p.evaluate(() => document.getElementById('dlm-tb').textContent + '|' + document.getElementById('dlm-nhan').hidden);
    ok('Máy chủ trả ok:false: hiện "Chưa gửi được yêu cầu: …" và KHÔNG hiện thẻ tiếp nhận', /Chưa gửi được yêu cầu/.test(t) && /\|true$/.test(t), t); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, () => 'rac'); await luong(p); await p.click('#dlm-gui'); await p.waitForSelector('#dlm-tb:not([hidden])', { timeout: 8000 }); const t = await p.evaluate(() => document.getElementById('dlm-tb').textContent + '|' + document.getElementById('dlm-nhan').hidden);
    ok('Máy chủ trả nội dung không đọc được (không phải JSON hợp đồng): KHÔNG báo thành công', /Chưa nhận được xác nhận/.test(t) && /\|true$/.test(t), t.slice(0, 120)); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, () => 'qua'); await luong(p); await p.fill('#dlm-web', 'spam'); await p.click('#dlm-gui'); await cho(800);
    ok('Ô bẫy chống tin rác có nội dung: không gửi gì, không báo gì', p.__ds.length === 0 && (await p.$eval('#dlm-nhan', (e) => e.hidden)), 'yêu cầu: ' + p.__ds.length); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, () => 'qua'); await luong(p, { noiTru: true, ten: 'Bông' }); await p.click('#dlm-gui'); await p.waitForSelector('#dlm-nhan:not([hidden])', { timeout: 8000 }); const j = JSON.parse(p.__ds[0].body), h = env.o(1);
    ok('Nội trú: gửi kèm ngày đón dự kiến, máy chủ chấp nhận và ghi cột "Ngày đón dự kiến"', !!j.ngay_don && /\d{4}-\d{2}-\d{2}/.test(String(h['Ngày đón dự kiến'] || '').replace(/^'/, '')) || /\d/.test(String(h['Ngày đón dự kiến'])), JSON.stringify(h['Ngày đón dự kiến'])); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(U2, {}, null, env, () => 'qua'); await luong(p); await p.click('#dlm-gui'); await p.waitForSelector('#dlm-nhan:not([hidden])', { timeout: 8000 });
    const x = await p.evaluate(() => { const t = document.querySelector('.dlm-nhan-the .dlm-tick-lon path'); const cs = getComputedStyle(t), kn = document.getAnimations().filter((a) => /dlm-(tick|ve)/.test(a.animationName || '')).map((a) => [a.animationName, a.effect.getTiming().duration]); return { kn }; });
    ok('Thành công: dấu tick xuất hiện mềm bằng hoạt cảnh 450ms (scale + vẽ nét), chỉ khi máy chủ đã xác nhận', x.kn.length >= 1 && x.kn.every((k) => k[1] === 450), JSON.stringify(x));
    await p.click('.dlm-nhan-the .dlm-nut'); await cho(200); const y = await p.evaluate(() => ({ b: +document.querySelector('.dlm-buoc:not([hidden])').dataset.buoc, ten: document.getElementById('dlm-ten-thu').value, tt: document.querySelector('[data-tt=thu] .dlm-tt-gt').textContent.trim() }));
    ok('"Gửi yêu cầu khác": quay về bước 1 với biểu mẫu trống, tóm tắt về "Chưa nhập"', y.b === 1 && y.ten === '' && y.tt === 'Chưa nhập', JSON.stringify(y)); await p.context().close(); }
  { // Không còn dấu hiệu đăng nhập / thanh toán / giá bịa
    const html = fs.readFileSync(path.join(D1, 'dat-lich/index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    ok('Trang không có đăng nhập, tài khoản, thanh toán; không có mức giá ví dụ (250.000đ); chi phí chỉ lấy từ dữ liệu giá hoặc là lời dẫn', !/đăng nhập|tạo tài khoản|mật khẩu|thanh toán|VNPay|Momo/i.test(html) && !/250\.000/.test(html) && /Phí báo sau khám/.test(html) && /Liên hệ để được tư vấn/.test(html));
    ok('Có nhãn "Bản xem trước · chưa gửi dữ liệu thật" ở bản giả lập; bản "that" KHÔNG có nhãn này và có data-endpoint', /Bản xem trước · chưa gửi dữ liệu thật/.test(html) && !/chưa gửi dữ liệu thật/.test(fs.readFileSync(path.join(D2, 'dat-lich/index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')) && /data-endpoint="https:\/\/script\.google\.com/.test(fs.readFileSync(path.join(D2, 'dat-lich/index.html'), 'utf8')));
  }
  ok('Không có lỗi JavaScript trong suốt các tình huống trên', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '));
  chuaXm('Trình đọc màn hình thật (NVDA / VoiceOver), Safari / Firefox / Edge, bàn phím ảo trên điện thoại thật; nhận email / Google Sheet thật', 'Chỉ kiểm được bằng thiết bị / tài khoản thật; ở đây chỉ chạy Chromium với Google giả');

  await b.close(); sv1.close(); sv2.close(); fs.rmSync(D1, { recursive: true, force: true }); fs.rmSync(D2, { recursive: true, force: true });
  const dem = (t) => kq.filter((x) => x.tt === t).length, tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA CHẠY 0 · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH')}`;
  const dong = kq.map((x) => `${x.tt === 'ĐẠT' ? '✓' : x.tt === 'KHÔNG ĐẠT' ? '✗' : '?'} [${x.tt}] ${x.ten}${x.tt !== 'ĐẠT' && x.ct ? ' → ' + x.ct : ''}`);
  const nd = `Kiểm thử trang Đặt lịch giao diện mới · Chromium Playwright · ${new Date().toISOString()}\n${dong.join('\n')}\n\n${tom}\n`;
  fs.writeFileSync(path.join(__dirname, 'ket-qua/ket-qua-dat-lich-moi.txt'), nd); console.log(nd);
  process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
