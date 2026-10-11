// Dựng web ở một chế độ biểu mẫu KHÁC để kiểm thử (that / cu / gia-lap) mà không để lại sửa đổi nào trong mã.
// Ghi tạm hằng số `modeDatLich` trong src/lib/dat-lich.ts, chạy `astro build --outDir <thư mục>`, rồi KHÔI PHỤC (cả khi lỗi hoặc bị ngắt).
// Dùng: node kiem-thu-astro/dung-che-do.cjs <gia-lap|that|cu> <thư mục ra, ví dụ dist-that>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const GOC = path.resolve(__dirname, '..'), TEP = path.join(GOC, 'src/lib/dat-lich.ts'), RE = /export const modeDatLich: ModeDatLich = '[a-z-]+';/;

function sachSua() { // đầu bộ kiểm thử: lần chạy trước bị ngắt giữa chừng có để lại sửa đổi không?
  try { cp.execSync('git diff --quiet -- src/lib/dat-lich.ts', { cwd: GOC, stdio: 'ignore' }); return true; } catch (e) { return e.status === 1 ? false : true; }
}
function dung(mode, thuMuc) {
  if (!['gia-lap', 'that', 'cu'].includes(mode)) throw new Error('Chế độ không hợp lệ: ' + mode);
  const goc = fs.readFileSync(TEP, 'utf8');
  if (!RE.test(goc)) throw new Error('Không tìm thấy dòng modeDatLich trong src/lib/dat-lich.ts');
  const khoiPhuc = () => fs.writeFileSync(TEP, goc);
  const ngat = () => { khoiPhuc(); process.exit(130); };
  process.once('SIGINT', ngat); process.once('SIGTERM', ngat);
  try {
    fs.writeFileSync(TEP, goc.replace(RE, `export const modeDatLich: ModeDatLich = '${mode}';`));
    cp.execSync(`npx astro build --outDir ${thuMuc}`, { cwd: GOC, stdio: 'ignore' });
  } finally { khoiPhuc(); process.removeListener('SIGINT', ngat); process.removeListener('SIGTERM', ngat); }
}
module.exports = { dung, sachSua };
if (require.main === module) { const [mode, thuMuc] = process.argv.slice(2); if (!mode || !thuMuc) { console.error('Dùng: node dung-che-do.cjs <gia-lap|that|cu> <thư mục ra>'); process.exit(2); } dung(mode, thuMuc); console.log(`Đã dựng chế độ "${mode}" vào ${thuMuc}; src/lib/dat-lich.ts đã được khôi phục.`); }
