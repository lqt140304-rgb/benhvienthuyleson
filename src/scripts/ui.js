// Giao diện Lê Sơn: header, menu, tab bảng giá, trợ lý Bé Cam, dải thẻ trượt, khu Sản phẩm, hiệu ứng trang trí.
// Dùng chung mọi trang; phần nào không có trên trang hiện tại thì bỏ qua. Tệp này KHÔNG gửi dữ liệu form đi đâu (form có script riêng).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var dl = JSON.parse(($('du-lieu-cam') || { textContent: '{}' }).textContent);
  var laModal = window.matchMedia('(max-width: 1023px)'); // mobile + tablet: Bé Cam là hộp thoại modal
  var itChuyenDong = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Đi tới một khu trên trang: cuộn tới (scroll-padding giữ khu nằm dưới header) và chuyển focus tới tiêu đề
  // của khu đó, để người dùng bàn phím / trình đọc màn hình tiếp tục từ đúng chỗ (không rơi về <body>)
  var diToi = function (id) {
    var khu = $(id); if (!khu) return;
    hienNgay(khu.querySelectorAll('[data-hien]'));
    if (typeof datActive === 'function') { datActive(linkCua(id)); khoaSpy(); }
    var dich = khu.querySelector('h2') || khu;
    if (!dich.hasAttribute('tabindex')) dich.setAttribute('tabindex', '-1');
    khu.scrollIntoView({ behavior: itChuyenDong.matches ? 'auto' : 'smooth', block: 'start' });
    dich.focus({ preventScroll: true });
  };

  // ---------- R3.2: thẻ xuất hiện khi cuộn (một lần) + hoạ tiết dao động ngắn khi khu hiện ra ----------
  // html.co-hieu-ung chỉ được gắn (ở <head>) khi có JS, có IntersectionObserver và không bật giảm chuyển động.
  // Không có lớp này thì mọi nội dung hiện sẵn. Bảng giá, form, lỗi không bao giờ có data-hien.
  var goc = document.documentElement, coHieuUng = goc.classList.contains('co-hieu-ung');
  function hienNgay(ds) {
    Array.prototype.forEach.call(ds, function (el) {
      if (el.classList.contains('da-hien')) return;
      el.classList.add('hien-ngay', 'da-hien', 'xong-hien');
      if (quanSat) quanSat.unobserve(el);
    });
  }
  var quanSat = null;
  if (coHieuUng) {
    window.__hieuUngSan = true;
    quanSat = new IntersectionObserver(function (muc) {
      var vao = muc.filter(function (m) { return m.isIntersecting; }).map(function (m) { return m.target; });
      vao.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      vao.forEach(function (el, i) {
        quanSat.unobserve(el);
        var tre = Math.min(i, 4) * 60; // nối tiếp 60ms, tối đa 240ms
        el.style.transitionDelay = tre + 'ms';
        el.classList.add('da-hien');
        // Xong hiệu ứng: trả lại transition riêng của thẻ (hover 200ms)
        setTimeout(function () { el.classList.add('xong-hien'); el.style.transitionDelay = ''; }, tre + 450);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('[data-hien]').forEach(function (el) { quanSat.observe(el); });
    // Phần tử nhận focus bằng bàn phím phải hiện ngay
    document.addEventListener('focusin', function (e) { var el = e.target.closest && e.target.closest('[data-hien]'); if (el) hienNgay([el]); });
    window.addEventListener('beforeprint', function () { hienNgay(document.querySelectorAll('[data-hien]')); });
  }
  // Dùng cho kiểm thử/chụp ảnh toàn trang: hiện tất cả ngay
  window.__hienTatCa = function () { hienNgay(document.querySelectorAll('[data-hien]')); };
  // Hoạ tiết trang trí: dao động liên tục bằng CSS (mỗi hoạ tiết một nhịp, lệch pha).
  // Nút "Hiệu ứng trang trí" (hero + chân trang) bật/tắt, nhớ lựa chọn; giảm chuyển động → mặc định tắt.
  var nutTT = Array.prototype.slice.call(document.querySelectorAll('[data-nut-trang-tri]'));
  var docTT = function () { try { return localStorage.getItem('le-son-trang-tri'); } catch (e) { return null; } };
  function datTT(bat, luu) {
    goc.classList.toggle('tat-trang-tri', !bat);
    goc.classList.toggle('tt-chu-dong', bat && itChuyenDong.matches); // giảm chuyển động nhưng người dùng chủ động bật
    nutTT.forEach(function (n) {
      n.setAttribute('aria-pressed', String(bat));
      n.querySelector('.tt-trang-thai').textContent = bat ? 'Đang bật' : (itChuyenDong.matches && !luu && !docTT() ? 'Đang tắt theo cài đặt máy' : 'Đang tắt');
    });
    if (luu) { try { if (bat && !itChuyenDong.matches) localStorage.removeItem('le-son-trang-tri'); else localStorage.setItem('le-son-trang-tri', bat ? 'bat' : 'tat'); } catch (e) { /* trình duyệt chặn lưu: chỉ áp dụng trong lần xem này */ } }
    document.dispatchEvent(new CustomEvent('doi-trang-tri', { detail: { bat: bat, chuDong: !!luu } }));
  }
  var ttDaLuu = docTT();
  nutTT.forEach(function (n) {
    n.hidden = false;
    n.addEventListener('click', function () { datTT(goc.classList.contains('tat-trang-tri'), true); });
  });
  datTT(ttDaLuu ? ttDaLuu === 'bat' : !itChuyenDong.matches, false);
  // Đổi cài đặt "giảm chuyển động" của máy khi trang đang mở: áp dụng ngay (lựa chọn đã lưu của người dùng vẫn được giữ)
  var khiDoiGiamCd = function () { var l = docTT(); datTT(l ? l === 'bat' : !itChuyenDong.matches, false); };
  // Một đối tượng MediaQueryList riêng chỉ để nghe thay đổi (đo trong Chromium 141: người nghe gắn vào đối tượng dùng chung ở trên chỉ được gọi lần đổi đầu tiên)
  var nghe = [khiDoiGiamCd], mqDoi = window.matchMedia('(prefers-reduced-motion: reduce)');
  var truyen = function () { nghe.forEach(function (f) { f(); }); };
  if (mqDoi.addEventListener) mqDoi.addEventListener('change', truyen); else if (mqDoi.addListener) mqDoi.addListener(truyen);
  window.__mqGiamCd = mqDoi; // giữ tham chiếu: tránh bị thu gom

  // ---------- Icon dịch vụ: chạy MỘT lần khi vào màn hình (hover / focus do CSS). Tắt hiệu ứng hoặc giảm chuyển động → đứng yên ----------
  if ('IntersectionObserver' in window) {
    var ioIc = new IntersectionObserver(function (ds) {
      ds.forEach(function (d) {
        if (!d.isIntersecting) return;
        ioIc.unobserve(d.target);
        if (goc.classList.contains('tat-trang-tri')) return;
        d.target.classList.add('cd-chay');
        setTimeout(function () { d.target.classList.remove('cd-chay'); }, 900);
      });
    }, { threshold: 0.9 });
    Array.prototype.forEach.call(document.querySelectorAll('svg.ic48'), function (x) { ioIc.observe(x); });
  }

  // ---------- Header: thu gọn khi cuộn (không đánh dấu mục theo vị trí cuộn) ----------
  var dau = $('dau');
  var capNhatDau = function () { dau.classList.toggle('cuon', window.scrollY > 8); };
  window.addEventListener('scroll', capNhatDau, { passive: true }); capNhatDau();

  // ---------- Menu ngăn kéo (dưới 1280px) ----------
  var nutMenu = $('nut-menu'), menu = $('menu');
  function moMenu(mo, traFocus) {
    nutMenu.setAttribute('aria-expanded', String(mo));
    nutMenu.setAttribute('aria-label', mo ? 'Đóng menu' : 'Mở menu');
    nutMenu.querySelector('.nut-menu-chu').textContent = mo ? 'Đóng' : 'Menu';
    menu.classList.toggle('mo', mo);
    document.body.classList.toggle('menu-mo', mo);
    if (mo) { dongBeCam(); menu.querySelector('a').focus({ preventScroll: true }); }
    else if (traFocus) nutMenu.focus({ preventScroll: true });
  }
  nutMenu.addEventListener('click', function () { moMenu(nutMenu.getAttribute('aria-expanded') !== 'true', true); });
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    moMenu(false);
    if (/^#/.test(a.getAttribute('href') || '')) { datActive(a); khoaSpy(); }
    // Link nội bộ (#dich-vu…): cuộn mượt tới khu, tiêu đề nằm dưới header, focus tới tiêu đề
    var id = (a.getAttribute('href') || '').replace(/^#/, '');
    if (/^#[\w-]+$/.test(a.getAttribute('href') || '') && id !== 'top' && $(id) && $(id).querySelector('h2')) { e.preventDefault(); history.replaceState(null, '', '#' + id); diToi(id); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('mo')) moMenu(false, true); });

  // ---------- Mục đang xem trên header (desktop: thanh tím trượt; menu mobile: vạch trái) ----------
  // Link tới section trong trang: active theo section đang xem. Link sang trang khác: không active ở trang chủ.
  // Section không có mục menu (Giới thiệu, Đội ngũ, Cẩm nang, Điều trị, Liên hệ): không mục nào được nhấn mạnh.
  // Trang phụ (Bảng giá, 404): menu không theo vị trí cuộn; link khu trỏ về index.html#khu
  // Bản xem trước trên claude.ai bỏ thẻ <body data-trang>: thiếu thuộc tính = trang chủ
  var trangGia = (document.body.getAttribute('data-trang') || 'chu') !== 'chu'; // trang phụ: menu không theo vị trí cuộn
  var linkTrong = Array.prototype.filter.call(menu.querySelectorAll('a'), function (a) { return /^#/.test(a.getAttribute('href')); });
  var linkCua = function (idKhu) { return linkTrong.filter(function (a) { return a.getAttribute('href') === '#' + (idKhu === 'noi-dung' ? 'top' : idKhu); })[0] || null; };
  var khuTrang = Array.prototype.slice.call(document.querySelectorAll('main > section[id]'));
  var thanh = document.createElement('span'); thanh.className = 'menu-thanh'; thanh.setAttribute('aria-hidden', 'true'); menu.appendChild(thanh);
  var menuDoc = window.matchMedia('(max-width: 1279px)');
  function dichThanh() {
    var a = menu.querySelector('a[aria-current]');
    if (!a || menuDoc.matches) { thanh.style.opacity = '0'; return; }
    thanh.style.opacity = '1';
    thanh.style.width = (a.offsetWidth - 24) + 'px';
    thanh.style.transform = 'translateX(' + (a.offsetLeft + 12) + 'px)';
  }
  function datActive(a) {
    Array.prototype.forEach.call(menu.querySelectorAll('a'), function (x) {
      if (x === a) x.setAttribute('aria-current', x.getAttribute('href') === '#top' ? 'page' : 'location'); else x.removeAttribute('aria-current');
    });
    dichThanh();
  }
  // Khu đang xem: khu cuối cùng có đỉnh nằm trên mép dưới header + 1/3 màn hình; ở sát đầu trang luôn là hero
  function khuDangXem() {
    if (window.scrollY < 8) return khuTrang[0];
    var moc = dau.getBoundingClientRect().bottom + window.innerHeight / 3, ket = khuTrang[0];
    khuTrang.forEach(function (k) { if (k.getBoundingClientRect().top <= moc) ket = k; });
    return ket;
  }
  var dangKhoa = false, henMo = null, henSpy = null;
  // Trang Bảng giá: "Bảng giá" luôn là mục active (aria-current="page" sẵn trong HTML), không theo vị trí cuộn
  function capNhatSpy() { if (!dangKhoa && !trangGia) datActive(linkCua(khuDangXem().id)); }
  // Bấm menu / Bé Cam: active chuyển ngay tới mục đích; trong lúc cuộn mượt không cập nhật theo vị trí (không nhảy qua mục trung gian)
  function khoaSpy() {
    dangKhoa = true; clearTimeout(henMo);
    var cu = -1;
    (function cho() { henMo = setTimeout(function () { if (Math.abs(window.scrollY - cu) < 1) { dangKhoa = false; capNhatSpy(); } else { cu = window.scrollY; cho(); } }, 140); })();
  }
  window.addEventListener('scroll', function () { if (!henSpy) henSpy = requestAnimationFrame(function () { henSpy = null; capNhatSpy(); }); }, { passive: true });
  window.addEventListener('resize', function () { dichThanh(); capNhatSpy(); });
  window.addEventListener('hashchange', capNhatSpy);
  if (menuDoc.addEventListener) menuDoc.addEventListener('change', dichThanh);
  // Mở trang bằng URL có #section: trình duyệt cuộn tới khu đó, active xác định theo khu
  var hashDau = linkTrong.filter(function (a) { return a.getAttribute('href') === location.hash; })[0];
  if (hashDau) datActive(hashDau);
  window.addEventListener('load', function () { capNhatSpy(); });
  if (trangGia) { dichThanh(); window.addEventListener('load', dichThanh); }
  capNhatSpy();
  requestAnimationFrame(function () { thanh.classList.add('san'); }); // lần đặt đầu không trượt

  // ---------- Tab bảng giá (phím mũi tên, Home, End) ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.bg-tab [role="tab"]'));
  function chonTab(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      $(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { chonTab(t); });
    t.addEventListener('keydown', function (e) {
      var k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (k !== undefined) { e.preventDefault(); chonTab(tabs[(k + tabs.length) % tabs.length], true); }
    });
  });
  // Trang Bảng giá mở thẳng một nhóm: bang-gia.html#nhom-<id> (từ thẻ dịch vụ ở trang chủ)
  function moNhomTheoHash() {
    var m = /^#nhom-(.+)$/.exec(location.hash), t = m && $('tab-' + m[1]); if (!t) return;
    chonTab(t);
    $('bang-gia').scrollIntoView({ behavior: 'auto', block: 'start' });
    // R3.5 · mở thẳng nhóm từ trang chủ: focus vào tab nhóm đó để người dùng bàn phím / đọc màn hình biết đang ở đâu
    try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
  }
  if (tabs.length) { moNhomTheoHash(); window.addEventListener('hashchange', moNhomTheoHash); }

  // ---------- Bé Cam ----------
  var cam = $('cam'), nutNoi = $('cam-nut'), nutDuoi = $('cam-nut-duoi'), bang = $('cam-bang'), tra = $('cam-tra'), nen = $('cam-nen');
  if (cam) {
  // Câu chào: ngoài giờ mở cửa (giờ Việt Nam, UTC+7) thì dùng câu ngoài giờ, ngược lại câu của trang hiện tại
  (function () {
    var vn = new Date(Date.now() + 7 * 3600000), phut = vn.getUTCHours() * 60 + vn.getUTCMinutes(), ngoaiGio = phut < 8 * 60 || phut >= 21 * 60;
    var ds = Array.prototype.slice.call(cam.querySelectorAll('.cam-chao')), chon = (ngoaiGio && ds.filter(function (c) { return c.dataset.goiY === 'ngoai_gio'; })[0]) || ds[ds.length - 1];
    if (chon) chon.hidden = false;
  })();
  var nenTrang = ['.bo-qua', '.ban-thu', '#dau', 'main', '.chan', '.thanh-duoi'].map(function (s) { return document.querySelector(s); }).filter(Boolean);
  var nutMo = null, henDong;
  var dangMo = function () { return cam && cam.classList.contains('dang-mo'); };

  function moBang(mo, traFocus, nguon) {
    clearTimeout(henDong);
    var modal = laModal.matches;
    cam.classList.toggle('dang-mo', mo);
    [nutNoi, nutDuoi].forEach(function (n) { if (n) n.setAttribute('aria-expanded', String(mo)); });
    nutNoi.setAttribute('aria-label', mo ? 'Đóng trợ lý Bé Cam' : 'Mở trợ lý thông tin Bé Cam');
    bang.setAttribute('aria-modal', String(modal));
    if (mo) {
      nutMo = nguon || (modal ? nutDuoi : nutNoi);
      if (menu.classList.contains('mo')) moMenu(false);
      bang.hidden = false; nen.hidden = !modal;
      // Modal (mobile/tablet): nền trang không thao tác được, khoá cuộn trang
      if (modal) { nenTrang.forEach(function (el) { el.setAttribute('inert', ''); }); document.body.classList.add('khoa-cuon'); }
      void bang.offsetWidth;
      bang.classList.add('hien'); nen.classList.add('hien');
      bang.querySelector('.cam-ds button').focus({ preventScroll: true });
    } else {
      nenTrang.forEach(function (el) { el.removeAttribute('inert'); });
      document.body.classList.remove('khoa-cuon');
      bang.classList.remove('hien'); nen.classList.remove('hien');
      henDong = setTimeout(function () { bang.hidden = true; nen.hidden = true; }, itChuyenDong.matches ? 0 : 220);
      if (traFocus !== false && nutMo) nutMo.focus({ preventScroll: true });
    }
  }
  function dongBeCam() { if (dangMo()) moBang(false, false); }
  nutNoi.addEventListener('click', function () { moBang(!dangMo(), true, nutNoi); });
  if (nutDuoi) nutDuoi.addEventListener('click', function () { moBang(!dangMo(), true, nutDuoi); });
  $('cam-dong').addEventListener('click', function () { moBang(false); });
  nen.addEventListener('click', function () { moBang(false); });
  // Desktop (không modal): bấm ra ngoài panel thì đóng, không làm kẹt thao tác khác
  document.addEventListener('pointerdown', function (e) {
    if (!dangMo() || laModal.matches) return;
    if (bang.contains(e.target) || nutNoi.contains(e.target)) return;
    moBang(false, false);
  });
  document.addEventListener('keydown', function (e) {
    if (!dangMo()) return;
    if (e.key === 'Escape') { moBang(false); return; }
    // Modal: giữ phím Tab trong panel
    if (e.key === 'Tab' && laModal.matches) {
      var ds = Array.prototype.filter.call(bang.querySelectorAll('button, a[href]'), function (x) { return x.offsetParent !== null; });
      var dau0 = ds[0], cuoi = ds[ds.length - 1];
      if (e.shiftKey && document.activeElement === dau0) { e.preventDefault(); cuoi.focus(); }
      else if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dau0.focus(); }
    }
  });
  // Đổi cỡ màn hình khi đang mở (xoay ngang/dọc): đóng để tránh trạng thái nửa modal
  laModal.addEventListener('change', dongBeCam);

  // Câu trả lời: chỉ thông tin thật của bệnh viện, mỗi mục một câu + một nút đi tới
  var hr = dl.href || {};
  var noi = {
    'dich-vu': { loi: 'Khám, xét nghiệm, tiêm phòng, grooming, triệt sản, phẫu thuật và nội trú.', nut: 'Xem dịch vụ', toi: 'dich-vu', trang: hr['dich-vu'] },
    'bang-gia': { loi: 'Giá chia theo nhóm dịch vụ và cân nặng của bé.', nut: 'Mở bảng giá', trang: hr['bang-gia'] },
    'dat-lich': { loi: 'Bạn gửi yêu cầu, nhân viên sẽ liên hệ xác nhận lịch.', nut: 'Đến phần đặt lịch', trang: hr['dat-lich'] },
    'lien-he': { loi: 'Hotline <b>' + dl.dien_thoai + '</b> · giờ mở cửa <b>' + dl.gio + '</b>.', nut: 'Xem liên hệ', trang: hr['lien-he'] },
    'chi-duong': { loi: '<b>' + dl.dia_chi + '</b>', nut: 'Mở Google Maps', link: dl.ban_do },
  };
  var nutHoi = Array.prototype.slice.call(bang.querySelectorAll('[data-hoi]'));
  nutHoi.forEach(function (b) {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      var n = noi[b.dataset.hoi];
      nutHoi.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var mui = '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (n.link ? 'M7 17 17 7M7 7h10v10' : 'M5 12h14M12 5l7 7-7 7') + '"/></svg>';
      tra.classList.remove('moi'); void tra.offsetWidth; tra.classList.add('moi');
      // Ở trang chủ, khu có trong trang thì cuộn tới khu; ở trang khác (hoặc mục không có khu) dẫn tới trang riêng
      var den = !trangGia && n.toi && $(n.toi) ? '' : n.trang;
      tra.innerHTML = '<p>' + n.loi + '</p>' + (n.link
        ? '<a class="nut nut-vien" href="' + n.link + '" target="_blank" rel="noopener">' + n.nut + mui + '</a>'
        : den ? '<a class="nut nut-vien" href="' + den + '">' + n.nut + mui + '</a>'
        : '<button type="button" class="nut nut-vien" data-toi="' + n.toi + '">' + n.nut + mui + '</button>');
    });
  });
  tra.addEventListener('click', function (e) {
    var b = e.target.closest('[data-toi]'); if (!b) return;
    moBang(false, false); // gỡ inert trước, rồi mới chuyển focus
    diToi(b.dataset.toi);
  });

  }

  // ---------- Dải thẻ trượt ngang (Cẩm nang, Đội ngũ) ----------
  // Nối vòng KHÔNG dùng bản sao: thẻ đã trượt hết khỏi mép trái được chuyển (chính phần tử thật) xuống cuối dải.
  // Vì vậy mọi thẻ nhìn thấy đều bấm/chạm được, mở đúng link, và không có điểm Tab trùng.
  // Dừng khi: bấm Tạm dừng, rê chuột, focus vào thẻ, đang kéo/vuốt. Giảm chuyển động: không tự chạy.
  window.__dai = {};
  function taoDai(ma, toc) {
    var dai = $(ma + '-dai'), ray = $(ma + '-ray'); if (!dai || !ray) return;
    var nutDung = $(ma + '-dung'), chuDung = nutDung.querySelector('.cn-dung-chu');
    var x = 0, nguoiDung = false, ghiDe = false, dangRe = false, dangFocus = false, keo = null, dich = null, tg0 = 0;
    var gap = function () { return parseFloat(getComputedStyle(ray).columnGap) || 0; };
    var dem = ray.children.length;
    // Xoay thẻ để 0 ≤ x < bề rộng thẻ đầu. Không xoay khi đang focus trong dải (giữ thứ tự Tab ổn định).
    function chuanHoa() {
      if (dangFocus) return;
      var g = gap(), n = 0;
      while (x >= ray.firstElementChild.offsetWidth + g && n++ < dem * 3) { var t = ray.firstElementChild; x -= t.offsetWidth + g; ray.appendChild(t); }
      while (x < 0 && n++ < dem * 3) { var c = ray.lastElementChild; ray.insertBefore(c, ray.firstElementChild); x += c.offsetWidth + g; }
    }
    function ve() { chuanHoa(); ray.style.transform = 'translate3d(' + (-x).toFixed(2) + 'px,0,0)'; }
    // nguoiDung = người dùng bấm Tạm dừng (hoặc tắt hiệu ứng); giamCd() = máy đang bật giảm chuyển động (đọc trực tiếp, đổi được khi đang xem);
    // ghiDe = người dùng chủ động bấm Tiếp tục / bật hiệu ứng dù máy đang giảm chuyển động
    var giamCd = function () { return itChuyenDong.matches && !ghiDe && !goc.classList.contains('tt-chu-dong'); };
    var dungNut = function () { return nguoiDung || giamCd(); };
    function capNhatNut() {
      var dung = dungNut();
      nutDung.setAttribute('aria-pressed', String(dung));
      chuDung.textContent = dung ? 'Tiếp tục' : 'Tạm dừng';
      nutDung.setAttribute('aria-label', (dung ? 'Tiếp tục trượt ' : 'Tạm dừng trượt ') + dai.getAttribute('aria-label').toLowerCase());
      nutDung.title = dung ? 'Tiếp tục' : 'Tạm dừng';
    }
    var khuat = false;
    var dungTam = function () { return dungNut() || dangRe || dangFocus || keo || dich || document.hidden || khuat; };
    // Dải khuất khỏi màn hình: không chạy (đỡ tốn pin). Trang ẩn (đổi tab): đã có document.hidden.
    if ('IntersectionObserver' in window) new IntersectionObserver(function (m) { khuat = !m[0].isIntersecting; }).observe(dai);
    document.addEventListener('visibilitychange', function () { tg0 = 0; });
    // Nút “Hiệu ứng trang trí” tắt → dải cũng thôi tự trượt (vẫn bấm Trước/Sau, kéo/vuốt được); bật lại → tự trượt tiếp
    document.addEventListener('doi-trang-tri', function (e) {
      if (!e.detail.chuDong) return;
      nguoiDung = !e.detail.bat; ghiDe = e.detail.bat && itChuyenDong.matches; capNhatNut();
    });
    // Máy bật / tắt giảm chuyển động khi đang xem: dừng ngay (hoàn tất bước đang trượt) hoặc chạy lại; lựa chọn Tạm dừng của người dùng được giữ
    var khiDoi = function () { ghiDe = false; if (itChuyenDong.matches && dich) { x = dich.den; dich = null; ve(); } capNhatNut(); };
    nghe.push(khiDoi);
    function truotToi(den, tg) {
      if (itChuyenDong.matches || !tg) { dich = null; x = den; ve(); return; }
      dich = { tu: x, den: den, bd: performance.now(), tg: tg };
    }
    function vong(t) {
      var dt = tg0 ? Math.min(t - tg0, 64) : 0; tg0 = t;
      if (dich) {
        var p = Math.min(1, (t - dich.bd) / dich.tg), e = 1 - Math.pow(1 - p, 3);
        x = dich.tu + (dich.den - dich.tu) * e;
        var x0 = x; ve();
        dich.tu += x - x0; dich.den += x - x0; // xoay thẻ làm x lệch đúng một bề rộng thẻ: dời cả điểm đầu/cuối
        if (p >= 1) dich = null;
      } else if (!dungTam()) { x += toc * dt / 1000; ve(); }
      requestAnimationFrame(vong);
    }
    // Trước / sau: trượt đúng một thẻ
    var buoc = function () { return ray.firstElementChild.offsetWidth + gap(); };
    $(ma + '-sau').addEventListener('click', function () { chuanHoa(); truotToi(x + buoc(), 380); });
    $(ma + '-truoc').addEventListener('click', function () { chuanHoa(); truotToi(x - buoc(), 380); });
    nutDung.addEventListener('click', function () { if (dungNut()) { nguoiDung = false; ghiDe = itChuyenDong.matches; } else nguoiDung = true; capNhatNut(); });
    // Thẻ phóng to khi hover/focus: nếu sát mép khung (sẽ bị cắt), dịch dải để thẻ cách mép ≥ 8px
    function phanLo(the) { var r = the.getBoundingClientRect(), d = dai.getBoundingClientRect(); return Math.max(0, Math.min(r.right, d.right) - Math.max(r.left, d.left)) / r.width; }
    // Độ lệch cần dịch để thẻ (kể cả khi phóng 1.02) cách mép khung ≥ 8px; 0 nếu đã nằm trọn
    function doLech(the) {
      var r = the.getBoundingClientRect(), d = dai.getBoundingClientRect(), no = r.width * 0.012;
      if (r.left - no < d.left + 8) return r.left - no - (d.left + 8);
      if (r.right + no > d.right - 8) return r.right + no - (d.right - 8);
      return 0;
    }
    function keoVaoKhung(the, tg) { var lech = doLech(the); if (lech) truotToi(x + lech, tg); }
    // Rê chuột thật (có di chuyển) lên thẻ: dừng dải; thẻ sát mép thì dịch dải để thẻ phóng to không bị cắt.
    // Bỏ qua sự kiện “rê” giả do nội dung trượt dưới con trỏ đứng yên, và không dịch nếu sau khi dịch con trỏ không còn nằm trên chính thẻ đó (tránh bấm nhầm).
    var theRe = null;
    dai.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || keo) return;
      dangRe = true;
      if (dangFocus || dich || (!e.movementX && !e.movementY)) return;
      var the = e.target.closest('#' + ma + '-ray > *'); if (!the || the === theRe) return;
      theRe = the;
      if (phanLo(the) < 0.4) return;
      var lech = doLech(the); if (!lech) return;
      var r = the.getBoundingClientRect();
      if (e.clientX < r.left - lech + 6 || e.clientX > r.right - lech - 6) return;
      truotToi(x + lech, 180);
    });
    dai.addEventListener('pointerleave', function () { dangRe = false; theRe = null; });
    // Focus vào thẻ (bàn phím): dừng, đưa thẻ vào vùng thấy; không tự chuyển focus
    dai.addEventListener('focusin', function (e) {
      // Chỉ tính focus bằng bàn phím (bấm chuột vào link cũng tạo focus nhưng không được chặn xoay vòng / kéo)
      if (!e.target.matches(':focus-visible')) return;
      dangFocus = true;
      var the = e.target.closest('#' + ma + '-ray > *'); if (the) keoVaoKhung(the, 0);
    });
    dai.addEventListener('focusout', function (e) { if (!dai.contains(e.relatedTarget)) { dangFocus = false; ve(); } });
    // Kéo chuột / vuốt cảm ứng
    var chanClick = false;
    dai.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; keo = { x0: e.clientX, tu: x, id: e.pointerId, da: false }; dich = null; });
    dai.addEventListener('pointermove', function (e) {
      if (!keo || e.pointerId !== keo.id) return;
      var dx = e.clientX - keo.x0;
      if (!keo.da && Math.abs(dx) > 6) { keo.da = true; dai.classList.add('dang-keo'); try { dai.setPointerCapture(e.pointerId); } catch (er) { /* không bắt được con trỏ */ } }
      if (keo.da) { x = keo.tu - dx; ve(); keo.tu += x - (keo.tu - dx); } // bù phần lệch khi thẻ được xoay
    });
    function thaKeo() { if (!keo) return; chanClick = keo.da; keo = null; dai.classList.remove('dang-keo'); setTimeout(function () { chanClick = false; }, 0); }
    dai.addEventListener('pointerup', thaKeo); dai.addEventListener('pointercancel', thaKeo);
    dai.addEventListener('click', function (e) { if (chanClick) { e.preventDefault(); e.stopPropagation(); } }, true);
    dai.addEventListener('dragstart', function (e) { e.preventDefault(); });
    if (goc.classList.contains('tat-trang-tri') && docTT() === 'tat') nguoiDung = true; // người dùng đã tắt hiệu ứng từ lần trước
    capNhatNut(); ve();
    window.addEventListener('resize', function () { ve(); });
    window.__dai[ma] = { trangThai: function () { return { x: x, buoc: buoc(), dung: !!dungTam(), nguoiDung: dungNut(), thuTu: Array.prototype.map.call(ray.children, function (c) { return c.getAttribute('data-ma'); }) }; }, dat: function (v) { dich = null; x = v; ve(); } }; // dùng cho kiểm thử
    requestAnimationFrame(vong);
  }
  taoDai('cn', 28);
  taoDai('dn', 24);

  // ---------- Khu "Sản phẩm nổi bật": chọn nhóm bằng ảnh nhỏ / Trước / Sau / phím mũi tên. Không tự chạy; không JS thì cả ba nhóm hiện dọc ----------
  (function () {
    var khu = $('san-pham'); if (!khu) return;
    var tabs = Array.prototype.slice.call(khu.querySelectorAll('[role="tab"]')), panels = Array.prototype.slice.call(khu.querySelectorAll('.sp-panel')), hien = 0;
    goc.classList.add('sp-co-js'); khu.classList.add('sp-js');
    function chon(i, tieuDiem, doi) {
      hien = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) { var bat = k === hien; t.setAttribute('aria-selected', String(bat)); t.tabIndex = bat ? 0 : -1; });
      panels.forEach(function (pn, k) { pn.hidden = k !== hien; pn.classList.toggle('sp-doi', !!doi && k === hien); });
      if (tieuDiem) tabs[hien].focus();
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { chon(k, false, true); }); });
    khu.querySelector('[role="tablist"]').addEventListener('keydown', function (e) {
      var k = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? hien + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? hien - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (k === null) return; e.preventDefault(); chon(k, true, true);
    });
    khu.addEventListener('click', function (e) {
      var nut = e.target.closest('[data-sp-truoc], [data-sp-sau]'); if (!nut) return;
      chon(hien + (nut.hasAttribute('data-sp-sau') ? 1 : -1), false, true);
      // nút vừa bấm nằm trong khung vừa ẩn: đưa focus sang nút cùng loại của khung mới để dùng bàn phím liên tục
      var moi = panels[hien].querySelector(nut.hasAttribute('data-sp-sau') ? '[data-sp-sau]' : '[data-sp-truoc]'); if (moi && document.activeElement !== moi) moi.focus();
    });
    chon(0, false, false);
  })();

  // ---------- Đang nhập / bàn phím ảo: ẩn thanh hành động dưới để không che ô nhập, lỗi, nút gửi ----------
  var dangGo = false, banPhim = false;
  function capNhatThanhDuoi() { document.body.classList.toggle('dang-go', laModal.matches && (dangGo || banPhim)); }
  document.addEventListener('focusin', function (e) {
    if (!e.target.matches('input, select, textarea') || e.target.closest('#cam-bang')) return;
    dangGo = true; capNhatThanhDuoi();
    // Ô đang nhập chỉ thấy một phần (màn ngang, bàn phím ảo): cuộn ô vào giữa vùng nhìn thấy
    var o = e.target;
    setTimeout(function () {
      var r = o.getBoundingClientRect(), cao = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      var dauDuoi = $('dau').getBoundingClientRect().bottom;
      if (r.top < dauDuoi || r.bottom > cao) o.scrollIntoView({ block: 'center' });
    }, 60);
  });
  document.addEventListener('focusout', function (e) { if (e.target.matches('input, select, textarea')) { dangGo = false; setTimeout(capNhatThanhDuoi, 0); } });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () { banPhim = window.visualViewport.height < window.innerHeight * 0.75; capNhatThanhDuoi(); });
  }
})();
