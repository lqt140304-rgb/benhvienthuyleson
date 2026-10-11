// Thử logic của apps-script/Code.v2.gs bằng Node với đối tượng GIẢ của Google (SpreadsheetApp, MailApp, LockService, ScriptApp…).
// KHÔNG gọi tới Google, không cần tài khoản. Chạy: node kiem-thu-astro/kiem-thu-apps-script.cjs
// Thử một bản khác của script (ví dụ để chứng minh bài kiểm tra bắt đúng lỗi của bản cũ): MA_PATH=/duong/dan/Code.v2.gs node ...
// Chỉ kiểm tra logic của mã. Việc script chạy đúng trên Google (cấp quyền, email tới, phản hồi JSON đọc được từ trình duyệt) là CHƯA XÁC MINH.
// Có thể nhận thêm tệp body do biểu mẫu cũ THẬT gửi (kiem-thu-astro.cjs ghi vào ket-qua/body-bieu-mau-cu.txt) để kiểm tra từ đầu đến cuối.
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const MA = fs.readFileSync(process.env.MA_PATH || path.resolve(__dirname, '../apps-script/Code.v2.gs'), 'utf8');
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });
const kq = []; const ok = (ten, dk, ct = '') => kq.push({ tt: dk ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 300) });
const chuaXm = (ten, ly) => kq.push({ tt: 'CHƯA XÁC MINH', ten, ct: ly });
const muc = (t) => kq.push({ tt: 'MỤC', ten: t, ct: '' });

function taoMoiTruong(tuyChon = {}) {
  const st = { rows: [], raw: [], bg: {}, khoa: 0, mo: 0, emails: [], sheets: {}, emailLoi: !!tuyChon.emailLoi, triggers: [] };
  const boNhay = (r) => r.map((x) => (typeof x === 'string' && x[0] === "'" ? x.slice(1) : x)); // Sheets: dấu nháy đầu ô = ép kiểu chữ, không nằm trong giá trị
  const sheet = (ten) => ({ ten, getLastRow: () => st.rows.length, getLastColumn: () => (st.rows[0] || []).length, setFrozenRows() {},
    appendRow: (r) => { st.raw.push(r); st.rows.push(boNhay(r)); },
    getRange: (r, c, n, m) => ({ getValues: () => st.rows.slice(r - 1, r - 1 + (n || 1)).map((x) => x.slice(c - 1, c - 1 + (m || 1))),
      setValue: (v) => { st.rows[r - 1][c - 1] = v; }, setValues: (vv) => vv.forEach((row, i) => row.forEach((v, j) => { st.rows[r - 1 + i][c - 1 + j] = v; })),
      setBackground: (b) => { st.bg[r] = b; } }) });
  const ss = { getSheetByName: (t) => st.sheets[t] || null, insertSheet: (t) => (st.sheets[t] = sheet(t)), getUrl: () => 'https://docs.example/sheet' };
  const vn = (d, f) => { const x = new Date(d.getTime() + 7 * 3600e3), p = (n) => String(n).padStart(2, '0'); return f === 'yyMMdd' ? p(x.getUTCFullYear() % 100) + p(x.getUTCMonth() + 1) + p(x.getUTCDate()) : f === 'HH:mm' ? `${p(x.getUTCHours())}:${p(x.getUTCMinutes())}` : `${x.getUTCFullYear()}-${p(x.getUTCMonth() + 1)}-${p(x.getUTCDate())}`; };
  const digest = tuyChon.digestHang ? () => Array(16).fill(7) : (a, s) => Array.from(crypto.createHash('md5').update(s).digest()).map((b) => (b > 127 ? b - 256 : b));
  const ctx = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    LockService: { getScriptLock: () => ({ waitLock() { st.khoa++; }, releaseLock() { st.mo++; } }) },
    MailApp: { sendEmail: (o) => { if (st.emailLoi) throw new Error('hết hạn mức email'); st.emails.push(o); } },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'chu@example.com' }) },
    ScriptApp: { getProjectTriggers: () => st.triggers.map((t) => ({ getHandlerFunction: () => t })), newTrigger: (fn) => ({ timeBased() { return this; }, everyMinutes() { return this; }, create() { st.triggers.push(fn); } }) },
    Utilities: { computeDigest: digest, DigestAlgorithm: { MD5: 'MD5' }, formatDate: (d, tz, f) => vn(d, f), getUuid: () => crypto.randomUUID() },
    ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }), MimeType: { JSON: 'JSON', TEXT: 'TEXT' } },
    Logger: { log() {} }, console,
  });
  vm.runInContext(MA, ctx);
  if (tuyChon.cauHinh) vm.runInContext(`Object.assign(CAU_HINH, ${JSON.stringify(tuyChon.cauHinh)})`, ctx);
  const gui = (obj, raw) => JSON.parse(ctx.doPost({ postData: { contents: raw !== undefined ? raw : JSON.stringify(obj) } }).getContent());
  const guiCu = (params) => JSON.parse(ctx.doPost({ parameter: params }).getContent()); // biểu mẫu cũ: form-urlencoded, không có postData
  const cot = (ten) => (st.rows[0] || []).indexOf(ten);
  const o = (i) => { const r = st.rows[i], d = {}; (st.rows[0] || []).forEach((t, k) => { d[t] = r[k]; }); return d; };
  return { st, ctx, gui, guiCu, cot, o };
}
const ngay = (n) => { const d = new Date(Date.now() + 7 * 3600e3 + n * 86400e3); return d.toISOString().slice(0, 10); };
const ddmmyyyy = (iso) => iso.split('-').reverse().join('/');
const tot = (o = {}) => ({ ma_yeu_cau: crypto.randomUUID(), ten_khach: 'Khách thử', dien_thoai: '0912345678', ten_thu_cung: 'Bé Thử', loai: 'Chó', loai_khac: '', dich_vu: 'Khám và chẩn đoán', ngay: ngay(2), gio: '09:00', ngay_don: '', ghi_chu: 'ghi chú', nguon: '/dat-lich/', website: '', ...o });

