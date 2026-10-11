/**
 * ĐỀ XUẤT (CHƯA TRIỂN KHAI): nhận yêu cầu đặt lịch bản 2 cho biểu mẫu đặt lịch mới của web Bệnh viện thú y Lê Sơn.
 *
 * Khác bản cũ (Code.gs):
 *  - Trả JSON đọc được { ok: true, ma } để web chỉ báo "Đã nhận yêu cầu" khi THỰC SỰ đã lưu.
 *  - Mã tra cứu LS-yymmdd-XXXXXX (6 ký tự) và được kiểm tra duy nhất trong trang tính.
 *  - Chống trùng: cùng ma_yeu_cau (gửi lại sau lỗi mạng) thì không tạo dòng mới, trả lại mã cũ.
 *  - Kiểm tra lại toàn bộ dữ liệu phía máy chủ (tên, số điện thoại, tên thú cưng, loài, ngày, giờ HH:MM đúng miền giá trị, ngày đón không trước ngày gửi).
 *  - Vẫn có ô bẫy spam, khoá LockService, chặn công thức trong Google Sheet.
 *  - Nhận được biểu mẫu CŨ (form-urlencoded, gồm ngày đón dính trong tên dịch vụ, cân nặng, hoá đơn, tổng tạm tính) để có thể quay lại
 *    biểu mẫu cũ mà không phải đổi script. Biểu mẫu cũ dùng no-cors nên KHÔNG đọc được phản hồi: bản này không từ chối vì trường chỉ có ở
 *    biểu mẫu mới, thay vào đó lưu lịch và ghi "Cần kiểm tra" để nhân viên xem lại.
 *  - Lỗi gửi email không còn im lặng: cột "Email báo", dòng tô màu, hàm guiLaiEmailLoi() (tối đa EMAIL_TOI_DA lần).
 *
 * Nơi nhận lịch (chủ dự án chọn, xem HUONG-DAN-NHAN-LICH.md): GUI_EMAIL ở CAU_HINH. Trang tính luôn được ghi (làm "trang quản lý" và để chống trùng).
 * Cách cài: xem HUONG-DAN-NHAN-LICH.md. KHÔNG dán đè lên bản đang chạy khi chưa thử nghiệm.
 */
var CAU_HINH = {
  TEN_TRANG: 'Đặt lịch v2',     // trang tính ghi yêu cầu (cũng là "trang quản lý" cho nhân viên: cột Trạng thái)
  GUI_EMAIL: true,              // true: gửi email báo cho chủ tài khoản đã triển khai script; false: chỉ ghi trang tính
  EMAIL_TOI_DA: 5,              // số lần thử gửi email cho một dòng (kể cả lần đầu)
  GIO_MO: 8 * 60,               // 8:00
  GIO_DONG: 21 * 60,            // 21:00
  MUI_GIO: 'Asia/Ho_Chi_Minh',
  MAU_LOI_EMAIL: '#FDE3C8'      // màu nền dòng có email lỗi
};
var COT = ['Mã yêu cầu', 'Mã gửi từ trình duyệt', 'Thời gian nhận', 'Tên khách hàng', 'Số điện thoại', 'Tên thú cưng', 'Loài', 'Dịch vụ', 'Ngày mong muốn / gửi', 'Giờ',
  'Ngày đón dự kiến', 'Giờ đón', 'Cân nặng', 'Ghi chú', 'Hoá đơn tham khảo', 'Tổng tạm tính', 'Trạng thái', 'Cần kiểm tra', 'Email báo', 'Số lần gửi email', 'Nguồn'];
function c_(ten) { return COT.indexOf(ten) + 1; } // số thứ tự cột (bắt đầu từ 1)

