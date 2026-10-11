// Dựng web ở một chế độ biểu mẫu KHÁC để kiểm thử (that / cu / gia-lap) mà KHÔNG đụng vào mã đang làm việc.
// Làm một bản sao tạm của dự án (package.json, cấu hình, src, public; node_modules dùng liên kết), đổi hằng số `modeDatLich` trong BẢN SAO,
// rồi `astro build --outDir <thư mục>` về thư mục đích trong repo. Tệp src/lib/dat-lich.ts của repo không bao giờ bị sửa (tránh commit nhầm chế độ tạm).
// Dùng: node kiem-thu-astro/dung-che-do.cjs <gia-lap|that|cu> <thư mục ra, ví dụ dist-that>
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const GOC = path.resolve(__dirname, '..'), RE = /export const modeDatLich: ModeDatLich = '[a-z-]+';/;

function sachSua() { // mã trong repo phải đúng bản đã commit (phát hiện chế độ tạm bị commit nhầm hoặc sửa dở)
  try { cp.execSync('git diff --quiet HEAD -- src/lib/dat-lich.ts', { cwd: GOC, stdio: 'ignore' }); return true; } catch (e) { return e.status === 1 ? false : true; }
}
function dung(mode, thuMuc) {
  if (!['gia-lap', 'that', 'cu'].includes(mode)) throw new Error('Chế độ không hợp lệ: ' + mode);
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'le-son-che-do-'));
  try {
    for (const f of ['package.json', 'astro.config.mjs', 'tsconfig.json']) if (fs.existsSync(path.join(GOC, f))) fs.copyFileSync(path.join(GOC, f), path.join(tam, f));
    for (const d of ['src', 'public']) fs.cpSync(path.join(GOC, d), path.join(tam, d), { recursive: true });
    fs.symlinkSync(path.join(GOC, 'node_modules'), path.join(tam, 'node_modules'), 'dir');
    const tep = path.join(tam, 'src/lib/dat-lich.ts'), goc = fs.readFileSync(tep, 'utf8');
    if (!RE.test(goc)) throw new Error('Không tìm thấy dòng modeDatLich trong src/lib/dat-lich.ts');
    fs.writeFileSync(tep, goc.replace(RE, `export const modeDatLich: ModeDatLich = '${mode}';`));
    cp.execSync(`npx astro build --outDir "${path.resolve(GOC, thuMuc)}"`, { cwd: tam, stdio: 'ignore' });
  } finally { fs.rmSync(tam, { recursive: true, force: true }); }
}
module.exports = { dung, sachSua };
if (require.main === module) { const [mode, thuMuc] = process.argv.slice(2); if (!mode || !thuMuc) { console.error('Dùng: node dung-che-do.cjs <gia-lap|that|cu> <thư mục ra>'); process.exit(2); } dung(mode, thuMuc); console.log(`Đã dựng chế độ "${mode}" vào ${thuMuc} (bằng bản sao tạm; mã trong repo không đổi).`); }