// ===== 1. Lưu thành công và chống trùng =====
muc('1. Biểu mẫu mới: lưu, chống trùng, email');
{ const { st, gui, o } = taoMoiTruong(); const d = tot(), r = gui(d);
  ok('Yêu cầu hợp lệ: trả { ok: true, ma } với mã dạng LS-yymmdd-XXXXXX (6 ký tự)', r.ok === true && /^LS-\d{6}-[0-9A-HJKMNP-TV-Z]{6}$/.test(r.ma) && r.trung === false, JSON.stringify(r));
  const x = o(1);
  ok('Lưu đúng 1 dòng, đúng cột (mã, mã gửi, tên, số điện thoại, thú cưng, loài, dịch vụ, ngày, giờ, trạng thái "Mới")', st.rows.length === 2 && x['Mã yêu cầu'] === r.ma && x['Mã gửi từ trình duyệt'] === d.ma_yeu_cau && x['Tên khách hàng'] === 'Khách thử' && x['Tên thú cưng'] === 'Bé Thử' && x['Loài'] === 'Chó' && x['Ngày mong muốn / gửi'] === d.ngay && x['Giờ'] === '09:00' && x['Trạng thái'] === 'Mới', JSON.stringify(x));
  ok('Gửi đúng 1 email cho chủ tài khoản, có mã yêu cầu; cột "Email báo" ghi "đã gửi"', st.emails.length === 1 && st.emails[0].to === 'chu@example.com' && st.emails[0].subject.includes(r.ma) && x['Email báo'] === 'đã gửi', JSON.stringify(x['Email báo']));
  ok('Khoá được lấy và trả lại đủ', st.khoa === 1 && st.mo === 1, `${st.khoa}/${st.mo}`);
  const r2 = gui(d);
  ok('Gửi lại CÙNG mã yêu cầu: không tạo dòng mới, không gửi email nữa, trả lại mã cũ với trung: true', r2.ok && r2.trung === true && r2.ma === r.ma && st.rows.length === 2 && st.emails.length === 1, JSON.stringify(r2));
  const r3 = gui(tot());
  ok('Mã yêu cầu khác: tạo dòng mới và mã mới', r3.ok && r3.ma !== r.ma && st.rows.length === 3, JSON.stringify(r3)); }