function doPost(e) {
  var du;
  try { du = docDuLieu_(e); } catch (err) { return traLoi_({ ok: false, loi: 'Dữ liệu gửi lên không đọc được.' }); }
  if (du.website) return traLoi_({ ok: false, loi: 'Yêu cầu bị từ chối.' }); // ô bẫy spam
  var loi = kiemTra_(du, new Date());
  if (loi) return traLoi_({ ok: false, loi: loi });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var ma, trung = false, sh, hang = 0;
  try {
    sh = layTrang_();
    var bang = docMa_(sh), cu = bang.theoGui[du.ma_yeu_cau];
    if (cu) { ma = cu; trung = true; }
    else {
      ma = taoMaDuyNhat_(du.ma_yeu_cau, new Date(), bang.daDung);
      if (!ma) return traLoi_({ ok: false, loi: 'Chưa tạo được mã yêu cầu, vui lòng thử lại.' });
      sh.appendRow([ma, "'" + du.ma_yeu_cau, new Date(), du.ten_khach, "'" + du.dien_thoai, du.ten_thu_cung, du.loai === 'Khác' ? 'Khác (' + du.loai_khac + ')' : du.loai,
        du.dich_vu, "'" + du.ngay, "'" + du.gio, du.ngay_don ? "'" + du.ngay_don : '', du.gio_don ? "'" + du.gio_don : '', du.can_nang, du.ghi_chu, du.hoa_don, du.tong_tam_tinh,
        'Mới', du.can_kiem_tra.join('; '), '', '', du.nguon]);
      hang = sh.getLastRow();
    }
  } finally {
    lock.releaseLock();
  }
  if (!trung) thongBaoEmail_(sh, hang, ma, du); // yêu cầu đã lưu; email lỗi KHÔNG làm mất yêu cầu nhưng được ghi lại để theo dõi
  return traLoi_({ ok: true, ma: ma, trung: trung });
}

// Kiểm tra sức khoẻ: mở địa chỉ /exec trên trình duyệt thấy dòng này là script đang chạy (không trả dữ liệu nào).
function doGet() { return traLoi_({ ok: true, dich_vu: 'dat-lich-v2' }); }

// ---------- Đọc và kiểm tra dữ liệu ----------
function docDuLieu_(e) {
  var p = (e && e.parameter) || {}, noiDung = e && e.postData && e.postData.contents, j = null;
  if (noiDung && /^\s*\{/.test(noiDung)) j = JSON.parse(noiDung); // biểu mẫu mới: JSON gửi dạng text/plain
  if (j) {
    return {
      cu: false, can_kiem_tra: [],
      ma_yeu_cau: sach_(j.ma_yeu_cau, 64), ten_khach: sach_(j.ten_khach, 80), dien_thoai: chuanSdt_(j.dien_thoai), ten_thu_cung: sach_(j.ten_thu_cung, 60),
      loai: sach_(j.loai, 10), loai_khac: sach_(j.loai_khac, 40), dich_vu: sach_(j.dich_vu, 120), ngay: String(j.ngay || ''), gio: String(j.gio || ''),
      ngay_don: String(j.ngay_don || ''), gio_don: '', can_nang: '', hoa_don: '', tong_tam_tinh: '', ghi_chu: sach_(j.ghi_chu, 1000), nguon: sach_(j.nguon, 100), website: String(j.website || '')
    };
  }
  // Biểu mẫu cũ (form-urlencoded): ten, dien_thoai, thu_cung ("Khác (thỏ)"), dich_vu ("… · đón dd/mm/yyyy lúc HH:MM" khi là nội trú), can_nang, ngay, gio, ghi_chu, hoa_don, tong_tam_tinh
  var flags = [], dv = String(p.dich_vu || '').slice(0, 300), ngayDon = '', gioDon = '';
  var m = /^([\s\S]*?)\s·\sđón\s(\d{2})\/(\d{2})\/(\d{4})\slúc\s(\S+)\s*$/.exec(dv);
  if (m) {
    dv = m[1];
    var iso = m[4] + '-' + m[3] + '-' + m[2];
    if (ngayDung_(iso)) ngayDon = iso; else flags.push('không đọc được ngày đón (' + sach_(m[2] + '/' + m[3] + '/' + m[4], 12) + ')');
    if (phutCua_(m[5]) >= 0) gioDon = m[5]; else flags.push('giờ đón không hợp lệ (' + sach_(m[5], 10) + ')');
  }
  var thuCung = String(p.thu_cung || ''), loai = /^Chó/.test(thuCung) ? 'Chó' : /^Mèo/.test(thuCung) ? 'Mèo' : 'Khác';
  var loaiKhac = loai === 'Khác' ? sach_(thuCung.replace(/^Khác\s*\((.*)\)\s*$/, '$1'), 40) : '';
  if (loai === 'Khác' && !loaiKhac) loaiKhac = '(không ghi)';
  return {
    cu: true, can_kiem_tra: flags,
    ma_yeu_cau: 'cu-' + Utilities.getUuid(), ten_khach: sach_(p.ten, 80), dien_thoai: chuanSdt_(p.dien_thoai), ten_thu_cung: '(biểu mẫu cũ: không có)',
    loai: loai, loai_khac: loaiKhac, dich_vu: sach_(dv, 120), ngay: String(p.ngay || ''), gio: String(p.gio || ''), ngay_don: ngayDon, gio_don: gioDon,
    can_nang: sach_(p.can_nang, 30), hoa_don: sach_(p.hoa_don, 1000), tong_tam_tinh: sach_(p.tong_tam_tinh, 60), ghi_chu: sach_(p.ghi_chu, 1000), nguon: 'biểu mẫu cũ', website: String(p.website || '')
  };
}

function chuanSdt_(v) { var s = String(v || '').replace(/[\s.\-()]/g, ''); return s.indexOf('+84') === 0 ? '0' + s.slice(3) : s; }

function ngayDung_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if (!m) return null;
  var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null;
}
// Giờ "HH:MM" đúng miền giá trị (giờ 00–23, phút 00–59). Trả số phút trong ngày, hoặc -1 nếu sai. Không cắt khoảng trắng: dữ liệu sai bị từ chối.
function phutCua_(s) { var m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(s)); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : -1; }

