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
 * Nơi nhận lịch: ĐÃ CHỐT 11/10/2026 = CẢ HAI (email báo + trang tính làm "trang quản lý"), tức GUI_EMAIL: true ở CAU_HINH. Trang tính luôn được ghi (và để chống trùng).
 * Đã quyết định BỎ hoá đơn tham khảo và phụ phí tự động; biểu mẫu mới không gửi các trường đó (chỉ còn nhận từ biểu mẫu cũ để quay lại được).
 *
 * GĐ3 v2b (sửa 2 lỗi):
 *  - Trang tính CŨ không còn bị lệch cột: cột được tìm theo TÊN tiêu đề (kể cả tên cũ của Code.gs: "Tên chủ nuôi", "Thời gian gửi", "Thú cưng"…),
 *    cột còn thiếu được THÊM VÀO CUỐI. Không bao giờ ghi đè, dời hay xoá ô/dòng/tiêu đề đã có. Dòng mới được ghi đúng cột theo tên.
 *  - Gửi lại email không còn trùng: mỗi dòng được "giữ chỗ" (Email báo = "ĐANG GỬI <giờ>") trong khoá TRƯỚC khi gửi; lần chạy khác thấy dòng đang gửi thì bỏ qua.
 *    Kết quả được ghi theo Mã yêu cầu (không theo số dòng, nên nhân viên chèn/xoá dòng cũng không ghi nhầm). Giữ chỗ quá CHO_GUI_PHUT phút mà không có kết quả thì coi là treo và mới được thử lại.
 *  - Muốn thử trên Sheet RIÊNG trước khi dùng thật: chạy kiemTraTrenSheetRieng() (xem docs/BAT-CHE-DO-THAT.md).
 * Cách cài: xem HUONG-DAN-NHAN-LICH.md. KHÔNG dán đè lên bản đang chạy khi chưa thử nghiệm.
 */
var CAU_HINH = {
  TEN_TRANG: 'Đặt lịch v2',     // trang tính ghi yêu cầu (cũng là "trang quản lý" cho nhân viên: cột Trạng thái)
  GUI_EMAIL: true,              // true: gửi email báo cho chủ tài khoản đã triển khai script; false: chỉ ghi trang tính
  EMAIL_TOI_DA: 5,              // số lần thử gửi email cho một dòng (kể cả lần đầu)
  GIO_MO: 8 * 60,               // 8:00
  GIO_DONG: 21 * 60,            // 21:00
  MUI_GIO: 'Asia/Ho_Chi_Minh',
  CHO_GUI_PHUT: 5,              // dòng "ĐANG GỬI" quá số phút này mà chưa có kết quả thì coi là treo và được thử lại
  EMAIL_NHAN: '',               // địa chỉ nhận email báo (nhiều địa chỉ cách nhau bằng dấu phẩy). Để trống = chủ tài khoản đã triển khai script
  MAU_LOI_EMAIL: '#FDE3C8'      // màu nền dòng có email lỗi
};
var COT = ['Mã yêu cầu', 'Mã gửi từ trình duyệt', 'Thời gian nhận', 'Tên khách hàng', 'Số điện thoại', 'Tên thú cưng', 'Loài', 'Dịch vụ', 'Ngày mong muốn / gửi', 'Giờ',
  'Ngày đón dự kiến', 'Giờ đón', 'Cân nặng', 'Ghi chú', 'Hoá đơn tham khảo', 'Tổng tạm tính', 'Trạng thái', 'Cần kiểm tra', 'Email báo', 'Số lần gửi email', 'Nguồn'];

// Tên cũ (Code.gs bản đầu) → tên cột chuẩn của bản này. Chỉ dùng khi trang tính cũ chưa có cột trùng tên chuẩn.
var BIET_DANH_ = { 'tên chủ nuôi': 'Tên khách hàng', 'thời gian gửi': 'Thời gian nhận', 'thú cưng': 'Loài', 'ngày muốn đến': 'Ngày mong muốn / gửi', 'giờ muốn đến': 'Giờ' };

