// Đối tượng GIẢ của Google (Trang tính, MailApp, LockService…) để chạy apps-script/Code.v2.gs trong Node. KHÔNG gọi Google.
// Dùng chung cho kiem-thu-apps-script.cjs và kiem-thu-that-dau-cuoi.cjs. MA_PATH=… để thử bản khác của script.
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const MA = fs.readFileSync(process.env.MA_PATH || path.resolve(__dirname, '../apps-script/Code.v2.gs'), 'utf8');
function taoMoiTruong(tuyChon = {}) {
  const tenChinh = (tuyChon.cauHinh && tuyChon.cauHinh.TEN_TRANG) || 'Đặt lịch v2';
  const st = { khoa: 0, mo: 0, giu: false, khoaBan: false, emails: [], sheets: {}, emailLoi: !!tuyChon.emailLoi, triggers: [], truocGui: null, hanMuc: 100 };
  Object.defineProperties(st, { rows: { get: () => (st.sheets[tenChinh] ? st.sheets[tenChinh].d.rows : []) }, raw: { get: () => (st.sheets[tenChinh] ? st.sheets[tenChinh].d.raw : []) }, bg: { get: () => (st.sheets[tenChinh] ? st.sheets[tenChinh].d.bg : {}) } });
  const boNhay = (r) => r.map((x) => (typeof x === 'string' && x[0] === "'" ? x.slice(1) : x)); // Sheets: dấu nháy đầu ô = ép kiểu chữ, không nằm trong giá trị
  const sheet = (ten, rows0) => { const d = { rows: rows0 || [], raw: [], bg: {}, an: [] }, soCot = () => d.rows.reduce((m, r) => Math.max(m, r.length), 0);
    return { ten, d, getLastRow: () => d.rows.length, getLastColumn: soCot, setFrozenRows() {},
      appendRow: (r) => { d.raw.push(r); d.rows.push(boNhay(r)); },
      getRange: (r, c, n, m) => ({ getValues: () => Array.from({ length: n || 1 }, (_, i) => Array.from({ length: m || 1 }, (_, j) => { const v = (d.rows[r - 1 + i] || [])[c - 1 + j]; return v === undefined ? '' : v; })),
        getValue: () => { const v = (d.rows[r - 1] || [])[c - 1]; return v === undefined ? '' : v; },
        setValue: (v) => { const row = (d.rows[r - 1] = d.rows[r - 1] || []); while (row.length < c - 1) row.push(''); row[c - 1] = v; },
        setValues: (vv) => vv.forEach((row0, i) => row0.forEach((v, j) => { const row = (d.rows[r - 1 + i] = d.rows[r - 1 + i] || []); while (row.length < c - 1 + j) row.push(''); row[c - 1 + j] = v; })),
        setBackground: (b) => { for (let i = 0; i < (n || 1); i++) for (let j = 0; j < (m || 1); j++) d.bg[`${r + i},${c + j}`] = b; } }),
      hideColumns: (c) => { if (!d.an.includes(c)) d.an.push(c); } }; };
  const ss = { getSheetByName: (t) => st.sheets[t] || null, insertSheet: (t) => (st.sheets[t] = sheet(t)), getUrl: () => 'https://docs.example/sheet' };
  // Dựng sẵn trang tính CŨ (có dữ liệu) trước khi script chạy: hang0 = [tiêu đề, dòng 1, dòng 2…]
  if (tuyChon.hangCu) st.sheets[tenChinh] = sheet(tenChinh, JSON.parse(JSON.stringify(tuyChon.hangCu), (k, v) => (typeof v === 'string' && /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(v) && k === 'ngayThuc' ? new Date(v) : v)));
  const vn = (d, f) => { const x = new Date(d.getTime() + 7 * 3600e3), p = (n) => String(n).padStart(2, '0'); return f === 'yyMMdd' ? p(x.getUTCFullYear() % 100) + p(x.getUTCMonth() + 1) + p(x.getUTCDate()) : f === 'HH:mm' ? `${p(x.getUTCHours())}:${p(x.getUTCMinutes())}` : `${x.getUTCFullYear()}-${p(x.getUTCMonth() + 1)}-${p(x.getUTCDate())}`; };
  const digest = tuyChon.digestHang ? () => Array(16).fill(7) : (a, s) => Array.from(crypto.createHash('md5').update(s).digest()).map((b) => (b > 127 ? b - 256 : b));
  const ctx = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    LockService: { getScriptLock: () => ({ waitLock() { if (st.khoaBan || st.giu) throw new Error('Không lấy được khoá'); st.giu = true; st.khoa++; }, releaseLock() { st.giu = false; st.mo++; } }) }, // khoá thật: đang có người giữ thì lấy không được
    MailApp: { sendEmail: (o) => { if (st.truocGui) st.truocGui(o); if (st.emailLoi) throw new Error('hết hạn mức email'); st.emails.push(o); }, getRemainingDailyQuota: () => st.hanMuc - st.emails.length },
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
  const mau = (i, ten) => { const s = st.sheets[tenChinh]; return s ? s.d.bg[`${i + 1},${cot(ten) + 1}`] : undefined; }; // màu nền của ô (dòng thứ i từ 0, tên cột)
  const anCot = () => { const s = st.sheets[tenChinh]; return s ? s.d.an.map((c) => s.d.rows[0][c - 1]) : []; }; // tên các cột đã ẩn
  return { st, ctx, gui, guiCu, cot, o, mau, anCot };
}
module.exports = { taoMoiTruong };