// Trả chuỗi lỗi (tiếng Việt, hiện cho khách) hoặc '' nếu hợp lệ. now: để thử nghiệm. Với biểu mẫu cũ (du.cu) chỉ từ chối lỗi LÕI, các chỗ khác ghi du.can_kiem_tra.
function kiemTra_(du, now) {
  if (!/^[A-Za-z0-9\-]{8,64}$/.test(du.ma_yeu_cau)) return 'Thiếu mã yêu cầu.';
  if (!du.ten_khach) return 'Thiếu tên khách hàng.';
  if (!/^0\d{9,10}$/.test(du.dien_thoai)) return 'Số điện thoại chưa đúng.';
  if (!du.cu && !du.ten_thu_cung) return 'Thiếu tên thú cưng.';
  if (['Chó', 'Mèo', 'Khác'].indexOf(du.loai) < 0) return 'Loài thú cưng chưa đúng.';
  if (du.loai === 'Khác' && !du.loai_khac) return 'Thiếu loài thú cưng.';
  if (!du.dich_vu) return 'Thiếu dịch vụ.';
  var ngay = ngayDung_(du.ngay);
  if (!ngay) return 'Ngày chưa đúng.';
  var vn = new Date(now.getTime() + 7 * 3600000), homNay = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  if (ngay < homNay) return 'Ngày phải từ hôm nay trở đi.';
  var phut = phutCua_(du.gio);
  if (phut < 0) return 'Giờ chưa đúng (định dạng HH:MM, ví dụ 09:30).';
  if (phut < CAU_HINH.GIO_MO || phut > CAU_HINH.GIO_DONG) return 'Giờ nhận lịch từ 8:00 đến 21:00.';
  if (/nội trú/i.test(du.dich_vu) && !du.ngay_don) {
    if (!du.cu) return 'Thiếu ngày đón dự kiến.';
    if (du.can_kiem_tra.length === 0) du.can_kiem_tra.push('nội trú nhưng không đọc được ngày đón');
  }
  if (du.ngay_don) {
    var don = ngayDung_(du.ngay_don);
    if (!don) return 'Ngày đón chưa đúng.';
    if (don < ngay) return 'Ngày đón không được trước ngày gửi.';
  }
  return '';
}

