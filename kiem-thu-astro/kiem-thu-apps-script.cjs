// Thử logic của apps-script/Code.v2.gs bằng Node với đối tượng GIẢ của Google (SpreadsheetApp, MailApp, LockService…).
// KHÔNG gọi tới Google, không cần tài khoản. Chạy: node kiem-thu-astro/kiem-thu-apps-script.cjs
// Chỉ kiểm tra logic của mã. Việc script chạy đúng trên Google (cấp quyền, email tới, phản hồi JSON đọc được từ trình duyệt) là CHƯA XÁC MINH.
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const MA = fs.readFileSync(path.resolve(__dirname, '../apps-script/Code.v2.gs'), 'utf8');
const KQ = path.join(__dirname, 'ket-qua'); fs.mkdirSync(KQ, { recursive: true });
const kq = []; const ok = (ten, dk, ct = '') => kq.push({ tt: dk ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, ct: String(ct).slice(0, 300) });

function taoMoiTruong(tuyChon = {}) {
  const st = { rows: [], khoa: 0, mo: 0, emails: [], sheets: {}, emailLoi: !!tuyChon.emailLoi };
  const sheet = (ten) => ({ ten, getLastRow: () => st.rows.length, appendRow: (r) => { st.rows.push(r); }, setFrozenRows() {}, getRange: (r, c, n, m) => ({ getValues: () => st.rows.slice(r - 1, r - 1 + n).map((x) => x.slice(c - 1, c - 1 + m)) }) });
  const ss = { getSheetByName: (t) => st.sheets[t] || null, insertSheet: (t) => (st.sheets[t] = sheet(t)), getUrl: () => 'https://docs.example/sheet' };
  const vn = (d, f) => { const x = new Date(d.getTime() + 7 * 3600e3), p = (n) => String(n).padStart(2, '0'); return f === 'yyMMdd' ? p(x.getUTCFullYear() % 100) + p(x.getUTCMonth() + 1) + p(x.getUTCDate()) : `${x.getUTCFullYear()}-${p(x.getUTCMonth() + 1)}-${p(x.getUTCDate())}`; };
  const ctx = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    LockService: { getScriptLock: () => ({ waitLock() { st.khoa++; }, releaseLock() { st.mo++; } }) },
    MailApp: { sendEmail: (o) => { if (st.emailLoi) throw new Error('hết hạn mức email'); st.emails.push(o); } },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'chu@example.com' }) },
    Utilities: { computeDigest: (a, s) => Array.from(crypto.createHash('md5').update(s).digest()).map((b) => (b > 127 ? b - 256 : b)), DigestAlgorithm: { MD5: 'MD5' }, formatDate: (d, tz, f) => vn(d, f), getUuid: () => crypto.randomUUID() },
    ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }), MimeType: { JSON: 'JSON', TEXT: 'TEXT' } },
    Logger: { log() {} }, console,
  });
  vm.runInContext(MA, ctx);
  if (tuyChon.cauHinh) vm.runInContext(`Object.assign(CAU_HINH, ${JSON.stringify(tuyChon.cauHinh)})`, ctx);
  const gui = (obj, raw) => JSON.parse(ctx.doPost({ postData: { contents: raw !== undefined ? raw : JSON.stringify(obj) } }).getContent());
  return { st, ctx, gui };
}
const ngay = (n) => { const d = new Date(Date.now() + 7 * 3600e3 + n * 86400e3); return d.toISOString().slice(0, 10); };
const tot = (o = {}) => ({ ma_yeu_cau: crypto.randomUUID(), ten_khach: 'Khách thử', dien_thoai: '0912345678', ten_thu_cung: 'Bé Thử', loai: 'Chó', loai_khac: '', dich_vu: 'Khám và chẩn đoán', ngay: ngay(2), gio: '09:00', ngay_don: '', ghi_chu: 'ghi chú', nguon: '/dat-lich/', website: '', ...o });