// ===== 2. Kiểm tra dữ liệu =====
muc('2. Kiểm tra dữ liệu phía máy chủ');
{ const ca = [
    ['thiếu tên khách hàng', { ten_khach: '' }], ['số điện thoại sai', { dien_thoai: '12345' }], ['thiếu tên thú cưng', { ten_thu_cung: '' }], ['loài không hợp lệ', { loai: 'Rồng' }],
    ['loài Khác nhưng không ghi loài', { loai: 'Khác', loai_khac: '' }], ['thiếu dịch vụ', { dich_vu: '' }], ['ngày sai định dạng', { ngay: '12/10/2030' }], ['ngày không tồn tại', { ngay: '2030-02-31' }],
    ['ngày trong quá khứ', { ngay: ngay(-1) }], ['giờ trước 8:00', { gio: '07:30' }], ['giờ sau 21:00', { gio: '21:30' }], ['giờ sai định dạng', { gio: '9h' }],
    ['nội trú thiếu ngày đón', { dich_vu: 'Gửi nội trú (khách sạn thú cưng)', ngay_don: '' }], ['ngày đón trước ngày gửi', { dich_vu: 'Gửi nội trú', ngay: ngay(3), ngay_don: ngay(2) }], ['mã yêu cầu quá ngắn', { ma_yeu_cau: 'abc' }], ['mã yêu cầu có ký tự lạ', { ma_yeu_cau: 'abc def ghi jkl' }] ];
  const hong = [];
  for (const [ten, x] of ca) { const { st, gui } = taoMoiTruong(); const r = gui(tot(x)); if (r.ok !== false || !r.loi || st.rows.length || st.emails.length) hong.push(ten + ' → ' + JSON.stringify(r)); }
  ok(`${ca.length} trường hợp dữ liệu sai: đều trả { ok: false, loi } bằng tiếng Việt, không lưu dòng nào, không gửi email`, hong.length === 0, hong.join(' | '));
  const { st, gui } = taoMoiTruong();
  ok('Ngày đón CÙNG ngày gửi là hợp lệ; ngày đón sau ngày gửi hợp lệ', gui(tot({ dich_vu: 'Gửi nội trú', ngay: ngay(3), ngay_don: ngay(3) })).ok && gui(tot({ dich_vu: 'Gửi nội trú', ngay: ngay(3), ngay_don: ngay(6) })).ok && st.rows.length === 3, '');
  ok('Loài Khác lưu kèm tên loài; số điện thoại +84 được đổi về dạng 0…', (() => { const t = taoMoiTruong(); const r = t.gui(tot({ loai: 'Khác', loai_khac: 'thỏ', dien_thoai: '+84 912 345 678' })); return r.ok && t.o(1)['Loài'] === 'Khác (thỏ)' && t.o(1)['Số điện thoại'] === '0912345678'; })(), '');
  // Giờ: định dạng và miền giá trị đầy đủ (không dựa vào danh sách chọn ở trình duyệt)
  const gioSai = ['08:99', '09:60', '24:00', '25:00', '7:30', '0930', '09:00:00', '08:5', '', ' 09:00', '09:00 ', '9:00', 'ab:cd', '12:5x', '-1:00', '08:00pm'];
  const honG = []; for (const g of gioSai) { const t = taoMoiTruong(); const r = t.gui(tot({ gio: g })); if (r.ok !== false || t.st.rows.length) honG.push(JSON.stringify(g) + ' → ' + JSON.stringify(r)); }
  ok(`Giờ không hợp lệ (${gioSai.length} dạng, gồm 08:99, 09:60, 24:00, 25:00): đều bị từ chối, không lưu`, honG.length === 0, honG.join(' | '));
  const gioDung = ['08:00', '08:30', '20:30', '21:00']; const honD = []; for (const g of gioDung) { const t = taoMoiTruong(); if (!t.gui(tot({ gio: g })).ok) honD.push(g); }
  ok('Giờ hợp lệ 08:00, 08:30, 20:30, 21:00 được nhận (khung 8:00–21:00 như Code.gs cũ)', honD.length === 0, honD.join(',')); }