// ---------- Lưu trữ ----------
function layTrang_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CAU_HINH.TEN_TRANG) || ss.insertSheet(CAU_HINH.TEN_TRANG);
  if (sh.getLastRow() === 0) { sh.appendRow(COT); sh.setFrozenRows(1); }
  return sh;
}
// Đọc cột A (mã yêu cầu) và B (mã gửi từ trình duyệt): để chống trùng khi khách bấm "Gửi lại" và để mã tra cứu luôn duy nhất
function docMa_(sh) {
  var theoGui = {}, daDung = {}, n = sh.getLastRow();
  if (n >= 2) {
    var v = sh.getRange(2, 1, n - 1, 2).getValues();
    for (var i = 0; i < v.length; i++) { daDung[String(v[i][0])] = true; theoGui[String(v[i][1])] = String(v[i][0]); }
  }
  return { theoGui: theoGui, daDung: daDung };
}
var BANG_MA_ = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: không có I, L, O, U (dễ đọc, dễ đọc qua điện thoại)
// Mã dễ đọc: LS-yymmdd-XXXXXX. 6 ký tự = 30 bit lấy từ MD5 của mã gửi (cùng mã gửi → cùng mã). salt > 0 chỉ dùng khi trùng với mã của yêu cầu khác.
function taoMa_(maGui, now, salt) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, maGui), x = [];
  for (var i = 0; i < 4; i++) x.push(b[i] < 0 ? b[i] + 256 : b[i]);
  var n = ((x[0] << 22) | (x[1] << 14) | (x[2] << 6) | (x[3] >> 2)) >>> 0;
  n = (n + (salt || 0) * 7919) & 0x3FFFFFFF; // mỗi salt cho một mã khác (7919 nguyên tố, nhỏ hơn 2^30 nhiều lần)
  var s = ''; for (var k = 5; k >= 0; k--) s += BANG_MA_.charAt((n >> (5 * k)) & 31);
  return 'LS-' + Utilities.formatDate(now, CAU_HINH.MUI_GIO, 'yyMMdd') + '-' + s;
}
// Đảm bảo mã chưa dùng cho yêu cầu khác (kiểm tra trong cùng khoá). Trả '' nếu thử 21 lần vẫn trùng (gần như không thể xảy ra).
function taoMaDuyNhat_(maGui, now, daDung) {
  for (var salt = 0; salt <= 20; salt++) { var ma = taoMa_(maGui, now, salt); if (!daDung[ma]) return ma; }
  return '';
}

