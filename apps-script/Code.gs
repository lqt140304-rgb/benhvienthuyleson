/**
 * Nhận form đặt lịch từ web Bệnh viện thú y Lê Sơn.
 * - Lưu mỗi yêu cầu thành một dòng trong trang tính "Đặt lịch"
 * - Gửi email báo cho chủ tài khoản Google đã triển khai script này
 *
 * Cách cài: xem HUONG-DAN.md, bước 2.
 */
var TEN_TRANG = 'Đặt lịch';
var COT = ['Thời gian gửi', 'Tên chủ nuôi', 'Số điện thoại', 'Thú cưng', 'Dịch vụ', 'Ngày muốn đến', 'Giờ muốn đến', 'Ghi chú', 'Trạng thái', 'Cân nặng', 'Hoá đơn tham khảo', 'Tổng tạm tính'];

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website) return traLoi_('ok'); // ô bẫy spam

  var ten = sach_(p.ten, 80);
  var dt = String(p.dien_thoai || '').replace(/[\s.\-()]/g, '').replace(/^\+84/, '0');
  var gio = String(p.gio || '');
  var ngay = String(p.ngay || '');

  if (!ten || !/^0\d{9,10}$/.test(dt) || !/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !/^\d{2}:\d{2}$/.test(gio)) {
    return traLoi_('loi');
  }
  var phut = parseInt(gio.slice(0, 2), 10) * 60 + parseInt(gio.slice(3), 10);
  if (phut < 8 * 60 || phut > 21 * 60) return traLoi_('ngoai-gio');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(TEN_TRANG) || ss.insertSheet(TEN_TRANG);
    if (sh.getLastRow() === 0) { sh.appendRow(COT); sh.setFrozenRows(1); }
    else if (sh.getLastColumn() < COT.length) { sh.getRange(1, 1, 1, COT.length).setValues([COT]); } // sheet cũ: thêm tiêu đề cột mới
    var dong = [new Date(), ten, "'" + dt, sach_(p.thu_cung, 20), sach_(p.dich_vu, 120), ngay, gio, sach_(p.ghi_chu, 1000), 'Mới',
      sach_(p.can_nang, 30), sach_(p.hoa_don, 1000), sach_(p.tong_tam_tinh, 60)];
    sh.appendRow(dong);
  } finally {
    lock.releaseLock();
  }

  var d = ngay.split('-');
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Lịch mới: ' + ten + ' – ' + d[2] + '/' + d[1] + ' lúc ' + gio,
    body: 'Có yêu cầu đặt lịch mới trên web:\n\n' +
      'Tên chủ nuôi: ' + ten + '\nSố điện thoại: ' + dt + '\nThú cưng: ' + sach_(p.thu_cung, 20) +
      '\nDịch vụ: ' + sach_(p.dich_vu, 120) + (p.can_nang ? ' · ' + sach_(p.can_nang, 30) : '') +
      '\nNgày: ' + d[2] + '/' + d[1] + '/' + d[0] + '\nGiờ: ' + gio +
      '\nGhi chú: ' + (sach_(p.ghi_chu, 1000) || '(không có)') +
      (p.hoa_don ? '\n\nHoá đơn tham khảo khách đã xem:\n' + sach_(p.hoa_don, 1000) + '\nTổng tạm tính: ' + sach_(p.tong_tam_tinh, 60) : '') +
      '\n\nNhớ gọi lại để xác nhận. Danh sách đầy đủ: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });
  return traLoi_('ok');
}

// Cắt độ dài và chặn công thức (ô bắt đầu bằng = + - @) để an toàn khi mở bằng Google Sheets
function sach_(v, max) {
  var s = String(v || '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function traLoi_(t) {
  return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.TEXT);
}

// Chạy hàm này một lần trong trình soạn script để cấp quyền và thử gửi email.
function thuNghiem() {
  doPost({ parameter: { ten: 'Thử nghiệm', dien_thoai: '0912345678', thu_cung: 'Chó', dich_vu: 'Tắm – Chó lông ngắn', can_nang: '3 – 5 kg', ngay: '2030-01-01', gio: '09:00', ghi_chu: 'Dòng thử, có thể xoá', hoa_don: 'Tắm – Chó lông ngắn · 3 – 5 kg: 120.000đ', tong_tam_tinh: '120.000đ' } });
}
