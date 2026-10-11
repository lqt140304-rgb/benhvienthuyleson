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

const { taoMoiTruong } = require('./mo-phong-google.cjs');
const ngay = (n) => { const d = new Date(Date.now() + 7 * 3600e3 + n * 86400e3); return d.toISOString().slice(0, 10); };
const ddmmyyyy = (iso) => iso.split('-').reverse().join('/');
let demRieng = 0; // mỗi yêu cầu cần nội dung KHÁC nhau (cùng SĐT + thú cưng + dịch vụ + ngày + giờ trong 60 phút bị coi là trùng)
const rieng = (o = {}) => tot({ ten_thu_cung: 'Bé ' + (++demRieng), ...o });
const tot = (o = {}) => ({ ma_yeu_cau: crypto.randomUUID(), ten_khach: 'Khách thử', dien_thoai: '0912345678', ten_thu_cung: 'Bé Thử', loai: 'Chó', loai_khac: '', dich_vu: 'Khám và chẩn đoán', ngay: ngay(2), gio: '09:00', ngay_don: '', ghi_chu: 'ghi chú', nguon: '/dat-lich/', website: '', ...o });

// ===== 1. Lưu thành công và chống trùng =====
muc('1. Biểu mẫu mới: lưu, chống trùng, email');
{ const { st, gui, o } = taoMoiTruong(); const d = tot(), r = gui(d);
  ok('Yêu cầu hợp lệ: trả { ok: true, ma } với mã dạng LS-yymmdd-XXXXXX (6 ký tự)', r.ok === true && /^LS-\d{6}-[0-9A-HJKMNP-TV-Z]{6}$/.test(r.ma) && r.trung === false, JSON.stringify(r));
  const x = o(1);
  ok('Lưu đúng 1 dòng, đúng cột (mã, mã gửi, tên, số điện thoại, thú cưng, loài, dịch vụ, ngày, giờ, trạng thái "Mới")', st.rows.length === 2 && x['Mã yêu cầu'] === r.ma && x['Mã gửi từ trình duyệt'] === d.ma_yeu_cau && x['Tên khách hàng'] === 'Khách thử' && x['Tên thú cưng'] === 'Bé Thử' && x['Loài'] === 'Chó' && x['Ngày mong muốn / gửi'] === d.ngay && x['Giờ'] === '09:00' && x['Trạng thái'] === 'Mới', JSON.stringify(x));
  ok('Gửi đúng 1 email cho chủ tài khoản, có mã yêu cầu; cột "Email báo" ghi "đã gửi"', st.emails.length === 1 && st.emails[0].to === 'chu@example.com' && st.emails[0].subject.includes(r.ma) && x['Email báo'] === 'đã gửi', JSON.stringify(x['Email báo']));
  ok('Khoá lấy và trả lại cân bằng (ghi dòng; cập nhật kết quả email)', st.khoa >= 1 && st.khoa === st.mo && !st.giu, `${st.khoa}/${st.mo}`);
  const r2 = gui(d);
  ok('Gửi lại CÙNG mã yêu cầu: không tạo dòng mới, không gửi email nữa, trả lại mã cũ với trung: true', r2.ok && r2.trung === true && r2.ma === r.ma && st.rows.length === 2 && st.emails.length === 1, JSON.stringify(r2));
  const r3 = gui(rieng());
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
  ok('Ngày đón CÙNG ngày gửi là hợp lệ; ngày đón sau ngày gửi hợp lệ', gui(rieng({ dich_vu: 'Gửi nội trú', ngay: ngay(3), ngay_don: ngay(3) })).ok && gui(rieng({ dich_vu: 'Gửi nội trú', ngay: ngay(3), ngay_don: ngay(6) })).ok && st.rows.length === 3, '');
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
  const t = taoMoiTruong(), a = t.gui(rieng({ ma_yeu_cau: 'request-240' })), b = t.gui(rieng({ ma_yeu_cau: 'request-382' }));
  ok('Hai mã gửi đó giờ ra HAI mã tra cứu khác nhau, đủ 2 dòng', a.ok && b.ok && a.ma !== b.ma && t.st.rows.length === 3, `${a.ma} / ${b.ma}`);
  const T = taoMoiTruong(), ds = new Set(); let loi = 0;
  for (let i = 0; i < 1500; i++) { const r = T.gui(rieng({ ma_yeu_cau: 'dong-' + i + '-' + crypto.randomBytes(4).toString('hex') })); if (!r.ok) loi++; else ds.add(r.ma); }
  ok('1.500 yêu cầu khác nhau cùng một ngày: 1.500 mã khác nhau, 1.500 dòng, không lỗi', loi === 0 && ds.size === 1500 && T.st.rows.length === 1501, `${ds.size} mã, ${T.st.rows.length - 1} dòng`);
  const H = taoMoiTruong({ digestHang: true }), m = [1, 2, 3, 4].map((i) => H.gui(rieng({ ma_yeu_cau: 'trung-mb-' + i })));
  ok('Ép băm trả cùng một giá trị (va chạm giả): vẫn ra các mã KHÁC nhau và đủ dòng (kiểm tra tính duy nhất, không dựa vào may rủi)', m.every((x) => x.ok) && new Set(m.map((x) => x.ma)).size === 4 && H.st.rows.length === 5, m.map((x) => x.ma).join(' '));
  const again = H.gui(rieng({ ma_yeu_cau: 'trung-mb-2' })); const ma2 = m[1].ma;
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

// ===== 8. Trang tính CŨ: không lệch cột, không đụng dữ liệu cũ =====
muc('8. Trang tính cũ: ghi theo TÊN cột, giữ nguyên dữ liệu cũ (tiêu đề + dòng cũ)');
const TIEU_DE_CU = ['Thời gian gửi', 'Tên chủ nuôi', 'Số điện thoại', 'Thú cưng', 'Dịch vụ', 'Ngày muốn đến', 'Giờ muốn đến', 'Ghi chú', 'Trạng thái', 'Cân nặng', 'Hoá đơn tham khảo', 'Tổng tạm tính'];
const DONG_CU = [['2026-09-01 10:00', 'Chị Lan', '0901111111', 'Chó', 'Tắm – Chó lông ngắn', '2026-09-05', '10:00', 'bé hiền', 'Đã xác nhận', '3 – 5 kg', 'Tắm: 120.000đ', '120.000đ'],
  ['2026-09-02 09:30', 'Anh Nam', '0902222222', 'Khác (thỏ)', 'Khám và chẩn đoán', '2026-09-06', '14:00', '', 'Mới', '', '', '']];
const chup = (v) => JSON.stringify(v);
const thu = (ten, fn) => { try { fn(); } catch (e) { ok(ten + ': script báo lỗi khi chạy', false, e && e.message); } }; // một khối lỗi không làm dừng cả bộ thử
const CH_CU = { cauHinh: { TEN_TRANG: 'Đặt lịch' }, hangCu: [TIEU_DE_CU, ...DONG_CU] };
thu('khối 1', () => { const T = taoMoiTruong(CH_CU), d = tot({ ten_khach: 'Khách mới', ghi_chu: 'từ web mới' }), r = T.gui(d);
  ok('Trang cũ (12 cột của Code.gs): ghi dòng mới được ok, tạo mã', r.ok === true && !!r.ma, JSON.stringify(r));
  const hd = T.st.rows[0] || [], sau = T.st.rows;
  ok('GIỮ NGUYÊN 12 tiêu đề cũ (không ghi đè, không đổi thứ tự, không đổi tên)', chup(hd.slice(0, 12)) === chup(TIEU_DE_CU), chup(hd.slice(0, 12)));
  ok('GIỮ NGUYÊN hai dòng dữ liệu cũ (giá trị và số cột không đổi)', chup(sau.slice(1, 3)) === chup(DONG_CU), chup(sau.slice(1, 3)));
  ok('Cột còn thiếu được THÊM VÀO CUỐI (9 cột: Mã yêu cầu … Nguồn), không chen vào giữa', hd.length === 21 && hd.slice(12).includes('Mã yêu cầu') && hd.slice(12).includes('Email báo') && hd.slice(12).includes('Nguồn'), chup(hd.slice(12)));
  const m = sau.length > 3 ? T.o(3) : {};
  ok('Dòng mới nằm ĐÚNG CỘT theo tên: "Tên chủ nuôi" = tên khách, "Thú cưng" = loài, "Giờ muốn đến" = giờ, "Ngày muốn đến" = ngày, "Trạng thái" = Mới, "Ghi chú"', m['Tên chủ nuôi'] === 'Khách mới' && m['Thú cưng'] === 'Chó' && m['Giờ muốn đến'] === '09:00' && m['Ngày muốn đến'] === d.ngay && m['Trạng thái'] === 'Mới' && m['Ghi chú'] === 'từ web mới' && m['Số điện thoại'] === '0912345678' && m['Dịch vụ'] === 'Khám và chẩn đoán', chup(m));
  ok('Cột mới đúng chỗ: Mã yêu cầu = mã trả về, Tên thú cưng, Mã gửi từ trình duyệt, Email báo "đã gửi"', m['Mã yêu cầu'] === r.ma && m['Tên thú cưng'] === 'Bé Thử' && m['Mã gửi từ trình duyệt'] === d.ma_yeu_cau && m['Email báo'] === 'đã gửi', chup(m));
  ok('Không dòng cũ nào bị tô màu hay đổi', !T.st.bg[2] && !T.st.bg[3], chup(T.st.bg));
  const r2 = T.gui(d);
  ok('Gửi lại cùng mã trên trang cũ: chống trùng hoạt động (trung: true, không thêm dòng, không thêm email, không thêm cột)', r2.trung === true && r2.ma === r.ma && T.st.rows.length === 4 && T.st.emails.length === 1 && T.st.rows[0].length === 21, chup(r2));
  const r3 = T.gui(rieng()); ok('Yêu cầu khác trên trang cũ: thêm dòng mới, số cột tiêu đề KHÔNG tăng nữa (thêm cột chỉ làm một lần)', r3.ok && T.st.rows.length === 5 && T.st.rows[0].length === 21 && chup(T.st.rows.slice(1, 3)) === chup(DONG_CU), '');
  T.ctx.guiLaiEmailLoi(); T.ctx.guiLaiEmailLoi();
  ok('Chạy gửi lại email trên trang cũ: các dòng cũ (không có mã) không bị đụng, không gửi email thừa', chup(T.st.rows.slice(1, 3)) === chup(DONG_CU) && T.st.emails.length === 2, T.st.emails.length); });
thu('khối 2', () => { const tieu = ['Thời gian gửi', 'Tên chủ nuôi', 'Tên khách hàng', 'Số điện thoại', 'Loài', 'Thú cưng'], T = taoMoiTruong({ hangCu: [tieu, ['t', 'a', 'b', '0900000000', 'Mèo', 'Mèo']] });
  T.gui(tot()); const m = T.st.rows.length > 2 ? T.o(2) : {};
  ok('Có cả "Tên khách hàng" lẫn "Tên chủ nuôi": ghi vào "Tên khách hàng" (tên chuẩn), để trống "Tên chủ nuôi"; "Loài" thắng "Thú cưng"', m['Tên khách hàng'] === 'Khách thử' && m['Tên chủ nuôi'] === '' && m['Loài'] === 'Chó' && m['Thú cưng'] === '', chup(m)); });
thu('khối 3', () => { const tieu = ['Mã yêu cầu', 'Mã gửi từ trình duyệt', 'Thời gian nhận', 'Tên khách hàng', 'Số điện thoại', 'Tên thú cưng', 'Loài', 'Dịch vụ', 'Ngày mong muốn / gửi', 'Giờ', 'Ngày đón dự kiến', 'Giờ đón', 'Cân nặng', 'Ghi chú'];
  const cu = [['LS-260901-AAAAAA', 'g1', '2026-09-01', 'A', '0900000001', 'Mi', 'Mèo', 'Khám', '2026-09-03', '09:00', '', '', '', '']];
  const T = taoMoiTruong({ hangCu: [tieu, ...cu] }), r = T.gui(tot()), m = T.st.rows.length > 2 ? T.o(2) : {};
  ok('Bố cục nháp 14 cột: thêm 7 cột còn thiếu vào cuối; 14 cột đầu và dòng cũ giữ nguyên; dòng mới đúng cột (Trạng thái "Mới", Email báo "đã gửi")', r.ok && chup(T.st.rows[0].slice(0, 14)) === chup(tieu) && chup(T.st.rows[1]) === chup(cu[0]) && T.st.rows[0].length === 21 && m['Trạng thái'] === 'Mới' && m['Email báo'] === 'đã gửi' && m['Mã yêu cầu'] === r.ma, chup(T.st.rows[0])); });
thu('khối 4', () => { const tieu = ['Nhân viên phụ trách', '  TÊN   khách hàng ', 'Mã yêu cầu', 'số điện thoại', 'Ghi chú nội bộ', 'Giờ', 'Dịch vụ'];
  const cu = [['Hà', 'Chị X', 'LS-260901-ZZZZZZ', '0900000009', 'VIP', '09:00', 'Tắm']];
  const T = taoMoiTruong({ hangCu: [tieu, ...cu] }), r = T.gui(tot()), h = T.st.rows[0], m = T.st.rows.length > 2 ? T.o(2) : {};
  ok('Cột bị sắp xếp lại / có cột riêng / tiêu đề lệch hoa-thường-khoảng trắng: vẫn khớp theo tên; cột riêng của nhân viên để trống; 7 tiêu đề gốc nguyên văn', r.ok && chup(h.slice(0, 7)) === chup(tieu) && m['  TÊN   khách hàng '] === 'Khách thử' && m['Mã yêu cầu'] === r.ma && m['số điện thoại'] === '0912345678' && m['Giờ'] === '09:00' && m['Nhân viên phụ trách'] === '' && m['Ghi chú nội bộ'] === '', chup(m));
  ok('Dòng cũ của bố cục đó không đổi; "Ghi chú" không bị nhầm với "Ghi chú nội bộ" (cột Ghi chú mới thêm ở cuối)', chup(T.st.rows[1]) === chup(cu[0]) && h.slice(7).includes('Ghi chú') && m['Ghi chú'] === 'ghi chú', chup(h)); });
thu('khối 5', () => { const tieu = ['Mã yêu cầu', 'Mã gửi từ trình duyệt', 'Tên khách hàng'], cu = [['LS-260901-QQQQQQ', 'da-co-ma-gui', 'A']];
  const T = taoMoiTruong({ hangCu: [tieu, ...cu] }), r = T.gui(tot({ ma_yeu_cau: 'da-co-ma-gui' }));
  ok('Mã gửi đã có sẵn ở dòng cũ (đọc theo tên cột): trả lại mã cũ, không tạo dòng', r.ok && r.trung === true && r.ma === 'LS-260901-QQQQQQ' && T.st.rows.length === 2, chup(r)); });
thu('khối 6', () => { const T = taoMoiTruong(); T.gui(tot());
  ok('Trang trống: ghi đủ 21 tiêu đề chuẩn theo thứ tự (hành vi cũ giữ nguyên)', T.st.rows[0].length === 21 && T.st.rows[0][0] === 'Mã yêu cầu' && T.st.rows[0][20] === 'Nguồn', chup(T.st.rows[0])); });

// ===== 9. Gửi lại email đồng thời không trùng =====
muc('9. Gửi lại email: không gửi trùng khi chạy chồng nhau');
thu('khối 7', () => { const T = taoMoiTruong({ emailLoi: true }); T.gui(tot()); // dòng ở trạng thái LỖI
  T.st.emailLoi = false; let da = false;
  T.st.truocGui = () => { if (!da) { da = true; T.ctx.guiLaiEmailLoi(); } }; // trong lúc lần chạy A đang gửi, lần chạy B (trigger / bấm tay) chạy chồng
  T.ctx.guiLaiEmailLoi();
  ok('Hai lần chạy chồng nhau lên cùng dòng LỖI: chỉ gửi ĐÚNG 1 email', T.st.emails.length === 1, T.st.emails.length);
  ok('Kết quả cuối: "Email báo" = "đã gửi", hết màu lỗi, số lần gửi = 2 (1 lần lỗi + 1 lần gửi lại)', T.o(1)['Email báo'] === 'đã gửi' && !T.st.bg[2] && Number(T.o(1)['Số lần gửi email']) === 2, chup([T.o(1)['Email báo'], T.st.bg, T.o(1)['Số lần gửi email']]));
  ok('Khoá cân bằng sau khi chạy chồng', T.st.khoa === T.st.mo && !T.st.giu, `${T.st.khoa}/${T.st.mo}`); });
thu('khối 8', () => { const T = taoMoiTruong({ emailLoi: true }); T.gui(rieng()); T.gui(rieng()); T.st.emailLoi = false; T.ctx.guiLaiEmailLoi(); T.ctx.guiLaiEmailLoi(); T.ctx.guiLaiEmailLoi();
  ok('Hai dòng LỖI, chạy 3 lần liên tiếp: mỗi dòng đúng 1 email (tổng 2)', T.st.emails.length === 2, T.st.emails.length); });
thu('khối 9', () => { const T = taoMoiTruong(); let da = false;
  T.st.truocGui = () => { if (!da) { da = true; T.ctx.guiLaiEmailLoi(); } }; // trong lúc gửi email lần đầu của doPost, trigger gửi lại chạy
  const r = T.gui(tot());
  ok('Trigger gửi lại chạy đúng lúc đang gửi email lần đầu của yêu cầu mới: vẫn chỉ 1 email', r.ok && T.st.emails.length === 1 && T.o(1)['Email báo'] === 'đã gửi', T.st.emails.length); });
thu('khối 10', () => { const T = taoMoiTruong({ emailLoi: true }); T.gui(tot()); T.st.emailLoi = false;
  const i = T.cot('Email báo'), j = T.cot('Số lần gửi email'); T.st.rows[1][i] = 'ĐANG GỬI ' + new Date().toISOString(); T.st.rows[1][j] = 2;
  T.ctx.guiLaiEmailLoi();
  ok('Dòng "ĐANG GỬI" MỚI (lần chạy khác đang gửi) không bị gửi lại', T.st.emails.length === 0 && /^ĐANG GỬI/.test(T.o(1)['Email báo']), T.o(1)['Email báo']);
  T.st.rows[1][i] = 'ĐANG GỬI ' + new Date(Date.now() - 20 * 60000).toISOString();
  T.ctx.guiLaiEmailLoi();
  ok('Dòng "ĐANG GỬI" bị treo quá 5 phút (lần chạy trước chết giữa chừng): được gửi lại đúng 1 lần, số lần tăng lên 3', T.st.emails.length === 1 && T.o(1)['Email báo'] === 'đã gửi' && Number(T.o(1)['Số lần gửi email']) === 3, chup([T.st.emails.length, T.o(1)['Email báo'], T.o(1)['Số lần gửi email']]));
  T.st.rows[1][i] = 'ĐANG GỬI ' + new Date(Date.now() - 20 * 60000).toISOString(); T.st.rows[1][j] = 5; const truoc = T.st.emails.length;
  T.ctx.guiLaiEmailLoi();
  ok('Treo mà đã hết 5 lượt: KHÔNG gửi nữa, chuyển sang LỖI và tô màu để nhân viên xem', T.st.emails.length === truoc && /^LỖI/.test(T.o(1)['Email báo']) && !!T.st.bg[2], chup([T.o(1)['Email báo'], T.st.bg])); });
thu('khối 11', () => { const T = taoMoiTruong();
  T.st.truocGui = () => { T.st.rows.splice(1, 0, ['nhân viên chèn dòng', '', '']); T.st.truocGui = null; }; // nhân viên chèn một dòng NGAY TRÊN dòng vừa ghi trong lúc email đang gửi
  const r = T.gui(tot()), hang = T.st.rows.findIndex((x) => x[0] === r.ma), iE = T.cot('Email báo');
  ok('Nhân viên chèn dòng ở trên trong lúc gửi email: kết quả "đã gửi" ghi đúng dòng của yêu cầu (tìm theo mã, không theo số dòng cũ), dòng chèn không bị đụng', hang === 2 && T.st.rows[hang][iE] === 'đã gửi' && chup(T.st.rows[1]) === chup(['nhân viên chèn dòng', '', '']), chup([hang, T.st.rows[hang] && T.st.rows[hang][iE], T.st.rows[1]])); });
thu('khối 12', () => { const T = taoMoiTruong({ emailLoi: true }); T.gui(tot()); T.st.emailLoi = false; T.st.khoaBan = true;
  let loi = ''; try { T.ctx.guiLaiEmailLoi(); } catch (e) { loi = e.message; }
  ok('Khoá đang bận khi chạy gửi lại: bỏ lượt, không ném lỗi, không gửi email', loi === '' && T.st.emails.length === 0, loi);
  const r = T.gui(tot());
  ok('Khoá bận khi ghi yêu cầu mới: trả lỗi tiếng Việt (khách bấm gửi lại được), KHÔNG ghi dòng nào', r.ok === false && /thử lại/.test(r.loi || '') && T.st.rows.length === 2, chup(r)); });
thu('khối 13', () => { const A = taoMoiTruong({ cauHinh: { EMAIL_NHAN: 'a@x.vn, b@x.vn' } }); A.gui(tot());
  const B = taoMoiTruong(); B.gui(tot());
  ok('EMAIL_NHAN điền sẵn: email gửi tới đúng các địa chỉ đó; để trống: gửi tới chủ tài khoản đã triển khai', A.st.emails[0].to === 'a@x.vn, b@x.vn' && B.st.emails[0].to === 'chu@example.com', chup([A.st.emails[0].to, B.st.emails[0].to])); });

// ===== 10. Thử trên Sheet riêng (hàm kiemTraTrenSheetRieng) =====
muc('10. kiemTraTrenSheetRieng(): bộ thử cho Sheet riêng');
thu('khối 14', () => { const T = taoMoiTruong(); const hamCo = typeof T.ctx.kiemTraTrenSheetRieng === 'function';
  ok('Có hàm kiemTraTrenSheetRieng()', hamCo, '');
  if (hamCo) { const kqHam = T.ctx.kiemTraTrenSheetRieng(), kt = T.st.sheets['Kết quả thử'], dong = kt ? kt.d.rows.slice(1) : [];
    ok('Môi trường tốt: mọi mục ĐẠT, ghi vào trang "Kết quả thử"', kqHam.khongDat === 0 && dong.length >= 7 && dong.every((r) => r[1] === 'ĐẠT'), chup(dong.map((r) => r[1] + ' ' + r[2])));
    ok('Đúng MỘT dòng trong trang đặt lịch và đúng 2 email thử (1 lần đầu + 1 lần sau khi giả lập lỗi), tới chủ tài khoản', T.st.rows.length === 2 && T.st.emails.length === 2 && T.st.emails.every((e) => e.to === 'chu@example.com'), `${T.st.rows.length - 1} dòng, ${T.st.emails.length} email`);
    const H = taoMoiTruong({ emailLoi: true }), kh = H.ctx.kiemTraTrenSheetRieng();
    ok('Email hỏng (hết hạn mức): bộ thử BÁO KHÔNG ĐẠT, không báo ĐẠT giả', kh.khongDat > 0, JSON.stringify(kh));
    const C = taoMoiTruong({ cauHinh: { GUI_EMAIL: false } }), kc = C.ctx.kiemTraTrenSheetRieng();
    ok('GUI_EMAIL = false: bộ thử vẫn đạt phần lưu 1 dòng và gửi lại không trùng, không gửi email', kc.khongDat === 0 && C.st.emails.length === 0 && C.st.rows.length === 2, JSON.stringify(kc)); } });

// ===== 11. Chống trùng theo NỘI DUNG (bấm "Gửi yêu cầu khác" rồi điền lại y hệt) =====
muc('11. Cùng SĐT + tên thú cưng + dịch vụ + ngày + giờ trong 60 phút = một yêu cầu');
thu('mục 11', () => {
  { const T = taoMoiTruong(), a = T.gui(tot({ ma_yeu_cau: 'adc8dfbc-a794-4e35-a7a4-111111111111', ten_khach: 'Trung Lê Quốc', dien_thoai: '0369661409', ten_thu_cung: 'pinky', dich_vu: 'Grooming - Spa', ngay: ngay(0), gio: '17:00' }));
    const b = T.gui(tot({ ma_yeu_cau: '4a689dd0-5ab9-45c1-bafa-222222222222', ten_khach: 'Trung Lê Quốc', dien_thoai: '0369661409', ten_thu_cung: 'pinky', dich_vu: 'Grooming - Spa', ngay: ngay(0), gio: '17:00' }));
    ok('Đúng cảnh khách đã gặp (2 mã gửi khác nhau, nội dung y hệt): chỉ 1 dòng, 1 email; lần 2 trả LẠI mã của lần 1 với trung: true', a.ok && b.ok && b.ma === a.ma && b.trung === true && T.st.rows.length === 2 && T.st.emails.length === 1, chup([a, b, T.st.rows.length - 1, T.st.emails.length]));
    const c = T.gui(tot({ ma_yeu_cau: 'ccccdddd-5ab9-45c1-bafa-333333333333', ten_khach: 'Trung Lê Quốc', dien_thoai: '+84 369 661 409', ten_thu_cung: '  PINKY ', dich_vu: 'grooming - spa', ngay: ngay(0), gio: '17:00' }));
    ok('Khác hoa-thường, khoảng trắng, +84 so với 0…: vẫn nhận ra là trùng', c.ok && c.ma === a.ma && T.st.rows.length === 2 && T.st.emails.length === 1, chup(c)); }
  const bien = [['số điện thoại', { dien_thoai: '0369661410' }], ['tên thú cưng', { ten_thu_cung: 'mimi' }], ['dịch vụ', { dich_vu: 'Khám và chẩn đoán' }], ['ngày', { ngay: ngay(1) }], ['giờ', { gio: '17:30' }]];
  const hong = [];
  for (const [ten, x] of bien) { const T = taoMoiTruong(), goc = { ten_thu_cung: 'pinky', dich_vu: 'Grooming - Spa', ngay: ngay(0), gio: '17:00' }; T.gui(tot(goc)); const r = T.gui(tot({ ...goc, ...x })); if (!(r.ok && r.trung === false && T.st.rows.length === 3 && T.st.emails.length === 2)) hong.push(ten + ' → ' + chup(r)); }
  ok('Đổi MỘT trong 5 trường (SĐT / tên thú cưng / dịch vụ / ngày / giờ): là yêu cầu MỚI, có dòng mới và email mới', hong.length === 0, hong.join(' | '));
  { const T = taoMoiTruong(); T.gui(tot({ ten_thu_cung: 'pinky' })); T.st.rows[1][T.cot('Thời gian nhận')] = new Date(Date.now() - 59 * 60000); const r1 = T.gui(tot({ ten_thu_cung: 'pinky' }));
    T.st.rows[1][T.cot('Thời gian nhận')] = new Date(Date.now() - 61 * 60000); const r2 = T.gui(tot({ ten_thu_cung: 'pinky' }));
    ok('Cách 59 phút: vẫn trùng (không thêm dòng); cách 61 phút: là yêu cầu mới (thêm dòng, thêm email)', r1.trung === true && r2.trung === false && T.st.rows.length === 3 && T.st.emails.length === 2, chup([r1, r2, T.st.rows.length - 1])); }
  { const T = taoMoiTruong({ emailLoi: true }); const a = T.gui(tot({ ten_thu_cung: 'pinky' })), b = T.gui(tot({ ten_thu_cung: 'pinky' }));
    ok('Email của lần 1 bị lỗi: lần điền lại y hệt cũng không tạo dòng mới (vẫn 1 dòng LỖI để gửi lại tự động)', b.trung === true && b.ma === a.ma && T.st.rows.length === 2 && /^LỖI/.test(T.o(1)['Email báo']), chup([b, T.st.rows.length - 1])); }
  { const dongCu = [['2026-10-11 19:00', 'Chị Lan', '0901111111', 'Chó', 'Tắm – Chó lông ngắn', ngay(3), '10:00', '', 'Mới', '', '', '']], T = taoMoiTruong({ cauHinh: { TEN_TRANG: 'Đặt lịch' }, hangCu: [TIEU_DE_CU, ...dongCu] }), nCu = chup([TIEU_DE_CU, ...dongCu]), a = T.gui(tot({ ten_thu_cung: 'pinky', dich_vu: 'Tắm – Chó lông ngắn', dien_thoai: '0901111111', ngay: ngay(3), gio: '10:00' }));
    ok('Trang cũ có dòng cùng SĐT/dịch vụ/ngày/giờ (dòng cũ không có "tên thú cưng", thời gian dạng chữ): dòng cũ KHÔNG bị coi là trùng, yêu cầu được nhận và dòng cũ giữ nguyên', a.ok && a.trung === false && T.st.rows.length === 3 && chup([T.st.rows[0].slice(0, 12), T.st.rows[1]]) === nCu, chup(a)); }
  { const T = taoMoiTruong(); const p = { ten: 'Khách cũ', dien_thoai: '0912345678', thu_cung: 'Chó', dich_vu: 'Tắm – Chó lông ngắn', can_nang: '3 – 5 kg', ngay: ngay(2), gio: '09:00', ghi_chu: '', hoa_don: '', tong_tam_tinh: '', website: '' };
    const a = T.guiCu(p), b = T.guiCu(p);
    ok('Biểu mẫu cũ bấm gửi 2 lần (mỗi lần sinh mã riêng): chỉ 1 dòng, 1 email', a.ok && b.ok && b.ma === a.ma && T.st.rows.length === 2 && T.st.emails.length === 1, chup([a, b, T.st.rows.length - 1])); }
  { const T = taoMoiTruong(); const a = T.gui(tot({ ten_thu_cung: 'pinky' })); T.gui(tot({ ten_thu_cung: 'pinky' })); T.gui(tot({ ten_thu_cung: 'pinky' }));
    ok('Điền y hệt 3 lần liên tiếp: vẫn 1 dòng, 1 email; khoá cân bằng', T.st.rows.length === 2 && T.st.emails.length === 1 && T.st.khoa === T.st.mo && !T.st.giu, `${T.st.rows.length - 1} dòng, ${T.st.emails.length} email`); }
});

const dem = (t) => kq.filter((x) => x.tt === t).length;
const tom = `ĐẠT ${dem('ĐẠT')} · KHÔNG ĐẠT ${dem('KHÔNG ĐẠT')} · CHƯA XÁC MINH ${dem('CHƯA XÁC MINH') + 1}`;
const dong = [`Thử logic Code.v2.gs bằng đối tượng giả (không gọi Google) · ${process.env.MA_PATH ? 'BẢN THỬ: ' + process.env.MA_PATH + ' · ' : ''}${new Date().toISOString()}`, tom, '', ...kq.map((x) => x.tt === 'MỤC' ? `\n-- ${x.ten}` : `[${x.tt}] ${x.ten}${x.ct && x.tt !== 'ĐẠT' ? '  → ' + x.ct : ''}`), '', '[CHƯA XÁC MINH] Chạy thật trên Google (cấp quyền, email tới, hạn mức email, phản hồi JSON đọc được từ trình duyệt github.io)  → cần chủ dự án thử theo HUONG-DAN-NHAN-LICH.md'];
if (!process.env.MA_PATH) fs.writeFileSync(path.join(KQ, 'ket-qua-apps-script.txt'), dong.join('\n'));
console.log(dong.join('\n').split('\n').filter((l) => /^(ĐẠT|\[KHÔNG|Thử|--)/.test(l) || /\[CHƯA/.test(l) === false && l.startsWith('[KHÔNG')).join('\n'));
console.log(tom);
process.exit(dem('KHÔNG ĐẠT') ? 1 : 0);
