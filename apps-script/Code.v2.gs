/**
 * ĐỀ XUẤT (CHƯA TRIỂN KHAI): nhận yêu cầu đặt lịch bản 2 cho biểu mẫu đặt lịch mới của web Bệnh viện thú y Lê Sơn.
 *
 * Khác bản cũ (Code.gs):
 *  - Trả JSON đọc được { ok: true, ma } để web chỉ báo "Đã nhận yêu cầu" khi THỰC SỰ đã lưu.
 *  - Chống trùng: cùng ma_yeu_cau (gửi lại sau lỗi mạng) thì không tạo dòng mới, trả lại mã cũ.
 *  - Kiểm tra lại toàn bộ dữ liệu phía máy chủ (tên, số điện thoại, tên thú cưng, loài, ngày, giờ, ngày đón không trước ngày gửi).
 *  - Vẫn có ô bẫy spam, khoá LockService, chặn công thức trong Google Sheet.
 *  - Vẫn nhận được biểu mẫu cũ (dạng form-urlencoded) để có thể quay lại biểu mẫu cũ mà không phải đổi script.
 *
 * Nơi nhận lịch (chủ dự án chọn, xem HUONG-DAN-NHAN-LICH.md): GUI_EMAIL và GHI_SHEET ở CAU_HINH bên dưới.
 * Cách cài: xem HUONG-DAN-NHAN-LICH.md. KHÔNG dán đè lên bản đang chạy khi chưa thử nghiệm.
 */
var CAU_HINH = {
  TEN_TRANG: 'Đặt lịch v2',     // trang tính ghi yêu cầu (cũng là "trang quản lý" cho nhân viên: cột Trạng thái)
  GUI_EMAIL: true,              // true: gửi email báo cho chủ tài khoản đã triển khai script; false: chỉ ghi trang tính
  GIO_MO: 8 * 60,               // 8:00
  GIO_DONG: 21 * 60,            // 21:00
  MUI_GIO: 'Asia/Ho_Chi_Minh'
};
var COT = ['Mã yêu cầu', 'Mã gửi từ trình duyệt', 'Thời gian nhận', 'Tên khách hàng', 'Số điện thoại', 'Tên thú cưng', 'Loài', 'Dịch vụ', 'Ngày mong muốn / gửi', 'Giờ', 'Ngày đón dự kiến', 'Ghi chú', 'Trạng thái', 'Nguồn'];

function doPost(e) {
  var du;
  try { du = docDuLieu_(e); } catch (err) { return traLoi_({ ok: false, loi: 'Dữ liệu gửi lên không đọc được.' }); }
  if (du.website) return traLoi_({ ok: false, loi: 'Yêu cầu bị từ chối.' }); // ô bẫy spam
  var loi = kiemTra_(du, new Date());
  if (loi) return traLoi_({ ok: false, loi: loi });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var ma, trung = false;
  try {
    var sh = layTrang_();
    var cu = timTheoMaGui_(sh, du.ma_yeu_cau);
    if (cu) { ma = cu; trung = true; }
    else {
      ma = taoMa_(du.ma_yeu_cau, new Date());
      sh.appendRow([ma, du.ma_yeu_cau, new Date(), du.ten_khach, "'" + du.dien_thoai, du.ten_thu_cung, du.loai === 'Khác' ? 'Khác (' + du.loai_khac + ')' : du.loai,
        du.dich_vu, du.ngay, du.gio, du.ngay_don, du.ghi_chu, 'Mới', du.nguon]);
    }
  } finally {
    lock.releaseLock();
  }
  if (!trung && CAU_HINH.GUI_EMAIL) {
    try { guiEmail_(ma, du); } catch (err) { /* email lỗi không làm mất yêu cầu đã lưu; nhân viên vẫn thấy dòng mới trong trang tính */ }
  }
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
      ma_yeu_cau: sach_(j.ma_yeu_cau, 64), ten_khach: sach_(j.ten_khach, 80), dien_thoai: chuanSdt_(j.dien_thoai), ten_thu_cung: sach_(j.ten_thu_cung, 60),
      loai: sach_(j.loai, 10), loai_khac: sach_(j.loai_khac, 40), dich_vu: sach_(j.dich_vu, 120), ngay: String(j.ngay || ''), gio: String(j.gio || ''),
      ngay_don: String(j.ngay_don || ''), ghi_chu: sach_(j.ghi_chu, 1000), nguon: sach_(j.nguon, 100), website: String(j.website || '')
    };
  }
  // Biểu mẫu cũ (form-urlencoded): ten, dien_thoai, thu_cung, dich_vu, ngay, gio, ghi_chu, can_nang, hoa_don
  var ma = 'cu-' + Utilities.getUuid();
  return {
    ma_yeu_cau: ma, ten_khach: sach_(p.ten, 80), dien_thoai: chuanSdt_(p.dien_thoai), ten_thu_cung: '(biểu mẫu cũ: không có)',
    loai: /^Chó/.test(p.thu_cung || '') ? 'Chó' : /^Mèo/.test(p.thu_cung || '') ? 'Mèo' : 'Khác', loai_khac: sach_(String(p.thu_cung || '').replace(/^Khác \((.*)\)$/, '$1'), 40),
    dich_vu: sach_(p.dich_vu, 120), ngay: String(p.ngay || ''), gio: String(p.gio || ''), ngay_don: '',
    ghi_chu: sach_(p.ghi_chu, 1000) + (p.can_nang ? ' · Cân nặng: ' + sach_(p.can_nang, 30) : ''), nguon: 'biểu mẫu cũ', website: String(p.website || '')
  };
}

