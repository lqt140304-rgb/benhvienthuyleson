// Dựng web với giao diện KHÁC (moi / r36) mà KHÔNG đụng vào mã đang làm việc: giống dung-che-do.cjs, làm bản sao tạm của dự án,
// đổi hằng số GIAO_DIEN trong src/lib/site.ts của BẢN SAO rồi `astro build --outDir <thư mục>` về repo.
// Dùng: node kiem-thu-astro/dung-giao-dien.cjs <moi|r36> <thư mục ra, ví dụ dist-moi>
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const GOC = path.resolve(__dirname, '..'), RE = /export const GIAO_DIEN: GiaoDien = '[a-z0-9-]+';/;
// tepThem (không bắt buộc): { 'public/video/hero.webm': '/đường/dẫn/tuyệt/đối' } chép thêm tệp vào BẢN SAO TẠM trước khi dựng (vd video thử); repo không đổi.
function dungGiaoDien(giaoDien, thuMuc, tepThem = {}) {
  if (!['moi', 'r36'].includes(giaoDien)) throw new Error('Giao diện không hợp lệ: ' + giaoDien);
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'le-son-giao-dien-'));
  try {
    for (const f of ['package.json', 'astro.config.mjs', 'tsconfig.json']) if (fs.existsSync(path.join(GOC, f))) fs.copyFileSync(path.join(GOC, f), path.join(tam, f));
    for (const d of ['src', 'public']) fs.cpSync(path.join(GOC, d), path.join(tam, d), { recursive: true });
    fs.symlinkSync(path.join(GOC, 'node_modules'), path.join(tam, 'node_modules'), 'dir');
    for (const [dich, nguon] of Object.entries(tepThem)) { fs.mkdirSync(path.dirname(path.join(tam, dich)), { recursive: true }); fs.copyFileSync(nguon, path.join(tam, dich)); }
    const tep = path.join(tam, 'src/lib/site.ts'), goc = fs.readFileSync(tep, 'utf8');
    if (!RE.test(goc)) throw new Error('Không tìm thấy dòng GIAO_DIEN trong src/lib/site.ts');
    fs.writeFileSync(tep, goc.replace(RE, `export const GIAO_DIEN: GiaoDien = '${giaoDien}';`));
    cp.execSync(`npx astro build --outDir "${path.resolve(GOC, thuMuc)}"`, { cwd: tam, stdio: 'ignore' });
  } finally { fs.rmSync(tam, { recursive: true, force: true }); }
}
module.exports = { dungGiaoDien };
if (require.main === module) { const [gd, thuMuc] = process.argv.slice(2); if (!gd || !thuMuc) { console.error('Dùng: node dung-giao-dien.cjs <moi|r36> <thư mục ra>'); process.exit(2); } dungGiaoDien(gd, thuMuc); console.log(`Đã dựng giao diện "${gd}" vào ${thuMuc} (bằng bản sao tạm; mã trong repo không đổi).`); }