function doPost(e) {
  var du;
  try { du = docDuLieu_(e); } catch (err) { return traLoi_({ ok: false, loi: 'Dữ liệu gửi lên không đọc được.' }); }
  if (du.website) return traLoi_({ ok: false, loi: 'Yêu cầu bị từ chối.' }); // ô bẫy spam
  var loi = kiemTra_(du, new Date());
  if (loi) return traLoi_({ ok: false, loi: loi });

  var kq;
  try {
    kq = voiKhoa_(function () {
      var tr = moTrang_(), bang = docMa_(tr), cu = bang.theoGui[du.ma_yeu_cau];
      if (cu) return { ma: cu, trung: true };
      var ma = taoMaDuyNhat_(du.ma_yeu_cau, new Date(), bang.daDung);
      if (!ma) return { loi: 'Chưa tạo được mã yêu cầu, vui lòng thử lại.' };
      // "Giữ chỗ" gửi email NGAY khi ghi dòng (cùng một lần ghi, trong khoá): lần chạy khác thấy ĐANG GỬI thì không gửi lại
      var dung = CAU_HINH.GUI_EMAIL;
      ghiDong_(tr, {
        'Mã yêu cầu': ma, 'Mã gửi từ trình duyệt': "'" + du.ma_yeu_cau, 'Thời gian nhận': new Date(), 'Tên khách hàng': du.ten_khach, 'Số điện thoại': "'" + du.dien_thoai,
        'Tên thú cưng': du.ten_thu_cung, 'Loài': du.loai === 'Khác' ? 'Khác (' + du.loai_khac + ')' : du.loai, 'Dịch vụ': du.dich_vu, 'Ngày mong muốn / gửi': "'" + du.ngay, 'Giờ': "'" + du.gio,
        'Ngày đón dự kiến': du.ngay_don ? "'" + du.ngay_don : '', 'Giờ đón': du.gio_don ? "'" + du.gio_don : '', 'Cân nặng': du.can_nang, 'Ghi chú': du.ghi_chu,
        'Hoá đơn tham khảo': du.hoa_don, 'Tổng tạm tính': du.tong_tam_tinh, 'Trạng thái': 'Mới', 'Cần kiểm tra': du.can_kiem_tra.join('; '),
        'Email báo': dung ? giuCho_() : 'không dùng', 'Số lần gửi email': dung ? 1 : 0, 'Nguồn': du.nguon
      });
      return { ma: ma, trung: false, gui: dung };
    }, true);
  } catch (err) {
    return traLoi_({ ok: false, loi: 'Chưa lưu được yêu cầu, vui lòng thử lại sau ít phút.' });
  }
  if (kq.loi) return traLoi_({ ok: false, loi: kq.loi });
  if (kq.gui) thongBaoEmail_(kq.ma, du); // yêu cầu đã lưu; email lỗi KHÔNG làm mất yêu cầu nhưng được ghi lại để theo dõi
  return traLoi_({ ok: true, ma: kq.ma, trung: kq.trung });
}

