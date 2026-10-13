// Đặt lịch giao diện mới: biểu mẫu 4 bước, tóm tắt trực tiếp, lịch chọn ngày, chống gửi trùng. Dữ liệu CHỈ nằm trong biến của trang này
// (không localStorage / sessionStorage / cookie): đóng trang là mất, đúng yêu cầu "không lưu dữ liệu cá nhân ở máy khách".
// Chế độ (data-mode trên <form>, do src/lib/dat-lich.ts quyết định):
//   'gia-lap' : KHÔNG gửi gì đi (không fetch / XHR / beacon). Không bao giờ hiện câu "đã tiếp nhận".
//   'that'    : gửi JSON tới data-endpoint (Apps Script Code.v2.gs). Chỉ hiện "Yêu cầu đặt lịch đã được tiếp nhận!" khi máy chủ trả { ok: true, ma } đọc được.
// Không bao giờ nói "lịch đã được xác nhận": lịch chỉ được xác nhận khi nhân viên liên hệ.
(function () {
  var form = document.getElementById('dlm-form'); if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var mode = form.dataset.mode === 'that' ? 'that' : 'gia-lap';
  var diaChi = form.dataset.endpoint || '';
  var thoiGianCho = function () { return parseInt(form.dataset.cho, 10) || 15000; };
  var sdtBV = form.dataset.sdt || '', telBV = form.dataset.tel || '';
  var DS_GIO = (form.dataset.gio || '').split(',').filter(Boolean);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  var hai = function (n) { return (n < 10 ? '0' : '') + n; };
  var vn = new Date(Date.now() + 7 * 3600000), homNay = new Date(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()); // "hôm nay" theo giờ Việt Nam
  var phutVnNay = function () { var t = new Date(Date.now() + 7 * 3600000); return t.getUTCHours() * 60 + t.getUTCMinutes(); };
  var phutCuaGio = function (g) { var m = /^(\d{2}):(\d{2})$/.exec(g); return m ? +m[1] * 60 + +m[2] : -1; };
  var iso = function (d) { return d.getFullYear() + '-' + hai(d.getMonth() + 1) + '-' + hai(d.getDate()); };
  var ddmm = function (d) { return hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + '/' + d.getFullYear(); };
  var tuIso = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  var ngayChu = function (d) { return THU[d.getDay()] + ', ' + ddmm(d); };

  // ---------- Dữ liệu (một nguồn duy nhất, không phụ thuộc DOM nên quay lại bước trước không mất gì) ----------
  var S = { loai: '', loaiKhac: '', tenThu: '', giong: '', tuoi: '', can: '', gioiTinh: '', tinhTrang: '', dv: '', dvTen: '', dvNoiTru: false, dvChiPhi: '', ngay: '', gio: '', ngayDon: '', tenKhach: '', sdt: '', email: '', ghiChu: '' };
  var buoc = 1, daToi = 1, dangGui = false, lanGui = null, daNhan = false;
  var nhanLoai = { cho: 'Chó', meo: 'Mèo', khac: 'Khác' };

  // ---------- Kiểm tra từng trường ----------
  var chuanSdt = function (v) { var s = String(v).replace(/[\s.\-()]/g, ''); if (s.indexOf('+84') === 0) s = '0' + s.slice(3); return s; };
  var LUAT = {
    loai: function () { return S.loai ? '' : 'Vui lòng chọn loài thú cưng: Chó, Mèo hoặc Khác.'; },
    loaiKhac: function () { return S.loai !== 'khac' || S.loaiKhac.trim() ? '' : 'Vui lòng nhập loài thú cưng (ví dụ: thỏ, hamster, chim).'; },
    tenThu: function () { return S.tenThu.trim() ? '' : 'Vui lòng nhập tên thú cưng.'; },
    can: function () {
      var v = S.can.trim().replace(',', '.'); if (!v) return '';
      return /^\d{1,3}(\.\d{1,2})?$/.test(v) && +v > 0 && +v <= 120 ? '' : 'Cân nặng là số kg, ví dụ 5.2 (từ 0.1 đến 120).';
    },
    dv: function () { return S.dv ? '' : 'Vui lòng chọn một dịch vụ.'; },
    ngay: function () {
      var d = tuIso(S.ngay);
      if (!d) return S.dvNoiTru ? 'Vui lòng chọn ngày gửi thú cưng.' : 'Vui lòng chọn ngày mong muốn.';
      if (d < homNay) return 'Không thể chọn ngày trong quá khứ. Vui lòng chọn từ hôm nay trở đi.';
      return d.getTime() === homNay.getTime() && !gioConLai(S.ngay) ? 'Hôm nay đã hết giờ nhận lịch, vui lòng chọn ngày khác.' : '';
    },
    gio: function () {
      if (!S.gio) return 'Vui lòng chọn giờ mong muốn.';
      var d = tuIso(S.ngay);
      return d && d.getTime() === homNay.getTime() && phutCuaGio(S.gio) < phutVnNay() ? 'Giờ này hôm nay đã qua, vui lòng chọn giờ khác hoặc ngày khác.' : '';
    },
    ngayDon: function () {
      if (!S.dvNoiTru) return '';
      var d = tuIso(S.ngayDon), g = tuIso(S.ngay);
      if (!d) return 'Vui lòng chọn ngày đón dự kiến.';
      if (d < homNay) return 'Không thể chọn ngày trong quá khứ.';
      return g && d < g ? 'Ngày đón không được trước ngày gửi (' + ddmm(g) + ').' : '';
    },
    tenKhach: function () { return S.tenKhach.trim() ? '' : 'Vui lòng nhập họ và tên.'; },
    sdt: function () { var s = chuanSdt(S.sdt); return !s ? 'Vui lòng nhập số điện thoại.' : /^(0|\+84)\d{9}$/.test(s) || /^0\d{9}$/.test(s) ? '' : 'Số điện thoại gồm 10 số, ví dụ 0912 345 678.'; },
    email: function () { var v = S.email.trim(); return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Email chưa đúng định dạng, ví dụ ten@email.com (hoặc để trống).'; },
  };
  // Trường nào thuộc bước nào, ô báo lỗi nằm ở đâu
  var THEO_BUOC = { 1: ['loai', 'loaiKhac', 'tenThu', 'can'], 2: ['dv'], 3: ['ngay', 'gio', 'ngayDon'], 4: ['tenKhach', 'sdt', 'email'] };
  var O_LOI = { loai: 'dlm-loai-loi', loaiKhac: 'dlm-loai-khac-loi', tenThu: 'dlm-ten-thu-loi', can: 'dlm-can-loi', dv: 'dlm-dv-loi', ngay: 'dlm-ngay-loi', gio: 'dlm-gio-loi', ngayDon: 'dlm-don-loi', tenKhach: 'dlm-ten-khach-loi', sdt: 'dlm-sdt-loi', email: 'dlm-email-loi' };
  var O_NHAP = { loai: null, loaiKhac: 'dlm-loai-khac', tenThu: 'dlm-ten-thu', can: 'dlm-can', dv: null, ngay: null, gio: null, ngayDon: null, tenKhach: 'dlm-ten-khach', sdt: 'dlm-sdt', email: 'dlm-email' };
  var icLoi = '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
  function hienLoi(k, loi) {
    var v = $(O_LOI[k]); if (!v) return;
    v.textContent = '';
    if (loi) { v.insertAdjacentHTML('afterbegin', icLoi); var s = document.createElement('span'); s.textContent = loi; v.appendChild(s); } // textContent: không chèn HTML từ dữ liệu
    var hop = v.closest('.dlm-o') || v.closest('.dlm-nhom') || v.parentElement; if (hop) hop.classList.toggle('co-loi', !!loi);
    var o = O_NHAP[k] && $(O_NHAP[k]); if (o) o.setAttribute('aria-invalid', String(!!loi));
  }
  function kiemTra(k, hien) { var loi = LUAT[k](); if (hien) hienLoi(k, loi); return !loi; }
  function kiemBuoc(n, hien) {
    var tot = true, dau = null;
    THEO_BUOC[n].forEach(function (k) { if (!kiemTra(k, hien)) { tot = false; if (!dau) dau = k; } });
    return { tot: tot, dau: dau };
  }
  function tieuDiem(k) {
    var id = O_NHAP[k], o = id && $(id);
    if (!o) { var m = { loai: 'dlm-f-loai', dv: 'dlm-f-dv', ngay: 'dlm-lich', gio: 'dlm-gio', ngayDon: 'dlm-lich-don' }[k], hop = m && $(m), f = hop && (hop.querySelector('input:checked, input:not(:disabled), button[tabindex="0"], button:not(:disabled)')); o = f; }
    if (o && o.focus) o.focus();
  }

  // ---------- Tóm tắt (chỉ làm nổi bật dòng vừa đổi) ----------
  var tomTat = {}; var henNoi = {};
  function datTt(khoa, gt, phu) {
    var hang = form.ownerDocument.querySelector('[data-tt="' + khoa + '"]'); if (!hang) return;
    var g = hang.querySelector('.dlm-tt-gt'), p = hang.querySelector('.dlm-tt-phu'), cu = g.textContent;
    if (cu !== gt) { g.textContent = gt; hang.classList.add('moi'); clearTimeout(henNoi[khoa]); henNoi[khoa] = setTimeout(function () { hang.classList.remove('moi'); }, 900); }
    if (p) p.textContent = phu || '';
    hang.classList.toggle('co-gt', !!gt && gt !== g.getAttribute('data-trong'));
  }
  ['thu', 'dv', 'gio', 'lh', 'gia'].forEach(function (k) { var h = document.querySelector('[data-tt="' + k + '"] .dlm-tt-gt'); if (h) h.setAttribute('data-trong', h.textContent); });
  function capNhatTt() {
    var ten = S.tenThu.trim(), loai = S.loai === 'khac' ? (S.loaiKhac.trim() || 'Khác') : nhanLoai[S.loai] || '';
    datTt('thu', ten || (loai ? loai : 'Chưa nhập'), ten ? [loai, S.giong.trim()].filter(Boolean).join(' · ') : (S.loai ? '' : 'Chưa chọn loài'));
    if (!ten && !loai) datTt('thu', 'Chưa nhập', '');
    datTt('dv', S.dvTen || 'Chưa chọn', '');
    var d = tuIso(S.ngay), dn = tuIso(S.ngayDon);
    datTt('gio', d ? ngayChu(d) + (S.gio ? ' · ' + S.gio : '') + (S.dvNoiTru && dn ? ' → đón ' + ddmm(dn) : '') : 'Chưa chọn', '');
    var lh = [S.tenKhach.trim(), chuanSdt(S.sdt)].filter(Boolean).join(' · ');
    datTt('lh', lh || 'Chưa nhập', '');
    datTt('gia', S.dv ? S.dvChiPhi : 'Chưa có thông tin', '');
  }
  function capNhatXemLai() {
    var ds = $('dlm-xem-lai-ds'); if (!ds) return; ds.textContent = '';
    var d = tuIso(S.ngay), dn = tuIso(S.ngayDon), loai = S.loai === 'khac' ? S.loaiKhac.trim() : nhanLoai[S.loai] || '';
    var dong = [
      ['Thú cưng', [S.tenThu.trim(), loai, S.giong.trim()].filter(Boolean).join(' · '), 1],
      ['Thông tin thêm', [S.tuoi.trim() && 'Tuổi: ' + S.tuoi.trim(), S.can.trim() && 'Cân nặng: ' + S.can.trim().replace(',', '.') + ' kg', S.gioiTinh && 'Giới tính: ' + S.gioiTinh].filter(Boolean).join(' · '), 1],
      ['Tình trạng / yêu cầu đặc biệt', S.tinhTrang.trim(), 1],
      ['Dịch vụ', S.dvTen, 2],
      [S.dvNoiTru ? 'Ngày gửi' : 'Ngày mong muốn', d ? ngayChu(d) + ' lúc ' + S.gio : '', 3],
      ['Ngày đón dự kiến', S.dvNoiTru && dn ? ngayChu(dn) : '', 3],
      ['Họ và tên · SĐT', [S.tenKhach.trim(), chuanSdt(S.sdt)].filter(Boolean).join(' · '), 4],
      ['Email', S.email.trim(), 4],
      ['Ghi chú', S.ghiChu.trim(), 4],
    ];
    dong.forEach(function (r) {
      if (!r[1]) return;
      var w = document.createElement('div'), a = document.createElement('dt'), b = document.createElement('dd'), c = document.createElement('button');
      a.textContent = r[0]; b.textContent = r[1]; c.type = 'button'; c.className = 'dlm-sua'; c.textContent = 'Sửa'; c.setAttribute('aria-label', 'Sửa: ' + r[0]); c.setAttribute('data-toi', String(r[2]));
      w.appendChild(a); w.appendChild(b); w.appendChild(c); ds.appendChild(w);
    });
  }

  // ---------- Bước ----------
  var cacBuoc = Array.prototype.slice.call(form.querySelectorAll('.dlm-buoc'));
  var nutTien = Array.prototype.slice.call(document.querySelectorAll('.dlm-tien-nut'));
  var nutLui = $('dlm-lui'), nutTiep = $('dlm-tiep'), nutGui = $('dlm-gui'), tt = $('dlm-trang-thai'), tb = $('dlm-tb'), the = $('dlm-nhan');
  function ve() {
    cacBuoc.forEach(function (s, i) { s.hidden = i + 1 !== buoc; });
    nutTien.forEach(function (b, i) {
      var n = i + 1; b.classList.toggle('dang', n === buoc); b.classList.toggle('xong', n < buoc || (n < daToi && n !== buoc));
      if (n === buoc) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.disabled = n > daToi; b.parentElement.classList.toggle('dang', n === buoc); b.parentElement.classList.toggle('xong', n < buoc);
    });
    nutLui.hidden = buoc === 1; nutTiep.hidden = buoc === 4; nutGui.hidden = buoc !== 4;
    document.getElementById('dlm-tien').style.setProperty('--tien', String((buoc - 1) / 3));
  }
  function toiBuoc(n, huong, khongTieuDiem) {
    if (n < 1 || n > 4) return;
    anTb();
    if (n > buoc) { // đi tới: phải qua hết các bước trước
      for (var i = buoc; i < n; i++) { var kq = kiemBuoc(i, true); if (!kq.tot) { buoc = i; daToi = Math.max(daToi, i); ve(); capNhatTrangThaiBuoc(); tieuDiem(kq.dau); return; } }
    }
    var tu = buoc; buoc = n; daToi = Math.max(daToi, n);
    if (n === 4) capNhatXemLai();
    ve();
    var s = cacBuoc[n - 1]; s.classList.remove('vao-phai', 'vao-trai'); void s.offsetWidth; s.classList.add(n >= tu ? 'vao-phai' : 'vao-trai');
    capNhatTrangThaiBuoc();
    if (!khongTieuDiem) { var h = s.querySelector('h2'); if (h) { h.focus({ preventScroll: true }); var r = h.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + r.top - 140, behavior: reduce.matches ? 'auto' : 'smooth' }); } }
  }
  function capNhatTrangThaiBuoc() {
    tt.textContent = buoc === 4 ? 'Kiểm tra lại thông tin rồi bấm "Gửi yêu cầu đặt lịch".' : '';
  }
  nutTiep.addEventListener('click', function () { var kq = kiemBuoc(buoc, true); if (!kq.tot) { tieuDiem(kq.dau); return; } toiBuoc(buoc + 1); });
  nutLui.addEventListener('click', function () { toiBuoc(buoc - 1); });
  nutTien.forEach(function (b) { b.addEventListener('click', function () { toiBuoc(+b.getAttribute('data-toi')); }); });
  form.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.dlm-sua'); if (t) toiBuoc(+t.getAttribute('data-toi')); });

  // ---------- Nhập liệu ----------
  var khan = /(kh[oó]\s*th[ởo]|co\s*gi[ậa]t|ch[ảa]y\s*m[áa]u|ng[ộo]\s*[đd][ộo]c|b[ấa]t\s*t[ỉi]nh|ng[ấa]t|li\s*b[ìi]|kh[ôo]ng\s*th[ởo]|tai\s*n[ạa]n)/i;
  function nhapChu(id, khoa, kiemKhi) {
    var o = $(id); if (!o) return;
    o.addEventListener('input', function () {
      S[khoa] = o.value; capNhatTt(); if (buoc === 4) capNhatXemLai(); // khối "Kiểm tra lại" luôn theo kịp những gì vừa nhập
      if (kiemKhi && o.closest('.co-loi')) kiemTra(kiemKhi, true);
      if (id === 'dlm-tinh-trang') { $('dlm-khan').hidden = !khan.test(o.value); }
    });
    o.addEventListener('blur', function () { if (kiemKhi) kiemTra(kiemKhi, true); });
  }
  nhapChu('dlm-loai-khac', 'loaiKhac', 'loaiKhac'); nhapChu('dlm-ten-thu', 'tenThu', 'tenThu'); nhapChu('dlm-giong', 'giong');
  nhapChu('dlm-tuoi', 'tuoi'); nhapChu('dlm-can', 'can', 'can'); nhapChu('dlm-tinh-trang', 'tinhTrang');
  nhapChu('dlm-ten-khach', 'tenKhach', 'tenKhach'); nhapChu('dlm-sdt', 'sdt', 'sdt'); nhapChu('dlm-email', 'email', 'email'); nhapChu('dlm-ghi-chu', 'ghiChu');
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'loai') {
      S.loai = t.value; var khac = S.loai === 'khac', hop = $('dlm-o-khac');
      hop.hidden = !khac; $('dlm-loai-khac').required = khac;
      if (!khac) { hienLoi('loaiKhac', ''); } else { hop.classList.remove('vao-nhe'); void hop.offsetWidth; hop.classList.add('vao-nhe'); }
      hienLoi('loai', ''); capNhatTt();
      var ic = document.querySelector('[data-tt="thu"] .dlm-tt-ic'); if (ic) ic.setAttribute('data-loai', S.loai);
    } else if (t.name === 'gioi_tinh') { S.gioiTinh = t.value; }
    else if (t.name === 'dich_vu') {
      S.dv = t.value; S.dvTen = t.getAttribute('data-ten') || ''; S.dvNoiTru = t.hasAttribute('data-noi-tru'); S.dvChiPhi = t.getAttribute('data-chi-phi') || '';
      hienLoi('dv', ''); capNhatNoiTru(); capNhatTt();
    } else if (t.name === 'gio') { S.gio = t.value; hienLoi('gio', ''); capNhatTt(); }
  });
  function capNhatNoiTru() {
    var nt = S.dvNoiTru; $('dlm-o-don').hidden = !nt;
    $('dlm-ngay-nhan').firstChild.textContent = nt ? 'Ngày gửi thú cưng ' : 'Ngày mong muốn ';
    if (!nt) { S.ngayDon = ''; hienLoi('ngayDon', ''); lichDon.ve(); }
    else lichDon.ve();
  }

  // ---------- Giờ ----------
  var NHOM_GIO = [['Sáng', 0, 720], ['Chiều', 720, 1020], ['Tối', 1020, 1440]];
  function gioConLai(ngayIso) { var d = tuIso(ngayIso); if (!d) return true; if (d.getTime() !== homNay.getTime()) return true; return DS_GIO.some(function (g) { return phutCuaGio(g) >= phutVnNay(); }); }
  function veGio() {
    var hop = $('dlm-gio'); hop.textContent = '';
    if (!S.ngay) { var p = document.createElement('p'); p.className = 'dlm-goi'; p.textContent = 'Chọn ngày trước để xem các khung giờ.'; hop.appendChild(p); return; }
    var homNayChon = tuIso(S.ngay) && tuIso(S.ngay).getTime() === homNay.getTime(), ph = phutVnNay();
    if (!gioConLai(S.ngay)) { var q = document.createElement('p'); q.className = 'dlm-khong-gio'; q.textContent = 'Hôm nay đã hết giờ nhận lịch (đến 21:00). Vui lòng chọn ngày khác.'; hop.appendChild(q); S.gio = ''; return; }
    if (S.gio && homNayChon && phutCuaGio(S.gio) < ph) S.gio = ''; // giờ đã chọn nay đã qua → bỏ chọn
    NHOM_GIO.forEach(function (n) {
      var gs = DS_GIO.filter(function (g) { var p2 = phutCuaGio(g); return p2 >= n[1] && p2 < n[2]; }); if (!gs.length) return;
      var nhom = document.createElement('div'), ten = document.createElement('p'), ds = document.createElement('div'); nhom.className = 'dlm-gio-nhom'; ten.className = 'dlm-gio-ten'; ten.textContent = n[0]; ds.className = 'dlm-chip-hang';
      gs.forEach(function (g) {
        var l = document.createElement('label'), i = document.createElement('input'), s = document.createElement('span'), qua = homNayChon && phutCuaGio(g) < ph;
        l.className = 'dlm-chip dlm-chip-gio' + (qua ? ' tat' : ''); i.type = 'radio'; i.name = 'gio'; i.value = g; i.disabled = qua; i.checked = S.gio === g; s.textContent = g;
        if (qua) l.title = 'Giờ này đã qua';
        l.appendChild(i); l.appendChild(s); ds.appendChild(l);
      });
      nhom.appendChild(ten); nhom.appendChild(ds); hop.appendChild(nhom);
    });
  }

  // ---------- Lịch chọn ngày ----------
  function taoLich(hopId, khoaS, ngayNhoNhat, khiDoi) {
    var hop = $(hopId), thang = new Date(homNay.getFullYear(), homNay.getMonth(), 1), tieu = null;
    var TEN_T = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    function ve() {
      hop.textContent = ''; var min = ngayNhoNhat(), chon = tuIso(S[khoaS]);
      var dau = document.createElement('div'); dau.className = 'dlm-lich-dau';
      var lui = document.createElement('button'), tien = document.createElement('button'), t = document.createElement('b'); lui.type = tien.type = 'button'; lui.className = tien.className = 'dlm-lich-chuyen';
      lui.setAttribute('aria-label', 'Tháng trước'); tien.setAttribute('aria-label', 'Tháng sau'); lui.innerHTML = tien.innerHTML = '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>';
      tien.firstChild.style.transform = 'scaleX(-1)';
      t.textContent = TEN_T[thang.getMonth()] + ' ' + thang.getFullYear(); t.setAttribute('aria-live', 'polite');
      var thangMin = new Date(min.getFullYear(), min.getMonth(), 1); lui.disabled = thang <= thangMin;
      var gioiHan = new Date(homNay.getFullYear(), homNay.getMonth() + 5, 1); tien.disabled = thang >= gioiHan; // chỉ đặt trước tối đa ~6 tháng
      lui.addEventListener('click', function () { thang = new Date(thang.getFullYear(), thang.getMonth() - 1, 1); ve(); focusNut(lui.disabled ? tien : lui); });
      tien.addEventListener('click', function () { thang = new Date(thang.getFullYear(), thang.getMonth() + 1, 1); ve(); focusNut(tien.disabled ? lui : tien); });
      dau.appendChild(lui); dau.appendChild(t); dau.appendChild(tien); hop.appendChild(dau);
      var luoi = document.createElement('div'); luoi.className = 'dlm-lich-luoi'; luoi.setAttribute('role', 'group'); luoi.setAttribute('aria-labelledby', hop.getAttribute('data-nhan'));
      ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(function (x) { var s = document.createElement('span'); s.className = 'dlm-lich-thu'; s.setAttribute('aria-hidden', 'true'); s.textContent = x; luoi.appendChild(s); });
      var dau1 = (new Date(thang.getFullYear(), thang.getMonth(), 1).getDay() + 6) % 7, soNgay = new Date(thang.getFullYear(), thang.getMonth() + 1, 0).getDate(), duocChon = [];
      for (var i = 0; i < dau1; i++) luoi.appendChild(document.createElement('span'));
      for (var n = 1; n <= soNgay; n++) {
        var d = new Date(thang.getFullYear(), thang.getMonth(), n), b = document.createElement('button'), qua = d < min;
        b.type = 'button'; b.className = 'dlm-ngay' + (d.getTime() === homNay.getTime() ? ' nay' : '') + (chon && d.getTime() === chon.getTime() ? ' chon' : ''); b.textContent = String(n); b.setAttribute('data-iso', iso(d));
        b.setAttribute('aria-label', ngayChu(d) + (d.getTime() === homNay.getTime() ? ' (hôm nay)' : '')); b.setAttribute('aria-pressed', String(!!chon && d.getTime() === chon.getTime())); b.disabled = qua; b.tabIndex = -1;
        if (!qua) duocChon.push(b);
        luoi.appendChild(b);
      }
      var khoiDau = luoi.querySelector('.dlm-ngay.chon:not(:disabled)') || duocChon[0]; if (khoiDau) khoiDau.tabIndex = 0;
      luoi.addEventListener('click', function (e) { var b = e.target.closest('.dlm-ngay'); if (!b || b.disabled) return; S[khoaS] = b.getAttribute('data-iso'); khiDoi(); ve(); var m = hop.querySelector('.dlm-ngay.chon'); if (m) m.focus(); });
      luoi.addEventListener('keydown', function (e) {
        var b = e.target.closest('.dlm-ngay'); if (!b) return; var dich = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); var l = duocChon; var m = e.key === 'Home' ? l[0] : l[l.length - 1]; if (m) { b.tabIndex = -1; m.tabIndex = 0; m.focus(); } return; }
        if (dich === undefined) return; e.preventDefault();
        var i2 = duocChon.indexOf(b), k = i2 + dich; if (duocChon[k]) { b.tabIndex = -1; duocChon[k].tabIndex = 0; duocChon[k].focus(); }
      });
      hop.appendChild(luoi);
      if (chon) { var nd = document.createElement('p'); nd.className = 'dlm-lich-da-chon'; nd.textContent = 'Đã chọn: ' + ngayChu(chon); hop.appendChild(nd); }
    }
    function focusNut(b) { if (b && b.focus) b.focus(); }
    ve();
    return { ve: function () { var c = tuIso(S[khoaS]); if (c && (c.getMonth() !== thang.getMonth() || c.getFullYear() !== thang.getFullYear())) thang = new Date(c.getFullYear(), c.getMonth(), 1); var m = ngayNhoNhat(); if (thang < new Date(m.getFullYear(), m.getMonth(), 1)) thang = new Date(m.getFullYear(), m.getMonth(), 1); ve(); } };
  }
  var lichDon;
  var lichNgay = taoLich('dlm-lich', 'ngay', function () { return homNay; }, function () {
    hienLoi('ngay', ''); veGio(); if (S.dvNoiTru) { var g = tuIso(S.ngay), d = tuIso(S.ngayDon); if (d && g && d < g) S.ngayDon = ''; lichDon.ve(); }
    capNhatTt();
  });
  lichDon = taoLich('dlm-lich-don', 'ngayDon', function () { var g = tuIso(S.ngay); return g && g > homNay ? g : homNay; }, function () { hienLoi('ngayDon', ''); capNhatTt(); });
  veGio();

  // ---------- Thông báo ----------
  function anTb() { tb.hidden = true; tb.textContent = ''; }
  var goiLink = function () { var a = document.createElement('a'); a.href = 'tel:' + telBV; a.textContent = sdtBV; return a; };
  function hienTb(doan, loai) {
    tb.textContent = ''; tb.className = 'dlm-tb ' + loai; var p = document.createElement('p');
    doan.forEach(function (d) { p.appendChild(typeof d === 'string' ? document.createTextNode(d) : d); }); tb.appendChild(p); tb.hidden = false; tb.focus();
  }

  // ---------- Gửi ----------
  function sinhMa() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* dùng cách dự phòng */ }
    var b = new Uint8Array(16); try { crypto.getRandomValues(b); } catch (e) { for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  // Máy chủ hiện tại (apps-script/Code.v2.gs) chỉ có cột "Ghi chú" cho thông tin thêm → gom giống, tuổi, cân nặng, giới tính, email, tình trạng vào ghi_chu (tối đa 1000 ký tự),
  // ĐỒNG THỜI gửi từng trường riêng (máy chủ cũ bỏ qua, máy chủ mới có thể đọc). Không mất dữ liệu.
  function layDuLieu() {
    var loai = S.loai === 'cho' ? 'Chó' : S.loai === 'meo' ? 'Mèo' : 'Khác', can = S.can.trim().replace(',', '.');
    var ghi = [S.giong.trim() && 'Giống: ' + S.giong.trim(), S.tuoi.trim() && 'Tuổi/ngày sinh: ' + S.tuoi.trim(), can && 'Cân nặng: ' + can + ' kg', S.gioiTinh && 'Giới tính: ' + S.gioiTinh, S.email.trim() && 'Email: ' + S.email.trim(), S.tinhTrang.trim() && 'Tình trạng/yêu cầu đặc biệt: ' + S.tinhTrang.trim(), S.ghiChu.trim() && 'Ghi chú: ' + S.ghiChu.trim()].filter(Boolean).join(' | ').slice(0, 1000);
    return {
      ten_khach: S.tenKhach.trim(), dien_thoai: chuanSdt(S.sdt), ten_thu_cung: S.tenThu.trim(), loai: loai, loai_khac: S.loai === 'khac' ? S.loaiKhac.trim() : '',
      dich_vu: S.dvTen, dich_vu_ma: S.dv, ngay: S.ngay, gio: S.gio, ngay_don: S.dvNoiTru ? S.ngayDon : '', ghi_chu: ghi,
      giong: S.giong.trim(), tuoi: S.tuoi.trim(), can_nang: can, gioi_tinh: S.gioiTinh, email: S.email.trim(), tinh_trang: S.tinhTrang.trim(), website: '',
    };
  }
  function dong(dl, nhan, gt) { if (!gt) return; var r = document.createElement('div'), a = document.createElement('dt'), b = document.createElement('dd'); a.textContent = nhan; b.textContent = gt; r.appendChild(a); r.appendChild(b); dl.appendChild(r); }
  function hienThe(tieuDe, doan, du, ma, nutChu, thanhCong) {
    the.textContent = ''; the.className = 'dlm-nhan-the ' + (thanhCong ? 'thanh-cong' : 'gia-lap');
    var ic = document.createElement('span'); ic.className = 'dlm-tick-lon'; ic.setAttribute('aria-hidden', 'true'); ic.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'; the.appendChild(ic);
    var h = document.createElement('h2'); h.textContent = tieuDe; the.appendChild(h);
    doan.forEach(function (t) { var p = document.createElement('p'); if (typeof t === 'string') p.textContent = t; else p.appendChild(t); the.appendChild(p); });
    if (ma) { var pm = document.createElement('p'); pm.className = 'dlm-ma'; pm.appendChild(document.createTextNode('Mã yêu cầu: ')); var bb = document.createElement('b'); bb.textContent = ma; pm.appendChild(bb); the.appendChild(pm); }
    var dl = document.createElement('dl'); dl.className = 'dlm-nhan-ds';
    var d = tuIso(du.ngay), dn = tuIso(du.ngay_don);
    dong(dl, 'Khách hàng', du.ten_khach + ' · ' + du.dien_thoai); dong(dl, 'Thú cưng', du.ten_thu_cung + ' (' + (du.loai === 'Khác' ? du.loai_khac : du.loai) + ')'); dong(dl, 'Dịch vụ', du.dich_vu);
    dong(dl, du.ngay_don ? 'Ngày gửi' : 'Ngày mong muốn', d ? ngayChu(d) + ' lúc ' + du.gio : ''); dong(dl, 'Ngày đón dự kiến', dn ? ngayChu(dn) : ''); the.appendChild(dl);
    var nut = document.createElement('button'); nut.type = 'button'; nut.className = 'dlm-nut dlm-nut-vien'; nut.textContent = nutChu; nut.addEventListener('click', lamLai); the.appendChild(nut);
    form.hidden = true; document.getElementById('dlm-tien').hidden = true; the.hidden = false; the.focus(); the.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function lamLai() {
    Object.keys(S).forEach(function (k) { S[k] = typeof S[k] === 'boolean' ? false : ''; });
    lanGui = null; dangGui = false; daNhan = false; buoc = 1; daToi = 1;
    form.reset(); ['dlm-o-khac', 'dlm-o-don'].forEach(function (id) { $(id).hidden = true; }); $('dlm-khan').hidden = true;
    Object.keys(O_LOI).forEach(function (k) { hienLoi(k, ''); });
    lichNgay.ve(); lichDon.ve(); veGio(); capNhatTt(); anTb();
    the.hidden = true; the.textContent = ''; form.hidden = false; $('dlm-tien').hidden = false; ve(); datNut(false); tt.textContent = '';
    cacBuoc[0].querySelector('h2').focus();
  }
  function datNut(dang) { nutGui.classList.toggle('dang-gui', dang); if (dang) { nutGui.disabled = true; nutGui.setAttribute('aria-busy', 'true'); nutGui.querySelector('.dlm-nut-chu').textContent = 'Đang gửi…'; } else { nutGui.disabled = false; nutGui.removeAttribute('aria-busy'); } }
  function khoa(k) { Array.prototype.forEach.call(form.querySelectorAll('.dlm-buoc, .dlm-dieu-huong button'), function (e) { if (e.tagName === 'SECTION') e.inert = k; else if (e !== nutGui) e.disabled = k; }); }
  function thatBai(loai, loiMay) {
    dangGui = false; khoa(false); datNut(false); nutGui.querySelector('.dlm-nut-chu').textContent = 'Gửi lại'; tt.textContent = '';
    hienTb(loai === 'that-bai'
      ? ['Chưa gửi được yêu cầu' + (loiMay ? ': ' + loiMay : '') + '. Thông tin bạn nhập vẫn còn nguyên. Bấm “Gửi lại”, hoặc gọi ', goiLink(), '.']
      : ['Chưa nhận được xác nhận từ bệnh viện, nên yêu cầu có thể chưa được gửi. Thông tin bạn nhập vẫn còn nguyên: bấm “Gửi lại” (hệ thống tránh tạo lịch trùng) hoặc gọi ', goiLink(), '.'], 'loi');
  }
  function thanhCong(ma, du) {
    dangGui = false; daNhan = true; khoa(false); datNut(false); anTb(); lanGui = null;
    var ghi = document.createElement('span'); ghi.appendChild(document.createTextNode('Nhân viên bệnh viện sẽ liên hệ xác nhận lịch với bạn. Lịch hẹn chỉ được xác nhận sau khi nhân viên liên hệ. Cần gấp? Gọi ')); ghi.appendChild(goiLink()); ghi.appendChild(document.createTextNode('.'));
    hienThe('Yêu cầu đặt lịch đã được tiếp nhận!', [ghi], du, ma, 'Gửi yêu cầu khác', true);
  }
  function xuLy(r, du) {
    var j = null; try { j = JSON.parse(r.text); } catch (e) { j = null; }
    if (j && j.ok === true && typeof j.ma === 'string' && j.ma) return thanhCong(j.ma.slice(0, 40), du);
    if (j && j.ok === false) return thatBai('that-bai', typeof j.loi === 'string' ? j.loi.slice(0, 160) : '');
    return thatBai('chua-xac-nhan'); // phản hồi không đọc được: KHÔNG báo thành công
  }
  function guiThat(du) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null, hen = setTimeout(function () { if (ctl) ctl.abort(); else thatBai('chua-xac-nhan'); }, thoiGianCho()), xong = false;
    var kt = function (f) { if (xong) return; xong = true; clearTimeout(hen); f(); };
    fetch(diaChi, { method: 'POST', body: JSON.stringify(du), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl ? ctl.signal : undefined, redirect: 'follow' })
      .then(function (res) { return res.text().then(function (t) { return { status: res.status, text: t }; }); })
      .then(function (r) { kt(function () { xuLy(r, du); }); })
      .catch(function () { kt(function () { thatBai('chua-xac-nhan'); }); });
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // luôn chặn gửi mặc định: dữ liệu chỉ đi qua đường dưới đây
    if (dangGui || daNhan) return; // chặn gửi lặp
    for (var n = 1; n <= 4; n++) { var kq = kiemBuoc(n, true); if (!kq.tot) { toiBuoc(n, 0, true); tieuDiem(kq.dau); hienTb(['Còn thông tin cần kiểm tra ở bước ' + n + '. Vui lòng xem các ô báo đỏ.'], 'loi'); return; } }
    if ($('dlm-web').value) return; // ô bẫy chống tin rác: không gửi, không báo gì
    var du = layDuLieu(), dau = JSON.stringify(du);
    if (!lanGui || lanGui.dauVan !== dau) lanGui = { ma: sinhMa(), dauVan: dau }; // đổi nội dung → mã mới; gửi lại y nguyên → dùng lại mã
    du.ma_yeu_cau = lanGui.ma; du.nguon = location.pathname; du.gui_luc = new Date().toISOString();
    dangGui = true; anTb(); datNut(true); tt.textContent = 'Đang gửi yêu cầu… Vui lòng không đóng trang.'; khoa(true);
    if (mode === 'gia-lap') {
      setTimeout(function () { // Giả lập: không có yêu cầu mạng nào, không có câu "đã tiếp nhận"
        dangGui = false; khoa(false); datNut(false); lanGui = null; tt.textContent = '';
        hienThe('Hoàn tất giả lập', ['Đây là bản xem trước: yêu cầu CHƯA được gửi đi đâu và chưa có lịch hẹn nào được xác nhận. Cần đặt lịch ngay, vui lòng gọi ' + sdtBV + ' hoặc nhắn Zalo.'], du, '', 'Làm lại từ đầu', false);
      }, reduce.matches ? 0 : 700);
      return;
    }
    if (!diaChi) { thatBai('that-bai', 'biểu mẫu đang được kết nối'); return; }
    guiThat(du);
  });
  // Enter trong ô nhập: sang bước kế (không gửi sớm). Ở bước 4 Enter gửi như bình thường.
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
    if (buoc < 4) { e.preventDefault(); nutTiep.click(); }
  });

  // ---------- Tóm tắt thu gọn trên điện thoại ----------
  var ttNut = $('dlm-tt-nut'), ttKhu = $('dlm-tt');
  var mobile = window.matchMedia('(max-width: 1023px)');
  function ttDat(mo) { ttNut.setAttribute('aria-expanded', String(mo)); ttKhu.classList.toggle('dong', !mo); }
  ttKhu.classList.add('co-js'); ttDat(!mobile.matches);
  ttNut.addEventListener('click', function () { ttDat(ttNut.getAttribute('aria-expanded') !== 'true'); });
  if (mobile.addEventListener) mobile.addEventListener('change', function () { ttDat(!mobile.matches); });

  // ---------- Khởi động ----------
  // Đường dẫn /dat-lich/?nhom=<mã dịch vụ> (từ Bảng giá): chọn sẵn dịch vụ
  try { var nhom = new URLSearchParams(location.search).get('nhom'), r = nhom && form.querySelector('input[name="dich_vu"][value="' + nhom.replace(/[^a-z0-9-]/gi, '') + '"]'); if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } } catch (e) { /* bỏ qua */ }
  ve(); capNhatTt();
  form.classList.add('san');
})();