// 1. Lưu thành công
{ const { st, gui } = taoMoiTruong(); const d = tot(), r = gui(d);
  ok('Yêu cầu hợp lệ: trả { ok: true, ma } với mã dạng LS-yymmdd-XXXX', r.ok === true && /^LS-\d{6}-[0-9A-F]{4}$/.test(r.ma) && r.trung === false, JSON.stringify(r));
  ok('Lưu đúng 1 dòng, đúng cột (mã, mã gửi, tên, số điện thoại, thú cưng, loài, dịch vụ, ngày, giờ, trạng thái "Mới")', st.rows.length === 2 && st.rows[1][0] === r.ma && st.rows[1][1] === d.ma_yeu_cau && st.rows[1][3] === 'Khách thử' && st.rows[1][5] === 'Bé Thử' && st.rows[1][6] === 'Chó' && st.rows[1][8] === d.ngay && st.rows[1][9] === '09:00' && st.rows[1][12] === 'Mới', JSON.stringify(st.rows[1]));
  ok('Gửi đúng 1 email cho chủ tài khoản, có mã yêu cầu', st.emails.length === 1 && st.emails[0].to === 'chu@example.com' && st.emails[0].subject.includes(r.ma), '');
  ok('Khoá được lấy và trả lại đủ', st.khoa === 1 && st.mo === 1, `${st.khoa}/${st.mo}`);
  const r2 = gui(d);
  ok('Gửi lại CÙNG mã yêu cầu: không tạo dòng mới, không gửi email nữa, trả lại mã cũ với trung: true', r2.ok && r2.trung === true && r2.ma === r.ma && st.rows.length === 2 && st.emails.length === 1, JSON.stringify(r2));
  const r3 = gui(tot());
  ok('Mã yêu cầu khác: tạo dòng mới và mã mới', r3.ok && r3.ma !== r.ma && st.rows.length === 3, JSON.stringify(r3)); }
// 2. Kiểm tra dữ liệu phía máy chủ
{ const ca = [
    ['thiếu tên khách hàng', { ten_khach: '' }], ['số điện thoại sai', { dien_thoai: '12345' }], ['thiếu tên thú cưng', { ten_thu_cung: '' }], ['loài không hợp lệ', { loai: 'Rồng' }],
    ['loài Khác nhưng không ghi loài', { loai: 'Khác', loai_khac: '' }], ['thiếu dịch vụ', { dich_vu: '' }], ['ngày sai định dạng', { ngay: '12/10/2030' }], ['ngày không tồn tại', { ngay: '2030-02-31' }],
    ['ngày trong quá khứ', { ngay: ngay(-1) }], ['giờ trước 8:00', { gio: '07:30' }], ['giờ sau 21:00', { gio: '21:30' }], ['giờ sai định dạng', { gio: '9h' }],
    ['nội trú thiếu ngày đón', { dich_vu: 'Gửi nội trú (khách sạn thú cưng)', ngay_don: '' }], ['ngày đón trước ngày gửi', { dich_vu: 'Gửi nội trú', ngay: ngay(3), ngay_don: ngay(2) }], ['mã yêu cầu quá ngắn', { ma_yeu_cau: 'abc' }], ['mã yêu cầu có ký tự lạ', { ma_yeu_cau: 'abc def ghi jkl' }] ];
  const hong = [];
  for (const [ten, o] of ca) { const { st, gui } = taoMoiTruong(); const r = gui(tot(o)); if (r.ok !== false || !r.loi || st.rows.length || st.emails.length) hong.push(ten + ' → ' + JSON.stringify(r)); }
  ok(`${ca.length} trường hợp dữ liệu sai: đều trả { ok: false, loi } bằng tiếng Việt, không lưu dòng nào, không gửi email`, hong.length === 0, hong.join(' | '));
  const { st, gui } = taoMoiTruong();
  ok('Ngày đón CÙNG ngày gửi là hợp lệ; ngày đón sau ngày gửi hợp lệ', gui(tot({ dich_vu: 'Gửi nội trú', ngay: ngay(3), ngay_don: ngay(3) })).ok && gui(tot({ dich_vu: 'Gửi nội trú', ngay: ngay(3), ngay_don: ngay(6) })).ok && st.rows.length === 3, '');
  ok('Loài Khác lưu kèm tên loài; số điện thoại +84 được đổi về dạng 0…', (() => { const { st, gui } = taoMoiTruong(); const r = gui(tot({ loai: 'Khác', loai_khac: 'thỏ', dien_thoai: '+84 912 345 678' })); return r.ok && st.rows[1][6] === 'Khác (thỏ)' && st.rows[1][4] === "'0912345678"; })(), ''); }