// Chạy fn trong khoá của script. batBuoc: không lấy được khoá thì báo lỗi (dùng khi GHI DÒNG MỚI, tránh ghi trùng). Không bắt buộc: vẫn chạy (cập nhật trạng thái).
function voiKhoa_(fn, batBuoc) {
  var lock = LockService.getScriptLock(), co = false;
  try { lock.waitLock(10000); co = true; } catch (err) { if (batBuoc) throw new Error('khoá bận'); }
  try { return fn(); } finally { if (co) lock.releaseLock(); }
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

// ---------- Lưu trữ (cột theo TÊN tiêu đề, không theo vị trí) ----------
function chuanHoaTen_(s) {
  var t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
  return t.normalize ? t.normalize('NFC') : t;
}
// Mở (hoặc tạo) trang tính và trả { sh, map: tên cột chuẩn → số cột (từ 1), tong: số cột }.
// Trang trống: ghi tiêu đề chuẩn. Trang đã có dữ liệu: KHÔNG sửa tiêu đề/dòng nào, chỉ thêm cột còn thiếu vào CUỐI. Gọi trong khoá.
function moTrang_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CAU_HINH.TEN_TRANG) || ss.insertSheet(CAU_HINH.TEN_TRANG), map = {}, i;
  if (sh.getLastRow() === 0) {
    sh.appendRow(COT); sh.setFrozenRows(1);
    for (i = 0; i < COT.length; i++) map[COT[i]] = i + 1;
    return { sh: sh, map: map, tong: COT.length };
  }
  var cuoi = sh.getLastColumn(), tieuDe = cuoi > 0 ? sh.getRange(1, 1, 1, cuoi).getValues()[0] : [], theoTen = {}, daCo = {};
  for (i = 0; i < COT.length; i++) theoTen[chuanHoaTen_(COT[i])] = COT[i];
  for (i = 0; i < tieuDe.length; i++) { var ten = theoTen[chuanHoaTen_(tieuDe[i])]; if (ten && !map[ten]) { map[ten] = i + 1; daCo[i] = true; } } // 1) khớp đúng tên chuẩn
  for (i = 0; i < tieuDe.length; i++) { var bd = !daCo[i] && BIET_DANH_[chuanHoaTen_(tieuDe[i])]; if (bd && !map[bd]) { map[bd] = i + 1; daCo[i] = true; } } // 2) tên cũ
  var tong = cuoi;
  for (i = 0; i < COT.length; i++) if (!map[COT[i]]) { tong++; sh.getRange(1, tong).setValue(COT[i]); map[COT[i]] = tong; } // 3) cột còn thiếu: thêm vào cuối
  return { sh: sh, map: map, tong: tong };
}
function ghiDong_(tr, giaTri) {
  var hang = [], i;
  for (i = 0; i < tr.tong; i++) hang.push('');
  for (var ten in giaTri) if (tr.map[ten]) hang[tr.map[ten] - 1] = giaTri[ten];
  tr.sh.appendRow(hang);
}
function cotGiaTri_(tr, ten) {
  var n = tr.sh.getLastRow(); if (n < 2) return [];
  return tr.sh.getRange(2, tr.map[ten], n - 1, 1).getValues().map(function (x) { return String(x[0]); });
}
// Mã yêu cầu và mã gửi từ trình duyệt đã có: để chống trùng khi khách bấm "Gửi lại" và để mã tra cứu luôn duy nhất. Dòng cũ không có mã thì bỏ qua.
function docMa_(tr) {
  var theoGui = {}, daDung = {}, ma = cotGiaTri_(tr, 'Mã yêu cầu'), gui = cotGiaTri_(tr, 'Mã gửi từ trình duyệt');
  for (var i = 0; i < ma.length; i++) { if (!ma[i]) continue; daDung[ma[i]] = true; if (gui[i]) theoGui[gui[i]] = ma[i]; }
  return { theoGui: theoGui, daDung: daDung };
}
// Tìm số dòng THEO MÃ YÊU CẦU (không dựa vào số dòng đã nhớ: nhân viên có thể đã chèn/xoá dòng). 0 nếu không thấy.
function timHang_(tr, ma) { var v = cotGiaTri_(tr, 'Mã yêu cầu'); for (var i = 0; i < v.length; i++) if (v[i] === ma) return i + 2; return 0; }
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
function nguoiNhan_() { var t = String(CAU_HINH.EMAIL_NHAN || '').trim(); return t || Session.getEffectiveUser().getEmail(); }
function guiEmail_(ma, du) {
  var nd = noiDungEmail_(ma, du);
  MailApp.sendEmail({ to: nguoiNhan_(), subject: nd.subject, body: nd.body });
}
function giuCho_() { return 'ĐANG GỬI ' + new Date().toISOString(); }
function loiEmail_(err) { return 'LỖI: ' + sach_(err && err.message ? err.message : err, 150); }
// Ghi kết quả gửi cho dòng có mã này (tìm theo mã, trong khoá). Lỗi: tô màu dòng để nhân viên thấy; thành công: bỏ màu.
function capNhatEmail_(ma, trangThai, loi) {
  voiKhoa_(function () {
    var tr = moTrang_(), hang = timHang_(tr, ma); if (!hang) return;
    tr.sh.getRange(hang, tr.map['Email báo']).setValue(trangThai);
    tr.sh.getRange(hang, 1, 1, tr.tong).setBackground(loi ? CAU_HINH.MAU_LOI_EMAIL : null);
  }, false);
}
// Gửi email lần đầu cho dòng vừa ghi (đã được giữ chỗ trong doPost). Gửi NGOÀI khoá để không chặn các yêu cầu khác.
function thongBaoEmail_(ma, du) {
  var kq, loi = false;
  try { guiEmail_(ma, du); kq = 'đã gửi'; } catch (err) { kq = loiEmail_(err); loi = true; }
  try { capNhatEmail_(ma, kq, loi); } catch (err2) { /* không ghi được kết quả: dòng ở "ĐANG GỬI", sẽ được xử lý như dòng treo */ }
}
// Gửi lại email cho các dòng đang LỖI (tối đa EMAIL_TOI_DA lần mỗi dòng) và các dòng "ĐANG GỬI" bị treo quá CHO_GUI_PHUT phút.
// Chạy tay trong trình soạn script, hoặc đặt tự chạy bằng taoLichGuiLaiEmail(). An toàn khi nhiều lần chạy cùng lúc: dòng được GIỮ CHỖ trong khoá trước khi gửi.
function guiLaiEmailLoi() {
  if (!CAU_HINH.GUI_EMAIL) return;
  var viec;
  try { viec = voiKhoa_(function () {
    var tr = moTrang_(), n = tr.sh.getLastRow(), ds = []; if (n < 2) return ds;
    var v = tr.sh.getRange(2, 1, n - 1, tr.tong).getValues(), cE = tr.map['Email báo'], cL = tr.map['Số lần gửi email'], cM = tr.map['Mã yêu cầu'], bay = Date.now();
    for (var i = 0; i < v.length; i++) {
      var r = v[i], tt = String(r[cE - 1] == null ? '' : r[cE - 1]), soLan = parseInt(r[cL - 1], 10) || 0, ma = String(r[cM - 1] == null ? '' : r[cM - 1]), hang = i + 2;
      if (!ma) continue;
      if (tt.indexOf('ĐANG GỬI') === 0) {
        var t = Date.parse(tt.slice(8).trim());
        if (!isNaN(t) && bay - t < CAU_HINH.CHO_GUI_PHUT * 60000) continue; // đang có lần chạy khác gửi: bỏ qua
        if (soLan >= CAU_HINH.EMAIL_TOI_DA) { // treo và hết lượt thử: đánh dấu lỗi để nhân viên xem
          tr.sh.getRange(hang, cE).setValue('LỖI: không rõ kết quả gửi (quá ' + CAU_HINH.CHO_GUI_PHUT + ' phút)');
          tr.sh.getRange(hang, 1, 1, tr.tong).setBackground(CAU_HINH.MAU_LOI_EMAIL);
          continue;
        }
      } else if (tt.indexOf('LỖI') !== 0 || soLan >= CAU_HINH.EMAIL_TOI_DA) continue;
      tr.sh.getRange(hang, cE).setValue(giuCho_()); // giữ chỗ: lần chạy khác sẽ bỏ qua dòng này
      tr.sh.getRange(hang, cL).setValue(soLan + 1);
      ds.push({ ma: ma, du: duTuDong_(r, tr.map) });
    }
    return ds;
  }, true); } catch (errKhoa) { return; } // khoá đang bận: bỏ lượt này, lần chạy sau (15 phút) sẽ xử lý
  for (var k = 0; k < viec.length; k++) {
    var kq, loi = false;
    try { guiEmail_(viec[k].ma, viec[k].du); kq = 'đã gửi'; } catch (err) { kq = loiEmail_(err); loi = true; }
    try { capNhatEmail_(viec[k].ma, kq, loi); } catch (err2) { /* xem thongBaoEmail_ */ }
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
function duTuDong_(r, map) {
  var g = function (ten) { return map[ten] ? r[map[ten] - 1] : ''; };
  var loai = chu_(g('Loài')), khac = /^Khác \((.*)\)$/.exec(loai);
  return {
    ten_khach: chu_(g('Tên khách hàng')), dien_thoai: chu_(g('Số điện thoại')), ten_thu_cung: chu_(g('Tên thú cưng')),
    loai: khac ? 'Khác' : loai, loai_khac: khac ? khac[1] : '', dich_vu: chu_(g('Dịch vụ')), ngay: ngayChu_(g('Ngày mong muốn / gửi')), gio: gioChu_(g('Giờ')),
    ngay_don: ngayChu_(g('Ngày đón dự kiến')), gio_don: gioChu_(g('Giờ đón')), can_nang: chu_(g('Cân nặng')), ghi_chu: chu_(g('Ghi chú')),
    hoa_don: chu_(g('Hoá đơn tham khảo')), tong_tam_tinh: chu_(g('Tổng tạm tính')), can_kiem_tra: chu_(g('Cần kiểm tra')) ? [chu_(g('Cần kiểm tra'))] : []
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

// ---------- Thử trên Sheet RIÊNG (chạy tay MỘT lần, trên một Google Sheet THỬ, không phải Sheet thật) ----------
// Kiểm tra 3 điều trước khi bật chế độ 'that': (1) đúng MỘT dòng được lưu, (2) email tới đúng hộp thư, (3) gửi lại không tạo dòng/email trùng.
// Ghi ĐẠT / KHÔNG ĐẠT vào trang "Kết quả thử". Gửi 2 email thử thật (lần đầu + một lần sau khi giả lập lỗi). Dùng Sheet thử MỚI để số email đếm được chính xác.
function kiemTraTrenSheetRieng() {
  var kq = [], ma0 = 'thu-rieng-' + Date.now();
  var ghi = function (ten, dat, ct) { kq.push([dat ? 'ĐẠT' : 'KHÔNG ĐẠT', ten, String(ct == null ? '' : ct)]); };
  var mai = Utilities.formatDate(new Date(Date.now() + 86400000), CAU_HINH.MUI_GIO, 'yyyy-MM-dd');
  var gui = function () { return JSON.parse(doPost({ postData: { contents: JSON.stringify({ ma_yeu_cau: ma0, ten_khach: 'THỬ NGHIỆM (xoá được)', dien_thoai: '0912345678', ten_thu_cung: 'Bé thử', loai: 'Chó', loai_khac: '', dich_vu: 'Khám và chẩn đoán', ngay: mai, gio: '09:00', ngay_don: '', ghi_chu: 'Dòng thử tự động, xoá được', nguon: '/thu-rieng', website: '' }) } }).getContent()); };
  var soDong = function () { return voiKhoa_(function () { return cotGiaTri_(moTrang_(), 'Mã gửi từ trình duyệt').filter(function (x) { return x === ma0; }).length; }, false); };
  var hanMuc = function () { try { return MailApp.getRemainingDailyQuota(); } catch (err) { return null; } };
  var trangThaiEmail = function (ma) { return voiKhoa_(function () { var tr = moTrang_(), h = timHang_(tr, ma); return h ? String(tr.sh.getRange(h, tr.map['Email báo']).getValue()) : '(không thấy dòng)'; }, false); };
  var coEmail = CAU_HINH.GUI_EMAIL, q0 = hanMuc(), r1 = gui();
  ghi('Gửi lần đầu: trả ok và mã yêu cầu', r1.ok === true && !r1.trung && !!r1.ma, JSON.stringify(r1));
  ghi('Đúng MỘT dòng được lưu', soDong() === 1, soDong() + ' dòng');
  var q1 = hanMuc();
  if (coEmail && q0 != null && q1 != null) ghi('Đúng MỘT email được gửi (hạn mức email giảm đúng 1)', q0 - q1 === 1, 'giảm ' + (q0 - q1));
  var tt = trangThaiEmail(r1.ma);
  ghi('Cột "Email báo" ghi ' + (coEmail ? '"đã gửi"' : '"không dùng"'), tt === (coEmail ? 'đã gửi' : 'không dùng'), tt);
  var r2 = gui(), q2 = hanMuc();
  ghi('Gửi lại CÙNG mã: không tạo dòng mới, trả lại mã cũ (trung: true)', r2.ok === true && r2.trung === true && r2.ma === r1.ma && soDong() === 1, JSON.stringify(r2) + ' · ' + soDong() + ' dòng');
  if (q1 != null && q2 != null) ghi('Gửi lại KHÔNG gửi thêm email', q1 - q2 === 0, 'giảm ' + (q1 - q2));
  if (coEmail) {
    capNhatEmail_(r1.ma, 'LỖI: giả lập để thử gửi lại', true);
    var a = hanMuc(); guiLaiEmailLoi(); guiLaiEmailLoi(); var b = hanMuc();
    if (a != null && b != null) ghi('Gửi lại email lỗi 2 lần liên tiếp: chỉ gửi đúng MỘT email', a - b === 1, 'giảm ' + (a - b));
    ghi('Sau khi gửi lại: "Email báo" = "đã gửi"', trangThaiEmail(r1.ma) === 'đã gửi', trangThaiEmail(r1.ma));
  }
  ghi('Email báo được gửi tới địa chỉ này (tự mở hộp thư, tìm thư "Lịch mới ' + r1.ma + '")', true, nguoiNhan_());
  var ss = SpreadsheetApp.getActiveSpreadsheet(), kt = ss.getSheetByName('Kết quả thử') || ss.insertSheet('Kết quả thử');
  kt.appendRow(['Lúc', 'Kết quả', 'Mục', 'Chi tiết']);
  for (var i = 0; i < kq.length; i++) kt.appendRow([new Date(), kq[i][0], kq[i][1], kq[i][2]]);
  var hong = kq.filter(function (x) { return x[0] !== 'ĐẠT'; }).length;
  Logger.log(kq.map(function (x) { return '[' + x[0] + '] ' + x[1] + (x[2] ? ' → ' + x[2] : ''); }).join('\n') + '\nTổng: ' + (hong ? hong + ' KHÔNG ĐẠT' : 'tất cả ĐẠT') + '. Script không đọc được hộp thư: bạn tự mở để xác nhận email tới.');
  return { khongDat: hong };
}