// ===== 3. Bảo vệ =====
muc('3. Bảo vệ (ô bẫy, công thức, độ dài)');
{ const { st, gui } = taoMoiTruong(); const r = gui(tot({ website: 'bot' }));
  ok('Ô bẫy spam có chữ: từ chối, không lưu, không gửi email', r.ok === false && !st.rows.length && !st.emails.length, JSON.stringify(r));
  const e2 = taoMoiTruong(); const rr = e2.gui(tot({ ten_khach: '=HYPERLINK("http://x","y")', ghi_chu: '@cmd' }));
  const rawHang = e2.st.raw[1]; const iT = e2.cot('Tên khách hàng'), iG = e2.cot('Ghi chú');
  ok('Chặn công thức: nội dung bắt đầu bằng = + - @ được ghi kèm dấu nháy ở đầu (Google Sheets coi là chữ)', rr.ok && String(rawHang[iT]).startsWith("'=") && String(rawHang[iG]).startsWith("'@"), JSON.stringify([rawHang[iT], rawHang[iG]]));
  const e3 = taoMoiTruong(); const dai = e3.gui(tot({ ghi_chu: 'x'.repeat(5000), ten_khach: 'y'.repeat(500) }));
  ok('Nội dung quá dài bị cắt (ghi chú ≤ 1000, tên ≤ 80)', dai.ok && e3.o(1)['Ghi chú'].length <= 1000 && e3.o(1)['Tên khách hàng'].length <= 80, ''); }

