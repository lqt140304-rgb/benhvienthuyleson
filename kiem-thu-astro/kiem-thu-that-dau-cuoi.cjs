// Đầu-cuối trên BẢN THỬ "that" (ban-thu-that/dist, nối địa chỉ Sheet thử): trình duyệt thật → (chặn lại mọi yêu cầu tới script.google.com) → Code.v2.gs chạy bằng Trang tính GIẢ.
// Chứng minh: gửi thành công = 1 dòng + 1 email; mất phản hồi SAU khi máy chủ đã lưu rồi gửi lại = vẫn 1 dòng + 1 email; lỗi mạng TRƯỚC khi tới máy chủ rồi gửi lại = 1 dòng + 1 email;
// yêu cầu khác = dòng thứ 2; form mới không gửi hoá đơn / tổng tạm tính. KHÔNG gọi Google thật (script.google.com bị chặn và trả lời bằng bản giả).
// Dùng: node kiem-thu-astro/dung-ban-thu-that.cjs <địa chỉ /exec> && node kiem-thu-astro/kiem-thu-that-dau-cuoi.cjs
const fs = require('fs'), path = require('path'), cp = require('child_process'), { chromium } = require('playwright'), { taoMoiTruong } = require('./mo-phong-google.cjs');
const GOC = path.resolve(__dirname, '..'), CONG = 4396, URLT = `http://localhost:${CONG}/benhvienthuyleson`, DIST = path.join(GOC, process.env.THU_DIST || 'ban-thu-that/dist');
if (!fs.existsSync(path.join(DIST, 'dat-lich/index.html'))) { console.error('Chưa có bản thử: chạy dung-ban-thu-that.cjs trước.'); process.exit(2); }
const kq = []; const ok = (ten, dk, ct = '') => { kq.push({ tt: dk ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 300) }); };
const cong = (n) => { const v = new Date(Date.now() + 7 * 3600e3), d = new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate() + n)); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`; };
(async () => {
  const may = cp.spawn('node', [path.join(__dirname, 'may-chu.cjs'), String(CONG)], { stdio: 'ignore', env: { ...process.env, DIST } });
  await new Promise((r) => setTimeout(r, 800));
  const b = await chromium.launch();
  const mo = async (env, kieu, gioVn) => { // kieu: hàm (lan, bodyDaLuu) → 'qua' | 'mat-phan-hoi' | 'loi-mang'
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }), p = await ctx.newPage(), ds = [];
    if (gioVn) { const v = new Date(Date.now() + 7 * 3600e3); await ctx.clock.setFixedTime(new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), gioVn[0] - 7, gioVn[1]))); } /* đồng hồ trình duyệt = giờ Việt Nam hôm nay lúc gioVn */
    p.__loi = []; p.on('pageerror', (e) => p.__loi.push(e.message));
    await ctx.route(/^(?!http:\/\/localhost)/, async (r) => {
      const u = r.request().url(); if (!/script\.google\.com/.test(u)) return r.abort();
      const body = r.request().postData() || '', lan = ds.push({ u, body }), cach = kieu(lan);
      if (cach === 'loi-mang') return r.abort('failed');
      const tra = env.ctx.doPost({ postData: { contents: body } }).getContent(); // máy chủ THẬT (mã Code.v2.gs) chạy với Trang tính giả
      if (cach === 'mat-phan-hoi') return r.abort('failed'); // máy chủ đã lưu nhưng trình duyệt không nhận được phản hồi
      return r.fulfill({ status: 200, contentType: 'application/json', body: tra });
    });
    await p.goto(URLT + '/dat-lich/', { waitUntil: 'load' }); p.__ds = ds; return p;
  };
  const dien = async (p, ten = 'THỬ NGHIỆM', thu = 'Bé Thử') => {
    await p.fill('#m-ten', ten); await p.fill('#m-sdt', '0912 345 678'); await p.fill('#m-thu', thu);
    const dv = await p.evaluate(() => [...document.getElementById('m-dv').options].map((o) => o.value).find((v) => v && !/noi-tru|bed/i.test(v)));
    await p.selectOption('#m-dv', dv); await p.fill('#m-ngay', cong(2)); await p.selectOption('#m-gio', '09:00'); await p.fill('#m-ghi', 'Dòng thử tự động');
  };
  const gui = async (p) => { await p.waitForSelector('#m-gui:not([disabled])', { timeout: 8000 }); await p.click('#m-gui'); };
  const chua = (p) => p.waitForSelector('#dl-thong-bao', { state: 'visible', timeout: 8000 });
  const nhan = (p) => p.waitForSelector('#dl-nhan', { state: 'visible', timeout: 8000 });
  const chu = async (p, s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ');

  // 0. Bản dựng đúng chế độ that, đúng địa chỉ, không hoá đơn
  { const html = fs.readFileSync(path.join(DIST, 'dat-lich/index.html'), 'utf8');
    ok('Bản thử: data-mode="that", có địa chỉ script.google.com/macros/s/…/exec, KHÔNG còn dòng "chưa gửi dữ liệu thật"', /data-mode="that"/.test(html) && /data-endpoint="https:\/\/script\.google\.com\/macros\/s\/[^"]+\/exec"/.test(html) && !/chưa gửi dữ liệu thật/.test(html));
    ok('Form mới không có ô hoá đơn tham khảo / phụ phí tự động / tổng tạm tính', !/id="(hoa-don|tong|phu-phi)/i.test(html.replace(/<script[\s\S]*?<\/script>/g, '')) && !/Tổng tạm tính|Phụ phí tự động/.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/Ngoài giờ mở cửa[\s\S]*?<\/section>/, ''))); }

  // A. Thành công
  { const env = taoMoiTruong(), p = await mo(env, () => 'qua'); await dien(p); await gui(p); await nhan(p); const t = await chu(p, '#dl-nhan'), j = JSON.parse(p.__ds[0].body);
    ok('[A thành công] Hiện "Đã nhận yêu cầu đặt lịch…" kèm mã LS-…; Sheet đúng 1 dòng; đúng 1 email', /Đã nhận yêu cầu đặt lịch, bệnh viện sẽ liên hệ xác nhận/.test(t) && /LS-\d{6}-[0-9A-Z]{6}/.test(t) && env.st.rows.length === 2 && env.st.emails.length === 1, `${t.slice(0, 120)} · ${env.st.rows.length - 1} dòng · ${env.st.emails.length} email`);
    ok('[A thành công] Mã hiện cho khách = mã trong Sheet; email nhắc đúng mã; trạng thái "Mới", "Email báo" = "đã gửi"', t.includes(env.o(1)['Mã yêu cầu']) && env.st.emails[0].subject.includes(env.o(1)['Mã yêu cầu']) && env.o(1)['Trạng thái'] === 'Mới' && env.o(1)['Email báo'] === 'đã gửi', JSON.stringify(env.o(1)));
    ok('[A thành công] Gửi tới địa chỉ Sheet thử (script.google.com/macros/s/…/exec); nội dung không có hoá đơn / tổng tạm tính / cân nặng', /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(p.__ds[0].u) && !('hoa_don' in j) && !('tong_tam_tinh' in j) && !('can_nang' in j) && env.o(1)['Hoá đơn tham khảo'] === '' && env.o(1)['Tổng tạm tính'] === '', Object.keys(j).join());
    ok('[A thành công] Không lỗi JavaScript', p.__loi.length === 0, p.__loi.join('|')); await p.context().close(); }

  // B. Máy chủ đã lưu nhưng trình duyệt mất phản hồi → gửi lại
  { const env = taoMoiTruong(), p = await mo(env, (lan) => (lan === 1 ? 'mat-phan-hoi' : 'qua')); await dien(p); await gui(p); await chua(p);
    const t1 = await chu(p, '#dl-thong-bao'), truoc = { dong: env.st.rows.length - 1, thu: env.st.emails.length };
    ok('[B mất phản hồi] Máy chủ ĐÃ lưu nhưng trình duyệt không nhận được: báo "Chưa nhận được xác nhận…" (KHÔNG báo thành công)', /Chưa nhận được xác nhận/.test(t1) && !/Đã nhận yêu cầu/.test(t1) && truoc.dong === 1 && truoc.thu === 1, `${t1.slice(0, 100)} · ${truoc.dong} dòng`);
    await p.waitForFunction(() => document.getElementById('m-gui').textContent.trim() === 'Gửi lại' && !document.getElementById('m-gui').disabled); await p.click('#m-gui'); await nhan(p); const t2 = await chu(p, '#dl-nhan');
    const j1 = JSON.parse(p.__ds[0].body), j2 = JSON.parse(p.__ds[1].body);
    ok('[B gửi lại] Cùng ma_yeu_cau; máy chủ nhận ra là trùng: KHÔNG thêm dòng, KHÔNG thêm email; khách thấy "Đã nhận" với mã đã có trong Sheet', j1.ma_yeu_cau === j2.ma_yeu_cau && env.st.rows.length === 2 && env.st.emails.length === 1 && /Đã nhận yêu cầu/.test(t2) && t2.includes(env.o(1)['Mã yêu cầu']), `${env.st.rows.length - 1} dòng · ${env.st.emails.length} email · ${t2.slice(0, 100)}`);
    ok('[B gửi lại] Không lỗi JavaScript', p.__loi.length === 0, p.__loi.join('|')); await p.context().close(); }

  // C. Lỗi mạng TRƯỚC khi tới máy chủ → gửi lại
  { const env = taoMoiTruong(), p = await mo(env, (lan) => (lan === 1 ? 'loi-mang' : 'qua')); await dien(p); await gui(p); await chua(p);
    ok('[C lỗi mạng] Mạng đứt trước khi tới máy chủ: báo chưa nhận được xác nhận, Sheet 0 dòng, 0 email, dữ liệu form còn nguyên', /Chưa nhận được xác nhận/.test(await chu(p, '#dl-thong-bao')) && env.st.rows.length === 0 && env.st.emails.length === 0 && (await p.inputValue('#m-ten')) === 'THỬ NGHIỆM');
    await p.waitForFunction(() => document.getElementById('m-gui').textContent.trim() === 'Gửi lại' && !document.getElementById('m-gui').disabled); await p.click('#m-gui'); await nhan(p);
    ok('[C gửi lại] Có mạng lại, bấm "Gửi lại": đúng 1 dòng, đúng 1 email, hiện "Đã nhận"', env.st.rows.length === 2 && env.st.emails.length === 1 && /Đã nhận yêu cầu/.test(await chu(p, '#dl-nhan')), `${env.st.rows.length - 1} dòng · ${env.st.emails.length} email`); await p.context().close(); }

  // D. Hai yêu cầu khác nhau (khác tên thú cưng) → hai dòng, hai email
  { const env = taoMoiTruong(), p = await mo(env, () => 'qua'); await dien(p, 'THỬ NGHIỆM 1', 'Bé Một'); await gui(p); await nhan(p); await p.click('#dl-lam-lai'); await dien(p, 'THỬ NGHIỆM 2', 'Bé Hai'); await gui(p); await nhan(p);
    ok('[D hai yêu cầu khác nhau] Khác tên thú cưng: đúng 2 dòng, 2 email, 2 mã khác nhau', env.st.rows.length === 3 && env.st.emails.length === 2 && env.o(1)['Mã yêu cầu'] !== env.o(2)['Mã yêu cầu'], `${env.st.rows.length - 1} dòng`); await p.context().close(); }

  // E. Đúng thao tác của chủ dự án: gửi thành công → "Gửi yêu cầu khác" → điền Y HỆT → gửi (mã gửi từ trình duyệt khác nhau)
  { const env = taoMoiTruong(), p = await mo(env, () => 'qua'); await dien(p); await gui(p); await nhan(p); const ma1 = (await chu(p, '#dl-nhan')).match(/LS-\d{6}-[0-9A-Z]{6}/)[0];
    await p.click('#dl-lam-lai'); await dien(p); await gui(p); await nhan(p); const ma2 = (await chu(p, '#dl-nhan')).match(/LS-\d{6}-[0-9A-Z]{6}/)[0];
    const g1 = JSON.parse(p.__ds[0].body).ma_yeu_cau, g2 = JSON.parse(p.__ds[1].body).ma_yeu_cau;
    ok('[E gửi yêu cầu khác rồi điền y hệt] Trình duyệt gửi 2 mã gửi KHÁC nhau, nhưng Sheet vẫn đúng 1 dòng, đúng 1 email; khách thấy "Đã nhận" với cùng mã', g1 !== g2 && p.__ds.length === 2 && ma1 === ma2 && env.st.rows.length === 2 && env.st.emails.length === 1, `${env.st.rows.length - 1} dòng · ${env.st.emails.length} email · ${ma1}/${ma2}`);
    ok('[E] Không lỗi JavaScript', p.__loi.length === 0, p.__loi.join('|')); await p.context().close(); }

  // F. Giờ đã qua trong ngày hôm nay (đồng hồ trình duyệt đặt 14:00 giờ Việt Nam)
  { const env = taoMoiTruong(), p = await mo(env, () => 'qua', [14, 0]); await dien(p);
    await p.fill('#m-ngay', cong(0)); await p.press('#m-ngay', 'Tab');
    const ds = await p.evaluate(() => [...document.getElementById('m-gio').options].filter((o) => o.value).map((o) => [o.value, o.disabled])), goi = await chu(p, '#m-gio-goi');
    ok('[F giờ đã qua] Chọn ngày HÔM NAY lúc 14:00: mọi giờ trước 14:00 bị tắt (không chọn được); 14:00, 14:30… 20:30 còn chọn được; có dòng gợi ý', ds.filter(([g]) => g < '14:00').every(([, d]) => d) && ds.filter(([g]) => g >= '14:00').every(([, d]) => !d) && ds.length === 26 && /Hôm nay chỉ chọn được giờ chưa qua/.test(goi), `${ds.filter(([, d]) => d).length} giờ bị tắt · ${goi}`);
    await p.evaluate(() => { const s = document.getElementById('m-gio'); s.value = '09:00'; s.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.waitForTimeout(150); const loi = await chu(p, '#m-gio-loi'), tat = await p.isDisabled('#m-gui');
    await p.evaluate(() => document.getElementById('form-dat-lich').requestSubmit()); await p.waitForTimeout(300);
    ok('[F giờ đã qua] Ép giờ 09:00 (đã qua) cho hôm nay: hiện lỗi "đã qua", nút gửi tắt, bấm gửi bằng mã lệnh cũng KHÔNG gửi gì (0 yêu cầu), Sheet 0 dòng', /đã qua/.test(loi) && tat && p.__ds.length === 0 && env.st.rows.length === 0, `${loi} · gửi tắt=${tat} · ${p.__ds.length} yêu cầu`);
    await p.fill('#m-ngay', cong(1)); await p.press('#m-ngay', 'Tab'); await p.waitForTimeout(150);
    const ds2 = await p.evaluate(() => [...document.getElementById('m-gio').options].filter((o) => o.value).every((o) => !o.disabled)), loi2 = await chu(p, '#m-gio-loi');
    ok('[F giờ đã qua] Đổi sang NGÀY MAI: mọi giờ mở lại, lỗi "đã qua" biến mất, 09:00 gửi được', ds2 && !/đã qua/.test(loi2) && !(await p.isDisabled('#m-gui')), loi2);
    await p.close().catch(() => {}); await p.context().close(); }
  { const env = taoMoiTruong(), p = await mo(env, () => 'qua', [21, 30]); await dien(p); await p.fill('#m-ngay', cong(0)); await p.press('#m-ngay', 'Tab'); await p.waitForTimeout(150);
    const ds = await p.evaluate(() => [...document.getElementById('m-gio').options].filter((o) => o.value).every((o) => o.disabled)), l = await chu(p, '#m-ngay-loi');
    ok('[F hết giờ] Sau 20:30 (đang 21:30): chọn hôm nay → mọi giờ bị tắt và hiện "Hôm nay đã hết giờ nhận lịch, vui lòng chọn ngày khác"', ds && /đã hết giờ nhận lịch/.test(l), l); await p.context().close(); }

  await b.close(); may.kill();
  const dem = (t) => kq.filter((x) => x.tt === t).length, dong = kq.map((x) => `[${x.tt}] ${x.ten}${x.tt !== 'ĐẠT' && x.ct ? '  → ' + x.ct : ''}`);
  const out = [`Đầu-cuối bản thử "that" (trình duyệt thật + Code.v2.gs + Trang tính GIẢ; KHÔNG gọi Google thật) · ${new Date().toISOString()}`, `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')}`, ...dong, '[CHƯA XÁC MINH] Google thật: email tới hộp thư, Sheet thử đúng 1 dòng, trình duyệt đọc được phản hồi từ script.google.com  → chủ dự án thử theo ban-thu-that/README-THU.md'].join('\n');
  fs.writeFileSync(path.join(__dirname, 'ket-qua/ket-qua-that-dau-cuoi.txt'), out); console.log(out); process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
