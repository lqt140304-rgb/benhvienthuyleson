// Kiểm tra CHẾ ĐỘ BIỂU MẪU ĐẶT LỊCH của bản dựng trước khi phát hành. Không cần thư viện.
// Dùng: npm run build && npm run kiem-tra-che-do -- --mong=gia-lap|that|cu [--dist=dist]
// In "CHẾ ĐỘ BẢN XUẤT: …" và thoát mã 1 nếu bản dựng KHÔNG đúng chế độ mong muốn (để không phát hành nhầm).
const fs = require('fs'), path = require('path');
const arg = (k) => (process.argv.find((a) => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
const mong = arg('mong'), dist = path.resolve(process.cwd(), arg('dist') || 'dist');
if (!['gia-lap', 'that', 'cu'].includes(mong)) { console.error('Thiếu --mong=gia-lap|that|cu'); process.exit(2); }
const doc = (p) => { const f = path.join(dist, p); if (!fs.existsSync(f)) { console.error('Không thấy ' + f + ' (đã chạy npm run build chưa?)'); process.exit(2); } return fs.readFileSync(f, 'utf8'); };
const dat = doc('dat-lich/index.html'), chu = doc('index.html');
const moi = /id="form-dat-lich"/.test(dat), cu = /<form[^>]*id="dat-lich"[^>]*data-endpoint/.test(dat);
const mode = (/id="form-dat-lich"[^>]*data-mode="([a-z-]+)"/.exec(dat) || /data-mode="([a-z-]+)"[^>]*id="form-dat-lich"/.exec(dat) || [])[1] || (cu ? 'cu' : '');
const co = { bieuMauMoi: moi, bieuMauCu: cu, dongXemTruoc: /chưa gửi dữ liệu thật/.test(dat), diaChiNhan: ((/data-endpoint="([^"]+)"/.exec(dat) || [])[1] || ''), trangChuCoBieuMauMoi: /id="form-dat-lich"/.test(chu), trangChuCoBieuMauCu: /id="dat-lich"[^>]*data-endpoint/.test(chu) };
const loi = [];
if (mode !== mong) loi.push(`chế độ thực tế là "${mode || 'không xác định'}", mong muốn "${mong}"`);
if (mong === 'gia-lap' && (!co.bieuMauMoi || !co.dongXemTruoc || co.diaChiNhan)) loi.push('chế độ giả lập phải có biểu mẫu mới, dòng "chưa gửi dữ liệu thật" và KHÔNG có địa chỉ nhận');
if (mong === 'that' && (!co.bieuMauMoi || co.dongXemTruoc || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(co.diaChiNhan))) loi.push('chế độ nhận thật phải có biểu mẫu mới, không có dòng "xem trước" và có địa chỉ nhận script.google.com/macros/s/…/exec');
if (mong === 'cu' && (!co.bieuMauCu || co.bieuMauMoi || co.trangChuCoBieuMauMoi)) loi.push('chế độ cũ phải chỉ có biểu mẫu cũ (#dat-lich), không có biểu mẫu mới');
console.log(`CHẾ ĐỘ BẢN XUẤT: ${mode || 'không xác định'}  (thư mục ${path.relative(process.cwd(), dist) || '.'})`);
console.log(JSON.stringify(co));
if (loi.length) { console.error('LỆCH CHẾ ĐỘ, KHÔNG NÊN PHÁT HÀNH: ' + loi.join('; ')); process.exit(1); }
console.log(`ĐÚNG chế độ "${mong}".` + (mong === 'that' ? ' Địa chỉ nhận: ' + co.diaChiNhan : mong === 'gia-lap' ? ' Web KHÔNG nhận lịch qua biểu mẫu (xem docs/DAT-LICH-DANH-GIA.md mục 5).' : ''));