// ===== 4. Biểu mẫu cũ: đúng dữ liệu mà FormDatLichCu gửi =====
muc('4. Tương thích biểu mẫu cũ (form-urlencoded, đúng định dạng FormDatLichCu gửi, không đọc được phản hồi)');
{ const don = ngay(5), ng = ngay(2);
  const cuNoiTru = { ten: 'Khách cũ', dien_thoai: '0912345678', thu_cung: 'Khác (thỏ)', dich_vu: `Gửi nội trú (khách sạn thú cưng) · đón ${ddmmyyyy(don)} lúc 17:00`, can_nang: '3 – 5 kg', ngay: ng, gio: '09:00', ghi_chu: 'bé hiền', hoa_don: '[Tự động] Phụ phí cuối tuần: +50.000đ\nGửi nội trú · 3 – 5 kg: 3 ngày × 110.000đ', tong_tam_tinh: '380.000đ', website: '' };
  const t = taoMoiTruong(), r = t.guiCu(cuNoiTru), x = t.st.rows.length > 1 ? t.o(1) : {};
  ok('Gửi nội trú từ biểu mẫu cũ (có "· đón dd/mm/yyyy lúc HH:MM" dính trong tên dịch vụ): ĐƯỢC NHẬN và lưu', r.ok === true && t.st.rows.length === 2, JSON.stringify(r));
  ok('Tách đúng: Dịch vụ sạch (không còn "· đón…"), Ngày đón dự kiến, Giờ đón; Loài "Khác (thỏ)"', x['Dịch vụ'] === 'Gửi nội trú (khách sạn thú cưng)' && x['Ngày đón dự kiến'] === don && x['Giờ đón'] === '17:00' && x['Loài'] === 'Khác (thỏ)', JSON.stringify(x));
  ok('Giữ đủ thông tin cũ: cân nặng, hoá đơn tham khảo (nhiều dòng), tổng tạm tính; không cần kiểm tra thêm', x['Cân nặng'] === '3 – 5 kg' && /Phụ phí cuối tuần/.test(x['Hoá đơn tham khảo'] || '') && x['Tổng tạm tính'] === '380.000đ' && !x['Cần kiểm tra'], JSON.stringify(x));
  ok('Email có ngày đón, hoá đơn và tổng tạm tính (như Code.gs cũ)', t.st.emails.length === 1 && t.st.emails[0].body.includes(ddmmyyyy(don)) && /Hoá đơn tham khảo/.test(t.st.emails[0].body) && t.st.emails[0].body.includes('380.000đ'), t.st.emails[0] && t.st.emails[0].body.slice(0, 200));
  ok('Biểu mẫu cũ không có "tên thú cưng": vẫn nhận, ghi chú rõ không có', x['Tên thú cưng'] && /biểu mẫu cũ/.test(x['Tên thú cưng']), JSON.stringify(x['Tên thú cưng']));
  const t2 = taoMoiTruong(), r2 = t2.guiCu({ ...cuNoiTru, dich_vu: 'Gửi nội trú (khách sạn thú cưng)' });
  ok('Nội trú cũ nhưng KHÔNG đọc được ngày đón: vẫn LƯU (không mất lịch trong im lặng) và gắn "Cần kiểm tra"', r2.ok === true && t2.st.rows.length === 2 && /ngày đón/i.test(t2.o(1)['Cần kiểm tra'] || ''), JSON.stringify(t2.st.rows.length > 1 ? t2.o(1)['Cần kiểm tra'] : r2));
  const t3 = taoMoiTruong(), r3 = t3.guiCu({ ten: 'Thử nghiệm', dien_thoai: '0912345678', thu_cung: 'Chó', dich_vu: 'Tắm – Chó lông ngắn', can_nang: '3 – 5 kg', ngay: ngay(2), gio: '09:00', ghi_chu: 'Dòng thử, có thể xoá', hoa_don: 'Tắm – Chó lông ngắn · 3 – 5 kg: 120.000đ', tong_tam_tinh: '120.000đ' });
  ok('Dữ liệu mẫu của hàm thuNghiem() trong Code.gs cũ (Tắm) được nhận', r3.ok === true && t3.o(1)['Dịch vụ'] === 'Tắm – Chó lông ngắn' && t3.o(1)['Tổng tạm tính'] === '120.000đ', JSON.stringify(r3));
  const ca = [['số điện thoại sai', { dien_thoai: '123' }], ['thiếu tên', { ten: '' }], ['giờ 08:99', { gio: '08:99' }], ['ngày quá khứ', { ngay: ngay(-2) }], ['giờ ngoài khung', { gio: '22:00' }], ['ngày đón trước ngày gửi', { dich_vu: `Gửi nội trú · đón ${ddmmyyyy(ngay(1))} lúc 17:00`, ngay: ngay(3) }]];
  const hong = []; for (const [ten, xx] of ca) { const tt = taoMoiTruong(); const rr = tt.guiCu({ ...cuNoiTru, ...xx }); if (rr.ok !== false || tt.st.rows.length) hong.push(ten + ' → ' + JSON.stringify(rr)); }
  ok('Biểu mẫu cũ vẫn bị từ chối khi lỗi LÕI (số điện thoại, tên, giờ, ngày, ngày đón trước ngày gửi) như Code.gs cũ', hong.length === 0, hong.join(' | '));
  const t4 = taoMoiTruong(), r4 = t4.guiCu({ ...cuNoiTru, dich_vu: `Gửi nội trú · đón ${ddmmyyyy(don)} lúc 25:99` });
  ok('Giờ đón của biểu mẫu cũ sai định dạng: vẫn lưu lịch, gắn "Cần kiểm tra" (giờ đón)', r4.ok === true && /giờ đón/i.test(t4.o(1)['Cần kiểm tra'] || ''), JSON.stringify(t4.st.rows.length > 1 ? t4.o(1)['Cần kiểm tra'] : r4));
  // Từ đầu đến cuối: body do biểu mẫu cũ THẬT gửi (bắt trong trình duyệt bởi kiem-thu-astro.cjs)
  const tepBody = path.join(KQ, 'body-bieu-mau-cu.txt');
  if (fs.existsSync(tepBody)) { const body = fs.readFileSync(tepBody, 'utf8'); const params = Object.fromEntries(new URLSearchParams(body)); const te = taoMoiTruong(), re = te.guiCu(params);
    ok('Từ đầu đến cuối: BODY do biểu mẫu cũ thật gửi trong trình duyệt (bản dựng chế độ "cu") được Code.v2.gs nhận và lưu đúng', re.ok === true && te.st.rows.length === 2 && !!te.o(1)['Ngày đón dự kiến'] && /Gửi nội trú/.test(te.o(1)['Dịch vụ']) && !/ · đón/.test(te.o(1)['Dịch vụ']), body.slice(0, 160) + ' → ' + JSON.stringify(re)); }
  else chuaXm('Từ đầu đến cuối với body biểu mẫu cũ thật', 'Chưa có ket-qua/body-bieu-mau-cu.txt: chạy kiem-thu-astro.cjs trước (nó ghi body từ trình duyệt thật), rồi chạy lại tệp này'); }

