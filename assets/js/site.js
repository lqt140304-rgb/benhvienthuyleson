// Menu điện thoại
(function () {
  var btn = document.querySelector('[data-menu]');
  var nav = document.getElementById('menu-dt');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.hasAttribute('hidden');
      if (open) nav.removeAttribute('hidden'); else nav.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Lọc bài tư vấn theo chuyên mục
  var filters = document.querySelectorAll('[data-filter]');
  if (filters.length) {
    var cards = document.querySelectorAll('[data-cat]');
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-filter');
        filters.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cards.forEach(function (c) { c.hidden = v !== 'all' && c.getAttribute('data-cat') !== v; });
      });
    });
  }
})();