function chuanSdt_(v) { var s = String(v || '').replace(/[\s.\-()]/g, ''); return s.indexOf('+84') === 0 ? '0' + s.slice(3) : s; }

function ngayDung_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if (!m) return null;
  var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null;
}

// Trả chuỗi lỗi (tiếng Việt, hiện cho khách) hoặc '' nếu hợp lệ. now: để thử nghiệm.
function kiemTra_(du, now) {
  if (!/^[A-Za-z0-9\-]{8,64}$/.test(du.ma_yeu_cau)) return 'Thiếu mã yêu cầu.';
  if (!du.ten_khach) return 'Thiếu tên khách hàng.';
  if (!/^0\d{9,10}$/.test(du.dien_thoai)) return 'Số điện thoại chưa đúng.';
  if (!du.ten_thu_cung) return 'Thiếu tên thú cưng.';
  if (['Chó', 'Mèo', 'Khác'].indexOf(du.loai) < 0) return 'Loài thú cưng chưa đúng.';
  if (du.loai === 'Khác' && !du.loai_khac) return 'Thiếu loài thú cưng.';
  if (!du.dich_vu) return 'Thiếu dịch vụ.';
  var ngay = ngayDung_(du.ngay);
  if (!ngay) return 'Ngày chưa đúng.';
  var vn = new Date(now.getTime() + 7 * 3600000), homNay = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  if (ngay < homNay) return 'Ngày phải từ hôm nay trở đi.';
  if (!/^\d{2}:\d{2}$/.test(du.gio)) return 'Giờ chưa đúng.';
  var phut = parseInt(du.gio.slice(0, 2), 10) * 60 + parseInt(du.gio.slice(3), 10);
  if (phut < CAU_HINH.GIO_MO || phut > CAU_HINH.GIO_DONG) return 'Giờ nhận lịch từ 8:00 đến 21:00.';
  if (/nội trú/i.test(du.dich_vu) && !du.ngay_don) return 'Thiếu ngày đón dự kiến.';
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
// Mã gửi từ trình duyệt đã có dòng trong trang tính thì trả lại mã yêu cầu cũ (chống trùng khi khách bấm "Gửi lại")
function timTheoMaGui_(sh, maGui) {
  var n = sh.getLastRow(); if (n < 2) return '';
  var v = sh.getRange(2, 1, n - 1, 2).getValues();
  for (var i = 0; i < v.length; i++) if (String(v[i][1]) === maGui) return String(v[i][0]);
  return '';
}
// Mã dễ đọc cho khách và nhân viên: LS-yymmdd-xxxx, xxxx lấy từ mã gửi (cùng mã gửi → cùng mã yêu cầu)
function taoMa_(maGui, now) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, maGui), hex = '';
  for (var i = 0; i < 2; i++) hex += ('0' + (b[i] < 0 ? b[i] + 256 : b[i]).toString(16)).slice(-2);
  return 'LS-' + Utilities.formatDate(now, CAU_HINH.MUI_GIO, 'yyMMdd') + '-' + hex.toUpperCase();
}
function guiEmail_(ma, du) {
  var d = du.ngay.split('-');
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Lịch mới ' + ma + ': ' + du.ten_khach + ' – ' + d[2] + '/' + d[1] + ' lúc ' + du.gio,
    body: 'Có yêu cầu đặt lịch mới trên web (mã ' + ma + '):\n\n' +
      'Khách hàng: ' + du.ten_khach + '\nSố điện thoại: ' + du.dien_thoai +
      '\nThú cưng: ' + du.ten_thu_cung + ' (' + (du.loai === 'Khác' ? du.loai_khac : du.loai) + ')' +
      '\nDịch vụ: ' + du.dich_vu + '\nNgày: ' + d[2] + '/' + d[1] + '/' + d[0] + '\nGiờ: ' + du.gio +
      (du.ngay_don ? '\nNgày đón dự kiến: ' + du.ngay_don.split('-').reverse().join('/') : '') +
      '\nGhi chú: ' + (du.ghi_chu || '(không có)') +
      '\n\nNhớ liên hệ khách để xác nhận lịch. Danh sách đầy đủ: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });
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