// ===== 5. Mã tra cứu =====
muc('5. Mã tra cứu đủ dài và duy nhất');
{ const md4 = (s) => crypto.createHash('md5').update(s).digest().slice(0, 2).toString('hex');
  ok('Cặp mã gửi request-240 / request-382 đã từng trùng mã bản cũ (cùng 4 ký tự đầu của MD5)', md4('request-240') === md4('request-382'), md4('request-240') + ' / ' + md4('request-382'));
  const t = taoMoiTruong(), a = t.gui(tot({ ma_yeu_cau: 'request-240' })), b = t.gui(tot({ ma_yeu_cau: 'request-382' }));
  ok('Hai mã gửi đó giờ ra HAI mã tra cứu khác nhau, đủ 2 dòng', a.ok && b.ok && a.ma !== b.ma && t.st.rows.length === 3, `${a.ma} / ${b.ma}`);
  const T = taoMoiTruong(), ds = new Set(); let loi = 0;
  for (let i = 0; i < 1500; i++) { const r = T.gui(tot({ ma_yeu_cau: 'dong-' + i + '-' + crypto.randomBytes(4).toString('hex') })); if (!r.ok) loi++; else ds.add(r.ma); }
  ok('1.500 yêu cầu khác nhau cùng một ngày: 1.500 mã khác nhau, 1.500 dòng, không lỗi', loi === 0 && ds.size === 1500 && T.st.rows.length === 1501, `${ds.size} mã, ${T.st.rows.length - 1} dòng`);
  const H = taoMoiTruong({ digestHang: true }), m = [1, 2, 3, 4].map((i) => H.gui(tot({ ma_yeu_cau: 'trung-mb-' + i })));
  ok('Ép băm trả cùng một giá trị (va chạm giả): vẫn ra các mã KHÁC nhau và đủ dòng (kiểm tra tính duy nhất, không dựa vào may rủi)', m.every((x) => x.ok) && new Set(m.map((x) => x.ma)).size === 4 && H.st.rows.length === 5, m.map((x) => x.ma).join(' '));
  const again = H.gui(tot({ ma_yeu_cau: 'trung-mb-2' })); const ma2 = m[1].ma;
  ok('Dù va chạm giả, gửi lại cùng mã gửi vẫn trả đúng mã cũ (không tạo dòng mới)', again.ok && again.trung === true && again.ma === ma2 && H.st.rows.length === 5, JSON.stringify(again)); }

