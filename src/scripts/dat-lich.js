// Biểu mẫu đặt lịch mới: kiểm tra dữ liệu, trường phụ thuộc, trạng thái gửi / đã nhận / thất bại, chống gửi trùng.
// Chế độ (data-mode trên <form>):
//   'gia-lap' : KHÔNG gửi gì đi (không fetch, không XHR, không beacon). Không bao giờ hiện câu "Đã nhận yêu cầu".
//   'that'    : gửi JSON tới data-endpoint. Chỉ hiện "Đã nhận yêu cầu đặt lịch…" khi máy chủ trả { ok: true, ma } đọc được.
// Không bao giờ nói "lịch đã được xác nhận": lịch chỉ được xác nhận khi nhân viên liên hệ.
(function () {
  var form = document.getElementById('form-dat-lich'); if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var mode = form.dataset.mode === 'that' ? 'that' : 'gia-lap';
  var diaChi = form.dataset.endpoint || '', thoiGianCho = parseInt(form.dataset.cho, 10) || 15000;
  var sdtBV = form.dataset.sdt || '', telBV = form.dataset.tel || '';
  var gui = $('m-gui'), chuNut = gui.querySelector('.nut-chu'), chu = $('form-chu'), tb = $('dl-thong-bao'), the = $('dl-nhan');
  var itChuyenDong = window.matchMedia('(prefers-reduced-motion: reduce)');
  var THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  var hai = function (n) { return (n < 10 ? '0' : '') + n; };
  // "Hôm nay" theo giờ Việt Nam (UTC+7), không phụ thuộc múi giờ của máy khách
  var vn = new Date(Date.now() + 7 * 3600000), homNay = new Date(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate());
  var ddmmyyyy = function (d) { return hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + '/' + d.getFullYear(); };
  var ngayMai = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() + 1);
  $('m-ngay-vi-du').textContent = ', ví dụ ' + ddmmyyyy(ngayMai);

  function docNgay(v) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim());
    if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? d : 'sai';
  }
  var isoCua = function (d) { return d.getFullYear() + '-' + hai(d.getMonth() + 1) + '-' + hai(d.getDate()); };
  var ngayHopLe = function (id) { var d = docNgay($(id).value); return d && d !== 'sai' ? d : null; };

  // Ô ngày dd/mm/yyyy + nút lịch + ô lịch ẩn (dùng cho "Ngày mong muốn" và "Ngày đón dự kiến")
  function ganNgay(id, ngayNhoNhat) {
    var o = $(id), an = $(id + '-an');
    var datMin = function () { an.min = isoCua(ngayNhoNhat()); };
    datMin();
    function dongBo() { var d = docNgay(o.value); datMin(); an.value = d && d !== 'sai' && d >= ngayNhoNhat() ? isoCua(d) : ''; }
    function hienVn() {
      var d = docNgay(o.value), ok = d && d !== 'sai';
      $(id + '-vn').textContent = ok ? 'Ngày đã chọn: ' + THU[d.getDay()] + ', ' + o.value.trim() : '';
      $(id + '-goi').hidden = !!ok;
    }
    o.addEventListener('input', function () {
      var so = o.value.replace(/\D/g, '').slice(0, 8), v = so;
      if (so.length > 4) v = so.slice(0, 2) + '/' + so.slice(2, 4) + '/' + so.slice(4);
      else if (so.length > 2) v = so.slice(0, 2) + '/' + so.slice(2);
      if (v !== o.value) o.value = v;
      hienVn(); dongBo();
    });
    $(id + '-lich').addEventListener('click', function () {
      dongBo();
      try { if (an.showPicker) { an.showPicker(); return; } } catch (e) { /* trình duyệt không hỗ trợ */ }
      o.focus();
    });
    an.addEventListener('change', function () {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(an.value); if (!m) return;
      o.value = m[3] + '/' + m[2] + '/' + m[1];
      hienVn(); kiemTra(id, true); o.dispatchEvent(new Event('ngay-doi')); capNhatNut();
      o.focus();
    });
    return { dongBo: dongBo };
  }
  ganNgay('m-ngay', function () { return homNay; });
  var ngayDon = ganNgay('m-ngay-don', function () { var g = ngayHopLe('m-ngay'); return g && g > homNay ? g : homNay; });

  // ---- Trường phụ thuộc: "Loài thú cưng" khi chọn Khác; "Ngày đón dự kiến" khi chọn dịch vụ nội trú ----
  var laKhac = function () { var r = form.querySelector('input[name="m-loai"]:checked'); return !!r && r.value === 'khac'; };
  var laNoiTru = function () { var o = $('m-dv').selectedOptions[0]; return !!o && o.hasAttribute('data-noi-tru'); };
  function batTruong(hop, o, bat) {
    hop.hidden = !bat; o.required = bat;
    if (!bat) { hop.classList.remove('co-loi', 'hop-le'); o.removeAttribute('aria-invalid'); $(o.id + '-loi').innerHTML = ''; }
  }
  function capNhatPhuThuoc() {
    batTruong($('o-loai-khac'), $('m-loai-khac'), laKhac());
    var nt = laNoiTru();
    batTruong($('o-ngay-don'), $('m-ngay-don'), nt);
    $('m-ngay-nhan').textContent = nt ? 'Ngày gửi thú cưng' : 'Ngày mong muốn';
    $('m-ngay-goi-ten').textContent = nt ? 'Ngày gửi: ngày/tháng/năm' : 'Ngày/tháng/năm';
  }

  var luat = {
    'm-ten': function (v) { return v.trim() ? '' : 'Vui lòng nhập tên khách hàng.'; },
    'm-sdt': function (v) { var s = v.replace(/[\s.\-]/g, ''); return !s ? 'Vui lòng nhập số điện thoại.' : /^(0|\+84)\d{9}$/.test(s) ? '' : 'Số điện thoại gồm 10 số, ví dụ 0912 345 678.'; },
    'm-thu': function (v) { return v.trim() ? '' : 'Vui lòng nhập tên thú cưng.'; },
    'm-dv': function (v) { return v ? '' : 'Vui lòng chọn dịch vụ.'; },
    'm-loai-khac': function (v) { return !laKhac() || v.trim() ? '' : 'Vui lòng nhập loài thú cưng (ví dụ: thỏ, hamster, chim).'; },
    'm-ngay': function (v) {
      if (!v.trim()) return laNoiTru() ? 'Vui lòng nhập ngày gửi thú cưng (ngày/tháng/năm).' : 'Vui lòng nhập ngày mong muốn (ngày/tháng/năm).';
      var d = docNgay(v);
      if (!d) return 'Nhập theo dạng ngày/tháng/năm, ví dụ ' + ddmmyyyy(ngayMai) + '.';
      if (d === 'sai') return 'Ngày này không tồn tại.';
      return d < homNay ? 'Vui lòng chọn từ hôm nay trở đi.' : '';
    },
    'm-ngay-don': function (v) {
      if (!laNoiTru()) return '';
      if (!v.trim()) return 'Vui lòng nhập ngày đón dự kiến (ngày/tháng/năm).';
      var d = docNgay(v);
      if (!d) return 'Nhập theo dạng ngày/tháng/năm, ví dụ ' + ddmmyyyy(ngayMai) + '.';
      if (d === 'sai') return 'Ngày này không tồn tại.';
      if (d < homNay) return 'Vui lòng chọn từ hôm nay trở đi.';
      var g = ngayHopLe('m-ngay');
      return g && d < g ? 'Ngày đón không được trước ngày gửi (' + $('m-ngay').value.trim() + ').' : '';
    },
    'm-gio': function (v) {
      if (!v) return 'Vui lòng chọn giờ mong muốn.';
      return /^\d{2}:\d{2}$/.test(v) && v >= '08:00' && v <= '21:00' ? '' : 'Giờ trong khoảng 8:00 – 21:00.';
    },
  };
  var icLoi = '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
  function kiemTra(id, hienLoi) {
    var o = $(id), loi = luat[id](o.value);
    if (hienLoi) {
      var hop = o.closest('.o');
      hop.classList.toggle('co-loi', !!loi);
      hop.classList.toggle('hop-le', !loi && !!o.value.trim());
      o.setAttribute('aria-invalid', String(!!loi));
      var vung = $(id + '-loi'); vung.textContent = ''; // textContent: không chèn HTML từ dữ liệu
      if (loi) { vung.insertAdjacentHTML('afterbegin', icLoi); var s = document.createElement('span'); s.textContent = loi; vung.appendChild(s); }
    }
    return !loi;
  }

  // ---------- Trạng thái ----------
  // nhap → dang-gui → da-nhan (chỉ chế độ 'that' khi máy chủ xác nhận) | that-bai (máy chủ trả lỗi đọc được) | chua-xac-nhan (quá thời gian / không đọc được phản hồi)
  var trangThai = 'nhap', dangGui = false, lanGui = null; // lanGui = { ma, dauVan } của lần gửi gần nhất chưa nhận
  var LOI = {
    thieu: 'Điền các ô có dấu * để gửi yêu cầu.',
    sai: 'Kiểm tra lại các ô đang báo đỏ.',
    du: mode === 'gia-lap' ? 'Đã đủ thông tin. Đây là bản thử: bấm nút sẽ không gửi dữ liệu đi đâu.' : 'Đã đủ thông tin. Bấm nút để gửi yêu cầu cho bệnh viện.',
    dangGui: 'Đang gửi yêu cầu… Vui lòng không đóng trang.',
  };
  function datNut(t) {
    gui.classList.toggle('dang-gui', t === 'dang-gui');
    if (t === 'dang-gui') { gui.disabled = true; gui.setAttribute('aria-busy', 'true'); chuNut.textContent = 'Đang gửi…'; }
    else { gui.removeAttribute('aria-busy'); chuNut.textContent = (t === 'that-bai' || t === 'chua-xac-nhan') ? 'Gửi lại' : 'Gửi yêu cầu đặt lịch'; }
  }
  function khoaTruong(khoa) { Array.prototype.forEach.call(form.querySelectorAll('fieldset'), function (f) { f.disabled = khoa; }); }
  function capNhatNut() {
    if (dangGui) return;
    var du = Object.keys(luat).every(function (id) { return kiemTra(id, false); });
    gui.disabled = !du;
    chu.classList.remove('ok');
    chu.textContent = du ? LOI.du : form.querySelector('.o.co-loi') ? LOI.sai : LOI.thieu;
  }
  function anThongBao() { tb.hidden = true; tb.textContent = ''; }
  function hienThongBao(cacDoan, loai) {
    tb.textContent = ''; tb.className = 'dl-thong-bao ' + loai;
    var p = document.createElement('p'); cacDoan.forEach(function (d) { if (typeof d === 'string') p.appendChild(document.createTextNode(d)); else p.appendChild(d); });
    tb.appendChild(p); tb.hidden = false; tb.focus();
  }
  var goiLink = function () { var a = document.createElement('a'); a.href = 'tel:' + telBV; a.textContent = sdtBV; return a; };

  // Mã yêu cầu: sinh một lần cho một nội dung; gửi lại cùng nội dung thì dùng lại mã (máy chủ bỏ qua mã đã có). Đổi nội dung → mã mới.
  function sinhMa() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* dùng cách dự phòng */ }
    var b = new Uint8Array(16); try { crypto.getRandomValues(b); } catch (e) { for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function chuanSdt(v) { var s = v.replace(/[\s.\-()]/g, ''); if (s.indexOf('+84') === 0) s = '0' + s.slice(3); return s; }
  function layDuLieu() {
    var nt = laNoiTru(), dvOpt = $('m-dv').selectedOptions[0], loai = form.querySelector('input[name="m-loai"]:checked').value;
    var g = ngayHopLe('m-ngay'), d = nt ? ngayHopLe('m-ngay-don') : null;
    return {
      ten_khach: $('m-ten').value.trim(), dien_thoai: chuanSdt($('m-sdt').value), ten_thu_cung: $('m-thu').value.trim(),
      loai: loai === 'cho' ? 'Chó' : loai === 'meo' ? 'Mèo' : 'Khác', loai_khac: laKhac() ? $('m-loai-khac').value.trim() : '',
      dich_vu: dvOpt.textContent.trim(), dich_vu_ma: dvOpt.value, ngay: isoCua(g), gio: $('m-gio').value, ngay_don: d ? isoCua(d) : '',
      ghi_chu: $('m-ghi').value.trim(), website: '',
    };
  }
  var dd = function (iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };

  // ---------- Thẻ kết quả ----------
  function dong(dl, nhan, giaTri) { if (!giaTri) return; var r = document.createElement('div'), a = document.createElement('dt'), b = document.createElement('dd'); a.textContent = nhan; b.textContent = giaTri; r.appendChild(a); r.appendChild(b); dl.appendChild(r); }
  function hienThe(tieuDe, doan, du, ma, nutChu) {
    the.textContent = ''; the.className = 'dl-nhan ' + (mode === 'that' ? 'that' : 'gia-lap');
    var h = document.createElement('h3'); h.textContent = tieuDe; the.appendChild(h);
    doan.forEach(function (t) { var p = document.createElement('p'); if (typeof t === 'string') p.textContent = t; else p.appendChild(t); the.appendChild(p); });
    if (ma) { var pm = document.createElement('p'); pm.className = 'dl-ma'; pm.appendChild(document.createTextNode('Mã yêu cầu: ')); var bb = document.createElement('b'); bb.textContent = ma; pm.appendChild(bb); the.appendChild(pm); }
    var dl = document.createElement('dl'); dl.className = 'dl-tom-tat';
    dong(dl, 'Khách hàng', du.ten_khach + ' · ' + du.dien_thoai); dong(dl, 'Thú cưng', du.ten_thu_cung + ' (' + (du.loai === 'Khác' ? du.loai_khac : du.loai) + ')');
    dong(dl, 'Dịch vụ', du.dich_vu); dong(dl, du.ngay_don ? 'Ngày gửi' : 'Ngày mong muốn', dd(du.ngay) + ' lúc ' + du.gio); dong(dl, 'Ngày đón dự kiến', dd(du.ngay_don)); dong(dl, 'Ghi chú', du.ghi_chu);
    the.appendChild(dl);
    var nut = document.createElement('button'); nut.type = 'button'; nut.className = 'nut nut-vien'; nut.id = 'dl-lam-lai'; nut.textContent = nutChu; the.appendChild(nut);
    nut.addEventListener('click', lamLai);
    form.hidden = true; the.hidden = false; the.focus();
  }
  function lamLai() {
    form.reset(); lanGui = null; trangThai = 'nhap'; dangGui = false;
    Array.prototype.forEach.call(form.querySelectorAll('.o'), function (o) { o.classList.remove('co-loi', 'hop-le'); });
    Array.prototype.forEach.call(form.querySelectorAll('.o-loi'), function (e) { e.textContent = ''; });
    ['m-ngay', 'm-ngay-don'].forEach(function (id) { $(id + '-vn').textContent = ''; $(id + '-goi').hidden = false; });
    anThongBao(); datNut('nhap'); capNhatPhuThuoc(); capNhatNut();
    the.hidden = true; the.textContent = ''; form.hidden = false; $('m-ten').focus();
  }

  // ---------- Gửi ----------
  function thatBai(loai, loiMay) {
    trangThai = loai; dangGui = false; khoaTruong(false); datNut(loai); gui.disabled = false;
    chu.classList.remove('ok'); chu.textContent = '';
    var doan = loai === 'that-bai'
      ? ['Chưa gửi được yêu cầu' + (loiMay ? ': ' + loiMay : '') + '. Thông tin bạn nhập vẫn còn nguyên. Bấm “Gửi lại”, hoặc gọi ', goiLink(), '.']
      : ['Chưa nhận được xác nhận từ bệnh viện, nên yêu cầu có thể chưa được gửi. Thông tin bạn nhập vẫn còn nguyên: bấm “Gửi lại” (hệ thống tránh tạo lịch trùng) hoặc gọi ', goiLink(), '.'];
    hienThongBao(doan, 'loi');
  }
  function daNhan(ma, du) {
    trangThai = 'da-nhan'; dangGui = false; khoaTruong(false); datNut('da-nhan'); anThongBao(); lanGui = null;
    var ghi = document.createElement('span');
    ghi.appendChild(document.createTextNode('Lịch hẹn chỉ được xác nhận sau khi nhân viên liên hệ với bạn. Cần gấp? Gọi ')); ghi.appendChild(goiLink()); ghi.appendChild(document.createTextNode('.'));
    hienThe('Đã nhận yêu cầu đặt lịch, bệnh viện sẽ liên hệ xác nhận.', [ghi], du, ma, 'Gửi yêu cầu khác');
  }
  function xuLyPhanHoi(r, du) {
    var j = null; try { j = JSON.parse(r.text); } catch (e) { j = null; }
    if (j && j.ok === true && typeof j.ma === 'string' && j.ma) return daNhan(j.ma.slice(0, 40), du);
    if (j && j.ok === false) return thatBai('that-bai', typeof j.loi === 'string' ? j.loi.slice(0, 160) : '');
    return thatBai('chua-xac-nhan'); // phản hồi không đọc được hoặc không đúng hợp đồng: KHÔNG báo thành công
  }
  function guiThat(du) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null, hen = setTimeout(function () { if (ctl) ctl.abort(); else thatBai('chua-xac-nhan'); }, thoiGianCho), xong = false;
    var ketThuc = function (f) { if (xong) return; xong = true; clearTimeout(hen); f(); };
    fetch(diaChi, { method: 'POST', body: JSON.stringify(du), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl ? ctl.signal : undefined, redirect: 'follow' })
      .then(function (res) { return res.text().then(function (t) { return { status: res.status, text: t }; }); })
      .then(function (r) { ketThuc(function () { xuLyPhanHoi(r, du); }); })
      .catch(function () { ketThuc(function () { thatBai('chua-xac-nhan'); }); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // luôn chặn gửi mặc định của trình duyệt: dữ liệu chỉ đi qua đường dưới đây
    if (dangGui || trangThai === 'da-nhan') return; // chặn gửi lặp (bấm nhanh, Enter lặp)
    var sai = Object.keys(luat).filter(function (id) { return !kiemTra(id, true); });
    if (sai.length) { capNhatNut(); $(sai[0]).focus(); return; }
    if ($('m-web').value) return; // ô bẫy chống tin rác: không gửi, không báo gì
    var du = layDuLieu(), dau = JSON.stringify(du);
    if (!lanGui || lanGui.dauVan !== dau) lanGui = { ma: sinhMa(), dauVan: dau }; // đổi nội dung → mã mới; gửi lại y nguyên → dùng lại mã
    du.ma_yeu_cau = lanGui.ma; du.nguon = location.pathname; du.gui_luc = new Date().toISOString();
    dangGui = true; trangThai = 'dang-gui'; anThongBao(); datNut('dang-gui');
    chu.classList.remove('ok'); chu.textContent = LOI.dangGui; khoaTruong(true);
    if (mode === 'gia-lap') {
      // Giả lập: không có yêu cầu mạng nào. Không có câu "Đã nhận yêu cầu".
      setTimeout(function () {
        dangGui = false; khoaTruong(false); datNut('nhap'); trangThai = 'nhap'; lanGui = null;
        hienThe('Hoàn tất giả lập', ['Đây là bản xem trước: yêu cầu CHƯA được gửi đi đâu và chưa có lịch hẹn nào được xác nhận. Cần đặt lịch ngay, vui lòng gọi ' + sdtBV + ' hoặc nhắn Zalo.'], du, '', 'Làm lại');
      }, itChuyenDong.matches ? 0 : 700);
      return;
    }
    if (!diaChi) { thatBai('that-bai', 'biểu mẫu đang được kết nối'); return; }
    guiThat(du);
  });

  // ---------- Sự kiện ----------
  Object.keys(luat).forEach(function (id) {
    var o = $(id);
    o.addEventListener('blur', function () { kiemTra(id, true); capNhatNut(); });
    o.addEventListener('input', function () { if (o.closest('.o').classList.contains('co-loi')) kiemTra(id, true); capNhatNut(); });
    o.addEventListener('change', function () { kiemTra(id, true); capNhatNut(); });
  });
  form.addEventListener('change', function (e) {
    if (e.target.name !== 'm-loai' && e.target.id !== 'm-dv') return;
    capNhatPhuThuoc();
    if (e.target.id === 'm-dv' && ($('m-ngay').value.trim() || $('m-ngay').closest('.o').classList.contains('co-loi'))) kiemTra('m-ngay', true);
    capNhatNut();
  });
  function kiemLaiDon() { var o = $('m-ngay-don'); if (laNoiTru() && (o.value.trim() || o.closest('.o').classList.contains('co-loi'))) kiemTra('m-ngay-don', true); ngayDon.dongBo(); capNhatNut(); }
  ['input', 'blur', 'ngay-doi'].forEach(function (k) { $('m-ngay').addEventListener(k, kiemLaiDon); });
  // Đường dẫn /dat-lich/?nhom=<mã dịch vụ> (từ Bảng giá): chọn sẵn dịch vụ
  try { var nhom = new URLSearchParams(location.search).get('nhom'), opt = nhom && Array.prototype.filter.call($('m-dv').options, function (x) { return x.value === nhom; })[0]; if (opt) $('m-dv').value = opt.value; } catch (e) { /* bỏ qua */ }
  capNhatPhuThuoc(); capNhatNut();
})();