// ---------- Email và theo dõi lỗi ----------
function noiDungEmail_(ma, du) {
  var d = du.ngay.split('-');
  return {
    subject: 'Lịch mới ' + ma + ': ' + du.ten_khach + ' – ' + d[2] + '/' + d[1] + ' lúc ' + du.gio,
    body: 'Có yêu cầu đặt lịch mới trên web (mã ' + ma + '):\n\n' +
      'Khách hàng: ' + du.ten_khach + '\nSố điện thoại: ' + du.dien_thoai +
      '\nThú cưng: ' + du.ten_thu_cung + ' (' + (du.loai === 'Khác' ? du.loai_khac : du.loai) + ')' +
      '\nDịch vụ: ' + du.dich_vu + (du.can_nang ? ' · ' + du.can_nang : '') + '\nNgày: ' + d[2] + '/' + d[1] + '/' + d[0] + '\nGiờ: ' + du.gio +
      (du.ngay_don ? '\nNgày đón dự kiến: ' + du.ngay_don.split('-').reverse().join('/') + (du.gio_don ? ' lúc ' + du.gio_don : '') : '') +
      '\nGhi chú: ' + (du.ghi_chu || '(không có)') +
      (du.can_kiem_tra.length ? '\n\nCẦN KIỂM TRA: ' + du.can_kiem_tra.join('; ') : '') +
      (du.hoa_don ? '\n\nHoá đơn tham khảo khách đã xem:\n' + du.hoa_don + (du.tong_tam_tinh ? '\nTổng tạm tính: ' + du.tong_tam_tinh : '') : '') +
      '\n\nNhớ liên hệ khách để xác nhận lịch. Danh sách đầy đủ: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  };
}
function guiEmail_(ma, du) {
  var nd = noiDungEmail_(ma, du);
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: nd.subject, body: nd.body });
}
function ghiEmail_(sh, hang, trangThai, soLan, loi) {
  sh.getRange(hang, c_('Email báo')).setValue(trangThai);
  sh.getRange(hang, c_('Số lần gửi email')).setValue(soLan);
  sh.getRange(hang, 1, 1, COT.length).setBackground(loi ? CAU_HINH.MAU_LOI_EMAIL : null); // lỗi: tô màu để nhân viên thấy; thành công: bỏ màu
}
function thongBaoEmail_(sh, hang, ma, du) {
  if (!CAU_HINH.GUI_EMAIL) { ghiEmail_(sh, hang, 'không dùng', 0, false); return; }
  try { guiEmail_(ma, du); ghiEmail_(sh, hang, 'đã gửi', 1, false); }
  catch (err) { ghiEmail_(sh, hang, 'LỖI: ' + sach_(err && err.message ? err.message : err, 150), 1, true); }
}
// Gửi lại email cho các dòng đang LỖI (tối đa EMAIL_TOI_DA lần mỗi dòng). Chạy tay trong trình soạn script, hoặc đặt tự chạy bằng taoLichGuiLaiEmail().
function guiLaiEmailLoi() {
  if (!CAU_HINH.GUI_EMAIL) return;
  var sh = layTrang_(), n = sh.getLastRow(); if (n < 2) return;
  var v = sh.getRange(2, 1, n - 1, COT.length).getValues();
  for (var i = 0; i < v.length; i++) {
    var r = v[i], trangThai = String(r[c_('Email báo') - 1]), soLan = parseInt(r[c_('Số lần gửi email') - 1], 10) || 0;
    if (trangThai.indexOf('LỖI') !== 0 || soLan >= CAU_HINH.EMAIL_TOI_DA) continue;
    var hang = i + 2, du = duTuDong_(r);
    try { guiEmail_(String(r[0]), du); ghiEmail_(sh, hang, 'đã gửi', soLan + 1, false); }
    catch (err) { ghiEmail_(sh, hang, 'LỖI: ' + sach_(err && err.message ? err.message : err, 150), soLan + 1, true); }
  }
}
// Đặt tự gửi lại email lỗi mỗi 15 phút (chạy MỘT lần; cần cấp thêm quyền quản lý trigger). Không tạo trigger thứ hai nếu đã có.
function taoLichGuiLaiEmail() {
  var co = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'guiLaiEmailLoi'; });
  if (!co) ScriptApp.newTrigger('guiLaiEmailLoi').timeBased().everyMinutes(15).create();
}
function chu_(v) { return String(v == null ? '' : v).replace(/^'/, ''); }
function ngayChu_(v) { return Object.prototype.toString.call(v) === '[object Date]' ? Utilities.formatDate(v, CAU_HINH.MUI_GIO, 'yyyy-MM-dd') : chu_(v); }
function gioChu_(v) { return Object.prototype.toString.call(v) === '[object Date]' ? Utilities.formatDate(v, CAU_HINH.MUI_GIO, 'HH:mm') : chu_(v); }
function duTuDong_(r) {
  var loai = chu_(r[c_('Loài') - 1]), khac = /^Khác \((.*)\)$/.exec(loai);
  return {
    ten_khach: chu_(r[c_('Tên khách hàng') - 1]), dien_thoai: chu_(r[c_('Số điện thoại') - 1]), ten_thu_cung: chu_(r[c_('Tên thú cưng') - 1]),
    loai: khac ? 'Khác' : loai, loai_khac: khac ? khac[1] : '', dich_vu: chu_(r[c_('Dịch vụ') - 1]), ngay: ngayChu_(r[c_('Ngày mong muốn / gửi') - 1]), gio: gioChu_(r[c_('Giờ') - 1]),
    ngay_don: ngayChu_(r[c_('Ngày đón dự kiến') - 1]), gio_don: gioChu_(r[c_('Giờ đón') - 1]), can_nang: chu_(r[c_('Cân nặng') - 1]), ghi_chu: chu_(r[c_('Ghi chú') - 1]),
    hoa_don: chu_(r[c_('Hoá đơn tham khảo') - 1]), tong_tam_tinh: chu_(r[c_('Tổng tạm tính') - 1]), can_kiem_tra: chu_(r[c_('Cần kiểm tra') - 1]) ? [chu_(r[c_('Cần kiểm tra') - 1])] : []
  };
}

// Cắt độ dài và chặn công thức (ô bắt đầu bằng = + - @) để an toàn khi mở bằng Google Sheets
function sach_(v, max) {
  var s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function traLoi_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Chạy hàm này MỘT lần trong trình soạn script để cấp quyền và thử gửi email. Ghi một dòng thử vào trang tính (có thể xoá).
function thuNghiem() {
  var mai = Utilities.formatDate(new Date(Date.now() + 86400000), CAU_HINH.MUI_GIO, 'yyyy-MM-dd');
  var kq = doPost({ postData: { contents: JSON.stringify({ ma_yeu_cau: 'thu-nghiem-' + Date.now(), ten_khach: 'Thử nghiệm', dien_thoai: '0912345678', ten_thu_cung: 'Bé thử', loai: 'Chó', loai_khac: '', dich_vu: 'Khám và chẩn đoán', ngay: mai, gio: '09:00', ngay_don: '', ghi_chu: 'Dòng thử, có thể xoá', nguon: '/thu-nghiem', website: '' }) } });
  Logger.log(kq.getContent());
}