// ===== 6. Lỗi email phải thấy được =====
muc('6. Nơi nhận: lỗi email không còn im lặng');
{ const a = taoMoiTruong({ cauHinh: { GUI_EMAIL: false } }); const ra = a.gui(tot());
  ok('GUI_EMAIL = false (chỉ trang tính): vẫn lưu dòng, không gửi email, cột "Email báo" ghi "không dùng"', ra.ok && a.st.rows.length === 2 && a.st.emails.length === 0 && a.o(1)['Email báo'] === 'không dùng', JSON.stringify(a.st.rows.length > 1 ? a.o(1)['Email báo'] : ra));
  const b = taoMoiTruong({ emailLoi: true }); const rb = b.gui(tot());
  ok('Gửi email lỗi (hết hạn mức): yêu cầu VẪN được lưu, vẫn trả ok: true, nhưng cột "Email báo" ghi LỖI và dòng được tô màu để nhân viên thấy', rb.ok && b.st.rows.length === 2 && /^LỖI/.test(b.o(1)['Email báo'] || '') && !!b.st.bg[2], JSON.stringify([rb, b.st.rows.length > 1 ? b.o(1)['Email báo'] : '', b.st.bg]));
  ok('Có hàm guiLaiEmailLoi() và taoLichGuiLaiEmail()', typeof b.ctx.guiLaiEmailLoi === 'function' && typeof b.ctx.taoLichGuiLaiEmail === 'function', '');
  if (typeof b.ctx.guiLaiEmailLoi === 'function') {
    b.st.emailLoi = false; b.ctx.guiLaiEmailLoi();
    ok('Sau khi email hoạt động lại: guiLaiEmailLoi() gửi lại đúng 1 email, đánh dấu "đã gửi", bỏ màu', b.st.emails.length === 1 && b.o(1)['Email báo'] === 'đã gửi' && !b.st.bg[2], JSON.stringify([b.st.emails.length, b.o(1)['Email báo'], b.st.bg]));
    b.ctx.guiLaiEmailLoi(); ok('Chạy lại lần nữa: không gửi trùng email đã gửi', b.st.emails.length === 1, '');
    const c = taoMoiTruong({ emailLoi: true }); c.gui(tot()); for (let i = 0; i < 8; i++) c.ctx.guiLaiEmailLoi();
    ok('Email vẫn lỗi: thử lại tối đa 5 lần rồi dừng (không lặp vô hạn); dòng vẫn nằm ở trạng thái LỖI để nhân viên theo dõi', Number(c.o(1)['Số lần gửi email']) <= 5 && /^LỖI/.test(c.o(1)['Email báo']) && c.st.emails.length === 0, JSON.stringify([c.o(1)['Số lần gửi email'], c.o(1)['Email báo']]));
    const d = taoMoiTruong({ cauHinh: { GUI_EMAIL: false } }); d.gui(tot()); d.ctx.guiLaiEmailLoi();
    ok('GUI_EMAIL = false: guiLaiEmailLoi() không gửi gì', d.st.emails.length === 0, '');
    b.ctx.taoLichGuiLaiEmail(); b.ctx.taoLichGuiLaiEmail();
    ok('taoLichGuiLaiEmail() đặt đúng 1 trigger dù chạy hai lần', b.st.triggers.filter((x) => x === 'guiLaiEmailLoi').length === 1, JSON.stringify(b.st.triggers)); } }

// ===== 7. Dữ liệu lạ =====
muc('7. Dữ liệu lạ');
{ const { st, gui, ctx } = taoMoiTruong(); const r = gui(null, '{bad json');
  ok('JSON hỏng: trả { ok: false } có thông báo, không báo lỗi script', r.ok === false && !!r.loi && !st.rows.length, JSON.stringify(r));
  const g = JSON.parse(ctx.doGet().getContent()); ok('doGet chỉ trả trạng thái chạy, không lộ dữ liệu', g.ok === true && g.dich_vu === 'dat-lich-v2' && Object.keys(g).length === 2, JSON.stringify(g)); }

const dem = (t) => kq.filter((x) => x.tt === t).length;
const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH') + 1}`;
const dong = [`Thử logic Code.v2.gs bằng đối tượng giả (không gọi Google) · ${process.env.MA_PATH ? 'BẢN THỬ: ' + process.env.MA_PATH + ' · ' : ''}${new Date().toISOString()}`, tom, '', ...kq.map((x) => x.tt === 'MỤC' ? `\n-- ${x.ten}` : `[${x.tt}] ${x.ten}${x.ct && x.tt !== 'ĐẠT' ? '  → ' + x.ct : ''}`), '', '[CHƯA XÁC MINH] Chạy thật trên Google (cấp quyền, email tới, hạn mức email, phản hồi JSON đọc được từ trình duyệt github.io)  → cần chủ dự án thử theo HUONG-DAN-NHAN-LICH.md'];
if (!process.env.MA_PATH) fs.writeFileSync(path.join(KQ, 'ket-qua-apps-script.txt'), dong.join('\n'));
console.log(dong.join('\n').split('\n').filter((l) => /^(ĐẠT|\[KHÔNG|Thử|--)/.test(l) || /\[CHƯA/.test(l) === false && l.startsWith('[KHÔNG')).join('\n'));
console.log(tom);
process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