// 3. Bảo vệ
{ const { st, gui } = taoMoiTruong(); const r = gui(tot({ website: 'bot' }));
  ok('Ô bẫy spam có chữ: từ chối, không lưu, không gửi email', r.ok === false && !st.rows.length && !st.emails.length, JSON.stringify(r));
  const r2 = taoMoiTruong().gui(tot({ ten_khach: '=HYPERLINK("http://x","y")', ghi_chu: '+1+1' })); const e2 = taoMoiTruong(); const rr = e2.gui(tot({ ten_khach: '=HYPERLINK("http://x","y")', ghi_chu: '@cmd' }));
  ok('Chặn công thức: nội dung bắt đầu bằng = + - @ được lưu kèm dấu nháy ở đầu', rr.ok && e2.st.rows[1][3].startsWith("'=") && e2.st.rows[1][11].startsWith("'@"), JSON.stringify([e2.st.rows[1][3], e2.st.rows[1][11]]));
  const e3 = taoMoiTruong(); const dai = e3.gui(tot({ ghi_chu: 'x'.repeat(5000), ten_khach: 'y'.repeat(500) }));
  ok('Nội dung quá dài bị cắt (ghi chú ≤ 1000, tên ≤ 80)', dai.ok && e3.st.rows[1][11].length <= 1001 && e3.st.rows[1][3].length <= 81, ''); }
// 4. Cấu hình nơi nhận và lỗi email
{ const a = taoMoiTruong({ cauHinh: { GUI_EMAIL: false } }); const ra = a.gui(tot());
  ok('GUI_EMAIL = false (chỉ trang tính): vẫn lưu dòng, không gửi email', ra.ok && a.st.rows.length === 2 && a.st.emails.length === 0, '');
  const b = taoMoiTruong({ emailLoi: true }); const rb = b.gui(tot());
  ok('Gửi email lỗi (hết hạn mức): yêu cầu VẪN được lưu và vẫn trả ok: true (nhân viên thấy dòng mới trong trang tính)', rb.ok && b.st.rows.length === 2, JSON.stringify(rb)); }
// 5. Dữ liệu lạ và biểu mẫu cũ
{ const { st, gui, ctx } = taoMoiTruong(); const r = gui(null, '{bad json');
  ok('JSON hỏng: trả { ok: false } có thông báo, không báo lỗi script', r.ok === false && !!r.loi && !st.rows.length, JSON.stringify(r));
  const cu = JSON.parse(ctx.doPost({ parameter: { ten: 'Khách cũ', dien_thoai: '0912345678', thu_cung: 'Mèo', dich_vu: 'Tắm', ngay: ngay(2), gio: '10:00', ghi_chu: 'cũ', can_nang: '3 – 5 kg' } }).getContent());
  ok('Biểu mẫu cũ (form-urlencoded) vẫn được nhận và lưu (có thể quay lại biểu mẫu cũ mà không đổi script)', cu.ok && st.rows.length === 2 && /biểu mẫu cũ/.test(st.rows[1][13]) && st.rows[1][6] === 'Mèo', JSON.stringify(cu));
  const g = JSON.parse(ctx.doGet().getContent()); ok('doGet chỉ trả trạng thái chạy, không lộ dữ liệu', g.ok === true && g.dich_vu === 'dat-lich-v2' && !st.rows.slice(1).some((x) => JSON.stringify(g).includes(String(x[3]))), JSON.stringify(g)); }

const dem = (t) => kq.filter((x) => x.tt === t).length;
const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')}`;
fs.writeFileSync(path.join(KQ, 'ket-qua-apps-script.txt'), [`Thử logic Code.v2.gs bằng đối tượng giả (không gọi Google) · ${new Date().toISOString()}`, tom, '', ...kq.map((x) => `[${x.tt}] ${x.ten}${x.ct && x.tt !== 'ĐẠT' ? '  → ' + x.ct : ''}`), '', '[CHƯA XÁC MINH] Chạy thật trên Google (cấp quyền, email tới, phản hồi JSON đọc được từ trình duyệt github.io)  → cần chủ dự án thử theo HUONG-DAN-NHAN-LICH.md'].join('\n'));
console.log(tom); kq.filter((x) => x.tt === 'KHÔNG ĐẠT').forEach((x) => console.log('✗', x.ten, '→', x.ct));
process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
