// Dựng BẢN THỬ chế độ "that" nối với Sheet THỬ, để chủ dự án chạy trên máy mình (không đưa lên web, không sửa repo).
// Dùng: node kiem-thu-astro/dung-ban-thu-that.cjs <địa chỉ /exec của Sheet thử> [--ra=ban-thu-that]
// Kết quả: <ra>/dist (web), <ra>/chay/may-chu.cjs (máy chủ cục bộ), <ra>/README-THU.md. Thư mục này bị git bỏ qua; địa chỉ chỉ nằm trong bản dựng thử.
const fs = require('fs'), path = require('path'), { dung } = require('./dung-che-do.cjs');
const GOC = path.resolve(__dirname, '..'), diaChi = process.argv[2] || '', ra = ((process.argv.find((a) => a.startsWith('--ra=')) || '').split('=')[1]) || 'ban-thu-that';
if (!diaChi) { console.error('Dùng: node kiem-thu-astro/dung-ban-thu-that.cjs <địa chỉ /exec của Sheet thử>'); process.exit(2); }
const RA = path.resolve(GOC, ra); fs.rmSync(RA, { recursive: true, force: true }); fs.mkdirSync(path.join(RA, 'chay'), { recursive: true });
dung('that', path.join(ra, 'dist'), { diaChi });
fs.copyFileSync(path.join(__dirname, 'may-chu.cjs'), path.join(RA, 'chay/may-chu.cjs')); // mặc định đọc ../dist = <ra>/dist
fs.writeFileSync(path.join(RA, 'README-THU.md'), `# Bản THỬ nhận lịch thật (nối với Google Sheet THỬ)

Bản này gửi lịch tới **Sheet thử** của bạn (không phải Sheet thật). Mỗi lần gửi tạo 1 dòng và 1 email. Dữ liệu thử nên dùng tên "THỬ NGHIỆM" để xoá sau.

## Chạy (cần cài Node.js 18 trở lên: https://nodejs.org)
1. Giải nén thư mục này. Mở cửa sổ lệnh (Terminal / Command Prompt) tại thư mục đó.
2. Gõ: \`node chay/may-chu.cjs 4321\`
3. Mở trình duyệt: **http://localhost:4321/benhvienthuyleson/dat-lich/**
   (Trên điện thoại cùng wifi: dùng địa chỉ IP máy tính thay cho "localhost". Trình duyệt có thể không cho gửi từ địa chỉ http không phải localhost: khi đó chỉ thử trên máy tính.)

## Việc cần thử (ghi lại kết quả cho tôi)
1. **Gửi thành công:** điền 1 lịch (tên "THỬ NGHIỆM"), bấm gửi. Phải thấy "Đã nhận yêu cầu đặt lịch…" kèm mã \`LS-…\`. Mở Sheet thử: đúng **1 dòng**; hộp thư nhận: đúng **1 thư** "Lịch mới LS-…".
2. **Gửi lại không trùng:** ngay sau đó bấm gửi lại cùng nội dung (hoặc tải lại trang rồi gửi đúng nội dung đó bằng nút "Gửi lại" nếu có). Sheet vẫn **1 dòng**, hộp thư vẫn **1 thư**.
3. **Lỗi mạng:** tắt wifi/mạng rồi bấm gửi. Phải hiện "Chưa nhận được xác nhận…", **không** báo thành công. Bật mạng, bấm "Gửi lại": Sheet có **đúng 1 dòng** cho lịch đó (không 2).
4. Báo tôi: số dòng trong Sheet, số thư nhận, và màn hình hiện gì ở mỗi bước (nếu được, chụp ảnh).
`);
console.log(`Đã dựng bản thử "that" vào ${ra}/ (chạy: node ${ra}/chay/may-chu.cjs 4321). Bản này KHÔNG nằm trong git.`);
