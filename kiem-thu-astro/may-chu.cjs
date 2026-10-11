// Máy chủ tĩnh nhỏ để xem bản dựng đúng như GitHub Pages: thư mục dist được phục vụ dưới /benhvienthuyleson/, đường dẫn không có trang thì trả 404.html (mã 404).
// Chạy: node kiem-thu-astro/may-chu.cjs [cổng=4321]   (cần chạy `npm run build` trước)
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.resolve(__dirname, '../dist'), BASE = '/benhvienthuyleson', CONG = +process.argv[2] || 4321;
const KIEU = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
const gui = (res, ma, tep) => { res.writeHead(ma, { 'Content-Type': KIEU[path.extname(tep)] || 'application/octet-stream' }); fs.createReadStream(tep).pipe(res); };
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (url === '/') { res.writeHead(302, { Location: BASE + '/' }); return res.end(); }
  if (url === BASE) { res.writeHead(301, { Location: BASE + '/' }); return res.end(); }
  if (url.startsWith(BASE + '/')) {
    let tep = path.join(DIST, url.slice(BASE.length));
    if (!tep.startsWith(DIST)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(tep) && fs.statSync(tep).isDirectory()) {
      if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); }
      tep = path.join(tep, 'index.html');
    }
    if (fs.existsSync(tep)) return gui(res, 200, tep);
  }
  gui(res, 404, path.join(DIST, '404.html'));
}).listen(CONG, () => console.log(`http://localhost:${CONG}${BASE}/`));
