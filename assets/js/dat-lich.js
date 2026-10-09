// Form đặt lịch: kiểm tra dữ liệu, chặn giờ ngoài 8:00–21:00, gửi tới Google Apps Script.
(function () {
  var form = document.getElementById('dat-lich');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var GIO_MO = 8 * 60, GIO_DONG = 21 * 60;

  function today() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  // Bỏ khoảng trắng, dấu chấm, gạch; đổi +84 thành 0; còn lại phải là số, bắt đầu bằng 0, dài 10–11 số
  function cleanPhone(v) {
    var s = (v || '').replace(/[\s.\-()]/g, '');
    if (s.indexOf('+84') === 0) s = '0' + s.slice(3);
    else if (s.indexOf('84') === 0 && s.length >= 11) s = '0' + s.slice(2);
    return s;
  }
  function phoneOk(v) { return /^0\d{9,10}$/.test(cleanPhone(v)); }
  function outsideHours(t) {
    if (!t) return false;
    var a = t.split(':'), m = parseInt(a[0], 10) * 60 + parseInt(a[1], 10);
    return m < GIO_MO || m > GIO_DONG;
  }
  function show(id, on, input) {
    $(id).hidden = !on;
    if (input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  var date = $('f-date'), time = $('f-time');
  date.min = today();
  if (!date.value) date.value = today();

  function checkTime() { $('ngoai-gio').hidden = !outsideHours(time.value); }
  time.addEventListener('input', checkTime);
  time.addEventListener('change', checkTime);
  checkTime();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    $('loi-gui').hidden = true;
    var name = $('f-name'), phone = $('f-phone'), svc = $('f-svc');
    var errs = {
      name: !name.value.trim(),
      phone: !phoneOk(phone.value),
      svc: !svc.value,
      date: !date.value || date.value < today()
    };
    show('e-name', errs.name, name);
    show('e-phone', errs.phone, phone);
    show('e-svc', errs.svc, svc);
    show('e-date', errs.date, date);
    var after = outsideHours(time.value);
    checkTime();
    var first = errs.name ? name : errs.phone ? phone : errs.svc ? svc : errs.date ? date : after ? time : null;
    if (first) { first.focus(); return; }
    if ($('f-web').value) return; // ô bẫy chống spam

    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      $('loi-gui').textContent = 'Form đặt lịch online đang được kết nối. Vui lòng gọi ' + (window.LS_PHONE || '') + ' để đặt lịch.';
      $('loi-gui').hidden = false;
      return;
    }

    var data = new URLSearchParams();
    data.append('ten', name.value.trim());
    data.append('dien_thoai', cleanPhone(phone.value));
    data.append('thu_cung', $('f-pet').value);
    data.append('dich_vu', svc.value);
    data.append('ngay', date.value);
    data.append('gio', time.value);
    data.append('ghi_chu', $('f-note').value.trim());
    data.append('website', $('f-web').value);

    var btn = $('gui');
    btn.disabled = true;
    fetch(endpoint, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        var d = date.value.split('-');
        $('ok-text').textContent = 'Cảm ơn ' + name.value.trim() + '. Nhân viên sẽ gọi số ' + cleanPhone(phone.value) +
          ' để xác nhận lịch ngày ' + d[2] + '/' + d[1] + '/' + d[0] + ' lúc ' + time.value + '.';
        form.hidden = true;
        $('ok').hidden = false;
        $('ok').focus();
      })
      .catch(function () {
        $('loi-gui').textContent = 'Chưa gửi được, có thể do mất mạng. Vui lòng thử lại hoặc gọi ' + (window.LS_PHONE || '') + '.';
        $('loi-gui').hidden = false;
      })
      .then(function () { btn.disabled = false; });
  });

  $('again').addEventListener('click', function () {
    form.reset();
    date.value = today();
    checkTime();
    $('ok').hidden = true;
    form.hidden = false;
    $('f-name').focus();
  });
})();
